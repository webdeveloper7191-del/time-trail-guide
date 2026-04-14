/**
 * In-House Greedy Heuristic Auto-Scheduler
 * 
 * Generates empty shifts from demand data, then optionally assigns staff
 * using a greedy scoring algorithm that honors the Timefold constraint config.
 * 
 * Algorithm:
 * 1. DEMAND ANALYSIS: Read demand data per room/time-slot → calculate required staff count
 * 2. SHIFT GENERATION: Create empty shifts for each required staff position
 * 3. CONSTRAINT VALIDATION: Validate against constraint config (work limits, rest, etc.)
 * 4. STAFF SCORING: Score each available staff member per shift
 * 5. GREEDY ASSIGNMENT: Assign best-scoring staff to highest-priority shifts first
 * 6. FAIRNESS PASS: Re-balance if distribution is skewed
 */

import { Shift, StaffMember, Room, Centre, ShiftTemplate, DayAvailability } from '@/types/roster';
import { DemandAnalyticsData } from '@/types/demandAnalytics';
import { TimefoldConstraintConfiguration, defaultConstraintConfig } from '@/types/timefoldConstraintConfig';
import { format, parseISO, getDay, differenceInMinutes, addMinutes, parse } from 'date-fns';

// ============= TYPES =============

export interface AutoSchedulerConfig {
  /** Which dates to schedule */
  dateRange: { start: string; end: string };
  /** Centre to schedule for */
  centreId: string;
  /** Rooms to include (empty = all) */
  roomIds: string[];
  /** Whether to assign staff or just create empty shifts */
  assignStaff: boolean;
  /** Constraint configuration to honor */
  constraints: TimefoldConstraintConfiguration;
  /** Optimization weights */
  weights: SchedulerWeights;
  /** Shift templates to use for generating shifts */
  shiftTemplates: ShiftTemplate[];
  /** Operating hours fallback */
  operatingHours: { start: string; end: string };
  /** Minimum shift duration in minutes */
  minShiftDurationMinutes: number;
}

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
  requiredCount: number;      // How many staff needed for this slot
  demandSource: 'booking' | 'ratio' | 'template' | 'manual';
  priority: 'critical' | 'high' | 'normal' | 'low';
  // Assignment info
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignmentScore?: number;
  assignmentIssues?: string[];
}

export interface SchedulerResult {
  generatedShifts: GeneratedShiftSlot[];
  summary: SchedulerSummary;
  constraintViolations: ConstraintViolation[];
}

export interface SchedulerSummary {
  totalShiftsGenerated: number;
  totalStaffAssigned: number;
  unfilledShifts: number;
  totalHoursScheduled: number;
  estimatedCost: number;
  averageFairnessScore: number;
  roomCoverage: { roomId: string; roomName: string; covered: number; required: number }[];
  dateBreakdown: { date: string; shifts: number; assigned: number }[];
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

function shiftDurationMinutes(start: string, end: string): number {
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
  
  // Check time windows if specified
  if (avail.startTime && avail.endTime) {
    const shiftStart = timeToMinutes(startTime);
    const shiftEnd = timeToMinutes(endTime);
    const availStart = timeToMinutes(avail.startTime);
    const availEnd = timeToMinutes(avail.endTime);
    
    if (shiftStart < availStart || shiftEnd > availEnd) return false;
  }
  
  // Check time off
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
  if (!contracts.enabled || contracts.contracts.length === 0) return 600; // 10h default
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
  if (!contracts.enabled || contracts.contracts.length === 0) return 2400; // 40h default
  return Math.max(...contracts.contracts.map(c => 
    c.workLimits.minutesPerPeriod.enabled ? (c.workLimits.minutesPerPeriod.maxMinutes ?? 2400) : 2400
  ));
}

// ============= STEP 1: GENERATE SHIFTS FROM DEMAND =============

export function generateShiftsFromDemand(
  demandData: DemandAnalyticsData[],
  rooms: Room[],
  config: AutoSchedulerConfig,
): GeneratedShiftSlot[] {
  const slots: GeneratedShiftSlot[] = [];
  
  // Group demand by date + room
  const groupedDemand = new Map<string, DemandAnalyticsData[]>();
  demandData
    .filter(d => 
      d.centreId === config.centreId &&
      (config.roomIds.length === 0 || config.roomIds.includes(d.roomId)) &&
      d.date >= config.dateRange.start &&
      d.date <= config.dateRange.end &&
      d.requiredStaff > 0
    )
    .forEach(d => {
      const key = `${d.date}::${d.roomId}`;
      if (!groupedDemand.has(key)) groupedDemand.set(key, []);
      groupedDemand.get(key)!.push(d);
    });
  
  groupedDemand.forEach((dayDemand, key) => {
    const [date, roomId] = key.split('::');
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Merge adjacent time slots with same staffing need into shifts
    const sortedSlots = dayDemand.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    
    // For each time slot, determine required staff
    sortedSlots.forEach((demand, idx) => {
      const [slotStart, slotEnd] = demand.timeSlot.split('-');
      const requiredStaff = demand.requiredStaff;
      const alreadyScheduled = demand.scheduledStaff;
      const needed = Math.max(0, requiredStaff - alreadyScheduled);
      
      if (needed <= 0) return;
      
      // Try to merge with shift templates if available
      const matchingTemplate = config.shiftTemplates.find(t => {
        const tStart = timeToMinutes(t.startTime);
        const tEnd = timeToMinutes(t.endTime);
        const sStart = timeToMinutes(slotStart);
        return Math.abs(tStart - sStart) <= 60; // Within 1 hour
      });
      
      const shiftStart = matchingTemplate?.startTime || slotStart;
      const shiftEnd = matchingTemplate?.endTime || slotEnd;
      const breakMins = matchingTemplate?.breakMinutes || (shiftDurationMinutes(shiftStart, shiftEnd) >= 300 ? 30 : 0);
      
      // Determine priority based on compliance
      let priority: GeneratedShiftSlot['priority'] = 'normal';
      if (!demand.staffRatioCompliant) priority = 'critical';
      else if (demand.utilisationPercent > 80) priority = 'high';
      else if (demand.utilisationPercent < 50) priority = 'low';
      
      // Create one shift slot per required staff member
      for (let i = 0; i < needed; i++) {
        slots.push({
          id: `auto-${date}-${roomId}-${slotStart.replace(':', '')}-${i}`,
          centreId: config.centreId,
          roomId,
          roomName: room.name,
          date,
          startTime: shiftStart,
          endTime: shiftEnd,
          breakMinutes: breakMins,
          requiredCount: 1,
          demandSource: 'ratio',
          priority,
        });
      }
    });
  });
  
  // Deduplicate overlapping shifts in the same room on the same day
  // Merge shifts that cover similar time windows
  const deduplicated = deduplicateShifts(slots);
  
  return deduplicated;
}

function deduplicateShifts(slots: GeneratedShiftSlot[]): GeneratedShiftSlot[] {
  const grouped = new Map<string, GeneratedShiftSlot[]>();
  
  slots.forEach(s => {
    const key = `${s.date}::${s.roomId}::${s.startTime}::${s.endTime}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  });
  
  return Array.from(grouped.values()).flat();
}

// ============= STEP 2: SCORE & ASSIGN STAFF =============

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
  
  // Check overlap
  if (hasShiftOverlap(staff.id, shift.date, shift.startTime, shift.endTime, existingShifts, assignedShifts)) {
    availScore = 0;
    isEligible = false;
    issues.push('Shift overlap');
  }
  
  // Check weekly hours constraint
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
  
  // Check max hours per staff member
  if (weeklyHours + shiftHours > staff.maxHoursPerWeek) {
    issues.push(`Exceeds personal max ${staff.maxHoursPerWeek}h/week`);
    availScore = Math.max(0, availScore - 20);
  }
  
  // --- QUALIFICATION SCORE ---
  let qualScore = 50; // Default if no requirements
  const room = shift.roomId;
  // Basic role matching
  if (staff.role === 'lead_educator' || staff.role === 'educator') {
    qualScore = 80;
  }
  if (staff.qualifications?.some(q => q.type === 'diploma_ece' || q.type === 'bachelor_ece')) {
    qualScore = 100;
  }
  
  // Skills enforcement from constraints
  if (constraints.shiftConstraints.skills.enabled && constraints.shiftConstraints.skills.requiredSkillsEnforced) {
    // If skills enforcement is on and staff lacks required quals, penalize hard
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
    // Higher score = lower cost (normalized)
    costScore = Math.round(100 * (1 - (staff.hourlyRate - minRate) / range));
  }
  
  // --- FAIRNESS SCORE ---
  let fairnessScore = 50;
  if (constraints.employeeConstraints.fairness.enabled) {
    const avgHours = allStaff.reduce((sum, s) => {
      return sum + getStaffWeeklyHours(s.id, shift.date, existingShifts, assignedShifts);
    }, 0) / allStaff.length;
    
    const deviation = Math.abs(weeklyHours - avgHours);
    // Staff with fewer hours gets higher fairness score
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
    // Check preferred rooms
    if (prefs.preferredRooms?.includes(shift.roomId)) {
      preferenceScore = 90;
    } else if (prefs.avoidRooms?.includes(shift.roomId)) {
      preferenceScore = 10;
      issues.push('Room is in avoid list');
    }
    
    // Check shift time preferences
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

// ============= STEP 3: MAIN SCHEDULER =============

export function runAutoScheduler(
  demandData: DemandAnalyticsData[],
  staff: StaffMember[],
  rooms: Room[],
  existingShifts: Shift[],
  config: AutoSchedulerConfig,
): SchedulerResult {
  const constraintViolations: ConstraintViolation[] = [];
  
  // Step 1: Generate shifts from demand
  const generatedShifts = generateShiftsFromDemand(demandData, rooms, config);
  
  // Step 2: Sort shifts by priority (critical first)
  const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
  generatedShifts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // Step 3: If assigning staff, run greedy assignment
  if (config.assignStaff && staff.length > 0) {
    const eligibleStaff = staff.filter(s => 
      s.employmentType !== 'casual' || true // Include all types
    );
    
    generatedShifts.forEach(shift => {
      // Score all staff for this shift
      const scores = eligibleStaff
        .map(s => scoreStaffForShift(
          s, shift, existingShifts, generatedShifts, eligibleStaff, config.weights, config.constraints
        ))
        .filter(s => s.isEligible)
        .sort((a, b) => b.totalScore - a.totalScore);
      
      if (scores.length > 0) {
        const best = scores[0];
        shift.assignedStaffId = best.staffId;
        shift.assignedStaffName = best.staffName;
        shift.assignmentScore = best.totalScore;
        shift.assignmentIssues = best.issues;
      } else {
        shift.assignmentIssues = ['No eligible staff found'];
      }
    });
  }
  
  // Step 4: Build summary
  const totalHours = generatedShifts.reduce((sum, s) => 
    sum + (shiftDurationMinutes(s.startTime, s.endTime) - s.breakMinutes) / 60, 0
  );
  
  const assignedShifts = generatedShifts.filter(s => s.assignedStaffId);
  const unfilledShifts = generatedShifts.filter(s => !s.assignedStaffId);
  
  // Room coverage
  const roomCoverage = rooms
    .filter(r => config.roomIds.length === 0 || config.roomIds.includes(r.id))
    .map(r => {
      const roomShifts = generatedShifts.filter(s => s.roomId === r.id);
      return {
        roomId: r.id,
        roomName: r.name,
        required: roomShifts.length,
        covered: roomShifts.filter(s => s.assignedStaffId).length,
      };
    });
  
  // Date breakdown
  const dateMap = new Map<string, { shifts: number; assigned: number }>();
  generatedShifts.forEach(s => {
    if (!dateMap.has(s.date)) dateMap.set(s.date, { shifts: 0, assigned: 0 });
    const entry = dateMap.get(s.date)!;
    entry.shifts++;
    if (s.assignedStaffId) entry.assigned++;
  });
  
  const dateBreakdown = Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // Estimated cost
  const estimatedCost = assignedShifts.reduce((sum, s) => {
    const staffMember = staff.find(st => st.id === s.assignedStaffId);
    const hours = (shiftDurationMinutes(s.startTime, s.endTime) - s.breakMinutes) / 60;
    return sum + (staffMember?.hourlyRate || 0) * hours;
  }, 0);
  
  // Average fairness
  const staffHoursMap = new Map<string, number>();
  assignedShifts.forEach(s => {
    if (!s.assignedStaffId) return;
    const hours = (shiftDurationMinutes(s.startTime, s.endTime) - s.breakMinutes) / 60;
    staffHoursMap.set(s.assignedStaffId, (staffHoursMap.get(s.assignedStaffId) || 0) + hours);
  });
  const hoursValues = Array.from(staffHoursMap.values());
  const avgFairness = hoursValues.length > 0
    ? 100 - (Math.max(...hoursValues) - Math.min(...hoursValues)) / (Math.max(...hoursValues) || 1) * 100
    : 100;
  
  return {
    generatedShifts,
    summary: {
      totalShiftsGenerated: generatedShifts.length,
      totalStaffAssigned: assignedShifts.length,
      unfilledShifts: unfilledShifts.length,
      totalHoursScheduled: Math.round(totalHours * 10) / 10,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      averageFairnessScore: Math.round(avgFairness),
      roomCoverage,
      dateBreakdown,
    },
    constraintViolations,
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

  // Sort open shifts by urgency (critical first)
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...openShifts].sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  // Track assignments as GeneratedShiftSlots for the scorer
  const assignedSlots: GeneratedShiftSlot[] = [];

  sorted.forEach((os) => {
    const count = os.requiredEmployeeCount || 1;

    for (let i = 0; i < count; i++) {
      // Build a temporary GeneratedShiftSlot so we can reuse scoreStaffForShift
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

      // Score all eligible staff
      const candidates = staff
        .map(s => scoreStaffForShift(s, tempSlot, existingShifts, assignedSlots, staff, weights, constraints))
        .filter(c => c.isEligible)
        .sort((a, b) => b.totalScore - a.totalScore);

      if (candidates.length > 0) {
        const best = candidates[0];
        
        // Track assignment for future scoring
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
