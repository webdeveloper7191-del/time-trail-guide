/**
 * Staff data bridge — copies fields from the workforce `StaffMember`
 * (Pay Conditions source-of-truth) onto the leaner roster `StaffMember`
 * that the scheduling grid, auto-scheduler, and shift panels consume.
 *
 * Kept as a pure mapper so callers can either overlay onto existing
 * roster mock staff (preferred, preserves ids/colours/qualifications)
 * or generate a roster staff record from scratch.
 */
import type {
  StaffMember as WorkforceStaff,
  WeeklyAvailability,
  PayCondition,
} from '@/types/staff';
import type {
  StaffMember as RosterStaff,
  DayAvailability,
  TimeOff as RosterTimeOff,
} from '@/types/roster';

const DAY_TO_INDEX: Record<WeeklyAvailability['dayOfWeek'], number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Collapse the (possibly multi-week) workforce weekly availability into a
 * single 7-day view that the roster grid understands. A weekday is treated
 * as available if it is available in *any* week of the cycle, and RDO days
 * are surfaced as unavailable so the roster hides them by default.
 * The full multi-week structure remains on `weeklyAvailability` for the
 * auto-scheduler and derivation card.
 */
export function collapseWeeklyAvailability(
  weekly: WeeklyAvailability[] | undefined,
): DayAvailability[] {
  const base: DayAvailability[] = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    available: false,
  }));
  if (!weekly?.length) return base;

  for (const slot of weekly) {
    const idx = DAY_TO_INDEX[slot.dayOfWeek];
    if (idx == null) continue;
    const current = base[idx];
    // RDO always beats availability — mark unavailable.
    if (slot.isRdo) {
      base[idx] = { dayOfWeek: idx, available: false };
      continue;
    }
    if (!slot.isAvailable) continue;
    if (!current.available) {
      base[idx] = {
        dayOfWeek: idx,
        available: true,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
    } else {
      // Widen the window across cycle weeks so the grid shows the union.
      base[idx] = {
        dayOfWeek: idx,
        available: true,
        startTime:
          current.startTime && slot.startTime
            ? current.startTime < slot.startTime
              ? current.startTime
              : slot.startTime
            : current.startTime ?? slot.startTime,
        endTime:
          current.endTime && slot.endTime
            ? current.endTime > slot.endTime
              ? current.endTime
              : slot.endTime
            : current.endTime ?? slot.endTime,
      };
    }
  }
  return base;
}

function hourlyRateFromPay(pc?: PayCondition): number | undefined {
  if (!pc) return undefined;
  if (pc.hourlyRate) return pc.hourlyRate;
  if (pc.payRateType === 'salary' && pc.annualSalary && pc.contractedHours) {
    // approx: salary / (contracted weekly hours * 52)
    return +(pc.annualSalary / (pc.contractedHours * 52)).toFixed(2);
  }
  return undefined;
}

/**
 * Overlay Pay Conditions data onto an existing roster StaffMember. When
 * `existing` is omitted, a minimal roster record is synthesised from the
 * workforce record so it can still be used by roster views.
 */
export function bridgeWorkforceToRoster(
  workforce: WorkforceStaff,
  existing?: RosterStaff,
): RosterStaff {
  const collapsed = collapseWeeklyAvailability(workforce.weeklyAvailability);
  const rate =
    hourlyRateFromPay(workforce.currentPayCondition) ??
    existing?.hourlyRate ??
    0;

  const base: RosterStaff =
    existing ?? {
      id: workforce.id,
      name:
        workforce.preferredName ||
        `${workforce.firstName} ${workforce.lastName}`.trim(),
      role: 'educator',
      employmentType:
        workforce.currentPayCondition?.employmentType === 'casual'
          ? 'casual'
          : 'permanent',
      qualifications: [],
      hourlyRate: rate,
      overtimeRate: +(rate * 1.5).toFixed(2),
      maxHoursPerWeek: workforce.currentPayCondition?.contractedHours ?? 38,
      currentWeeklyHours: 0,
      preferredCentres: [],
      availability: collapsed,
      color: 'hsl(220, 70%, 55%)',
      email: workforce.email,
      phone: workforce.mobilePhone,
    };

  return {
    ...base,
    availability: collapsed.some((d) => d.available)
      ? collapsed
      : base.availability,
    hourlyRate: rate || base.hourlyRate,
    overtimeRate: rate ? +(rate * 1.5).toFixed(2) : base.overtimeRate,
    email: base.email ?? workforce.email,
    phone: base.phone ?? workforce.mobilePhone,
    sourceStaffId: workforce.id,
    weeklyAvailability: workforce.weeklyAvailability,
    availabilityPattern: workforce.availabilityPattern,
    availabilityCycleAnchor: workforce.availabilityCycleAnchor,
    currentPayCondition: workforce.currentPayCondition,
  };
}

/**
 * Merge a list of workforce staff into a list of roster staff. Roster
 * records without a workforce counterpart pass through untouched; workforce
 * records without a roster counterpart are appended via `bridgeWorkforceToRoster`.
 */
export function mergeStaff(
  rosterStaff: RosterStaff[],
  workforceStaff: WorkforceStaff[],
): RosterStaff[] {
  const byId = new Map(rosterStaff.map((s) => [s.id, s]));
  const merged: RosterStaff[] = [];
  const seen = new Set<string>();

  for (const wf of workforceStaff) {
    const existing = byId.get(wf.id);
    merged.push(bridgeWorkforceToRoster(wf, existing));
    seen.add(wf.id);
  }
  for (const rs of rosterStaff) {
    if (!seen.has(rs.id)) merged.push(rs);
  }
  return merged;
}
