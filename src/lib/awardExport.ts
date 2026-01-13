import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { AustralianAward, AwardClassification, calculateRates } from '@/data/australianAwards';
import { format } from 'date-fns';

export interface AwardExportData {
  award: AustralianAward;
  customRates?: Record<string, number>;
  includeAllClassifications?: boolean;
}

export interface BulkAwardExportData {
  awards: AustralianAward[];
  customRates?: Record<string, Record<string, number>>;
}

const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

export function exportAwardToPDF(data: AwardExportData) {
  const { award, customRates = {} } = data;
  const doc = new jsPDF({ orientation: 'portrait' });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(award.shortName, 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(award.name, 14, yPos);
  yPos += 6;
  doc.text(`${award.code} | ${award.industry} | Effective: ${award.effectiveDate}`, 14, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 12;

  // Export date
  doc.setFontSize(8);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, pageWidth - 14 - 50, 20);
  yPos += 5;

  // Penalty Rates Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Penalty Rates', 14, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const penalties = [
    ['Casual Loading', `${award.casualLoading}%`],
    ['Saturday', `${award.saturdayPenalty}%`],
    ['Sunday', `${award.sundayPenalty}%`],
    ['Public Holiday', `${award.publicHolidayPenalty}%`],
  ];
  
  if (award.eveningPenalty) penalties.push(['Evening', `${award.eveningPenalty}%`]);
  if (award.nightPenalty) penalties.push(['Night', `${award.nightPenalty}%`]);

  penalties.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 14, yPos);
    yPos += 5;
  });
  yPos += 5;

  // Overtime Rates
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Overtime Rates', 14, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`First 2 Hours: ${award.overtimeRates.first2Hours}%`, 14, yPos);
  yPos += 5;
  doc.text(`After 2 Hours: ${award.overtimeRates.after2Hours}%`, 14, yPos);
  yPos += 5;
  doc.text(`Sunday Overtime: ${award.overtimeRates.sundayOvertime}%`, 14, yPos);
  yPos += 10;

  // Classifications Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Pay Classifications (${award.classifications.length})`, 14, yPos);
  yPos += 8;

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos - 4, pageWidth - 28, 8, 'F');
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const colX = [14, 40, 95, 125, 155];
  doc.text('Level', colX[0], yPos);
  doc.text('Description', colX[1], yPos);
  doc.text('Base Rate', colX[2], yPos);
  doc.text('Casual Rate', colX[3], yPos);
  doc.text('Override', colX[4], yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  award.classifications.forEach((classification) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    const rates = calculateRates(award, classification, 'casual');
    const hasOverride = customRates[classification.id] !== undefined;
    const overrideRate = customRates[classification.id];

    doc.text(classification.level.substring(0, 10), colX[0], yPos);
    doc.text(classification.description.substring(0, 30), colX[1], yPos);
    doc.text(formatCurrency(classification.baseHourlyRate), colX[2], yPos);
    doc.text(formatCurrency(rates.casualLoadedRate || 0), colX[3], yPos);
    doc.text(hasOverride ? formatCurrency(overrideRate!) : '-', colX[4], yPos);
    yPos += 6;
  });
  yPos += 5;

  // Allowances
  if (award.allowances.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Allowances (${award.allowances.length})`, 14, yPos);
    yPos += 8;

    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos - 4, pageWidth - 28, 8, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Name', 14, yPos);
    doc.text('Type', 80, yPos);
    doc.text('Amount', 120, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    award.allowances.forEach((allowance) => {
      doc.text(allowance.name.substring(0, 30), 14, yPos);
      doc.text(allowance.type.replace('_', ' '), 80, yPos);
      doc.text(formatCurrency(allowance.amount), 120, yPos);
      yPos += 6;
    });
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Source: Fair Work Commission | This document is for reference only', 14, 285);

  doc.save(`award-${award.code}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function exportAwardToExcel(data: AwardExportData) {
  const { award, customRates = {} } = data;
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ['Award Details'],
    [''],
    ['Name', award.name],
    ['Short Name', award.shortName],
    ['Code', award.code],
    ['Industry', award.industry],
    ['Effective Date', award.effectiveDate],
    [''],
    ['Penalty Rates'],
    ['Casual Loading', `${award.casualLoading}%`],
    ['Saturday', `${award.saturdayPenalty}%`],
    ['Sunday', `${award.sundayPenalty}%`],
    ['Public Holiday', `${award.publicHolidayPenalty}%`],
    ...(award.eveningPenalty ? [['Evening', `${award.eveningPenalty}%`]] : []),
    ...(award.nightPenalty ? [['Night', `${award.nightPenalty}%`]] : []),
    [''],
    ['Overtime Rates'],
    ['First 2 Hours', `${award.overtimeRates.first2Hours}%`],
    ['After 2 Hours', `${award.overtimeRates.after2Hours}%`],
    ['Sunday Overtime', `${award.overtimeRates.sundayOvertime}%`],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Classifications Sheet
  const classData: (string | number)[][] = [
    ['Level', 'Description', 'Base Hourly Rate', 'Casual Rate', 'Saturday Rate', 'Sunday Rate', 'Public Holiday Rate', 'Custom Override', 'Qualification'],
  ];
  
  award.classifications.forEach((classification) => {
    const rates = calculateRates(award, classification, 'casual');
    classData.push([
      classification.level,
      classification.description,
      classification.baseHourlyRate,
      rates.casualLoadedRate || 0,
      rates.saturdayRate,
      rates.sundayRate,
      rates.publicHolidayRate,
      customRates[classification.id] || '',
      classification.qualificationRequired || '',
    ]);
  });
  const classWs = XLSX.utils.aoa_to_sheet(classData);
  XLSX.utils.book_append_sheet(wb, classWs, 'Classifications');

  // Allowances Sheet
  if (award.allowances.length > 0) {
    const allowanceData: (string | number)[][] = [
      ['Name', 'Type', 'Amount', 'Description'],
    ];
    award.allowances.forEach((allowance) => {
      allowanceData.push([
        allowance.name,
        allowance.type.replace('_', ' '),
        allowance.amount,
        allowance.description,
      ]);
    });
    const allowanceWs = XLSX.utils.aoa_to_sheet(allowanceData);
    XLSX.utils.book_append_sheet(wb, allowanceWs, 'Allowances');
  }

  XLSX.writeFile(wb, `award-${award.code}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

export function exportMultipleAwardsToPDF(data: BulkAwardExportData) {
  const { awards, customRates = {} } = data;
  const doc = new jsPDF({ orientation: 'landscape' });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Award Rates Comparison', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')} | ${awards.length} awards`, 14, yPos);
  yPos += 15;

  // Summary table
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos - 4, pageWidth - 28, 10, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const cols = [14, 70, 110, 140, 165, 190, 215, 240];
  doc.text('Award', cols[0], yPos);
  doc.text('Industry', cols[1], yPos);
  doc.text('Classifications', cols[2], yPos);
  doc.text('Casual', cols[3], yPos);
  doc.text('Saturday', cols[4], yPos);
  doc.text('Sunday', cols[5], yPos);
  doc.text('P.Holiday', cols[6], yPos);
  doc.text('Rate Range', cols[7], yPos);
  yPos += 12;

  doc.setFont('helvetica', 'normal');
  awards.forEach((award) => {
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }

    const minRate = Math.min(...award.classifications.map(c => c.baseHourlyRate));
    const maxRate = Math.max(...award.classifications.map(c => c.baseHourlyRate));

    doc.text(award.shortName.substring(0, 25), cols[0], yPos);
    doc.text(award.industry.substring(0, 15), cols[1], yPos);
    doc.text(award.classifications.length.toString(), cols[2], yPos);
    doc.text(`${award.casualLoading}%`, cols[3], yPos);
    doc.text(`${award.saturdayPenalty}%`, cols[4], yPos);
    doc.text(`${award.sundayPenalty}%`, cols[5], yPos);
    doc.text(`${award.publicHolidayPenalty}%`, cols[6], yPos);
    doc.text(`${formatCurrency(minRate)} - ${formatCurrency(maxRate)}`, cols[7], yPos);
    yPos += 7;
  });

  doc.save(`awards-comparison-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function exportMultipleAwardsToExcel(data: BulkAwardExportData) {
  const { awards, customRates = {} } = data;
  const wb = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData: (string | number)[][] = [
    ['Award Comparison Summary', '', '', '', '', '', '', '', ''],
    ['Generated:', format(new Date(), 'dd MMM yyyy HH:mm'), '', '', '', '', '', '', ''],
    [''],
    ['Short Name', 'Full Name', 'Code', 'Industry', 'Classifications', 'Casual %', 'Saturday %', 'Sunday %', 'Public Holiday %', 'Min Rate', 'Max Rate'],
  ];

  awards.forEach((award) => {
    const minRate = Math.min(...award.classifications.map(c => c.baseHourlyRate));
    const maxRate = Math.max(...award.classifications.map(c => c.baseHourlyRate));
    
    summaryData.push([
      award.shortName,
      award.name,
      award.code,
      award.industry,
      award.classifications.length,
      award.casualLoading,
      award.saturdayPenalty,
      award.sundayPenalty,
      award.publicHolidayPenalty,
      minRate,
      maxRate,
    ]);
  });

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Individual award sheets
  awards.forEach((award) => {
    const sheetData: (string | number)[][] = [
      [award.name],
      [`${award.code} | ${award.industry}`],
      [''],
      ['Level', 'Description', 'Base Rate', 'Casual Rate', 'Saturday', 'Sunday', 'Public Holiday'],
    ];

    award.classifications.forEach((classification) => {
      const rates = calculateRates(award, classification, 'casual');
      sheetData.push([
        classification.level,
        classification.description,
        classification.baseHourlyRate,
        rates.casualLoadedRate || 0,
        rates.saturdayRate,
        rates.sundayRate,
        rates.publicHolidayRate,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const sheetName = award.shortName.substring(0, 31).replace(/[*?:/\\[\]]/g, '');
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, `awards-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
