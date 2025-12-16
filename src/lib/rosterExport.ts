import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Shift, StaffMember, Centre, OpenShift, roleLabels } from '@/types/roster';
import { format } from 'date-fns';

interface ExportData {
  shifts: Shift[];
  staff: StaffMember[];
  centre: Centre;
  dates: Date[];
  weeklyBudget: number;
}

export function exportToPDF(data: ExportData) {
  const { shifts, staff, centre, dates, weeklyBudget } = data;
  const doc = new jsPDF({ orientation: 'landscape' });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.text(`Roster Schedule - ${centre.name}`, 14, yPos);
  yPos += 10;

  // Date range
  doc.setFontSize(12);
  doc.text(`Week of ${format(dates[0], 'MMM d')} - ${format(dates[dates.length - 1], 'MMM d, yyyy')}`, 14, yPos);
  yPos += 15;

  // Cost Summary
  const centreShifts = shifts.filter(s => s.centreId === centre.id);
  let totalCost = 0;
  let totalHours = 0;
  
  centreShifts.forEach(shift => {
    const member = staff.find(s => s.id === shift.staffId);
    if (member) {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const hours = ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
      totalHours += hours;
      totalCost += hours * member.hourlyRate;
    }
  });

  doc.setFontSize(10);
  doc.text(`Total Hours: ${Math.round(totalHours * 10) / 10}h | Total Cost: $${Math.round(totalCost).toLocaleString()} | Budget: $${weeklyBudget.toLocaleString()}`, 14, yPos);
  yPos += 15;

  // Table Header
  const colWidths = [50, ...dates.map(() => (pageWidth - 80) / dates.length)];
  let xPos = 14;

  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos - 5, pageWidth - 28, 10, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Staff', xPos, yPos);
  xPos += colWidths[0];

  dates.forEach((date, idx) => {
    doc.text(format(date, 'EEE d'), xPos, yPos);
    xPos += colWidths[idx + 1];
  });
  
  yPos += 10;

  // Staff rows
  doc.setFont('helvetica', 'normal');
  
  const staffWithShifts = staff.filter(s => 
    centreShifts.some(shift => shift.staffId === s.id)
  );

  staffWithShifts.forEach((member) => {
    if (yPos > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = 20;
    }

    xPos = 14;
    doc.text(member.name.substring(0, 20), xPos, yPos);
    xPos += colWidths[0];

    dates.forEach((date, idx) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayShifts = centreShifts.filter(s => s.staffId === member.id && s.date === dateStr);
      
      if (dayShifts.length > 0) {
        const shiftText = dayShifts.map(s => `${s.startTime}-${s.endTime}`).join(', ');
        doc.text(shiftText.substring(0, 12), xPos, yPos);
      } else {
        doc.text('-', xPos, yPos);
      }
      xPos += colWidths[idx + 1];
    });

    yPos += 7;
  });

  // Save
  doc.save(`roster-${centre.code}-${format(dates[0], 'yyyy-MM-dd')}.pdf`);
}

export function exportToExcel(data: ExportData) {
  const { shifts, staff, centre, dates, weeklyBudget } = data;
  const centreShifts = shifts.filter(s => s.centreId === centre.id);

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Schedule Sheet
  const scheduleData: (string | number)[][] = [];
  
  // Header row
  const headerRow = ['Staff Name', 'Role', 'Hourly Rate', ...dates.map(d => format(d, 'EEE d MMM')), 'Total Hours', 'Total Cost'];
  scheduleData.push(headerRow);

  // Staff rows
  const staffWithShifts = staff.filter(s => centreShifts.some(shift => shift.staffId === s.id));
  
  staffWithShifts.forEach((member) => {
    const row: (string | number)[] = [member.name, roleLabels[member.role], member.hourlyRate];
    let memberTotalHours = 0;

    dates.forEach((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayShifts = centreShifts.filter(s => s.staffId === member.id && s.date === dateStr);
      
      if (dayShifts.length > 0) {
        const shiftTexts: string[] = [];
        dayShifts.forEach(shift => {
          shiftTexts.push(`${shift.startTime}-${shift.endTime}`);
          const [startH, startM] = shift.startTime.split(':').map(Number);
          const [endH, endM] = shift.endTime.split(':').map(Number);
          memberTotalHours += ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
        });
        row.push(shiftTexts.join(', '));
      } else {
        row.push('');
      }
    });

    row.push(Math.round(memberTotalHours * 10) / 10);
    row.push(Math.round(memberTotalHours * member.hourlyRate * 100) / 100);
    scheduleData.push(row);
  });

  // Totals row
  let grandTotalHours = 0;
  let grandTotalCost = 0;
  scheduleData.forEach((row, idx) => {
    if (idx > 0) {
      grandTotalHours += (row[row.length - 2] as number) || 0;
      grandTotalCost += (row[row.length - 1] as number) || 0;
    }
  });
  
  const totalsRow = ['TOTAL', '', '', ...dates.map(() => ''), grandTotalHours, grandTotalCost];
  scheduleData.push(totalsRow);

  const scheduleWs = XLSX.utils.aoa_to_sheet(scheduleData);
  XLSX.utils.book_append_sheet(wb, scheduleWs, 'Schedule');

  // Summary Sheet
  const summaryData = [
    ['Roster Summary'],
    [''],
    ['Centre', centre.name],
    ['Week', `${format(dates[0], 'MMM d')} - ${format(dates[dates.length - 1], 'MMM d, yyyy')}`],
    [''],
    ['Total Hours', grandTotalHours],
    ['Total Cost', grandTotalCost],
    ['Budget', weeklyBudget],
    ['Variance', grandTotalCost - weeklyBudget],
    [''],
    ['Staff Count', staffWithShifts.length],
    ['Shifts Count', centreShifts.length],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Save
  XLSX.writeFile(wb, `roster-${centre.code}-${format(dates[0], 'yyyy-MM-dd')}.xlsx`);
}
