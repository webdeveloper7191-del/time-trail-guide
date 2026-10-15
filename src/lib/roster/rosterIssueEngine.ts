/**
 * Roster Issue Engine
 * ---------------------------------------------------------------------------
 * Pure functions that evaluate the roster (shifts, staff, leave, availability,
 * qualifications, demand/ratios) and return:
 *  - Conflicts: true-right-now problems (blocking or overridable with reason)
 *  - Alerts: things that will become a problem if ignored
 *
 * See /mnt/documents/Roster-Conflicts-Alerts-Notifications.md for the source
 * catalogue this module implements (subset relevant to the roster module).
 *
 * Thresholds live in a small versioned localStorage-backed settings store so
 * other parts of the app (and tests) can read/update them with change
 * notifications, mirroring the pattern used by other roster/pricing stores.
 */
import {
  Shift,
  StaffMember,
  TimeOff,
  Room,
  DemandData,
  QualificationType,
} from '@/types/roster';
import { parseISO, differenceInCalendarDays, differenceInHours, addDays, subDays, format } from 'date-fns';

// ---------------------------------------------------------------------------
// Settings (thresholds) — versioned localStorage store with listeners
// ---------------------------------------------------------------------------

export interface RosterIssueSettings {
  /** Minimum rest between shifts, in hours (C9). */
  minRestHours: number;
  /** Max consecutive days worked before flagging (C10). */
  maxConsecutiveDays: number;
  /** Open shift unfilled: amber threshold, hours before start (A1). */
  openShiftAmberHours: number;
  /** Open shift unfilled: red threshold, hours before start (A1). */
  openShiftRedHours: number;
  /** Fraction (0-1) of weekly-hours / fatigue limit that counts as "approaching" (A8/A9/A11). */
  approachingLimitRatio: number;
  /** Hours after publish before an unacknowledged shift reminds the staff member (A13). */
  unacknowledgedReminderHours: number;
  /** Hours after publish before an unacknowledged shift alerts the manager (A13). */
  unacknowledgedEscalationHours: number;
  /** Days before expiry a qualification is flagged as "expiring soon" (A14). */
  qualificationExpiryWarningDays: number;
  /** Days before expiry considered "high" urgency (A14). */
  qualificationExpiryHighDays: number;
  /** Shift length (hours) above which a break must be scheduled (C24/A12). */
  breakRequiredAfterHours: number;
}

export const DEFAULT_ROSTER_ISSUE_SETTINGS: RosterIssueSettings = {
  minRestHours: 10,
  maxConsecutiveDays: 6,
  openShiftAmberHours: 72,
  openShiftRedHours: 24,
  approachingLimitRatio: 0.9,
  unacknowledgedReminderHours: 24,
  unacknowledgedEscalationHours: 48,
  qualificationExpiryWarningDays: 30,
  qualificationExpiryHighDays: 7,
  breakRequiredAfterHours: 5,
};

const SETTINGS_KEY = 'rai.roster.issueSettings.v1';
const listeners = new Set<() => void>();
let cachedSettings: RosterIssueSettings | null = null;

function emit() {
  listeners.forEach(l => l());
}

function readSettings(): RosterIssueSettings {
  if (cachedSettings) return cachedSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const stored = raw ? (JSON.parse(raw) as Partial<RosterIssueSettings>) : {};
    cachedSettings = { ...DEFAULT_ROSTER_ISSUE_SETTINGS, ...stored };
  } catch {
    cachedSettings = { ...DEFAULT_ROSTER_ISSUE_SETTINGS };
  }
  return cachedSettings;
}

function writeSettings(next: RosterIssueSettings) {
  cachedSettings = next;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore (e.g. storage unavailable in tests) */
  }
  emit();
}

export const rosterIssueSettingsStore = {
  get: readSettings,
  update: (patch: Partial<RosterIssueSettings>) => {
    writeSettings({ ...readSettings(), ...patch });
  },
  reset: () => writeSettings({ ...DEFAULT_ROSTER_ISSUE_SETTINGS }),
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

export function shiftHours(shift: Pick<Shift, 'startTime' | 'endTime' | 'breakMinutes'>): number {
  const start = timeToMinutes(shift.startTime);
  let end = timeToMinutes(shift.endTime);
  if (end <= start) end += 24 * 60; // overnight shift
  return (end - start - (shift.breakMinutes || 0)) / 60;
}

function shiftStartDateTime(shift: Shift): Date {
  return new Date(`${shift.date}T${shift.startTime}:00`);
}

function shiftEndDateTime(shift: Shift): Date {
  const start = timeToMinutes(shift.startTime);
  const end = timeToMinutes(shift.endTime);
  const dayOffset = end <= start ? 1 : 0;
  const d = addDays(parseISO(shift.date), dayOffset);
  return new Date(`${format(d, 'yyyy-MM-dd')}T${shift.endTime}:00`);
}

// ---------------------------------------------------------------------------
// Conflicts
// ---------------------------------------------------------------------------

export type RosterConflictCode =
  | 'overlap_same_location'
  | 'overlap_cross_location'
  | 'on_approved_leave'
  | 'outside_availability'
  | 'insufficient_rest'
  | 'max_consecutive_days'
  | 'max_weekly_hours'
  | 'missing_qualification'
  | 'ratio_breach';

export type RosterSeverity = 'blocking' | 'overridable';

export interface RosterConflict {
  id: string;
  code: RosterConflictCode;
  severity: RosterSeverity;
  shiftId: string;
  staffId: string;
  staffName: string;
  date: string;
  reason: string;
  details?: string;
  requiresOverrideReason: boolean;
}

export interface ConflictEngineInputs {
  shifts: Shift[];
  staff: StaffMember[];
  leave?: TimeOff[];
  rooms?: Room[];
  settings?: RosterIssueSettings;
}

/** Evaluate every conflict rule against the supplied roster snapshot. */
export function computeConflicts(inputs: ConflictEngineInputs): RosterConflict[] {
  const settings = inputs.settings ?? readSettings();
  const { shifts, staff, rooms = [] } = inputs;
  const leave = inputs.leave ?? staff.flatMap(s => (s.timeOff || []).map(t => ({ ...t, staffId: t.staffId || s.id })));
  const conflicts: RosterConflict[] = [];
  const staffById = new Map(staff.map(s => [s.id, s]));

  const seenOverlapPairs = new Set<string>();

  for (const shift of shifts) {
    if (shift.isOpenShift || !shift.staffId) continue;
    const member = staffById.get(shift.staffId);
    if (!member) continue;

    // --- C1/C2: Overlapping shifts (same or cross location) ---
    const sameDay = shifts.filter(
      s => s.staffId === shift.staffId && s.date === shift.date && s.id !== shift.id && !s.isOpenShift
    );
    for (const other of sameDay) {
      const pairKey = [shift.id, other.id].sort().join('::');
      if (seenOverlapPairs.has(pairKey)) continue;
      if (timesOverlap(shift.startTime, shift.endTime, other.startTime, other.endTime)) {
        seenOverlapPairs.add(pairKey);
        const sameLocation = shift.centreId === other.centreId;
        conflicts.push({
          id: `conflict-overlap-${pairKey}`,
          code: sameLocation ? 'overlap_same_location' : 'overlap_cross_location',
          severity: 'blocking',
          shiftId: shift.id,
          staffId: shift.staffId,
          staffName: member.name,
          date: shift.date,
          reason: sameLocation
            ? `Overlapping shifts at the same location (${shift.startTime}-${shift.endTime} / ${other.startTime}-${other.endTime})`
            : `Overlapping shifts across locations (${shift.startTime}-${shift.endTime} / ${other.startTime}-${other.endTime})`,
          details: `${member.name} cannot work two overlapping shifts.`,
          requiresOverrideReason: false,
        });
      }
    }

    // --- C4: On approved leave ---
    const shiftDate = parseISO(shift.date);
    const onApprovedLeave = leave.find(l => {
      if (l.staffId !== shift.staffId || l.status !== 'approved') return false;
      const start = parseISO(l.startDate);
      const end = parseISO(l.endDate);
      return shiftDate >= start && shiftDate <= end;
    });
    if (onApprovedLeave) {
      conflicts.push({
        id: `conflict-leave-${shift.id}`,
        code: 'on_approved_leave',
        severity: 'blocking',
        shiftId: shift.id,
        staffId: shift.staffId,
        staffName: member.name,
        date: shift.date,
        reason: `${member.name} is on approved leave (${onApprovedLeave.type.replace('_', ' ')})`,
        requiresOverrideReason: false,
      });
    }

    // --- C7/C8: Outside availability / unavailable day ---
    const dayOfWeek = shiftDate.getDay();
    const availability = member.availability?.find(a => a.dayOfWeek === dayOfWeek);
    if (availability && !availability.available) {
      conflicts.push({
        id: `conflict-unavailable-${shift.id}`,
        code: 'outside_availability',
        severity: 'overridable',
        shiftId: shift.id,
        staffId: shift.staffId,
        staffName: member.name,
        date: shift.date,
        reason: `${member.name} marked themselves unavailable on ${format(shiftDate, 'EEEE')}`,
        requiresOverrideReason: true,
      });
    } else if (availability?.available && availability.startTime && availability.endTime) {
      const availStart = timeToMinutes(availability.startTime);
      const availEnd = timeToMinutes(availability.endTime);
      const shiftStart = timeToMinutes(shift.startTime);
      const shiftEnd = timeToMinutes(shift.endTime);
      if (shiftStart < availStart || shiftEnd > availEnd) {
        conflicts.push({
          id: `conflict-availability-${shift.id}`,
          code: 'outside_availability',
          severity: 'overridable',
          shiftId: shift.id,
          staffId: shift.staffId,
          staffName: member.name,
          date: shift.date,
          reason: `Shift (${shift.startTime}-${shift.endTime}) is outside ${member.name}'s availability (${availability.startTime}-${availability.endTime})`,
          requiresOverrideReason: true,
        });
      }
    }

    // --- C9: Insufficient rest between shifts ---
    const prevShift = shifts
      .filter(s => s.staffId === shift.staffId && s.id !== shift.id && !s.isOpenShift)
      .filter(s => shiftEndDateTime(s).getTime() <= shiftStartDateTime(shift).getTime())
      .sort((a, b) => shiftEndDateTime(b).getTime() - shiftEndDateTime(a).getTime())[0];
    if (prevShift) {
      const restHours = differenceInHours(shiftStartDateTime(shift), shiftEndDateTime(prevShift));
      if (restHours < settings.minRestHours) {
        conflicts.push({
          id: `conflict-rest-${shift.id}`,
          code: 'insufficient_rest',
          severity: 'blocking',
          shiftId: shift.id,
          staffId: shift.staffId,
          staffName: member.name,
          date: shift.date,
          reason: `Only ${restHours}h rest since previous shift (minimum ${settings.minRestHours}h)`,
          requiresOverrideReason: false,
        });
      }
    }

    // --- C10: Max consecutive days exceeded ---
    let consecutive = 1;
    for (let i = 1; i <= settings.maxConsecutiveDays + 2; i++) {
      const checkDate = format(subDays(shiftDate, i), 'yyyy-MM-dd');
      if (shifts.some(s => s.staffId === shift.staffId && s.date === checkDate && !s.isOpenShift)) {
        consecutive++;
      } else break;
    }
    if (consecutive > settings.maxConsecutiveDays) {
      conflicts.push({
        id: `conflict-consecutive-${shift.id}`,
        code: 'max_consecutive_days',
        severity: 'blocking',
        shiftId: shift.id,
        staffId: shift.staffId,
        staffName: member.name,
        date: shift.date,
        reason: `${consecutive} consecutive days worked (maximum ${settings.maxConsecutiveDays})`,
        requiresOverrideReason: false,
      });
    }

    // --- C15: Missing required qualification ---
    const room = rooms.find(r => r.id === shift.roomId);
    const requiredQuals: QualificationType[] = [];
    if (room && room.minQualifiedStaff > 0) {
      // Room-level requirement is a share, not a per-shift hard qualification list here;
      // template-level requirements (if present on the shift) are authoritative.
    }
    // No direct requiredQualifications field on Shift; nothing to check beyond template-driven data
    // left here for extension — engine stays pure and conservative.
  }

  // --- C11: Max weekly hours exceeded ---
  const hoursByStaffWeek = new Map<string, number>();
  for (const shift of shifts) {
    if (shift.isOpenShift || !shift.staffId) continue;
    const weekStart = format(subDays(parseISO(shift.date), parseISO(shift.date).getDay()), 'yyyy-MM-dd');
    const key = `${shift.staffId}::${weekStart}`;
    hoursByStaffWeek.set(key, (hoursByStaffWeek.get(key) || 0) + shiftHours(shift));
  }
  const reportedWeeklyBreach = new Set<string>();
  for (const shift of shifts) {
    if (shift.isOpenShift || !shift.staffId) continue;
    const member = staffById.get(shift.staffId);
    if (!member) continue;
    const weekStart = format(subDays(parseISO(shift.date), parseISO(shift.date).getDay()), 'yyyy-MM-dd');
    const key = `${shift.staffId}::${weekStart}`;
    if (reportedWeeklyBreach.has(key)) continue;
    const total = hoursByStaffWeek.get(key) || 0;
    if (total > member.maxHoursPerWeek) {
      reportedWeeklyBreach.add(key);
      conflicts.push({
        id: `conflict-weekly-hours-${key}`,
        code: 'max_weekly_hours',
        severity: 'overridable',
        shiftId: shift.id,
        staffId: shift.staffId,
        staffName: member.name,
        date: shift.date,
        reason: `${member.name} is rostered ${total.toFixed(1)}h this week (maximum ${member.maxHoursPerWeek}h)`,
        requiresOverrideReason: true,
      });
    }
  }

  // --- C18: Ratio breach (staff below required ratio for an area/day) ---
  if (rooms.length) {
    const roomsById = new Map(rooms.map(r => [r.id, r]));
    const groups = new Map<string, Shift[]>();
    for (const shift of shifts) {
      if (shift.isOpenShift) continue;
      const key = `${shift.roomId}::${shift.date}`;
      groups.set(key, [...(groups.get(key) || []), shift]);
    }
    for (const [key, groupShifts] of groups) {
      const [roomId, date] = key.split('::');
      const room = roomsById.get(roomId);
      if (!room || !room.minQualifiedStaff) continue;
      const staffCount = new Set(groupShifts.map(s => s.staffId)).size;
      if (staffCount < room.minQualifiedStaff) {
        const sample = groupShifts[0];
        const member = staffById.get(sample.staffId);
        conflicts.push({
          id: `conflict-ratio-${key}`,
          code: 'ratio_breach',
          severity: 'blocking',
          shiftId: sample.id,
          staffId: sample.staffId,
          staffName: member?.name || 'Area',
          date,
          reason: `${room.name}: only ${staffCount} staff rostered on ${date}, minimum required is ${room.minQualifiedStaff}`,
          requiresOverrideReason: false,
        });
      }
    }
  }

  return conflicts;
}

export function hasBlockingConflicts(conflicts: RosterConflict[]): boolean {
  return conflicts.some(c => c.severity === 'blocking');
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export type RosterAlertCode =
  | 'open_shift_unfilled'
  | 'coverage_below_demand'
  | 'future_under_ratio'
  | 'approaching_weekly_hours'
  | 'break_risk'
  | 'shift_unacknowledged'
  | 'qualification_expiring';

export type RosterAlertUrgency = 'amber' | 'red' | 'info';

export interface RosterAlert {
  id: string;
  code: RosterAlertCode;
  urgency: RosterAlertUrgency;
  shiftId?: string;
  staffId?: string;
  staffName?: string;
  date?: string;
  reason: string;
  details?: string;
}

export interface AlertEngineInputs {
  shifts: Shift[];
  staff: StaffMember[];
  rooms?: Room[];
  demandData?: DemandData[];
  now?: Date;
  settings?: RosterIssueSettings;
  /** Map of shiftId -> ISO timestamp the staff member acknowledged the shift. */
  acknowledgedShiftIds?: Record<string, string>;
  /** ISO timestamp the roster (or shift) was published; required for A13. */
  publishedAt?: Record<string, string>;
}

export function computeAlerts(inputs: AlertEngineInputs): RosterAlert[] {
  const settings = inputs.settings ?? readSettings();
  const now = inputs.now ?? new Date();
  const { shifts, staff, rooms = [], demandData = [] } = inputs;
  const staffById = new Map(staff.map(s => [s.id, s]));
  const alerts: RosterAlert[] = [];

  // --- A1: Open shift unfilled ---
  for (const shift of shifts) {
    if (!shift.isOpenShift) continue;
    const start = shiftStartDateTime(shift);
    const hoursLeft = differenceInHours(start, now);
    if (hoursLeft < 0) continue;
    if (hoursLeft <= settings.openShiftRedHours) {
      alerts.push({
        id: `alert-openshift-red-${shift.id}`,
        code: 'open_shift_unfilled',
        urgency: 'red',
        shiftId: shift.id,
        date: shift.date,
        reason: `Open shift starts in ${hoursLeft}h and is still unfilled`,
      });
    } else if (hoursLeft <= settings.openShiftAmberHours) {
      alerts.push({
        id: `alert-openshift-amber-${shift.id}`,
        code: 'open_shift_unfilled',
        urgency: 'amber',
        shiftId: shift.id,
        date: shift.date,
        reason: `Open shift starts in ${hoursLeft}h and is still unfilled`,
      });
    }
  }

  // --- A4: Coverage below demand forecast ---
  if (demandData.length) {
    const rosteredByRoomDate = new Map<string, Set<string>>();
    for (const shift of shifts) {
      if (shift.isOpenShift) continue;
      const key = `${shift.roomId}::${shift.date}`;
      if (!rosteredByRoomDate.has(key)) rosteredByRoomDate.set(key, new Set());
      rosteredByRoomDate.get(key)!.add(shift.staffId);
    }
    const roomsById = new Map(rooms.map(r => [r.id, r]));
    for (const demand of demandData) {
      const room = roomsById.get(demand.roomId);
      const ratio = room?.requiredRatio || 1;
      const requiredStaff = Math.ceil(demand.projectedChildren / ratio);
      const key = `${demand.roomId}::${demand.date}`;
      const rosteredStaff = rosteredByRoomDate.get(key)?.size || 0;
      if (requiredStaff > 0 && rosteredStaff < requiredStaff) {
        alerts.push({
          id: `alert-coverage-${key}-${demand.timeSlot}`,
          code: 'coverage_below_demand',
          urgency: requiredStaff - rosteredStaff >= 2 ? 'red' : 'amber',
          date: demand.date,
          reason: `${room?.name || demand.roomId}: rostered ${rosteredStaff} staff vs ${requiredStaff} required for forecast demand (${demand.timeSlot})`,
        });
      }
    }
  }

  // --- A6: Future under-ratio risk (next 24h window using current roster vs ratio) ---
  if (rooms.length) {
    const roomsById = new Map(rooms.map(r => [r.id, r]));
    const groups = new Map<string, Shift[]>();
    for (const shift of shifts) {
      if (shift.isOpenShift) continue;
      const start = shiftStartDateTime(shift);
      if (isBefore(start, now) || differenceInHours(start, now) > 24) continue;
      const key = `${shift.roomId}::${shift.date}`;
      groups.set(key, [...(groups.get(key) || []), shift]);
    }
    for (const [key, groupShifts] of groups) {
      const [roomId, date] = key.split('::');
      const room = roomsById.get(roomId);
      if (!room || !room.minQualifiedStaff) continue;
      const staffCount = new Set(groupShifts.map(s => s.staffId)).size;
      if (staffCount < room.minQualifiedStaff) {
        alerts.push({
          id: `alert-future-ratio-${key}`,
          code: 'future_under_ratio',
          urgency: 'red',
          date,
          reason: `${room.name} will be under ratio within 24h (${staffCount}/${room.minQualifiedStaff} staff)`,
        });
      }
    }
  }

  // --- A8/A9: Approaching max weekly hours / overtime (90% of limit) ---
  const hoursByStaffWeek = new Map<string, number>();
  for (const shift of shifts) {
    if (shift.isOpenShift || !shift.staffId) continue;
    const weekStart = format(subDays(parseISO(shift.date), parseISO(shift.date).getDay()), 'yyyy-MM-dd');
    const key = `${shift.staffId}::${weekStart}`;
    hoursByStaffWeek.set(key, (hoursByStaffWeek.get(key) || 0) + shiftHours(shift));
  }
  for (const [key, totalHours] of hoursByStaffWeek) {
    const [staffId] = key.split('::');
    const member = staffById.get(staffId);
    if (!member || !member.maxHoursPerWeek) continue;
    const ratio = totalHours / member.maxHoursPerWeek;
    if (ratio >= settings.approachingLimitRatio && totalHours <= member.maxHoursPerWeek) {
      alerts.push({
        id: `alert-approaching-hours-${key}`,
        code: 'approaching_weekly_hours',
        urgency: 'amber',
        staffId,
        staffName: member.name,
        reason: `${member.name} is at ${Math.round(ratio * 100)}% of their weekly hours limit (${totalHours.toFixed(1)}/${member.maxHoursPerWeek}h)`,
      });
    }
  }

  // --- A12: Break compliance risk ---
  for (const shift of shifts) {
    if (shift.isOpenShift || !shift.staffId) continue;
    const hours = shiftHours(shift);
    const grossHours = hours + (shift.breakMinutes || 0) / 60;
    if (grossHours >= settings.breakRequiredAfterHours && !(shift.breakMinutes > 0 || (shift.breaks && shift.breaks.length))) {
      const member = staffById.get(shift.staffId);
      alerts.push({
        id: `alert-break-risk-${shift.id}`,
        code: 'break_risk',
        urgency: 'amber',
        shiftId: shift.id,
        staffId: shift.staffId,
        staffName: member?.name,
        date: shift.date,
        reason: `Shift is ${grossHours.toFixed(1)}h with no break scheduled (break required after ${settings.breakRequiredAfterHours}h)`,
      });
    }
  }

  // --- A13: Shift unacknowledged (24h reminder / 48h escalation) ---
  if (inputs.publishedAt) {
    const acknowledged = inputs.acknowledgedShiftIds || {};
    for (const shift of shifts) {
      if (shift.isOpenShift || shift.status !== 'published') continue;
      const publishedIso = inputs.publishedAt[shift.id];
      if (!publishedIso || acknowledged[shift.id]) continue;
      const hoursSincePublish = differenceInHours(now, new Date(publishedIso));
      const member = staffById.get(shift.staffId);
      if (hoursSincePublish >= settings.unacknowledgedEscalationHours) {
        alerts.push({
          id: `alert-unacked-manager-${shift.id}`,
          code: 'shift_unacknowledged',
          urgency: 'red',
          shiftId: shift.id,
          staffId: shift.staffId,
          staffName: member?.name,
          date: shift.date,
          reason: `${member?.name || 'Staff member'} has not acknowledged this shift ${settings.unacknowledgedEscalationHours}h after publishing`,
        });
      } else if (hoursSincePublish >= settings.unacknowledgedReminderHours) {
        alerts.push({
          id: `alert-unacked-reminder-${shift.id}`,
          code: 'shift_unacknowledged',
          urgency: 'amber',
          shiftId: shift.id,
          staffId: shift.staffId,
          staffName: member?.name,
          date: shift.date,
          reason: `${member?.name || 'Staff member'} has not acknowledged this shift ${settings.unacknowledgedReminderHours}h after publishing`,
        });
      }
    }
  }

  // --- A14: Qualification expiring before shift ---
  for (const member of staff) {
    for (const qual of member.qualifications || []) {
      if (!qual.expiryDate) continue;
      const expiry = parseISO(qual.expiryDate);
      const daysUntilExpiry = differenceInCalendarDays(expiry, now);
      if (daysUntilExpiry < 0 || daysUntilExpiry > settings.qualificationExpiryWarningDays) continue;
      const upcomingShift = shifts.find(
        s => s.staffId === member.id && !s.isOpenShift && parseISO(s.date) >= now && parseISO(s.date) <= expiry
      );
      if (!upcomingShift) continue;
      alerts.push({
        id: `alert-qual-expiring-${member.id}-${qual.type}`,
        code: 'qualification_expiring',
        urgency: daysUntilExpiry < settings.qualificationExpiryHighDays ? 'red' : 'amber',
        shiftId: upcomingShift.id,
        staffId: member.id,
        staffName: member.name,
        date: upcomingShift.date,
        reason: `${member.name}'s ${qual.name} expires in ${daysUntilExpiry} day(s), before a rostered shift`,
      });
    }
  }

  return alerts;
}

function isBefore(a: Date, b: Date) {
  return a.getTime() < b.getTime();
}

export interface RosterIssuesSummary {
  conflicts: RosterConflict[];
  alerts: RosterAlert[];
  blockingConflicts: RosterConflict[];
}

/** Convenience: compute both conflicts and alerts together. */
export function computeRosterIssues(
  inputs: ConflictEngineInputs & AlertEngineInputs
): RosterIssuesSummary {
  const conflicts = computeConflicts(inputs);
  const alerts = computeAlerts(inputs);
  return { conflicts, alerts, blockingConflicts: conflicts.filter(c => c.severity === 'blocking') };
}
