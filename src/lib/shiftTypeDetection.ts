/**
 * Shift Type Detection Utilities
 * 
 * These utilities detect and validate special shift conditions that trigger
 * specific allowances under Australian awards.
 */

import { Shift, StaffMember } from '@/types/roster';

// Time parsing utilities
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Detects if a shift qualifies as a broken/split shift
 * A broken shift has an unpaid break of more than 1 hour in the middle
 */
export function isBrokenShift(shift: Shift): boolean {
  // Explicit broken shift marking
  if (shift.shiftType === 'broken') return true;
  if (shift.brokenShiftDetails) return true;
  
  // Auto-detect based on break duration (>60 minutes suggests broken shift)
  // Note: This is a heuristic - proper broken shift detection requires
  // tracking separate shift segments
  return shift.breakMinutes > 60;
}

/**
 * Detects if shift is an on-call period
 * On-call means the employee must be available but isn't actively working
 */
export function isOnCallShift(shift: Shift): boolean {
  if (shift.shiftType === 'on_call') return true;
  if (shift.onCallDetails) return true;
  return false;
}

/**
 * Detects if this is a sleepover shift
 * Sleepover = employee required to stay overnight at workplace
 */
export function isSleepoverShift(shift: Shift): boolean {
  if (shift.shiftType === 'sleepover') return true;
  if (shift.sleepoverDetails) return true;
  
  // Auto-detect based on shift spanning overnight hours
  const startMins = timeToMinutes(shift.startTime);
  const endMins = timeToMinutes(shift.endTime);
  
  // If shift goes past midnight and duration is 8+ hours, likely sleepover
  if (endMins < startMins) {
    const duration = (24 * 60 - startMins) + endMins;
    if (duration >= 8 * 60) return true;
  }
  
  return false;
}

/**
 * Detects if staff was recalled during on-call
 */
export function wasRecalledDuringOnCall(shift: Shift): boolean {
  if (shift.shiftType === 'recall') return true;
  return shift.onCallDetails?.wasRecalled ?? false;
}

/**
 * Detects if sleepover was disturbed (triggers additional pay)
 */
export function wasSleepoverDisturbed(shift: Shift): boolean {
  return shift.sleepoverDetails?.wasDisturbed ?? false;
}

/**
 * Calculates unpaid gap duration for broken shifts
 */
export function getBrokenShiftGapMinutes(shift: Shift): number {
  if (shift.brokenShiftDetails) {
    return shift.brokenShiftDetails.unpaidGapMinutes;
  }
  
  // If break is over 60 minutes, the excess is the "gap"
  if (shift.breakMinutes > 60) {
    return shift.breakMinutes - 30; // Assume 30 min paid break, rest is gap
  }
  
  return 0;
}

/**
 * Determines if higher duties allowance applies
 */
export function hasHigherDuties(shift: Shift): boolean {
  return !!shift.higherDuties?.classification;
}

/**
 * Gets the higher duties classification if applicable
 */
export function getHigherDutiesClassification(shift: Shift): string | null {
  return shift.higherDuties?.classification ?? null;
}

/**
 * Calculates vehicle/travel allowance eligibility
 */
export function calculateTravelAllowance(shift: Shift, ratePerKm: number = 0.96): number {
  if (!shift.travelKilometres || shift.travelKilometres <= 0) return 0;
  return shift.travelKilometres * ratePerKm;
}

/**
 * Validates shift data for common issues
 */
export interface ShiftValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export function validateShiftData(shift: Shift): ShiftValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  const startMins = timeToMinutes(shift.startTime);
  let endMins = timeToMinutes(shift.endTime);
  if (endMins < startMins) endMins += 24 * 60;
  
  const grossMinutes = endMins - startMins;
  const netMinutes = grossMinutes - shift.breakMinutes;
  
  // Check for overnight shift without sleepover marking
  if (endMins > 24 * 60 && !shift.sleepoverDetails && shift.shiftType !== 'sleepover') {
    suggestions.push('This shift spans overnight. Consider marking as sleepover if employee stays at facility.');
  }
  
  // Check for long break without broken shift marking
  if (shift.breakMinutes > 60 && shift.shiftType !== 'broken' && !shift.brokenShiftDetails) {
    suggestions.push(`Break of ${shift.breakMinutes} minutes detected. If this is a broken/split shift, mark it as such to apply correct allowances.`);
  }
  
  // Check for on-call without recall details
  if (shift.shiftType === 'on_call' && !shift.onCallDetails) {
    warnings.push('On-call shift missing details. Add on-call start/end times for accurate allowance calculation.');
  }
  
  // Check for recall without on-call context
  if (shift.shiftType === 'recall' && !shift.onCallDetails?.wasRecalled) {
    warnings.push('Recall shift should have on-call details with wasRecalled=true.');
  }
  
  // Sleepover disturbance check
  if (shift.sleepoverDetails?.wasDisturbed && !shift.sleepoverDetails.disturbanceMinutes) {
    warnings.push('Sleepover was disturbed but disturbance duration not recorded. This affects pay calculation.');
  }
  
  // Higher duties partial shift
  if (shift.higherDuties && !shift.higherDuties.durationMinutes) {
    suggestions.push('Higher duties recorded without duration. System will assume full shift at higher rate.');
  }
  
  // Validate net hours
  if (netMinutes <= 0) {
    errors.push('Break duration exceeds shift duration.');
  }
  
  // Long shift warning
  if (netMinutes > 10 * 60) {
    warnings.push(`Long shift: ${(netMinutes / 60).toFixed(1)} net hours. Ensure overtime is correctly applied.`);
  }
  
  // Minimum engagement (3 hours for casuals in most awards)
  if (netMinutes < 3 * 60 && netMinutes > 0) {
    warnings.push('Shift is less than 3 hours. Check minimum engagement requirements for applicable award.');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions,
  };
}

/**
 * Determines which allowances a shift is eligible for
 */
export interface AllowanceEligibility {
  allowanceCode: string;
  allowanceName: string;
  isEligible: boolean;
  reason: string;
  autoDetected: boolean;
  requiresConfirmation: boolean;
}

export function detectAllowanceEligibility(
  shift: Shift, 
  staff: StaffMember
): AllowanceEligibility[] {
  const eligibility: AllowanceEligibility[] = [];
  
  // On-Call Allowance
  eligibility.push({
    allowanceCode: 'ON_CALL',
    allowanceName: 'On Call Allowance',
    isEligible: isOnCallShift(shift),
    reason: isOnCallShift(shift) 
      ? 'Shift marked as on-call period'
      : 'Not an on-call shift',
    autoDetected: shift.shiftType === 'on_call',
    requiresConfirmation: false,
  });
  
  // Sleepover Allowance
  const sleepoverDetected = isSleepoverShift(shift);
  eligibility.push({
    allowanceCode: 'SLEEPOVER',
    allowanceName: 'Sleepover Allowance',
    isEligible: sleepoverDetected,
    reason: sleepoverDetected 
      ? 'Employee required to sleep overnight at workplace'
      : 'Not a sleepover shift',
    autoDetected: shift.shiftType !== 'sleepover' && sleepoverDetected,
    requiresConfirmation: shift.shiftType !== 'sleepover' && sleepoverDetected,
  });
  
  // Broken Shift Allowance
  const brokenDetected = isBrokenShift(shift);
  eligibility.push({
    allowanceCode: 'BROKEN_SHIFT',
    allowanceName: 'Broken Shift Allowance',
    isEligible: brokenDetected,
    reason: brokenDetected 
      ? `Unpaid break exceeds 1 hour (${shift.breakMinutes} mins)`
      : 'Standard break duration',
    autoDetected: shift.shiftType !== 'broken' && brokenDetected,
    requiresConfirmation: shift.shiftType !== 'broken' && brokenDetected,
  });
  
  // First Aid Allowance
  const hasFirstAid = staff.qualifications.some(
    q => q.type === 'first_aid' && !q.isExpired
  );
  eligibility.push({
    allowanceCode: 'FIRST_AID',
    allowanceName: 'First Aid Allowance',
    isEligible: hasFirstAid,
    reason: hasFirstAid 
      ? 'Staff has valid first aid certification'
      : 'No valid first aid certification',
    autoDetected: true,
    requiresConfirmation: false,
  });
  
  // Higher Duties Allowance
  eligibility.push({
    allowanceCode: 'HIGHER_DUTIES',
    allowanceName: 'Higher Duties Allowance',
    isEligible: hasHigherDuties(shift),
    reason: hasHigherDuties(shift) 
      ? `Performing ${shift.higherDuties?.classification} duties`
      : 'No higher duties assigned',
    autoDetected: false,
    requiresConfirmation: hasHigherDuties(shift),
  });
  
  // Vehicle/Travel Allowance
  const hasTravelKm = (shift.travelKilometres ?? 0) > 0;
  eligibility.push({
    allowanceCode: 'VEHICLE',
    allowanceName: 'Vehicle Allowance',
    isEligible: hasTravelKm,
    reason: hasTravelKm 
      ? `${shift.travelKilometres} km work-related travel`
      : 'No travel kilometres recorded',
    autoDetected: false,
    requiresConfirmation: false,
  });
  
  // Educational Leader Allowance (for lead educators)
  const isEducationalLeader = staff.role === 'lead_educator';
  eligibility.push({
    allowanceCode: 'NQA_LEADERSHIP',
    allowanceName: 'NQA Leadership Allowance',
    isEligible: isEducationalLeader,
    reason: isEducationalLeader 
      ? 'Staff is Educational Leader'
      : 'Not an Educational Leader role',
    autoDetected: true,
    requiresConfirmation: false,
  });
  
  return eligibility;
}

/**
 * Auto-enriches shift with detected special conditions
 * Returns a new shift object with inferred properties filled in
 */
export function enrichShiftWithDetectedConditions(shift: Shift): Shift {
  const enrichedShift = { ...shift };
  
  // Auto-detect sleepover if not already marked
  if (!enrichedShift.shiftType && isSleepoverShift(shift)) {
    enrichedShift.shiftType = 'sleepover';
  }
  
  // Auto-detect broken shift if not already marked
  if (!enrichedShift.shiftType && shift.breakMinutes > 60) {
    enrichedShift.shiftType = 'broken';
    enrichedShift.brokenShiftDetails = {
      firstShiftEnd: shift.startTime, // Placeholder - needs actual data
      secondShiftStart: shift.endTime, // Placeholder - needs actual data
      unpaidGapMinutes: shift.breakMinutes - 30,
    };
  }
  
  return enrichedShift;
}
