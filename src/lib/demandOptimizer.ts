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
  /** Ratio tier this requirement covers */
  tier: 'qualified' | 'support';
  /** Qualifications the filler must hold */
  requiredQualifications: string[];
  /** Which pool the assigned staff member came from */
  assignedPool?: 'permanent' | 'casual';
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
    qualifiedShiftsRequired: number;
    permanentAssigned: number;
    casualAssigned: number;
    staffAbsencesConsidered: number;
    childAbsencesConsidered: number;
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
  absenceDatesByStaff: Map<string, string[]> = new Map(),
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
    leavesDates: Array.from(new Set([
      ...(s.timeOff || [])
        .filter(t => t.status === 'approved')
        .flatMap(t => expandDates(t.startDate, t.endDate)),
      ...(absenceDatesByStaff.get(s.id) || []),
    ])),
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
  const planningShifts: ShiftPlanningEntity[] = uncovered.map(({ env }) => ({
    id: env.id,
    shiftId: env.id,
    date: env.date,
    startTime: env.startTime,
    endTime: env.endTime,
    roomId: env.roomId,
    centreId: env.centreId || centreId,
    requiredQualifications: env.requiredQualifications ?? [],
    preferredRole: env.tier === 'qualified' ? 'lead_educator' : undefined,
  }));

  // Staff absences reported in demand analytics remove supply for that date
  const absenceDatesByStaff = new Map<string, string[]>();
  let staffAbsencesConsidered = 0;
  if (config.honourStaffAbsences) {
    demandData
      .filter(d => dates.includes(d.date))
      .forEach(d => {
        (d.staffAbsences || []).forEach(a => {
          const list = absenceDatesByStaff.get(a.staffId) || [];
          if (!list.includes(a.date || d.date)) {
            list.push(a.date || d.date);
            staffAbsencesConsidered += 1;
          }
          absenceDatesByStaff.set(a.staffId, list);
        });
      });
  }
  const childAbsencesConsidered = demandData
    .filter(d => dates.includes(d.date))
    .reduce((sum, d) => sum + (d.childAbsences || 0), 0);

  const allEntities = toStaffEntities(staff, centreId, absenceDatesByStaff);
  const permanentPool = allEntities.filter(e => e.employmentType === 'permanent' && !e.isAgency);
  const casualPool = allEntities.filter(e => e.employmentType === 'casual' || e.isAgency);
  const poolOf = new Map<string, 'permanent' | 'casual'>([
    ...permanentPool.map(e => [e.id, 'permanent'] as const),
    ...casualPool.map(e => [e.id, 'casual'] as const),
  ]);

  // Pass 1 — permanent pool first (contracted hours before casual spend),
  // Pass 2 — casual/agency pool for whatever the permanents could not cover.
  let solution: TimefoldSolution;
  if (config.preferPermanentFirst && permanentPool.length && casualPool.length) {
    const first = await solveWithTimefold(solverCfg, planningShifts, permanentPool);
    const leftoverIds = new Set(first.unassignedShifts);
    const leftover = planningShifts.filter(p => leftoverIds.has(p.id));
    const second = leftover.length
      ? await solveWithTimefold(solverCfg, leftover, casualPool)
      : null;
    solution = second
      ? {
          ...first,
          score: {
            hardScore: first.score.hardScore + second.score.hardScore,
            mediumScore: first.score.mediumScore + second.score.mediumScore,
            softScore: first.score.softScore + second.score.softScore,
            isFeasible: first.score.isFeasible && second.score.isFeasible,
          },
          assignments: [...first.assignments, ...second.assignments],
          unassignedShifts: second.unassignedShifts,
          solverTimeMs: first.solverTimeMs + second.solverTimeMs,
          movesEvaluated: first.movesEvaluated + second.movesEvaluated,
        }
      : first;
  } else {
    solution = await solveWithTimefold(solverCfg, planningShifts, allEntities);
  }

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
      tier: env.tier,
      requiredQualifications: env.requiredQualifications ?? [],
      assignedPool: assignedStaff ? poolOf.get(assignedStaff.id) : undefined,
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
      qualifiedShiftsRequired: planItems.filter(p => p.tier === 'qualified').length,
      permanentAssigned: planItems.filter(p => p.assignedPool === 'permanent').length,
      casualAssigned: planItems.filter(p => p.assignedPool === 'casual').length,
      staffAbsencesConsidered,
      childAbsencesConsidered,
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
      requiredQualifications: (i.requiredQualifications || []) as never,
      notes: `Demand-optimised · ${i.tier} tier (peak ${i.peakDemand}, avg ${i.averageDemand})`,
    }));
}
