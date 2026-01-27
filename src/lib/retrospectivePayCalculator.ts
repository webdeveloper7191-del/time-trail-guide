/**
 * Retrospective Pay Calculator
 * Calculates back-pay adjustments when pay changes are applied to previous pay cycles
 */

import { format, parseISO, differenceInDays, isWithinInterval, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export interface AffectedTimesheet {
  id: string;
  weekEnding: string;
  employeeName: string;
  regularHours: number;
  overtimeHours: number;
  originalRate: number;
  newRate: number;
  originalPay: number;
  newPay: number;
  adjustment: number;
  status: 'pending' | 'approved' | 'processed';
}

export interface BackPayCalculation {
  totalAffectedTimesheets: number;
  totalAffectedHours: number;
  totalOriginalPay: number;
  totalNewPay: number;
  totalAdjustment: number;
  affectedPeriods: string[];
  affectedTimesheets: AffectedTimesheet[];
  calculatedAt: string;
  effectiveFrom: string;
  effectiveTo: string;
  employeeId: string;
  employeeName: string;
  adjustmentType: 'increase' | 'decrease';
  rateDifference: number;
  percentageChange: number;
}

export interface RetroactivePayInput {
  employeeId: string;
  employeeName: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  oldHourlyRate: number;
  newHourlyRate: number;
  overtimeMultiplier?: number;
}

// Mock timesheets for demonstration - in real app, this would come from API/database
function getMockTimesheetsForPeriod(employeeId: string, startDate: Date, endDate: Date): AffectedTimesheet[] {
  const timesheets: AffectedTimesheet[] = [];
  let currentDate = startOfWeek(startDate);
  let id = 1;
  
  while (currentDate <= endDate) {
    const weekEnd = endOfWeek(currentDate);
    // Simulate some variation in hours
    const regularHours = 38 + (Math.random() > 0.7 ? 0 : -8); // Sometimes part-time week
    const overtimeHours = Math.random() > 0.6 ? Math.floor(Math.random() * 6) : 0;
    
    timesheets.push({
      id: `ts-retro-${id}`,
      weekEnding: format(weekEnd, 'yyyy-MM-dd'),
      employeeName: '',
      regularHours,
      overtimeHours,
      originalRate: 0,
      newRate: 0,
      originalPay: 0,
      newPay: 0,
      adjustment: 0,
      status: Math.random() > 0.3 ? 'approved' : 'pending',
    });
    
    currentDate = new Date(weekEnd.getTime() + 24 * 60 * 60 * 1000);
    id++;
  }
  
  return timesheets;
}

export function calculateRetrospectivePay(input: RetroactivePayInput): BackPayCalculation {
  const {
    employeeId,
    employeeName,
    effectiveFrom,
    effectiveTo = new Date(),
    oldHourlyRate,
    newHourlyRate,
    overtimeMultiplier = 1.5,
  } = input;
  
  const rateDifference = newHourlyRate - oldHourlyRate;
  const percentageChange = oldHourlyRate > 0 ? ((rateDifference / oldHourlyRate) * 100) : 0;
  const adjustmentType = rateDifference > 0 ? 'increase' : 'decrease';
  
  // Get affected timesheets
  const rawTimesheets = getMockTimesheetsForPeriod(employeeId, effectiveFrom, effectiveTo);
  
  // Calculate pay for each timesheet
  const affectedTimesheets: AffectedTimesheet[] = rawTimesheets.map(ts => {
    const regularPay = ts.regularHours * oldHourlyRate;
    const overtimePay = ts.overtimeHours * oldHourlyRate * overtimeMultiplier;
    const originalPay = regularPay + overtimePay;
    
    const newRegularPay = ts.regularHours * newHourlyRate;
    const newOvertimePay = ts.overtimeHours * newHourlyRate * overtimeMultiplier;
    const newPay = newRegularPay + newOvertimePay;
    
    return {
      ...ts,
      employeeName,
      originalRate: oldHourlyRate,
      newRate: newHourlyRate,
      originalPay,
      newPay,
      adjustment: newPay - originalPay,
    };
  });
  
  // Calculate totals
  const totalAffectedHours = affectedTimesheets.reduce(
    (sum, ts) => sum + ts.regularHours + ts.overtimeHours, 0
  );
  const totalOriginalPay = affectedTimesheets.reduce((sum, ts) => sum + ts.originalPay, 0);
  const totalNewPay = affectedTimesheets.reduce((sum, ts) => sum + ts.newPay, 0);
  const totalAdjustment = totalNewPay - totalOriginalPay;
  
  // Get unique periods (weeks)
  const affectedPeriods = [...new Set(affectedTimesheets.map(ts => ts.weekEnding))];
  
  return {
    totalAffectedTimesheets: affectedTimesheets.length,
    totalAffectedHours,
    totalOriginalPay,
    totalNewPay,
    totalAdjustment,
    affectedPeriods,
    affectedTimesheets,
    calculatedAt: new Date().toISOString(),
    effectiveFrom: format(effectiveFrom, 'yyyy-MM-dd'),
    effectiveTo: format(effectiveTo, 'yyyy-MM-dd'),
    employeeId,
    employeeName,
    adjustmentType,
    rateDifference,
    percentageChange,
  };
}

export function formatBackPayReport(calculation: BackPayCalculation): string {
  const lines: string[] = [
    '='.repeat(60),
    'RETROSPECTIVE PAY ADJUSTMENT REPORT',
    '='.repeat(60),
    '',
    `Employee: ${calculation.employeeName}`,
    `Generated: ${format(new Date(calculation.calculatedAt), 'dd MMM yyyy HH:mm')}`,
    '',
    '-'.repeat(60),
    'ADJUSTMENT SUMMARY',
    '-'.repeat(60),
    `Period: ${format(parseISO(calculation.effectiveFrom), 'dd MMM yyyy')} to ${format(parseISO(calculation.effectiveTo), 'dd MMM yyyy')}`,
    `Rate Change: $${calculation.rateDifference.toFixed(2)}/hr (${calculation.percentageChange.toFixed(1)}% ${calculation.adjustmentType})`,
    '',
    `Total Affected Timesheets: ${calculation.totalAffectedTimesheets}`,
    `Total Hours: ${calculation.totalAffectedHours.toFixed(1)}`,
    '',
    `Original Total Pay: $${calculation.totalOriginalPay.toFixed(2)}`,
    `New Total Pay: $${calculation.totalNewPay.toFixed(2)}`,
    '',
    `TOTAL ADJUSTMENT: $${calculation.totalAdjustment.toFixed(2)}`,
    '',
    '-'.repeat(60),
    'AFFECTED TIMESHEETS',
    '-'.repeat(60),
  ];
  
  calculation.affectedTimesheets.forEach(ts => {
    lines.push(`Week Ending: ${format(parseISO(ts.weekEnding), 'dd MMM yyyy')}`);
    lines.push(`  Hours: ${ts.regularHours}h regular + ${ts.overtimeHours}h OT`);
    lines.push(`  Original: $${ts.originalPay.toFixed(2)} → New: $${ts.newPay.toFixed(2)}`);
    lines.push(`  Adjustment: $${ts.adjustment.toFixed(2)} [${ts.status.toUpperCase()}]`);
    lines.push('');
  });
  
  return lines.join('\n');
}
