/**
 * Staff Retention rules
 * ---------------------
 * Shared logic for deciding whether a copied / re-generated shift keeps its
 * assigned staff member, or is released back to the open-shift pool.
 *
 * Used by Copy Week, roster template application and recurring generation so
 * "retention" behaves identically everywhere.
 */
import { StaffMember, Shift } from '@/types/roster';

export type StaffCohort = 'full_time' | 'part_time' | 'casual' | 'agency';

export const staffCohortLabels: Record<StaffCohort, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  casual: 'Casual',
  agency: 'Agency / Contractor',
};

export type RetentionMode = 'keep_all' | 'unassign_all' | 'by_type';

/** What happens to a shift whose staff member is not retained. */
export type ReleaseOutcome = 'open_shift' | 'drop';

export interface StaffRetentionRules {
  mode: RetentionMode;
  /** Only consulted when mode === 'by_type'. */
  retainCohorts: Record<StaffCohort, boolean>;
  releaseOutcome: ReleaseOutcome;
  /** Also release staff who are on approved leave / RDO on the target date. */
  releaseOnLeaveOrRdo: boolean;
}

export const defaultRetentionRules: StaffRetentionRules = {
  mode: 'by_type',
  retainCohorts: {
    full_time: true,
    part_time: true,
    casual: false,
    agency: false,
  },
  releaseOutcome: 'open_shift',
  releaseOnLeaveOrRdo: true,
};

/**
 * Resolve a staff member's cohort. Prefers the bridged Pay Conditions record
 * (source of truth), falling back to the roster-level employment type + agency.
 */
export function resolveStaffCohort(staff?: StaffMember): StaffCohort | undefined {
  if (!staff) return undefined;

  if (staff.agency && staff.agency !== 'internal') return 'agency';

  const pcType = staff.currentPayCondition?.employmentType;
  if (pcType === 'full_time') return 'full_time';
  if (pcType === 'part_time') return 'part_time';
  if (pcType === 'casual') return 'casual';
  if (pcType === 'contractor') return 'agency';

  if (staff.employmentType === 'casual') return 'casual';
  if (staff.employmentType === 'permanent') return 'full_time';
  return undefined;
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

/** Approved leave, declared RDO weekday, or a not-available weekday on the target date. */
export function isBlockedOnDate(staff: StaffMember | undefined, date: string): { blocked: boolean; reason?: string } {
  if (!staff) return { blocked: false };

  const onLeave = (staff.timeOff ?? []).some(
    t => t.status === 'approved' && date >= t.startDate && date <= t.endDate,
  );
  if (onLeave) return { blocked: true, reason: 'On approved leave' };

  const dow = new Date(`${date}T00:00:00`).getDay();
  const dayKey = DAY_KEYS[dow];

  const rdo = (staff.weeklyAvailability ?? []).some(w => w.dayOfWeek === dayKey && w.isRdo);
  if (rdo) return { blocked: true, reason: 'Rostered day off (RDO)' };

  return { blocked: false };
}

export interface RetentionDecision {
  retained: boolean;
  cohort?: StaffCohort;
  /** Present when not retained. */
  reason?: string;
  outcome: 'keep' | 'open_shift' | 'drop';
}

export function evaluateRetention(
  staff: StaffMember | undefined,
  targetDate: string,
  rules: StaffRetentionRules,
): RetentionDecision {
  const cohort = resolveStaffCohort(staff);

  if (!staff || !staff.id) {
    return { retained: false, cohort, outcome: 'open_shift', reason: 'Unassigned shift' };
  }

  const release = (reason: string): RetentionDecision => ({
    retained: false,
    cohort,
    reason,
    outcome: rules.releaseOutcome === 'drop' ? 'drop' : 'open_shift',
  });

  if (rules.mode === 'unassign_all') return release('All shifts released to open');

  if (rules.mode === 'by_type') {
    if (cohort && !rules.retainCohorts[cohort]) {
      return release(`${staffCohortLabels[cohort]} not retained`);
    }
  }

  if (rules.releaseOnLeaveOrRdo) {
    const blocked = isBlockedOnDate(staff, targetDate);
    if (blocked.blocked) return release(blocked.reason!);
  }

  return { retained: true, cohort, outcome: 'keep' };
}

/** Apply a retention decision to a shift draft. Returns null when the shift should be dropped. */
export function applyRetention<T extends Partial<Shift>>(
  shift: T,
  decision: RetentionDecision,
): T | null {
  if (decision.outcome === 'drop') return null;
  if (decision.outcome === 'open_shift') {
    return { ...shift, staffId: '', isOpenShift: true };
  }
  return shift;
}

export function summariseRetention(decisions: RetentionDecision[]) {
  const kept = decisions.filter(d => d.retained).length;
  const released = decisions.filter(d => d.outcome === 'open_shift').length;
  const dropped = decisions.filter(d => d.outcome === 'drop').length;

  const byCohort: Partial<Record<StaffCohort, number>> = {};
  decisions
    .filter(d => !d.retained && d.cohort)
    .forEach(d => {
      byCohort[d.cohort!] = (byCohort[d.cohort!] ?? 0) + 1;
    });

  return { kept, released, dropped, byCohort, total: decisions.length };
}
