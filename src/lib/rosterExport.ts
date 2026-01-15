import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Shift, StaffMember, Centre, OpenShift, roleLabels, Room } from '@/types/roster';
import { format } from 'date-fns';

interface ExportData {
  shifts: Shift[];
  staff: StaffMember[];
  centre: Centre;
  dates: Date[];
  weeklyBudget: number;
  roomColors?: string[];
}

// Convert HSL string to RGB for PDF
function hslToRgb(hslStr: string): { r: number; g: number; b: number } {
  const match = hslStr.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
  if (!match) return { r: 100, g: 100, b: 100 };
  
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;
  
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Lighter version of a color for backgrounds
function lightenRgb(rgb: { r: number; g: number; b: number }, factor: number = 0.85): { r: number; g: number; b: number } {
  return {
    r: Math.round(rgb.r + (255 - rgb.r) * factor),
    g: Math.round(rgb.g + (255 - rgb.g) * factor),
    b: Math.round(rgb.b + (255 - rgb.b) * factor),
  };
}

export function exportToPDF(data: ExportData, useColors: boolean = false) {
  const { shifts, staff, centre, dates, weeklyBudget, roomColors = [] } = data;
  const doc = new jsPDF({ orientation: 'landscape' });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text(`Roster Schedule - ${centre.name}`, 14, yPos);
  yPos += 10;

  // Date range
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
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
  doc.setTextColor(60, 60, 60);
  doc.text(`Total Hours: ${Math.round(totalHours * 10) / 10}h | Total Cost: $${Math.round(totalCost).toLocaleString()} | Budget: $${weeklyBudget.toLocaleString()}`, 14, yPos);
  yPos += 15;

  // Calculate column widths
  const leftColWidth = 55;
  const dateColWidth = (pageWidth - leftColWidth - 30) / dates.length;

  // Table Header
  if (useColors) {
    doc.setFillColor(240, 245, 250);
  } else {
    doc.setFillColor(245, 245, 245);
  }
  doc.rect(14, yPos - 5, pageWidth - 28, 12, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  
  let xPos = 17;
  doc.text('Room / Staff', xPos, yPos + 2);
  xPos = leftColWidth + 14;

  dates.forEach((date) => {
    const dayText = format(date, 'EEE');
    const dateText = format(date, 'd MMM');
    doc.text(dayText, xPos + dateColWidth / 2 - doc.getTextWidth(dayText) / 2, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(dateText, xPos + dateColWidth / 2 - doc.getTextWidth(dateText) / 2, yPos + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    xPos += dateColWidth;
  });
  
  yPos += 15;

  // Render rooms with staff
  centre.rooms.forEach((room, roomIndex) => {
    const roomShifts = centreShifts.filter(s => s.roomId === room.id);
    const roomStaffIds = [...new Set(roomShifts.map(s => s.staffId))];
    const roomStaff = staff.filter(s => roomStaffIds.includes(s.id));

    if (roomStaff.length === 0) return;

    // Check page break
    const estimatedHeight = (roomStaff.length + 1) * 8 + 10;
    if (yPos + estimatedHeight > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    // Room header row
    const roomColor = roomColors[roomIndex] || 'hsl(200, 70%, 50%)';
    const rgb = hslToRgb(roomColor);
    
    if (useColors) {
      const lightRgb = lightenRgb(rgb, 0.8);
      doc.setFillColor(lightRgb.r, lightRgb.g, lightRgb.b);
      doc.rect(14, yPos - 4, pageWidth - 28, 10, 'F');
      
      // Room color accent bar
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(14, yPos - 4, 3, 10, 'F');
    } else {
      doc.setFillColor(235, 235, 235);
      doc.rect(14, yPos - 4, pageWidth - 28, 10, 'F');
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(`${room.name}`, 20, yPos + 2);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`(1:${room.requiredRatio} ratio, Cap: ${room.capacity})`, 20 + doc.getTextWidth(`${room.name} `) + 5, yPos + 2);
    
    yPos += 10;

    // Staff rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    roomStaff.forEach((member, memberIndex) => {
      if (yPos > pageHeight - 15) {
        doc.addPage();
        yPos = 20;
      }

      // Alternating row colors
      if (useColors) {
        if (memberIndex % 2 === 0) {
          const veryLightRgb = lightenRgb(rgb, 0.95);
          doc.setFillColor(veryLightRgb.r, veryLightRgb.g, veryLightRgb.b);
        } else {
          doc.setFillColor(255, 255, 255);
        }
      } else {
        if (memberIndex % 2 === 0) {
          doc.setFillColor(250, 250, 250);
        } else {
          doc.setFillColor(255, 255, 255);
        }
      }
      doc.rect(14, yPos - 3, pageWidth - 28, 8, 'F');

      xPos = 20;
      doc.setTextColor(50, 50, 50);
      doc.text(member.name.substring(0, 22), xPos, yPos + 2);
      xPos = leftColWidth + 14;

      dates.forEach((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayShifts = roomShifts.filter(s => s.staffId === member.id && s.date === dateStr);
        
        if (dayShifts.length > 0) {
          // Draw shift box with color
          if (useColors) {
            doc.setFillColor(rgb.r, rgb.g, rgb.b);
            doc.roundedRect(xPos + 1, yPos - 2, dateColWidth - 4, 6, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
          } else {
            doc.setTextColor(30, 30, 30);
          }
          
          const shiftText = dayShifts.map(s => `${s.startTime}-${s.endTime}`).join(', ');
          const displayText = shiftText.length > 11 ? shiftText.substring(0, 9) + '..' : shiftText;
          doc.text(displayText, xPos + dateColWidth / 2 - doc.getTextWidth(displayText) / 2, yPos + 2);
          doc.setTextColor(50, 50, 50);
        } else {
          doc.setTextColor(180, 180, 180);
          doc.text('—', xPos + dateColWidth / 2 - 2, yPos + 2);
          doc.setTextColor(50, 50, 50);
        }
        xPos += dateColWidth;
      });

      yPos += 8;
    });

    yPos += 5; // Space between rooms
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 14, pageHeight - 10);

  // Save
  const colorSuffix = useColors ? '-color' : '';
  doc.save(`roster-${centre.code}-${format(dates[0], 'yyyy-MM-dd')}${colorSuffix}.pdf`);
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
