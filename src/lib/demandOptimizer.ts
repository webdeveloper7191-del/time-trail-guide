/**
 * Demand-driven optimisation orchestrator.
 *
 * Bridges three previously disconnected pieces:
 *   1. Demand analytics  → 15-min interval demand curves (demandShiftEngine)
 *   2. Shift envelopes   → the *shift requirement* structure implied by demand
 *   3. Timefold solver   → assigns real staff to those requirements
 *
 * Output is an actionable plan (keep / add / release) that the Optimize screen
 * can preview and apply straight onto the roster.
 */

import { Shift, StaffMember, Room } from '@/types/roster';
import { DemandAnalyticsData } from '@/types/demandAnalytics';
import {
  DemandShiftConfig,
  DEFAULT_DEMAND_SHIFT_CONFIG,
  ShiftEnvelope,
} from '@/types/demandShiftGeneration';
import { generateDemandDrivenShifts } from '@/lib/demandShiftEngine';
import {
  solveWithTimefold,
  defaultSolverConfig,
  TimefoldSolverConfig,
  TimefoldSolution,
  ShiftPlanningEntity,
  StaffPlanningEntity,
} from '@/lib/timefoldSolver';

// ============= TYPES =============

export interface OptimizationPlanItem {
  envelopeId: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  workedHours: number;
  peakDemand: number;
  averageDemand: number;
  priority: ShiftEnvelope['priority'];
  /** Existing roster shift this requirement is already covered by, if any */
  matchedShiftId?: string;
  matchedStaffId?: string;
  /** Staff proposed by the solver for uncovered requirements */
  assignedStaffId?: string;
  assignedStaffName?: string;
  action: 'keep' | 'add' | 'add-open';
  estimatedCost: number;
  violations: { constraintName: string; level: string; impact: number }[];
}

export interface ReleaseCandidate {
  shiftId: string;
  staffId: string;
  staffName: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  workedHours: number;
  estimatedSaving: number;
  reason: string;
}

export interface DemandOptimizationResult {
  planItems: OptimizationPlanItem[];
  releaseCandidates: ReleaseCandidate[];
  solution: TimefoldSolution;
  metrics: {
    demandShiftsRequired: number;
    currentShifts: number;
    covered: number;
    toAdd: number;
    toRelease: number;
    unassigned: number;
    requiredHours: number;
    currentHours: number;
    currentCost: number;
    optimisedCost: number;
    costDelta: number;
    coveragePercent: number;
    peakStaffRequired: number;
    coverageGaps: number;
  };
  config: DemandShiftConfig;
  solverConfig: TimefoldSolverConfig;
  generatedAt: string;
}

export interface RunDemandOptimizationParams {
  shifts: Shift[];
  staff: StaffMember[];
  rooms: Room[];
  centreId: string;
  dates: string[];
  demandData: DemandAnalyticsData[];
  demandConfig?: Partial<DemandShiftConfig>;
  solverConfig?: Partial<TimefoldSolverConfig>;
}

// ============= HELPERS =============

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const workedHoursOf = (start: string, end: string, breakMinutes: number) =>
  Math.max(0, toMinutes(end) - toMinutes(start) - breakMinutes) / 60;

/** Overlap ratio between an existing shift and a demand envelope (0–1). */
function overlapRatio(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): number {
  const s = Math.max(toMinutes(aStart), toMinutes(bStart));
  const e = Math.min(toMinutes(aEnd), toMinutes(bEnd));
  const overlap = Math.max(0, e - s);
  const span = Math.max(1, toMinutes(bEnd) - toMinutes(bStart));
  return overlap / span;
}

function toStaffEntities(
  staff: StaffMember[],
  centreId: string,
): StaffPlanningEntity[] {
  return staff.map(s => ({
    id: s.id,
    name: s.name,
    role: s.role,
    employmentType: s.employmentType === 'casual' ? 'casual' : 'permanent',
    isAgency: !!s.agency,
    hourlyRate: s.hourlyRate,
    maxHoursPerWeek: s.maxHoursPerWeek,
    currentHoursAssigned: s.currentWeeklyHours,
    qualifications: (s.qualifications || []).map(q => q.type),
    availability: (s.availability || []).map(a => ({
      dayOfWeek: a.dayOfWeek,
      available: a.available,
      startTime: a.startTime,
      endTime: a.endTime,
    })),
    preferredCentres: s.preferredCentres || [],
    defaultCentreId: s.defaultCentreId ?? centreId,
    willingToWorkMultipleLocations: s.willingToWorkMultipleLocations,
    leavesDates: (s.timeOff || [])
      .filter(t => t.status === 'approved')
      .flatMap(t => expandDates(t.startDate, t.endDate)),
  }));
}

function expandDates(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(start);
  const last = new Date(end);
  while (d <= last && out.length < 90) {
    out.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// ============= MAIN =============

export async function runDemandOptimization(
  params: RunDemandOptimizationParams,
): Promise<DemandOptimizationResult> {
  const {
    shifts,
    staff,
    rooms,
    centreId,
    dates,
    demandData,
    demandConfig,
    solverConfig,
  } = params;

  const config: DemandShiftConfig = { ...DEFAULT_DEMAND_SHIFT_CONFIG, ...demandConfig };
  const solverCfg: TimefoldSolverConfig = { ...defaultSolverConfig, ...solverConfig };

  // ---- 1. Demand → shift requirements -------------------------------------
  const generation = generateDemandDrivenShifts(demandData, rooms, dates, config);
  const envelopes = generation.shiftEnvelopes.filter(e => dates.includes(e.date));

  // ---- 2. Match requirements against the existing roster ------------------
  const centreShifts = shifts.filter(
    s => s.centreId === centreId && dates.includes(s.date) && !s.isAbsent,
  );
  const usedShiftIds = new Set<string>();

  const matched = envelopes.map(env => {
    const candidates = centreShifts
      .filter(s => !usedShiftIds.has(s.id) && s.roomId === env.roomId && s.date === env.date)
      .map(s => ({ shift: s, ratio: overlapRatio(s.startTime, s.endTime, env.startTime, env.endTime) }))
      .filter(c => c.ratio >= 0.6)
      .sort((a, b) => b.ratio - a.ratio);

    const best = candidates[0];
    if (best) usedShiftIds.add(best.shift.id);
    return { env, match: best?.shift };
  });

  const uncovered = matched.filter(m => !m.match);

  // ---- 3. Solve staffing for the uncovered requirements -------------------
  const planningShifts: ShiftPlanningEntity[] = uncovered.map(({ env }) => {
    const room = rooms.find(r => r.id === env.roomId);
    return {
      id: env.id,
      shiftId: env.id,
      date: env.date,
      startTime: env.startTime,
      endTime: env.endTime,
      roomId: env.roomId,
      centreId: env.centreId || centreId,
      requiredQualifications: room && room.minQualifiedStaff > 0 ? ['diploma'] : [],
      preferredRole: env.priority === 'critical' ? 'lead_educator' : undefined,
    };
  });

  const staffEntities = toStaffEntities(staff, centreId);
  const solution = await solveWithTimefold(solverCfg, planningShifts, staffEntities);

  const assignmentMap = new Map(solution.assignments.map(a => [a.shiftId, a]));
  const staffById = new Map(staff.map(s => [s.id, s]));
  const avgRate = staff.length
    ? staff.reduce((sum, s) => sum + s.hourlyRate, 0) / staff.length
    : 35;

  // ---- 4. Build the plan --------------------------------------------------
  const planItems: OptimizationPlanItem[] = matched.map(({ env, match }) => {
    const hours = workedHoursOf(env.startTime, env.endTime, env.breakMinutes);
    const assignment = assignmentMap.get(env.id);
    const assignedStaff = assignment ? staffById.get(assignment.staffId) : undefined;
    const rate = match
      ? staffById.get(match.staffId)?.hourlyRate ?? avgRate
      : assignedStaff?.hourlyRate ?? avgRate;

    return {
      envelopeId: env.id,
      roomId: env.roomId,
      roomName: env.roomName,
      date: env.date,
      startTime: env.startTime,
      endTime: env.endTime,
      breakMinutes: env.breakMinutes,
      workedHours: Math.round(hours * 10) / 10,
      peakDemand: env.peakDemand,
      averageDemand: env.averageDemand,
      priority: env.priority,
      matchedShiftId: match?.id,
      matchedStaffId: match?.staffId,
      assignedStaffId: assignedStaff?.id,
      assignedStaffName: assignedStaff?.name,
      action: match ? 'keep' : assignedStaff ? 'add' : 'add-open',
      estimatedCost: Math.round(hours * rate),
      violations: (assignment?.constraintViolations || []).map(v => ({
        constraintName: v.constraintName,
        level: v.level,
        impact: v.impact,
      })),
    };
  });

  // ---- 5. Surplus shifts the demand curve does not justify ----------------
  const releaseCandidates: ReleaseCandidate[] = centreShifts
    .filter(s => !usedShiftIds.has(s.id))
    .map(s => {
      const hours = workedHoursOf(s.startTime, s.endTime, s.breakMinutes);
      const st = staffById.get(s.staffId);
      const room = rooms.find(r => r.id === s.roomId);
      return {
        shiftId: s.id,
        staffId: s.staffId,
        staffName: st?.name ?? (s.isOpenShift ? 'Open shift' : 'Unknown'),
        roomId: s.roomId,
        roomName: room?.name ?? s.roomId,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        workedHours: Math.round(hours * 10) / 10,
        estimatedSaving: Math.round(hours * (st?.hourlyRate ?? avgRate)),
        reason: 'No demand-driven requirement overlaps this shift',
      };
    });

  const currentHours = centreShifts.reduce(
    (sum, s) => sum + workedHoursOf(s.startTime, s.endTime, s.breakMinutes),
    0,
  );
  const currentCost = centreShifts.reduce((sum, s) => {
    const st = staffById.get(s.staffId);
    return sum + workedHoursOf(s.startTime, s.endTime, s.breakMinutes) * (st?.hourlyRate ?? avgRate);
  }, 0);
  const requiredHours = planItems.reduce((sum, p) => sum + p.workedHours, 0);
  const optimisedCost = planItems.reduce((sum, p) => sum + p.estimatedCost, 0);
  const covered = planItems.filter(p => p.action === 'keep').length;
  const toAdd = planItems.filter(p => p.action !== 'keep').length;
  const unassigned = planItems.filter(p => p.action === 'add-open').length;

  return {
    planItems,
    releaseCandidates,
    solution,
    metrics: {
      demandShiftsRequired: planItems.length,
      currentShifts: centreShifts.length,
      covered,
      toAdd,
      toRelease: releaseCandidates.length,
      unassigned,
      requiredHours: Math.round(requiredHours * 10) / 10,
      currentHours: Math.round(currentHours * 10) / 10,
      currentCost: Math.round(currentCost),
      optimisedCost: Math.round(optimisedCost),
      costDelta: Math.round(optimisedCost - currentCost),
      coveragePercent: planItems.length
        ? Math.round((covered / planItems.length) * 100)
        : 100,
      peakStaffRequired: generation.summary.peakStaffRequired,
      coverageGaps: generation.summary.coverageGaps.length,
    },
    config,
    solverConfig: solverCfg,
    generatedAt: new Date().toISOString(),
  };
}

/** Convert accepted plan items into roster-ready shifts. */
export function planItemsToShifts(
  items: OptimizationPlanItem[],
  centreId: string,
): Omit<Shift, 'id'>[] {
  return items
    .filter(i => i.action !== 'keep')
    .map(i => ({
      staffId: i.assignedStaffId ?? '',
      centreId,
      roomId: i.roomId,
      date: i.date,
      startTime: i.startTime,
      endTime: i.endTime,
      breakMinutes: i.breakMinutes,
      status: 'draft' as const,
      isOpenShift: !i.assignedStaffId,
      isAIGenerated: true,
      aiGeneratedAt: new Date().toISOString(),
      notes: `Demand-optimised (peak ${i.peakDemand}, avg ${i.averageDemand})`,
    }));
}
