/**
 * Leave Accrual Engine
 * Calculates leave accruals, LSL entitlements, and manages leave balances
 */

import { format, parseISO, differenceInDays, differenceInYears, differenceInMonths, addYears } from 'date-fns';
import {
  LeaveType,
  LeaveBalance,
  LeaveAccrualConfig,
  LeaveTransaction,
  AccrualCalculation,
  LSL_STATE_RULES,
  NES_ENTITLEMENTS,
  AustralianState,
  EmploymentBasis,
} from '@/types/leaveAccrual';

// Calculate annual leave accrual for a pay period
export function calculateAnnualLeaveAccrual(
  hoursWorked: number,
  config: LeaveAccrualConfig
): number {
  // Casuals don't accrue annual leave (loaded in rate instead)
  if (config.hasCasualLoading) {
    return 0;
  }
  
  // Custom rate if specified
  if (config.customAnnualLeaveRate) {
    const hoursPerYear = config.standardHoursPerWeek * 52;
    return hoursWorked * (config.customAnnualLeaveRate / hoursPerYear);
  }
  
  // NES standard: 4 weeks (152 hours for 38hr week) per year
  // Accrual rate = 4/52 = 0.07692 per hour worked
  return hoursWorked * NES_ENTITLEMENTS.annualLeave.accrualRate;
}

// Calculate personal/carer's leave accrual for a pay period
export function calculatePersonalLeaveAccrual(
  hoursWorked: number,
  config: LeaveAccrualConfig
): number {
  // Casuals don't accrue personal leave
  if (config.hasCasualLoading) {
    return 0;
  }
  
  // Custom rate if specified
  if (config.customPersonalLeaveRate) {
    const hoursPerYear = config.standardHoursPerWeek * 52;
    return hoursWorked * (config.customPersonalLeaveRate / hoursPerYear);
  }
  
  // NES standard: 10 days (76 hours for 38hr week) per year
  // Accrual rate = 2/52 = 0.03846 per hour worked
  return hoursWorked * NES_ENTITLEMENTS.personalLeave.accrualRate;
}

// Calculate Long Service Leave accrual
export function calculateLSLAccrual(
  hoursWorked: number,
  serviceYears: number,
  state: AustralianState,
  config: LeaveAccrualConfig
): { hours: number; eligible: boolean; entitlementDate?: string } {
  const rules = LSL_STATE_RULES[state];
  
  // Casuals may still accrue LSL in some states
  const weeksPerYear = rules.entitlementWeeks / rules.entitlementYears;
  const hoursPerWeek = config.standardHoursPerWeek || 38;
  const lslHoursPerYear = weeksPerYear * hoursPerWeek;
  
  // Accrual per hour worked
  const yearlyHours = hoursPerWeek * 52;
  const accrualRate = lslHoursPerYear / yearlyHours;
  
  const hoursAccrued = hoursWorked * accrualRate;
  
  // Check if eligible for entitlement
  const eligible = serviceYears >= rules.entitlementYears;
  
  // Calculate next entitlement date if not yet eligible
  let entitlementDate: string | undefined;
  if (!eligible) {
    const startDate = parseISO(config.serviceStartDate);
    const nextEntitlement = addYears(startDate, rules.entitlementYears);
    entitlementDate = format(nextEntitlement, 'yyyy-MM-dd');
  }
  
  return {
    hours: hoursAccrued,
    eligible,
    entitlementDate,
  };
}

// Calculate service years from start date
export function calculateServiceYears(startDate: string, asOfDate?: string): number {
  const start = parseISO(startDate);
  const end = asOfDate ? parseISO(asOfDate) : new Date();
  return differenceInYears(end, start);
}

// Calculate service in months (for more precise LSL calculations)
export function calculateServiceMonths(startDate: string, asOfDate?: string): number {
  const start = parseISO(startDate);
  const end = asOfDate ? parseISO(asOfDate) : new Date();
  return differenceInMonths(end, start);
}

// Get LSL pro-rata entitlement
export function getLSLProRataEntitlement(
  state: AustralianState,
  serviceYears: number,
  terminationType: 'resignation' | 'termination' | 'redundancy',
  hourlyRate: number,
  standardHoursPerWeek: number = 38
): { eligible: boolean; weeks: number; hours: number; value: number; reason: string } {
  const rules = LSL_STATE_RULES[state];
  
  // Check pro-rata eligibility based on termination type
  const isEligibleForProRata = 
    (terminationType === 'resignation' && rules.proRataOnResignation && serviceYears >= (rules.proRataYears || rules.entitlementYears)) ||
    (terminationType === 'termination' && rules.proRataOnTermination && serviceYears >= (rules.proRataYears || rules.entitlementYears)) ||
    (terminationType === 'redundancy' && serviceYears >= (rules.proRataYears || rules.entitlementYears));
  
  if (!isEligibleForProRata && serviceYears < rules.entitlementYears) {
    return {
      eligible: false,
      weeks: 0,
      hours: 0,
      value: 0,
      reason: `Minimum ${rules.proRataYears || rules.entitlementYears} years service required for pro-rata LSL in ${rules.stateName}`,
    };
  }
  
  // Calculate pro-rata weeks
  let weeks: number;
  if (serviceYears >= rules.entitlementYears) {
    // Full entitlement plus additional years
    const additionalYears = serviceYears - rules.entitlementYears;
    weeks = rules.entitlementWeeks + (additionalYears * rules.additionalWeeksPerYear);
  } else {
    // Pro-rata calculation
    weeks = (serviceYears / rules.entitlementYears) * rules.entitlementWeeks;
  }
  
  const hours = weeks * standardHoursPerWeek;
  const value = hours * hourlyRate;
  
  return {
    eligible: true,
    weeks: Math.round(weeks * 100) / 100,
    hours: Math.round(hours * 100) / 100,
    value: Math.round(value * 100) / 100,
    reason: `${rules.stateName} LSL: ${weeks.toFixed(2)} weeks for ${serviceYears} years service`,
  };
}

// Full accrual calculation for a pay period
export function calculatePeriodAccruals(
  staffId: string,
  hoursWorked: number,
  periodStart: string,
  periodEnd: string,
  config: LeaveAccrualConfig
): AccrualCalculation {
  const serviceYears = calculateServiceYears(config.serviceStartDate, periodEnd);
  
  const annualLeave = calculateAnnualLeaveAccrual(hoursWorked, config);
  const personalLeave = calculatePersonalLeaveAccrual(hoursWorked, config);
  const lslResult = calculateLSLAccrual(hoursWorked, serviceYears, config.state, config);
  
  const calculations: AccrualCalculation['calculations'] = [];
  
  if (annualLeave > 0) {
    calculations.push({
      leaveType: 'annual_leave',
      hoursAccrued: annualLeave,
      rate: NES_ENTITLEMENTS.annualLeave.accrualRate,
      formula: `${hoursWorked} hours × ${NES_ENTITLEMENTS.annualLeave.accrualRate.toFixed(5)} = ${annualLeave.toFixed(4)} hours`,
      notes: config.customAnnualLeaveRate ? 'Custom rate applied' : 'NES standard rate',
    });
  }
  
  if (personalLeave > 0) {
    calculations.push({
      leaveType: 'personal_leave',
      hoursAccrued: personalLeave,
      rate: NES_ENTITLEMENTS.personalLeave.accrualRate,
      formula: `${hoursWorked} hours × ${NES_ENTITLEMENTS.personalLeave.accrualRate.toFixed(5)} = ${personalLeave.toFixed(4)} hours`,
      notes: config.customPersonalLeaveRate ? 'Custom rate applied' : 'NES standard rate',
    });
  }
  
  if (lslResult.hours > 0) {
    const rules = LSL_STATE_RULES[config.state];
    const accrualRate = (rules.entitlementWeeks * (config.standardHoursPerWeek || 38)) / (rules.entitlementYears * 52 * (config.standardHoursPerWeek || 38));
    calculations.push({
      leaveType: 'long_service_leave',
      hoursAccrued: lslResult.hours,
      rate: accrualRate,
      formula: `${hoursWorked} hours × ${accrualRate.toFixed(5)} = ${lslResult.hours.toFixed(4)} hours`,
      notes: `${rules.stateName} LSL rules. ${lslResult.eligible ? 'Eligible for entitlement' : `Eligible from ${lslResult.entitlementDate}`}`,
    });
  }
  
  return {
    staffId,
    periodStart,
    periodEnd,
    hoursWorked,
    annualLeaveAccrued: annualLeave,
    personalLeaveAccrued: personalLeave,
    lslAccrued: lslResult.hours,
    calculations,
  };
}

// Update leave balance after accrual
export function applyAccrualToBalance(
  currentBalance: LeaveBalance,
  accrual: number,
  hourlyRate: number
): LeaveBalance {
  return {
    ...currentBalance,
    currentBalanceHours: currentBalance.currentBalanceHours + accrual,
    accruedThisPeriod: accrual,
    accruedYTD: currentBalance.accruedYTD + accrual,
    valueAtCurrentRate: (currentBalance.currentBalanceHours + accrual) * hourlyRate,
    lastUpdated: new Date().toISOString(),
    lastCalculationDate: new Date().toISOString(),
  };
}

// Create leave transaction record
export function createLeaveTransaction(
  staffId: string,
  leaveType: LeaveType,
  transactionType: LeaveTransaction['transactionType'],
  hours: number,
  hourlyRate: number,
  balanceAfter: number,
  reason: string,
  createdBy: string,
  leaveRequestId?: string,
  startDate?: string,
  endDate?: string,
  payPeriodId?: string
): LeaveTransaction {
  return {
    id: `lt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    staffId,
    leaveType,
    transactionType,
    hours,
    value: hours * hourlyRate,
    balanceAfter,
    leaveRequestId,
    startDate,
    endDate,
    reason,
    createdAt: new Date().toISOString(),
    createdBy,
    payPeriodId,
  };
}

// Initialize leave balances for a new employee
export function initializeLeaveBalances(
  staffId: string,
  config: LeaveAccrualConfig
): LeaveBalance[] {
  const now = new Date().toISOString();
  const balances: LeaveBalance[] = [];
  
  // Annual Leave
  if (!config.hasCasualLoading) {
    balances.push({
      id: `lb-al-${staffId}`,
      staffId,
      leaveType: 'annual_leave',
      currentBalanceHours: 0,
      accruedThisPeriod: 0,
      takenThisPeriod: 0,
      accruedYTD: 0,
      takenYTD: 0,
      openingBalance: 0,
      valueAtCurrentRate: 0,
      lastUpdated: now,
      lastCalculationDate: now,
    });
  }
  
  // Personal Leave
  if (!config.hasCasualLoading) {
    balances.push({
      id: `lb-pl-${staffId}`,
      staffId,
      leaveType: 'personal_leave',
      currentBalanceHours: 0,
      accruedThisPeriod: 0,
      takenThisPeriod: 0,
      accruedYTD: 0,
      takenYTD: 0,
      openingBalance: 0,
      valueAtCurrentRate: 0,
      lastUpdated: now,
      lastCalculationDate: now,
    });
  }
  
  // Long Service Leave
  balances.push({
    id: `lb-lsl-${staffId}`,
    staffId,
    leaveType: 'long_service_leave',
    currentBalanceHours: 0,
    accruedThisPeriod: 0,
    takenThisPeriod: 0,
    accruedYTD: 0,
    takenYTD: 0,
    openingBalance: 0,
    serviceYears: 0,
    lslState: config.state,
    valueAtCurrentRate: 0,
    lastUpdated: now,
    lastCalculationDate: now,
  });
  
  return balances;
}

// Format leave balance for display
export function formatLeaveBalance(hours: number, standardHoursPerDay: number = 7.6): string {
  const days = hours / standardHoursPerDay;
  if (days >= 1) {
    return `${days.toFixed(1)} days (${hours.toFixed(1)} hours)`;
  }
  return `${hours.toFixed(1)} hours`;
}

// Convert hours to Xero units
export function convertToXeroUnits(
  hours: number,
  unitType: 'Hours' | 'Days',
  conversionRate: number = 7.6
): number {
  if (unitType === 'Days') {
    return hours / conversionRate;
  }
  return hours;
}

// Export for Xero integration
export interface XeroLeaveBalanceExport {
  employeeId: string;
  leaveTypeId: string;
  numberOfUnits: number;
  unitType: 'Hours' | 'Days';
  description: string;
}

export function exportLeaveBalancesForXero(
  balances: LeaveBalance[],
  staffXeroMapping: Record<string, string>,
  leaveTypeMapping: Record<LeaveType, { xeroId: string; unitType: 'Hours' | 'Days'; conversionRate: number }>
): XeroLeaveBalanceExport[] {
  const exports: XeroLeaveBalanceExport[] = [];
  
  for (const balance of balances) {
    const xeroEmployeeId = staffXeroMapping[balance.staffId];
    const mapping = leaveTypeMapping[balance.leaveType];
    
    if (!xeroEmployeeId || !mapping) continue;
    
    const units = convertToXeroUnits(balance.currentBalanceHours, mapping.unitType, mapping.conversionRate);
    
    exports.push({
      employeeId: xeroEmployeeId,
      leaveTypeId: mapping.xeroId,
      numberOfUnits: Math.round(units * 100) / 100,
      unitType: mapping.unitType,
      description: `Leave balance as of ${format(new Date(), 'dd/MM/yyyy')}`,
    });
  }
  
  return exports;
}
