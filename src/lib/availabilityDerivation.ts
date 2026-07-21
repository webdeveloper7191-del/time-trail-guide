/**
 * Availability Derivation
 * ------------------------------------------------------------
 * Given a staff member's pay condition + leave accrual config,
 * derive the availability overlays used by:
 *  - the Availability tab (visual preview)
 *  - Auto-Schedule / Fill Open Shifts (hard/soft constraints)
 *
 * Precedence (highest → lowest):
 *  1. Approved leave (incl. TOIL-drawn)     [hard block]
 *  2. Scheduled RDO / approved ADO          [hard block, override w/ alert]
 *  3. Staff-declared unavailability         [hard block]
 *  4. Rotating shift pattern                [soft preference]
 *  5. Shift-worker eligibility window       [expands allowed hours]
 *  6. Default weekly availability           [baseline]
 */

import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
import { StaffMember } from '@/types/staff';
import { LeaveStore, StaffLeaveConfig } from '@/lib/leaveAccrualEngine';

export type DerivedBlockKind =
  | 'rdo_scheduled'
  | 'ado_scheduled'
  | 'toil_leave'
  | 'rotation_preferred'
  | 'shift_worker_extended';

export type DerivedBlockSeverity = 'hard' | 'soft' | 'info';

export interface DerivedAvailabilityBlock {
  date: string;              // ISO yyyy-MM-dd
  kind: DerivedBlockKind;
  severity: DerivedBlockSeverity;
  label: string;
  detail?: string;
}

export interface DerivedAvailabilitySummary {
  blocks: DerivedAvailabilityBlock[];
  shiftWorker: {
    enabled: boolean;
    rotating: boolean;
    pattern?: string;
    cycleWeeks?: number;
    eligibilityWindow: string; // human label
  };
  rdo: {
    optedIn: boolean;
    nextDates: string[];
    cycleWeeks?: number;
    preferredDay?: string;
  };
  ado: {
    optedIn: boolean;
    balanceHours: number;
    targetHours: number;
    progressPct: number;
    autoSchedule: boolean;
  };
  toil: {
    optedIn: boolean;
    balanceHours: number;
    capHours?: number;
    expiryDays?: number;
  };
}

const DAY_INDEX: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

const PATTERN_LABEL: Record<string, string> = {
  fixed_nights: 'Fixed nights',
  two_shift: 'Two-shift rotation (day / evening)',
  three_shift: 'Three-shift rotation (day / evening / night)',
  seven_day: '7-day continuous rotation',
  other: 'Custom rotation',
};

/**
 * Compute upcoming RDO dates from anchor + preferred day + cycle weeks.
 */
function computeUpcomingRdoDates(
  anchor: string | undefined,
  cycleWeeks: number,
  preferredDay: string | undefined,
  count = 6,
): string[] {
  if (!anchor && !preferredDay) return [];
  const base = anchor ? new Date(anchor) : startOfWeek(new Date(), { weekStartsOn: 1 });
  let first = base;
  if (preferredDay && DAY_INDEX[preferredDay] !== undefined) {
    const target = DAY_INDEX[preferredDay];
    const diff = (target - base.getDay() + 7) % 7;
    first = addDays(base, diff);
  }
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(format(addWeeks(first, i * (cycleWeeks || 4)), 'yyyy-MM-dd'));
  }
  return out;
}

export function deriveAvailability(
  staff: StaffMember,
  weeksAhead = 8,
): DerivedAvailabilitySummary {
  const pc = staff.currentPayCondition;
  const leaveStaff: StaffLeaveConfig | undefined =
    LeaveStore.getStaff().find(
      s => s.staffId === staff.id || s.staffName === `${staff.firstName} ${staff.lastName}`,
    );

  const rdoOpted = leaveStaff?.optedIn?.RDO ?? false;
  const adoOpted = leaveStaff?.optedIn?.ADO ?? false;
  const toilOpted = leaveStaff?.optedIn?.TOIL ?? false;

  const rdoCycle = leaveStaff?.rdoSettings?.cycleWeeks ?? 4;
  const rdoDay = leaveStaff?.rdoSettings?.dayOfWeek;
  const rdoDates = rdoOpted
    ? computeUpcomingRdoDates(leaveStaff?.rdoAnchorDate, rdoCycle, rdoDay, weeksAhead / rdoCycle + 2)
    : [];

  const adoTarget = leaveStaff?.adoSettings?.targetHoursPerDayOff ?? 7.6;
  const adoBalance = leaveStaff?.balanceHours?.ADO ?? 0;
  const adoAuto = leaveStaff?.adoSettings?.autoScheduleDayOff ?? false;
  const adoReady = adoOpted && adoBalance >= adoTarget;

  const toilBalance = leaveStaff?.balanceHours?.TOIL ?? 0;
  const toilCap = leaveStaff?.toilSettings?.maxBalanceHours;
  const toilExpiry = leaveStaff?.toilSettings?.expiryDays;

  const blocks: DerivedAvailabilityBlock[] = [];

  // Weekday-declared RDOs (from Weekly Availability table) — hard block, recurring
  const declaredRdoDays = (staff.weeklyAvailability ?? [])
    .filter(w => w.isRdo)
    .map(w => w.dayOfWeek);
  if (declaredRdoDays.length > 0) {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    const dowIdx: Record<string, number> = {
      monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
    };
    for (let w = 0; w < weeksAhead; w++) {
      declaredRdoDays.forEach(dow => {
        const date = addDays(base, w * 7 + (dowIdx[dow] ?? 0));
        blocks.push({
          date: format(date, 'yyyy-MM-dd'),
          kind: 'rdo_scheduled',
          severity: 'hard',
          label: `RDO — ${dow.charAt(0).toUpperCase() + dow.slice(1)} declared unavailable`,
          detail: 'Recurring Rostered Day Off set in Weekly Availability',
        });
      });
    }
  }

  // RDO blocks — hard (from leave-accrual cycle config)
  rdoDates.forEach(d => {
    blocks.push({
      date: d,
      kind: 'rdo_scheduled',
      severity: 'hard',
      label: 'RDO — unavailable',
      detail: `Scheduled RDO from ${rdoCycle}-week cycle`,
    });
  });

  // ADO — if auto-schedule and threshold reached, book next eligible Monday
  if (adoAuto && adoReady) {
    const next = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
    blocks.push({
      date: format(next, 'yyyy-MM-dd'),
      kind: 'ado_scheduled',
      severity: 'hard',
      label: 'ADO — auto-scheduled day off',
      detail: `Threshold ${adoTarget}h reached (balance ${adoBalance.toFixed(1)}h)`,
    });
  }

  // Rotating pattern — soft preferred windows across the cycle
  if (pc?.isShiftWorker && pc.isRotatingShiftWorker) {
    const weeks = pc.rotationCycleWeeks ?? 4;
    const patternLabel = PATTERN_LABEL[pc.shiftPattern ?? 'other'] ?? 'Rotation';
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    for (let w = 0; w < Math.min(weeks, weeksAhead); w++) {
      const monday = addWeeks(base, w);
      blocks.push({
        date: format(monday, 'yyyy-MM-dd'),
        kind: 'rotation_preferred',
        severity: 'soft',
        label: `Cycle week ${w + 1}/${weeks} · ${patternLabel}`,
        detail: `Preferred shift band this week`,
      });
    }
  }

  // Shift-worker extended eligibility — informational marker
  if (pc?.isShiftWorker) {
    blocks.push({
      date: format(new Date(), 'yyyy-MM-dd'),
      kind: 'shift_worker_extended',
      severity: 'info',
      label: '24/7 eligibility unlocked',
      detail: 'Nights, weekends and public holidays available for rostering',
    });
  }

  return {
    blocks,
    shiftWorker: {
      enabled: !!pc?.isShiftWorker,
      rotating: !!pc?.isRotatingShiftWorker,
      pattern: pc?.shiftPattern ? PATTERN_LABEL[pc.shiftPattern] : undefined,
      cycleWeeks: pc?.rotationCycleWeeks,
      eligibilityWindow: pc?.isShiftWorker
        ? '24/7 (all hours, incl. nights / weekends / PH)'
        : 'Ordinary hours only (per award span of hours)',
    },
    rdo: {
      optedIn: rdoOpted || declaredRdoDays.length > 0,
      nextDates: rdoDates.length > 0
        ? rdoDates
        : blocks.filter(b => b.kind === 'rdo_scheduled').slice(0, 6).map(b => b.date),
      cycleWeeks: rdoCycle,
      preferredDay: rdoDay ?? declaredRdoDays[0],
    },
    ado: {
      optedIn: adoOpted,
      balanceHours: adoBalance,
      targetHours: adoTarget,
      progressPct: adoTarget > 0 ? Math.min(100, (adoBalance / adoTarget) * 100) : 0,
      autoSchedule: adoAuto,
    },
    toil: {
      optedIn: toilOpted,
      balanceHours: toilBalance,
      capHours: toilCap,
      expiryDays: toilExpiry,
    },
  };
}
