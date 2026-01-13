/**
 * Award Interpreter Engine
 * Comprehensive calculation of pay rates, penalties, overtime, and allowances
 * based on Australian Modern Awards, specifically Children's Services Award 2020
 */

import { Shift, StaffMember } from '@/types/roster';
import { 
  AustralianAward, 
  AwardClassification, 
  australianAwards, 
  getAwardById 
} from '@/data/australianAwards';
import { isPublicHoliday, isSchoolHoliday } from '@/data/mockHolidaysEvents';
import { format, parseISO, getDay, differenceInMinutes } from 'date-fns';
import {
  isBrokenShift,
  isOnCallShift,
  isSleepoverShift,
  wasRecalledDuringOnCall,
  wasSleepoverDisturbed,
  hasHigherDuties,
  calculateTravelAllowance,
  enrichShiftWithDetectedConditions,
} from './shiftTypeDetection';

// Time period definitions
export interface TimePeriod {
  start: string; // HH:MM
  end: string;   // HH:MM
  type: 'ordinary' | 'evening' | 'night' | 'earlyMorning';
  penaltyRate?: number; // percentage multiplier
}

// Children's Services Award time periods (Monday-Friday)
export const childcareTimePeriods: TimePeriod[] = [
  { start: '00:00', end: '06:00', type: 'night', penaltyRate: 115 },
  { start: '06:00', end: '18:00', type: 'ordinary', penaltyRate: 100 },
  { start: '18:00', end: '21:00', type: 'evening', penaltyRate: 110 },
  { start: '21:00', end: '24:00', type: 'night', penaltyRate: 115 },
];

export interface ShiftCostBreakdown {
  shiftId: string;
  staffId: string;
  staffName: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  grossMinutes: number;
  breakMinutes: number;
  netMinutes: number;
  netHours: number;
  
  // Rate components
  baseHourlyRate: number;
  effectiveHourlyRate: number; // after casual loading if applicable
  classification: string;
  employmentType: string;
  
  // Pay breakdown
  ordinaryHours: number;
  ordinaryPay: number;
  
  eveningHours: number;
  eveningPay: number;
  eveningPenaltyRate: number;
  
  saturdayHours: number;
  saturdayPay: number;
  saturdayPenaltyRate: number;
  
  sundayHours: number;
  sundayPay: number;
  sundayPenaltyRate: number;
  
  publicHolidayHours: number;
  publicHolidayPay: number;
  publicHolidayPenaltyRate: number;
  
  overtimeHours: number;
  overtimePay: number;
  
  // Allowances
  allowances: {
    id: string;
    name: string;
    amount: number;
    description?: string;
  }[];
  totalAllowances: number;
  
  // Totals
  grossPay: number;
  superannuation: number; // 11.5% as of July 2024
  totalCost: number;
  
  // Flags
  isPublicHoliday: boolean;
  isSchoolHoliday: boolean;
  isCasual: boolean;
  hasOvertime: boolean;
  warnings: string[];
}

export interface WeeklyCostSummary {
  staffId: string;
  staffName: string;
  weekStart: string;
  weekEnd: string;
  
  totalHours: number;
  ordinaryHours: number;
  overtimeHours: number;
  penaltyHours: number;
  
  ordinaryPay: number;
  overtimePay: number;
  penaltyPay: number;
  allowances: number;
  
  grossPay: number;
  superannuation: number;
  totalCost: number;
  
  maxHoursExceeded: boolean;
  shifts: ShiftCostBreakdown[];
}

// Get day type for penalty calculation
export type DayType = 'weekday' | 'saturday' | 'sunday' | 'public_holiday';

export function getDayType(dateStr: string): DayType {
  if (isPublicHoliday(dateStr)) {
    return 'public_holiday';
  }
  
  const date = parseISO(dateStr);
  const dayOfWeek = getDay(date);
  
  if (dayOfWeek === 0) return 'sunday';
  if (dayOfWeek === 6) return 'saturday';
  return 'weekday';
}

// Parse time string to minutes from midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Calculate hours within a time period
function hoursInPeriod(
  shiftStart: string, 
  shiftEnd: string, 
  periodStart: string, 
  periodEnd: string
): number {
  const shiftStartMins = timeToMinutes(shiftStart);
  let shiftEndMins = timeToMinutes(shiftEnd);
  const periodStartMins = timeToMinutes(periodStart);
  const periodEndMins = timeToMinutes(periodEnd);
  
  // Handle overnight shifts
  if (shiftEndMins < shiftStartMins) {
    shiftEndMins += 24 * 60;
  }
  
  const overlapStart = Math.max(shiftStartMins, periodStartMins);
  const overlapEnd = Math.min(shiftEndMins, periodEndMins);
  
  if (overlapStart >= overlapEnd) return 0;
  
  return (overlapEnd - overlapStart) / 60;
}

// Calculate shift cost breakdown
export function calculateShiftCost(
  shift: Shift,
  staff: StaffMember,
  award: AustralianAward = getAwardById('children-services-2020')!,
  classification?: AwardClassification
): ShiftCostBreakdown {
  const warnings: string[] = [];
  const dateStr = shift.date;
  const date = parseISO(dateStr);
  const dayOfWeek = format(date, 'EEEE');
  const dayType = getDayType(dateStr);
  
  // Calculate time
  const startMins = timeToMinutes(shift.startTime);
  let endMins = timeToMinutes(shift.endTime);
  if (endMins < startMins) endMins += 24 * 60;
  
  const grossMinutes = endMins - startMins;
  const breakMinutes = shift.breakMinutes;
  const netMinutes = grossMinutes - breakMinutes;
  const netHours = netMinutes / 60;
  
  // Get classification or default
  const classLevel = classification || award.classifications.find(c => c.level === 'Level 3.1') || award.classifications[6];
  const isCasual = staff.employmentType === 'casual';
  
  // Calculate effective hourly rate
  const baseHourlyRate = staff.hourlyRate || classLevel.baseHourlyRate;
  const casualLoading = isCasual ? award.casualLoading / 100 : 0;
  const effectiveHourlyRate = baseHourlyRate * (1 + casualLoading);
  
  // Initialize breakdown
  let ordinaryHours = 0;
  let ordinaryPay = 0;
  let eveningHours = 0;
  let eveningPay = 0;
  let saturdayHours = 0;
  let saturdayPay = 0;
  let sundayHours = 0;
  let sundayPay = 0;
  let publicHolidayHours = 0;
  let publicHolidayPay = 0;
  let overtimeHours = 0;
  let overtimePay = 0;
  
  // Calculate based on day type
  if (dayType === 'public_holiday') {
    publicHolidayHours = netHours;
    publicHolidayPay = netHours * effectiveHourlyRate * (award.publicHolidayPenalty / 100);
  } else if (dayType === 'sunday') {
    sundayHours = netHours;
    sundayPay = netHours * effectiveHourlyRate * (award.sundayPenalty / 100);
  } else if (dayType === 'saturday') {
    saturdayHours = netHours;
    saturdayPay = netHours * effectiveHourlyRate * (award.saturdayPenalty / 100);
  } else {
    // Weekday - calculate time periods
    const ordinaryPeriodHours = hoursInPeriod(shift.startTime, shift.endTime, '06:00', '18:00');
    const eveningPeriodHours = hoursInPeriod(shift.startTime, shift.endTime, '18:00', '21:00');
    const nightHours = hoursInPeriod(shift.startTime, shift.endTime, '21:00', '24:00') +
                       hoursInPeriod(shift.startTime, shift.endTime, '00:00', '06:00');
    
    // Prorate break across periods
    const totalHoursWithBreak = ordinaryPeriodHours + eveningPeriodHours + nightHours;
    const breakProration = totalHoursWithBreak > 0 ? netHours / totalHoursWithBreak : 1;
    
    ordinaryHours = ordinaryPeriodHours * breakProration;
    eveningHours = eveningPeriodHours * breakProration;
    
    ordinaryPay = ordinaryHours * effectiveHourlyRate;
    
    if (award.eveningPenalty && eveningHours > 0) {
      eveningPay = eveningHours * effectiveHourlyRate * (award.eveningPenalty / 100);
    } else {
      eveningPay = eveningHours * effectiveHourlyRate;
    }
    
    // Night penalty (add to ordinary)
    const nightPayHours = nightHours * breakProration;
    if (nightPayHours > 0 && award.nightPenalty) {
      ordinaryPay += nightPayHours * effectiveHourlyRate * (award.nightPenalty / 100);
      ordinaryHours += nightPayHours;
    }
  }
  
  // Calculate overtime (over 8 hours daily for permanent/part-time)
  if (!isCasual && netHours > 8) {
    const dailyOT = netHours - 8;
    overtimeHours = dailyOT;
    
    // First 2 hours at 1.5x, after that at 2x
    const ot15Hours = Math.min(dailyOT, 2);
    const ot20Hours = Math.max(0, dailyOT - 2);
    
    overtimePay = (ot15Hours * effectiveHourlyRate * (award.overtimeRates.first2Hours / 100)) +
                  (ot20Hours * effectiveHourlyRate * (award.overtimeRates.after2Hours / 100));
    
    // Reduce ordinary hours by overtime
    if (ordinaryHours >= overtimeHours) {
      ordinaryHours -= overtimeHours;
      ordinaryPay = ordinaryHours * effectiveHourlyRate;
    }
    
    warnings.push(`Overtime: ${overtimeHours.toFixed(1)}h (daily limit exceeded)`);
  }
  
  // Enrich shift with auto-detected conditions
  const enrichedShift = enrichShiftWithDetectedConditions(shift);
  
  // Calculate allowances
  const allowances: ShiftCostBreakdown['allowances'] = [];
  
  // First Aid allowance (if qualified)
  const hasFirstAid = staff.qualifications.some(q => q.type === 'first_aid' && !q.isExpired);
  if (hasFirstAid) {
    const faAllowance = award.allowances.find(a => a.id.includes('fa'));
    if (faAllowance && faAllowance.type === 'per_week') {
      // Prorate weekly allowance across 5 working days
      allowances.push({
        id: faAllowance.id,
        name: faAllowance.name,
        amount: faAllowance.amount / 5,
        description: 'Prorated from weekly allowance',
      });
    }
  }
  
  // Educational Leader allowance (for lead educators)
  if (staff.role === 'lead_educator') {
    const edAllowance = award.allowances.find(a => a.id.includes('ed'));
    if (edAllowance && edAllowance.type === 'per_hour') {
      allowances.push({
        id: edAllowance.id,
        name: edAllowance.name,
        amount: edAllowance.amount * netHours,
        description: `${netHours.toFixed(1)}h × $${edAllowance.amount.toFixed(2)}`,
      });
    }
  }
  
  // On-Call Allowance
  if (isOnCallShift(enrichedShift)) {
    const onCallAllowance = award.allowances.find(a => 
      a.name.toLowerCase().includes('on-call') || 
      a.name.toLowerCase().includes('on call') ||
      a.id.includes('oncall')
    );
    const onCallRate = onCallAllowance?.amount ?? 15.42; // Default rate
    
    // Calculate on-call hours
    let onCallHours = netHours;
    if (enrichedShift.onCallDetails) {
      const ocStart = timeToMinutes(enrichedShift.onCallDetails.startTime);
      let ocEnd = timeToMinutes(enrichedShift.onCallDetails.endTime);
      if (ocEnd < ocStart) ocEnd += 24 * 60;
      onCallHours = (ocEnd - ocStart) / 60;
    }
    
    allowances.push({
      id: 'on-call-allowance',
      name: 'On-Call Allowance',
      amount: onCallRate, // Daily rate
      description: `On-call for ${onCallHours.toFixed(1)} hours`,
    });
    
    // Recall during on-call (paid at overtime rates for time worked)
    if (wasRecalledDuringOnCall(enrichedShift) && enrichedShift.onCallDetails?.recallDuration) {
      const recallMinutes = enrichedShift.onCallDetails.recallDuration;
      const recallHours = recallMinutes / 60;
      // Minimum 2 hours for recall
      const paidRecallHours = Math.max(2, recallHours);
      const recallRate = effectiveHourlyRate * 1.5; // Time and a half minimum
      
      allowances.push({
        id: 'recall-payment',
        name: 'Recall During On-Call',
        amount: paidRecallHours * recallRate,
        description: `${recallHours.toFixed(1)}h actual (min 2h) @ 150% rate`,
      });
      
      warnings.push(`Recalled during on-call: ${recallMinutes} mins worked`);
    }
  }
  
  // Sleepover Allowance
  if (isSleepoverShift(enrichedShift)) {
    const sleepoverAllowance = award.allowances.find(a => 
      a.name.toLowerCase().includes('sleepover') ||
      a.name.toLowerCase().includes('sleep over') ||
      a.id.includes('sleep')
    );
    const sleepoverRate = sleepoverAllowance?.amount ?? 69.85; // Default rate
    
    allowances.push({
      id: 'sleepover-allowance',
      name: 'Sleepover Allowance',
      amount: sleepoverRate,
      description: 'Overnight stay at facility',
    });
    
    // Disturbance during sleepover (paid at minimum rates)
    if (wasSleepoverDisturbed(enrichedShift) && enrichedShift.sleepoverDetails?.disturbanceMinutes) {
      const disturbanceMinutes = enrichedShift.sleepoverDetails.disturbanceMinutes;
      const disturbanceHours = Math.max(1, disturbanceMinutes / 60); // Minimum 1 hour
      const disturbanceRate = effectiveHourlyRate * 1.5; // Typically time and a half
      
      allowances.push({
        id: 'sleepover-disturbance',
        name: 'Sleepover Disturbance',
        amount: disturbanceHours * disturbanceRate,
        description: `Disturbed for ${disturbanceMinutes} mins (min 1h @ 150%)`,
      });
      
      warnings.push(`Sleepover disturbed: ${disturbanceMinutes} mins`);
    }
  }
  
  // Broken/Split Shift Allowance
  if (isBrokenShift(enrichedShift)) {
    const brokenAllowance = award.allowances.find(a => 
      a.name.toLowerCase().includes('broken') ||
      a.name.toLowerCase().includes('split') ||
      a.id.includes('broken') ||
      a.id.includes('split')
    );
    const brokenRate = brokenAllowance?.amount ?? 18.46; // Default rate
    
    allowances.push({
      id: 'broken-shift-allowance',
      name: 'Broken Shift Allowance',
      amount: brokenRate,
      description: `Shift with unpaid break > 1 hour`,
    });
    
    if (enrichedShift.brokenShiftDetails) {
      warnings.push(`Broken shift: ${enrichedShift.brokenShiftDetails.unpaidGapMinutes} mins unpaid gap`);
    }
  }
  
  // Higher Duties Allowance
  if (hasHigherDuties(enrichedShift) && enrichedShift.higherDuties) {
    const hdAllowance = award.allowances.find(a => 
      a.name.toLowerCase().includes('higher dut') ||
      a.id.includes('higher')
    );
    const hdHourlyRate = hdAllowance?.amount ?? 2.50;
    
    // Calculate hours at higher duties (default to full shift)
    const hdMinutes = enrichedShift.higherDuties.durationMinutes ?? netMinutes;
    const hdHours = hdMinutes / 60;
    
    allowances.push({
      id: 'higher-duties-allowance',
      name: 'Higher Duties Allowance',
      amount: hdHours * hdHourlyRate,
      description: `${hdHours.toFixed(1)}h at ${enrichedShift.higherDuties.classification}`,
    });
  }
  
  // Vehicle/Travel Allowance
  const travelAllowance = calculateTravelAllowance(enrichedShift);
  if (travelAllowance > 0) {
    allowances.push({
      id: 'vehicle-allowance',
      name: 'Vehicle Allowance',
      amount: travelAllowance,
      description: `${enrichedShift.travelKilometres} km @ $0.96/km`,
    });
  }
  
  const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
  
  // Calculate gross pay
  const grossPay = ordinaryPay + eveningPay + saturdayPay + sundayPay + 
                   publicHolidayPay + overtimePay + totalAllowances;
  
  // Superannuation (11.5% as of July 2024)
  const superRate = 0.115;
  const superannuation = grossPay * superRate;
  
  // Total cost to employer
  const totalCost = grossPay + superannuation;
  
  return {
    shiftId: shift.id,
    staffId: staff.id,
    staffName: staff.name,
    date: dateStr,
    dayOfWeek,
    startTime: shift.startTime,
    endTime: shift.endTime,
    grossMinutes,
    breakMinutes,
    netMinutes,
    netHours,
    
    baseHourlyRate,
    effectiveHourlyRate,
    classification: classLevel.level,
    employmentType: staff.employmentType,
    
    ordinaryHours,
    ordinaryPay,
    
    eveningHours,
    eveningPay,
    eveningPenaltyRate: award.eveningPenalty || 100,
    
    saturdayHours,
    saturdayPay,
    saturdayPenaltyRate: award.saturdayPenalty,
    
    sundayHours,
    sundayPay,
    sundayPenaltyRate: award.sundayPenalty,
    
    publicHolidayHours,
    publicHolidayPay,
    publicHolidayPenaltyRate: award.publicHolidayPenalty,
    
    overtimeHours,
    overtimePay,
    
    allowances,
    totalAllowances,
    
    grossPay,
    superannuation,
    totalCost,
    
    isPublicHoliday: dayType === 'public_holiday',
    isSchoolHoliday: isSchoolHoliday(dateStr),
    isCasual,
    hasOvertime: overtimeHours > 0,
    warnings,
  };
}

// Calculate weekly summary for a staff member
export function calculateWeeklyCost(
  shifts: Shift[],
  staff: StaffMember,
  weekStart: string,
  weekEnd: string,
  award: AustralianAward = getAwardById('children-services-2020')!
): WeeklyCostSummary {
  const shiftBreakdowns = shifts
    .filter(s => s.staffId === staff.id && s.date >= weekStart && s.date <= weekEnd)
    .map(s => calculateShiftCost(s, staff, award));
  
  const totalHours = shiftBreakdowns.reduce((sum, s) => sum + s.netHours, 0);
  const ordinaryHours = shiftBreakdowns.reduce((sum, s) => sum + s.ordinaryHours, 0);
  const overtimeHours = shiftBreakdowns.reduce((sum, s) => sum + s.overtimeHours, 0);
  const penaltyHours = shiftBreakdowns.reduce((sum, s) => 
    sum + s.eveningHours + s.saturdayHours + s.sundayHours + s.publicHolidayHours, 0);
  
  const ordinaryPay = shiftBreakdowns.reduce((sum, s) => sum + s.ordinaryPay, 0);
  const overtimePay = shiftBreakdowns.reduce((sum, s) => sum + s.overtimePay, 0);
  const penaltyPay = shiftBreakdowns.reduce((sum, s) => 
    sum + s.eveningPay + s.saturdayPay + s.sundayPay + s.publicHolidayPay, 0);
  const allowances = shiftBreakdowns.reduce((sum, s) => sum + s.totalAllowances, 0);
  
  const grossPay = shiftBreakdowns.reduce((sum, s) => sum + s.grossPay, 0);
  const superannuation = shiftBreakdowns.reduce((sum, s) => sum + s.superannuation, 0);
  const totalCost = shiftBreakdowns.reduce((sum, s) => sum + s.totalCost, 0);
  
  // Check weekly overtime (over 38 hours for full-time)
  const maxHoursExceeded = totalHours > staff.maxHoursPerWeek;
  
  return {
    staffId: staff.id,
    staffName: staff.name,
    weekStart,
    weekEnd,
    totalHours,
    ordinaryHours,
    overtimeHours,
    penaltyHours,
    ordinaryPay,
    overtimePay,
    penaltyPay,
    allowances,
    grossPay,
    superannuation,
    totalCost,
    maxHoursExceeded,
    shifts: shiftBreakdowns,
  };
}

// Calculate total roster cost for a period
export function calculateRosterCost(
  shifts: Shift[],
  staff: StaffMember[],
  startDate: string,
  endDate: string,
  award: AustralianAward = getAwardById('children-services-2020')!
): {
  totalGrossPay: number;
  totalSuperannuation: number;
  totalCost: number;
  totalHours: number;
  staffCosts: WeeklyCostSummary[];
  byDayType: {
    weekday: { hours: number; cost: number };
    saturday: { hours: number; cost: number };
    sunday: { hours: number; cost: number };
    publicHoliday: { hours: number; cost: number };
  };
} {
  const staffCosts = staff.map(s => 
    calculateWeeklyCost(shifts, s, startDate, endDate, award)
  );
  
  const totalGrossPay = staffCosts.reduce((sum, s) => sum + s.grossPay, 0);
  const totalSuperannuation = staffCosts.reduce((sum, s) => sum + s.superannuation, 0);
  const totalCost = staffCosts.reduce((sum, s) => sum + s.totalCost, 0);
  const totalHours = staffCosts.reduce((sum, s) => sum + s.totalHours, 0);
  
  // Aggregate by day type
  const allBreakdowns = staffCosts.flatMap(s => s.shifts);
  
  const byDayType = {
    weekday: {
      hours: allBreakdowns.reduce((sum, s) => sum + s.ordinaryHours + s.eveningHours, 0),
      cost: allBreakdowns.reduce((sum, s) => sum + s.ordinaryPay + s.eveningPay, 0),
    },
    saturday: {
      hours: allBreakdowns.reduce((sum, s) => sum + s.saturdayHours, 0),
      cost: allBreakdowns.reduce((sum, s) => sum + s.saturdayPay, 0),
    },
    sunday: {
      hours: allBreakdowns.reduce((sum, s) => sum + s.sundayHours, 0),
      cost: allBreakdowns.reduce((sum, s) => sum + s.sundayPay, 0),
    },
    publicHoliday: {
      hours: allBreakdowns.reduce((sum, s) => sum + s.publicHolidayHours, 0),
      cost: allBreakdowns.reduce((sum, s) => sum + s.publicHolidayPay, 0),
    },
  };
  
  return {
    totalGrossPay,
    totalSuperannuation,
    totalCost,
    totalHours,
    staffCosts,
    byDayType,
  };
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
