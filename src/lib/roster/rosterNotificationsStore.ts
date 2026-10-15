/**
 * Roster Notifications Store
 * ---------------------------------------------------------------------------
 * A lightweight localStorage-backed "FYI, something just happened" feed for
 * the roster module (published, assigned, swapped, claimed, leave decision,
 * timesheet submitted, conflict resolved, all-clear, etc.).
 *
 * Versioned + listener based, mirroring the pattern used elsewhere
 * (see src/lib/pricingScheduleStore.ts and rosterIssueEngine.ts settings).
 */

export type RosterNotificationType =
  | 'roster_published'
  | 'shift_assigned'
  | 'shift_unassigned'
  | 'shift_swapped'
  | 'open_shift_claimed'
  | 'leave_approved'
  | 'leave_rejected'
  | 'timesheet_submitted'
  | 'conflict_resolved'
  | 'all_clear'
  | 'override_recorded';

export interface RosterNotification {
  id: string;
  type: RosterNotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO
  read: boolean;
  staffId?: string;
  staffName?: string;
  shiftId?: string;
  centreId?: string;
}

const KEY = 'rai.roster.notifications.v1';
const MAX_ITEMS = 200;

let cached: RosterNotification[] | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function read(): RosterNotification[] {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    cached = raw ? (JSON.parse(raw) as RosterNotification[]) : [];
  } catch {
    cached = [];
  }
  return cached;
}

function write(next: RosterNotification[]) {
  cached = next.slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(KEY, JSON.stringify(cached));
  } catch {
    /* ignore */
  }
  emit();
}

function addNotification(input: Omit<RosterNotification, 'id' | 'timestamp' | 'read'> & { timestamp?: string }) {
  const notification: RosterNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    read: false,
    timestamp: input.timestamp ?? new Date().toISOString(),
    ...input,
  };
  write([notification, ...read()]);
  return notification;
}

export const rosterNotificationsStore = {
  all: read,
  markRead: (id: string) => write(read().map(n => (n.id === id ? { ...n, read: true } : n))),
  markAllRead: () => write(read().map(n => ({ ...n, read: true }))),
  dismiss: (id: string) => write(read().filter(n => n.id !== id)),
  clear: () => write([]),
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// ---------------------------------------------------------------------------
// Emit helpers — call these from the existing publish/assign/swap/etc. handlers.
// ---------------------------------------------------------------------------

export const emitRosterPublished = (count: number, centreId?: string) =>
  addNotification({
    type: 'roster_published',
    title: 'Roster published',
    message: `${count} shift${count === 1 ? '' : 's'} published${centreId ? ` for this location` : ''}.`,
    centreId,
  });

export const emitShiftAssigned = (staffName: string, shiftId: string, centreId?: string) =>
  addNotification({
    type: 'shift_assigned',
    title: 'Shift assigned',
    message: `${staffName} was assigned a shift.`,
    staffName,
    shiftId,
    centreId,
  });

export const emitShiftUnassigned = (staffName: string, shiftId: string, centreId?: string) =>
  addNotification({
    type: 'shift_unassigned',
    title: 'Shift unassigned',
    message: `${staffName}'s shift was removed or cancelled.`,
    staffName,
    shiftId,
    centreId,
  });

export const emitShiftSwapped = (staffA: string, staffB: string, shiftId: string) =>
  addNotification({
    type: 'shift_swapped',
    title: 'Shift swapped',
    message: `${staffA} swapped a shift with ${staffB}.`,
    shiftId,
  });

export const emitOpenShiftClaimed = (staffName: string, shiftId: string) =>
  addNotification({
    type: 'open_shift_claimed',
    title: 'Open shift claimed',
    message: `${staffName} claimed an open shift.`,
    staffName,
    shiftId,
  });

export const emitLeaveDecision = (staffName: string, approved: boolean) =>
  addNotification({
    type: approved ? 'leave_approved' : 'leave_rejected',
    title: approved ? 'Leave approved' : 'Leave rejected',
    message: `${staffName}'s leave request was ${approved ? 'approved' : 'rejected'}.`,
    staffName,
  });

export const emitTimesheetSubmitted = (staffName: string, shiftId?: string) =>
  addNotification({
    type: 'timesheet_submitted',
    title: 'Timesheet submitted',
    message: `${staffName} submitted a timesheet for approval.`,
    staffName,
    shiftId,
  });

export const emitConflictResolved = (reason: string, shiftId?: string) =>
  addNotification({
    type: 'conflict_resolved',
    title: 'Conflict resolved',
    message: reason,
    shiftId,
  });

export const emitAllClear = (centreId?: string) =>
  addNotification({
    type: 'all_clear',
    title: 'All conflicts cleared',
    message: 'The roster has zero conflicts and is ready to publish.',
    centreId,
  });

export const emitOverrideRecorded = (staffName: string, reason: string, shiftId?: string) =>
  addNotification({
    type: 'override_recorded',
    title: 'Override recorded',
    message: `${staffName}: ${reason}`,
    staffName,
    shiftId,
  });
