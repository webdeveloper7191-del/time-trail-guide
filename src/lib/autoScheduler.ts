/**
 * Staff Assignment Engine
 * 
 * Provides constraint-aware staff scoring and assignment for shifts.
 * Used by the unified Demand Shift Wizard and Fill Open Shifts.
 * 
 * Capabilities:
 * 1. STAFF SCORING: Score each available staff member per shift
 * 2. CONSTRAINT VALIDATION: Validate against constraint config (work limits, rest, etc.)
 * 3. GREEDY ASSIGNMENT: Assign best-scoring staff to highest-priority shifts first
 * 4. FILL OPEN SHIFTS: One-click assignment for existing open shifts
 */

import { Shift, StaffMember, Room, Centre, ShiftTemplate, DayAvailability } from '@/types/roster';
import { DemandAnalyticsData } from '@/types/demandAnalytics';
import { TimefoldConstraintConfiguration, defaultConstraintConfig } from '@/types/timefoldConstraintConfig';
import { format, parseISO, getDay, differenceInMinutes, addMinutes, parse } from 'date-fns';

// ============= TYPES =============

export interface SchedulerWeights {
  availability: number;    // 0-100
  qualifications: number;  // 0-100
  cost: number;           // 0-100
  fairness: number;       // 0-100
  preference: number;     // 0-100
}

export const DEFAULT_WEIGHTS: SchedulerWeights = {
  availability: 30,
  qualifications: 25,
  cost: 15,
  fairness: 20,
  preference: 10,
};

export interface GeneratedShiftSlot {
  id: string;
  centreId: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  requiredCount: number;
  demandSource: 'booking' | 'ratio' | 'template' | 'manual';
  priority: 'critical' | 'high' | 'normal' | 'low';
  // Assignment info
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignmentScore?: number;
  assignmentIssues?: string[];
}

export interface ConstraintViolation {
  type: 'hard' | 'soft';
  constraint: string;
  staffId?: string;
  staffName?: string;
  shiftId?: string;
  message: string;
  penalty: number;
}

// ============= HELPERS =============

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function shiftDurationMinutes(start: string, end: string): number {
  let s = timeToMinutes(start);
  let e = timeToMinutes(end);
  if (e <= s) e += 24 * 60; // overnight
  return e - s;
}

function getStaffHoursForDate(
  staffId: string,
  date: string,
  existingShifts: Shift[],
  generatedShifts: GeneratedShiftSlot[]
): number {
  const fromExisting = existingShifts
    .filter(s => s.staffId === staffId && s.date === date)
    .reduce((sum, s) => sum + shiftDurationMinutes(s.startTime, s.endTime) - s.breakMinutes, 0);
  
  const fromGenerated = generatedShifts
    .filter(s => s.assignedStaffId === staffId && s.date === date)
    .reduce((sum, s) => sum + shiftDurationMinutes(s.startTime, s.endTime) - s.breakMinutes, 0);
  
  return (fromExisting + fromGenerated) / 60;
}

function getStaffWeeklyHours(
  staffId: string,
  dateStr: string,
  existingShifts: Shift[],
  generatedShifts: GeneratedShiftSlot[]
): number {
  const date = parseISO(dateStr);
  const dayOfWeek = getDay(date); // 0=Sun
  const weekStart = new Date(date);
  weekStart.setDate(weekStart.getDate() - dayOfWeek + 1); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endStr = format(weekEnd, 'yyyy-MM-dd');
  
  const fromExisting = existingShifts
    .filter(s => s.staffId === staffId && s.date >= startStr && s.date <= endStr)
    .reduce((sum, s) => sum + shiftDurationMinutes(s.startTime, s.endTime) - s.breakMinutes, 0);
  
  const fromGenerated = generatedShifts
    .filter(s => s.assignedStaffId === staffId && s.date >= startStr && s.date <= endStr)
    .reduce((sum, s) => sum + shiftDurationMinutes(s.startTime, s.endTime) - s.breakMinutes, 0);
  
  return (fromExisting + fromGenerated) / 60;
}

function isStaffAvailable(staff: StaffMember, date: string, startTime: string, endTime: string): boolean {
  const dayOfWeek = getDay(parseISO(date));
  const avail = staff.availability?.find(a => a.dayOfWeek === dayOfWeek);
  
  if (!avail || !avail.available) return false;
  
  if (avail.startTime && avail.endTime) {
    const shiftStart = timeToMinutes(startTime);
    const shiftEnd = timeToMinutes(endTime);
    const availStart = timeToMinutes(avail.startTime);
    const availEnd = timeToMinutes(avail.endTime);
    
    if (shiftStart < availStart || shiftEnd > availEnd) return false;
  }
  
  if (staff.timeOff?.some(to => 
    to.status === 'approved' && to.startDate <= date && to.endDate >= date
  )) {
    return false;
  }
  
  return true;
}

function hasShiftOverlap(
  staffId: string,
  date: string,
  startTime: string,
  endTime: string,
  existingShifts: Shift[],
  generatedShifts: GeneratedShiftSlot[]
): boolean {
  const sStart = timeToMinutes(startTime);
  const sEnd = timeToMinutes(endTime);
  
  const allShifts = [
    ...existingShifts.filter(s => s.staffId === staffId && s.date === date).map(s => ({ start: s.startTime, end: s.endTime })),
    ...generatedShifts.filter(s => s.assignedStaffId === staffId && s.date === date).map(s => ({ start: s.startTime, end: s.endTime })),
  ];
  
  return allShifts.some(s => {
    const eStart = timeToMinutes(s.start);
    const eEnd = timeToMinutes(s.end);
    return sStart < eEnd && sEnd > eStart;
  });
}

function getMinRestBetweenShifts(constraints: TimefoldConstraintConfiguration): number {
  const contracts = constraints.employeeConstraints.contracts;
  if (!contracts.enabled || contracts.contracts.length === 0) return 600;
  return Math.max(...contracts.contracts.map(c => c.timeOffRules.minTimeBetweenShiftsMinutes));
}

function getMaxConsecutiveDays(constraints: TimefoldConstraintConfiguration): number {
  const contracts = constraints.employeeConstraints.contracts;
  if (!contracts.enabled || contracts.contracts.length === 0) return 6;
  return Math.min(...contracts.contracts.map(c => 
    c.workLimits.consecutiveDaysWorked.enabled ? c.workLimits.consecutiveDaysWorked.maxConsecutiveDays : 7
  ));
}

function getMaxWeeklyMinutes(constraints: TimefoldConstraintConfiguration): number {
  const contracts = constraints.employeeConstraints.contracts;
  if (!contracts.enabled || contracts.contracts.length === 0) return 2400;
  return Math.max(...contracts.contracts.map(c => 
    c.workLimits.minutesPerPeriod.enabled ? (c.workLimits.minutesPerPeriod.maxMinutes ?? 2400) : 2400
  ));
}

// ============= STAFF SCORING ENGINE =============

interface StaffCandidateScore {
  staffId: string;
  staffName: string;
  totalScore: number;
  breakdown: {
    availability: number;
    qualifications: number;
    cost: number;
    fairness: number;
    preference: number;
  };
  issues: string[];
  isEligible: boolean;
  hourlyRate: number;
}

export function scoreStaffForShift(
  staff: StaffMember,
  shift: GeneratedShiftSlot,
  existingShifts: Shift[],
  assignedShifts: GeneratedShiftSlot[],
  allStaff: StaffMember[],
  weights: SchedulerWeights,
  constraints: TimefoldConstraintConfiguration,
): StaffCandidateScore {
  const issues: string[] = [];
  let isEligible = true;
  
  // --- AVAILABILITY SCORE ---
  let availScore = 0;
  if (isStaffAvailable(staff, shift.date, shift.startTime, shift.endTime)) {
    availScore = 100;
  } else {
    availScore = 0;
    isEligible = false;
    issues.push('Not available');
  }
  
  if (hasShiftOverlap(staff.id, shift.date, shift.startTime, shift.endTime, existingShifts, assignedShifts)) {
    availScore = 0;
    isEligible = false;
    issues.push('Shift overlap');
  }
  
  const weeklyHours = getStaffWeeklyHours(staff.id, shift.date, existingShifts, assignedShifts);
  const shiftHours = (shiftDurationMinutes(shift.startTime, shift.endTime) - shift.breakMinutes) / 60;
  const maxWeeklyMins = getMaxWeeklyMinutes(constraints);
  const maxWeeklyHrs = maxWeeklyMins / 60;
  
  if (weeklyHours + shiftHours > maxWeeklyHrs) {
    if (constraints.employeeConstraints.contracts.contracts.some(c => 
      c.workLimits.minutesPerPeriod.satisfiability === 'REQUIRED'
    )) {
      isEligible = false;
    }
    issues.push(`Would exceed ${maxWeeklyHrs}h weekly limit`);
    availScore = Math.max(0, availScore - 40);
  }
  
  if (weeklyHours + shiftHours > staff.maxHoursPerWeek) {
    issues.push(`Exceeds personal max ${staff.maxHoursPerWeek}h/week`);
    availScore = Math.max(0, availScore - 20);
  }
  
  // --- QUALIFICATION SCORE ---
  let qualScore = 50;
  if (staff.role === 'lead_educator' || staff.role === 'educator') {
    qualScore = 80;
  }
  if (staff.qualifications?.some(q => q.type === 'diploma_ece' || q.type === 'bachelor_ece')) {
    qualScore = 100;
  }
  
  if (constraints.shiftConstraints.skills.enabled && constraints.shiftConstraints.skills.requiredSkillsEnforced) {
    const hasRequired = staff.qualifications?.some(q => !q.isExpired);
    if (!hasRequired) {
      qualScore = 20;
      if (constraints.shiftConstraints.skills.requiredSkillsEnforced) {
        issues.push('Missing required qualifications');
      }
    }
  }
  
  // --- COST SCORE ---
  let costScore = 50;
  if (constraints.shiftConstraints.costManagement.enabled) {
    const allRates = allStaff.map(s => s.hourlyRate);
    const minRate = Math.min(...allRates);
    const maxRate = Math.max(...allRates);
    const range = maxRate - minRate || 1;
    costScore = Math.round(100 * (1 - (staff.hourlyRate - minRate) / range));
  }
  
  // --- FAIRNESS SCORE ---
  let fairnessScore = 50;
  if (constraints.employeeConstraints.fairness.enabled) {
    const avgHours = allStaff.reduce((sum, s) => {
      return sum + getStaffWeeklyHours(s.id, shift.date, existingShifts, assignedShifts);
    }, 0) / allStaff.length;
    
    const deviation = Math.abs(weeklyHours - avgHours);
    if (weeklyHours < avgHours) {
      fairnessScore = Math.min(100, 50 + (avgHours - weeklyHours) * 10);
    } else {
      fairnessScore = Math.max(0, 50 - deviation * 10);
    }
  }
  
  // --- PREFERENCE SCORE ---
  let preferenceScore = 50;
  const prefs = staff.schedulingPreferences;
  if (prefs) {
    if (prefs.preferredRooms?.includes(shift.roomId)) {
      preferenceScore = 90;
    } else if (prefs.avoidRooms?.includes(shift.roomId)) {
      preferenceScore = 10;
      issues.push('Room is in avoid list');
    }
    
    const shiftStartMins = timeToMinutes(shift.startTime);
    if (prefs.preferEarlyShifts && shiftStartMins <= 9 * 60) preferenceScore += 10;
    if (prefs.preferLateShifts && shiftStartMins >= 12 * 60) preferenceScore += 10;
    preferenceScore = Math.min(100, preferenceScore);
  }
  
  // --- WEIGHTED TOTAL ---
  const totalWeight = weights.availability + weights.qualifications + weights.cost + weights.fairness + weights.preference;
  const totalScore = totalWeight > 0
    ? (
        availScore * weights.availability +
        qualScore * weights.qualifications +
        costScore * weights.cost +
        fairnessScore * weights.fairness +
        preferenceScore * weights.preference
      ) / totalWeight
    : 0;
  
  return {
    staffId: staff.id,
    staffName: staff.name,
    totalScore: Math.round(totalScore),
    breakdown: {
      availability: availScore,
      qualifications: qualScore,
      cost: costScore,
      fairness: fairnessScore,
      preference: preferenceScore,
    },
    issues,
    isEligible,
    hourlyRate: staff.hourlyRate,
  };
}

// ============= BATCH ASSIGNMENT ENGINE =============

export interface AssignmentResult {
  assignments: Map<string, { staffId: string; staffName: string; score: number; issues: string[] }>;
  estimatedCost: number;
  fairnessScore: number;
  constraintViolations: ConstraintViolation[];
}

/**
 * Batch assign staff to a set of shift slots using greedy scoring.
 * Returns assignments map, estimated cost, and fairness metrics.
 */
export function batchAssignStaff(
  slots: GeneratedShiftSlot[],
  staff: StaffMember[],
  existingShifts: Shift[],
  weights: SchedulerWeights,
  constraints: TimefoldConstraintConfiguration,
): AssignmentResult {
  const assignmentMap = new Map<string, { staffId: string; staffName: string; score: number; issues: string[] }>();
  const assignedSlots: GeneratedShiftSlot[] = [];
  const constraintViolations: ConstraintViolation[] = [];

  // Sort by priority (critical first)
  const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
  const sorted = [...slots].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  sorted.forEach(slot => {
    const candidates = staff
      .map(s => scoreStaffForShift(s, slot, existingShifts, assignedSlots, staff, weights, constraints))
      .filter(c => c.isEligible)
      .sort((a, b) => b.totalScore - a.totalScore);

    if (candidates.length > 0) {
      const best = candidates[0];
      const assignedSlot = { ...slot, assignedStaffId: best.staffId, assignedStaffName: best.staffName };
      assignedSlots.push(assignedSlot);
      
      assignmentMap.set(slot.id, {
        staffId: best.staffId,
        staffName: best.staffName,
        score: best.totalScore,
        issues: best.issues,
      });
    }
  });

  // Calculate estimated cost
  const estimatedCost = Array.from(assignmentMap.entries()).reduce((sum, [slotId, assignment]) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return sum;
    const staffMember = staff.find(s => s.id === assignment.staffId);
    const hours = (shiftDurationMinutes(slot.startTime, slot.endTime) - slot.breakMinutes) / 60;
    return sum + (staffMember?.hourlyRate || 0) * hours;
  }, 0);

  // Calculate fairness score
  const staffHoursMap = new Map<string, number>();
  assignedSlots.forEach(s => {
    if (!s.assignedStaffId) return;
    const hours = (shiftDurationMinutes(s.startTime, s.endTime) - s.breakMinutes) / 60;
    staffHoursMap.set(s.assignedStaffId, (staffHoursMap.get(s.assignedStaffId) || 0) + hours);
  });
  const hoursValues = Array.from(staffHoursMap.values());
  const fairnessScore = hoursValues.length > 0
    ? Math.round(100 - (Math.max(...hoursValues) - Math.min(...hoursValues)) / (Math.max(...hoursValues) || 1) * 100)
    : 100;

  return { assignments: assignmentMap, estimatedCost: Math.round(estimatedCost * 100) / 100, fairnessScore, constraintViolations };
}

// ============= FILL OPEN SHIFTS (ONE-CLICK) =============

export interface FillOpenShiftsResult {
  filledShifts: Shift[];
  unfilledOpenShiftIds: string[];
  summary: {
    total: number;
    filled: number;
    unfilled: number;
    averageScore: number;
  };
}

/**
 * One-click "Fill Open Shifts" action.
 * Takes existing open shifts, scores all available staff using the same
 * greedy heuristic engine, and returns new Shift objects assigned to best staff.
 */
export function fillOpenShiftsWithStaff(
  openShifts: import('@/types/roster').OpenShift[],
  staff: StaffMember[],
  existingShifts: Shift[],
  constraints: TimefoldConstraintConfiguration,
  weights: SchedulerWeights = DEFAULT_WEIGHTS,
): FillOpenShiftsResult {
  const filledShifts: Shift[] = [];
  const unfilledOpenShiftIds: string[] = [];
  const scores: number[] = [];

  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...openShifts].sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  const assignedSlots: GeneratedShiftSlot[] = [];

  sorted.forEach((os) => {
    const count = os.requiredEmployeeCount || 1;

    for (let i = 0; i < count; i++) {
      const tempSlot: GeneratedShiftSlot = {
        id: `fill-${os.id}-${i}`,
        centreId: os.centreId,
        roomId: os.roomId,
        roomName: '',
        date: os.date,
        startTime: os.startTime,
        endTime: os.endTime,
        breakMinutes: os.breakMinutes || 30,
        requiredCount: 1,
        demandSource: 'manual',
        priority: os.urgency === 'critical' ? 'critical' : os.urgency === 'high' ? 'high' : 'normal',
      };

      const candidates = staff
        .map(s => scoreStaffForShift(s, tempSlot, existingShifts, assignedSlots, staff, weights, constraints))
        .filter(c => c.isEligible)
        .sort((a, b) => b.totalScore - a.totalScore);

      if (candidates.length > 0) {
        const best = candidates[0];
        
        tempSlot.assignedStaffId = best.staffId;
        tempSlot.assignedStaffName = best.staffName;
        assignedSlots.push(tempSlot);

        filledShifts.push({
          id: `shift-fill-${Date.now()}-${os.id}-${i}`,
          staffId: best.staffId,
          centreId: os.centreId,
          roomId: os.roomId,
          date: os.date,
          startTime: os.startTime,
          endTime: os.endTime,
          breakMinutes: os.breakMinutes || 30,
          status: 'draft',
          isOpenShift: false,
          isAIGenerated: true,
          aiGeneratedAt: new Date().toISOString(),
          notes: `Auto-filled from open shift (score: ${best.totalScore})`,
          shiftType: os.shiftType,
          templateId: os.templateId,
        });
        scores.push(best.totalScore);
      } else {
        unfilledOpenShiftIds.push(os.id);
      }
    }
  });

  return {
    filledShifts,
    unfilledOpenShiftIds,
    summary: {
      total: sorted.length,
      filled: filledShifts.length,
      unfilled: unfilledOpenShiftIds.length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    },
  };
}

/**
 * Convert generated shift slots to actual Shift objects for the roster
 */
export function convertToRosterShifts(
  slots: GeneratedShiftSlot[],
): Omit<Shift, 'id'>[] {
  return slots.map(slot => ({
    staffId: slot.assignedStaffId || '',
    centreId: slot.centreId,
    roomId: slot.roomId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    breakMinutes: slot.breakMinutes,
    status: 'draft' as const,
    isOpenShift: !slot.assignedStaffId,
    isAIGenerated: true,
    aiGeneratedAt: new Date().toISOString(),
    notes: `Auto-generated from demand (${slot.demandSource})`,
  }));
}
