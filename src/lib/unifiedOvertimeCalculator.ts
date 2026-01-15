/**
 * Unified Overtime Calculator
 * Single source of truth for overtime calculations across the system
 * Used by both complianceEngine and awardInterpreter
 */

import { Jurisdiction } from '@/types/compliance';
import { australianJurisdiction, getJurisdictionByAward, AwardType, penaltyRatesByAward } from './australianJurisdiction';

// Input for overtime calculation
export interface OvertimeInput {
  hoursWorked: number;          // Total hours worked
  baseHourlyRate: number;       // Base hourly rate before loadings
  isCasual: boolean;            // Casual employee (affects OT rules)
  casualLoading?: number;       // Casual loading percentage (default 25)
  awardType?: AwardType;        // Award type for specific rules
  dayType?: 'weekday' | 'saturday' | 'sunday' | 'public_holiday';
  isNightShift?: boolean;       // If shift includes night hours
  isEveningShift?: boolean;     // If shift includes evening hours
}

// Detailed overtime breakdown
export interface OvertimeBreakdown {
  // Hours breakdown
  ordinaryHours: number;
  overtime15Hours: number;       // First 2 hours at 1.5x
  overtime20Hours: number;       // Additional hours at 2x
  totalOvertimeHours: number;
  
  // Pay breakdown
  ordinaryPay: number;
  overtime15Pay: number;
  overtime20Pay: number;
  totalOvertimePay: number;
  
  // Penalty loadings (for weekend/holiday/evening work)
  penaltyLoading: number;
  penaltyPay: number;
  
  // Casual loading
  casualLoadingAmount: number;
  
  // Totals
  grossPay: number;
  effectiveHourlyRate: number;
  
  // Flags
  hasOvertime: boolean;
  overtimeReason: string[];
}

// Daily overtime calculation (Australian awards typically use daily triggers)
export function calculateDailyOvertime(
  input: OvertimeInput,
  jurisdiction: Jurisdiction = australianJurisdiction
): OvertimeBreakdown {
  const {
    hoursWorked,
    baseHourlyRate,
    isCasual,
    casualLoading = 25,
    awardType = 'general',
    dayType = 'weekday',
    isNightShift = false,
    isEveningShift = false,
  } = input;
  
  const penalties = penaltyRatesByAward[awardType];
  const overtimeReasons: string[] = [];
  
  // Calculate effective base rate (with casual loading if applicable)
  const casualLoadingAmount = isCasual ? baseHourlyRate * (casualLoading / 100) : 0;
  const effectiveBaseRate = baseHourlyRate + casualLoadingAmount;
  
  // Casual employees generally don't get overtime under Australian awards
  // (casual loading compensates for lack of leave entitlements, not overtime)
  // However, they still get overtime after threshold hours
  const overtimeThreshold = jurisdiction.overtimeThresholdDaily;
  const doubleTimeThreshold = jurisdiction.doubleTimeThreshold || overtimeThreshold + 2;
  
  // Calculate hours breakdown
  let ordinaryHours = Math.min(hoursWorked, overtimeThreshold);
  let overtime15Hours = 0;
  let overtime20Hours = 0;
  
  if (hoursWorked > overtimeThreshold) {
    // Casuals DO get overtime in Australia after threshold
    overtime15Hours = Math.min(hoursWorked - overtimeThreshold, 2);
    overtime20Hours = Math.max(0, hoursWorked - doubleTimeThreshold);
    
    if (overtime15Hours > 0) {
      overtimeReasons.push(`Daily threshold of ${overtimeThreshold}h exceeded`);
    }
    if (overtime20Hours > 0) {
      overtimeReasons.push(`Extended overtime after ${doubleTimeThreshold}h`);
    }
  }
  
  const totalOvertimeHours = overtime15Hours + overtime20Hours;
  
  // Calculate base pay
  let ordinaryPay = ordinaryHours * effectiveBaseRate;
  const overtime15Pay = overtime15Hours * effectiveBaseRate * jurisdiction.overtimeMultiplier;
  const overtime20Pay = overtime20Hours * effectiveBaseRate * (jurisdiction.doubleTimeMultiplier || 2);
  const totalOvertimePay = overtime15Pay + overtime20Pay;
  
  // Calculate penalty loadings based on day type
  let penaltyMultiplier = 1;
  let penaltyDescription = '';
  
  switch (dayType) {
    case 'saturday':
      penaltyMultiplier = penalties.saturday;
      penaltyDescription = 'Saturday penalty';
      break;
    case 'sunday':
      penaltyMultiplier = penalties.sunday;
      penaltyDescription = 'Sunday penalty';
      break;
    case 'public_holiday':
      penaltyMultiplier = penalties.publicHoliday;
      penaltyDescription = 'Public holiday penalty';
      break;
    case 'weekday':
      // Evening/night loadings apply to weekdays
      if (isNightShift) {
        penaltyMultiplier = 1 + (penalties.night / 100);
        penaltyDescription = 'Night shift loading';
      } else if (isEveningShift) {
        penaltyMultiplier = 1 + (penalties.evening / 100);
        penaltyDescription = 'Evening shift loading';
      }
      break;
  }
  
  // Apply penalty to ordinary hours (overtime has its own rates)
  const penaltyLoading = penaltyMultiplier > 1 ? (penaltyMultiplier - 1) : 0;
  const penaltyPay = ordinaryHours * effectiveBaseRate * penaltyLoading;
  ordinaryPay = ordinaryHours * effectiveBaseRate * penaltyMultiplier;
  
  if (penaltyLoading > 0 && penaltyDescription) {
    overtimeReasons.push(penaltyDescription);
  }
  
  const grossPay = ordinaryPay + totalOvertimePay;
  const effectiveHourlyRate = hoursWorked > 0 ? grossPay / hoursWorked : effectiveBaseRate;
  
  return {
    ordinaryHours,
    overtime15Hours,
    overtime20Hours,
    totalOvertimeHours,
    ordinaryPay,
    overtime15Pay,
    overtime20Pay,
    totalOvertimePay,
    penaltyLoading,
    penaltyPay,
    casualLoadingAmount: casualLoadingAmount * ordinaryHours,
    grossPay,
    effectiveHourlyRate,
    hasOvertime: totalOvertimeHours > 0,
    overtimeReason: overtimeReasons,
  };
}

// Weekly overtime calculation (for timesheet totals)
export interface WeeklyOvertimeInput {
  dailyHours: number[];         // Array of hours for each day
  baseHourlyRate: number;
  isCasual: boolean;
  casualLoading?: number;
  awardType?: AwardType;
}

export interface WeeklyOvertimeBreakdown {
  totalHours: number;
  weeklyOrdinaryHours: number;
  weeklyOvertimeHours: number;
  dailyBreakdowns: OvertimeBreakdown[];
  
  // Weekly totals
  totalOrdinaryPay: number;
  totalOvertimePay: number;
  totalPenaltyPay: number;
  grossPay: number;
  
  // Flags
  exceededWeeklyThreshold: boolean;
  weeklyOvertimeHoursFromThreshold: number;
}

export function calculateWeeklyOvertime(
  input: WeeklyOvertimeInput,
  jurisdiction: Jurisdiction = australianJurisdiction
): WeeklyOvertimeBreakdown {
  const { dailyHours, baseHourlyRate, isCasual, casualLoading = 25, awardType = 'general' } = input;
  
  // Calculate daily breakdowns first
  const dailyBreakdowns: OvertimeBreakdown[] = dailyHours.map((hours, index) => {
    const dayOfWeek = index;
    let dayType: OvertimeInput['dayType'] = 'weekday';
    if (dayOfWeek === 5) dayType = 'saturday';
    if (dayOfWeek === 6) dayType = 'sunday';
    
    return calculateDailyOvertime({
      hoursWorked: hours,
      baseHourlyRate,
      isCasual,
      casualLoading,
      awardType,
      dayType,
    }, jurisdiction);
  });
  
  const totalHours = dailyHours.reduce((sum, h) => sum + h, 0);
  
  // Sum up daily calculations
  let weeklyOrdinaryHours = dailyBreakdowns.reduce((sum, d) => sum + d.ordinaryHours, 0);
  let weeklyOvertimeHours = dailyBreakdowns.reduce((sum, d) => sum + d.totalOvertimeHours, 0);
  
  // Check for additional weekly overtime (if total ordinary hours exceed weekly threshold)
  // This catches cases where daily hours were under threshold but weekly total exceeded
  let weeklyOvertimeHoursFromThreshold = 0;
  const exceededWeeklyThreshold = weeklyOrdinaryHours > jurisdiction.overtimeThresholdWeekly;
  
  if (exceededWeeklyThreshold) {
    weeklyOvertimeHoursFromThreshold = weeklyOrdinaryHours - jurisdiction.overtimeThresholdWeekly;
    weeklyOvertimeHours += weeklyOvertimeHoursFromThreshold;
    weeklyOrdinaryHours = jurisdiction.overtimeThresholdWeekly;
  }
  
  const totalOrdinaryPay = dailyBreakdowns.reduce((sum, d) => sum + d.ordinaryPay, 0);
  const totalOvertimePay = dailyBreakdowns.reduce((sum, d) => sum + d.totalOvertimePay, 0);
  const totalPenaltyPay = dailyBreakdowns.reduce((sum, d) => sum + d.penaltyPay, 0);
  const grossPay = dailyBreakdowns.reduce((sum, d) => sum + d.grossPay, 0);
  
  return {
    totalHours,
    weeklyOrdinaryHours,
    weeklyOvertimeHours,
    dailyBreakdowns,
    totalOrdinaryPay,
    totalOvertimePay,
    totalPenaltyPay,
    grossPay,
    exceededWeeklyThreshold,
    weeklyOvertimeHoursFromThreshold,
  };
}

// Convert timesheet entries to unified format
export interface TimesheetEntry {
  date: string;
  netHours: number;
  dayType?: 'weekday' | 'saturday' | 'sunday' | 'public_holiday';
}

export function calculateTimesheetOvertime(
  entries: TimesheetEntry[],
  baseHourlyRate: number,
  isCasual: boolean,
  awardType: AwardType = 'general',
  jurisdiction: Jurisdiction = australianJurisdiction
): WeeklyOvertimeBreakdown {
  const dailyBreakdowns: OvertimeBreakdown[] = entries.map(entry => 
    calculateDailyOvertime({
      hoursWorked: entry.netHours,
      baseHourlyRate,
      isCasual,
      awardType,
      dayType: entry.dayType,
    }, jurisdiction)
  );
  
  const totalHours = entries.reduce((sum, e) => sum + e.netHours, 0);
  let weeklyOrdinaryHours = dailyBreakdowns.reduce((sum, d) => sum + d.ordinaryHours, 0);
  let weeklyOvertimeHours = dailyBreakdowns.reduce((sum, d) => sum + d.totalOvertimeHours, 0);
  
  let weeklyOvertimeHoursFromThreshold = 0;
  const exceededWeeklyThreshold = weeklyOrdinaryHours > jurisdiction.overtimeThresholdWeekly;
  
  if (exceededWeeklyThreshold) {
    weeklyOvertimeHoursFromThreshold = weeklyOrdinaryHours - jurisdiction.overtimeThresholdWeekly;
    weeklyOvertimeHours += weeklyOvertimeHoursFromThreshold;
    weeklyOrdinaryHours = jurisdiction.overtimeThresholdWeekly;
  }
  
  return {
    totalHours,
    weeklyOrdinaryHours,
    weeklyOvertimeHours,
    dailyBreakdowns,
    totalOrdinaryPay: dailyBreakdowns.reduce((sum, d) => sum + d.ordinaryPay, 0),
    totalOvertimePay: dailyBreakdowns.reduce((sum, d) => sum + d.totalOvertimePay, 0),
    totalPenaltyPay: dailyBreakdowns.reduce((sum, d) => sum + d.penaltyPay, 0),
    grossPay: dailyBreakdowns.reduce((sum, d) => sum + d.grossPay, 0),
    exceededWeeklyThreshold,
    weeklyOvertimeHoursFromThreshold,
  };
}
