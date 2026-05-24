// Attendance Reconciliation Service
// Clock-in/out for agency workers and bridge from Placement -> Timesheet entry.
// Handles discrepancies (late start, early finish, no-show, outside geofence, etc.)

import {
  AttendanceReconciliation,
  AttendanceReconciliationSettings,
  ClockEvent,
  ClockEventType,
  ClockMethod,
  DiscrepancyType,
  ReconciliationStatus,
} from '@/types/agencyCompliance';
import { timesheetApi } from '@/lib/api/timesheetApi';

export const DEFAULT_RECONCILIATION_SETTINGS: AttendanceReconciliationSettings = {
  toleranceMinutesEarlyStart: 5,
  toleranceMinutesLateStart: 5,
  toleranceMinutesEarlyFinish: 5,
  toleranceMinutesLateFinish: 15,
  autoMatchWithinTolerance: true,
  requireGeofenceMatch: true,
  geofenceRadiusMeters: 150,
  allowedClockMethods: ['qr_code', 'geofence', 'pin', 'kiosk', 'supervisor'],
  pinCodeRequired: false,
  autoPushToTimesheetOnApproval: true,
};

function minutesBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

function isoFromShiftTime(date: string, time: string): string {
  // date: YYYY-MM-DD, time: HH:mm
  return new Date(`${date}T${time}:00`).toISOString();
}

export function createClockEvent(args: {
  placementId: string;
  candidateId: string;
  type: ClockEventType;
  method: ClockMethod;
  geoLocation?: { lat: number; lng: number; accuracyMeters?: number };
  geofenceMatched?: boolean;
  deviceId?: string;
  ipAddress?: string;
  recordedBy?: string;
  notes?: string;
  isManualOverride?: boolean;
  timestamp?: string;
}): ClockEvent {
  return {
    id: `clk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    placementId: args.placementId,
    candidateId: args.candidateId,
    type: args.type,
    timestamp: args.timestamp ?? new Date().toISOString(),
    method: args.method,
    geoLocation: args.geoLocation,
    geofenceMatched: args.geofenceMatched,
    deviceId: args.deviceId,
    ipAddress: args.ipAddress,
    recordedBy: args.recordedBy,
    notes: args.notes,
    isManualOverride: args.isManualOverride ?? false,
  };
}

export function computeDiscrepancies(
  rec: Pick<
    AttendanceReconciliation,
    'scheduledStart' | 'scheduledEnd' | 'actualStart' | 'actualEnd' | 'scheduledBreakMinutes' | 'actualBreakMinutes' | 'clockEvents'
  >,
  settings: AttendanceReconciliationSettings = DEFAULT_RECONCILIATION_SETTINGS,
): { discrepancies: DiscrepancyType[]; startDelta: number; endDelta: number } {
  const discrepancies: DiscrepancyType[] = [];
  let startDelta = 0;
  let endDelta = 0;

  if (!rec.actualStart) {
    discrepancies.push('no_show');
    return { discrepancies, startDelta: 0, endDelta: 0 };
  }
  startDelta = minutesBetween(rec.scheduledStart, rec.actualStart);
  if (startDelta > settings.toleranceMinutesLateStart) discrepancies.push('late_start');
  if (-startDelta > settings.toleranceMinutesEarlyStart) discrepancies.push('early_start');

  if (!rec.actualEnd) {
    discrepancies.push('missing_clock_out');
  } else {
    endDelta = minutesBetween(rec.scheduledEnd, rec.actualEnd);
    if (-endDelta > settings.toleranceMinutesEarlyFinish) discrepancies.push('early_finish');
    if (endDelta > settings.toleranceMinutesLateFinish) discrepancies.push('late_finish');

    const totalShiftMin = minutesBetween(rec.scheduledStart, rec.scheduledEnd);
    const actualWorkedMin = minutesBetween(rec.actualStart, rec.actualEnd) - rec.actualBreakMinutes;
    if (actualWorkedMin < totalShiftMin * 0.5) discrepancies.push('partial_shift');
  }

  if (rec.actualBreakMinutes > rec.scheduledBreakMinutes + 10) discrepancies.push('over_break');

  if (settings.requireGeofenceMatch) {
    const anyOutside = rec.clockEvents.some(e => e.geofenceMatched === false);
    if (anyOutside) discrepancies.push('outside_geofence');
  }

  return { discrepancies, startDelta, endDelta };
}

export function computePayableHours(
  rec: Pick<AttendanceReconciliation, 'actualStart' | 'actualEnd' | 'actualBreakMinutes'>,
): number {
  if (!rec.actualStart || !rec.actualEnd) return 0;
  const min = minutesBetween(rec.actualStart, rec.actualEnd) - rec.actualBreakMinutes;
  return Math.max(0, Math.round((min / 60) * 100) / 100);
}

export function reconcile(
  rec: AttendanceReconciliation,
  settings: AttendanceReconciliationSettings = DEFAULT_RECONCILIATION_SETTINGS,
): AttendanceReconciliation {
  const { discrepancies, startDelta, endDelta } = computeDiscrepancies(rec, settings);
  const hoursWorked = computePayableHours(rec);
  const hoursBooked =
    minutesBetween(rec.scheduledStart, rec.scheduledEnd) / 60 - rec.scheduledBreakMinutes / 60;

  // Auto-match if within tolerance and no hard discrepancies
  const blockingDiscrepancies: DiscrepancyType[] = ['no_show', 'missing_clock_out', 'partial_shift'];
  const hasBlocker = discrepancies.some(d => blockingDiscrepancies.includes(d));
  const inTolerance = discrepancies.length === 0;

  let status: ReconciliationStatus = rec.status;
  if (inTolerance && settings.autoMatchWithinTolerance) status = 'auto_matched';
  else if (hasBlocker) status = 'pending';
  else if (rec.status === 'pushed_to_timesheet') status = 'pushed_to_timesheet';
  else status = 'pending';

  return {
    ...rec,
    discrepancies,
    startDeltaMinutes: startDelta,
    endDeltaMinutes: endDelta,
    hoursWorked,
    hoursBooked: Math.round(hoursBooked * 100) / 100,
    hoursPayable: hoursWorked, // default - supervisor can override on approval
    status,
  };
}

export function approveReconciliation(
  rec: AttendanceReconciliation,
  approvedBy: string,
  hoursPayableOverride?: number,
  notes?: string,
): AttendanceReconciliation {
  return {
    ...rec,
    status: 'supervisor_approved',
    approvedAt: new Date().toISOString(),
    approvedBy,
    approvalNotes: notes,
    hoursPayable: hoursPayableOverride ?? rec.hoursPayable,
  };
}

export function rejectReconciliation(
  rec: AttendanceReconciliation,
  rejectedBy: string,
  reason: string,
): AttendanceReconciliation {
  return {
    ...rec,
    status: 'rejected',
    approvedAt: new Date().toISOString(),
    approvedBy: rejectedBy,
    approvalNotes: reason,
    hoursPayable: 0,
  };
}

export function disputeReconciliation(
  rec: AttendanceReconciliation,
  notes: string,
): AttendanceReconciliation {
  return { ...rec, status: 'disputed', approvalNotes: notes };
}

// Bridge to timesheet system
export async function pushToTimesheet(
  rec: AttendanceReconciliation,
  baseRate = 35,
): Promise<AttendanceReconciliation> {
  if (!rec.actualStart || !rec.actualEnd) throw new Error('Cannot push without actual times');
  const res = await timesheetApi.createCallbackTimesheetEntry({
    staffId: rec.candidateId,
    staffName: rec.candidateName,
    date: rec.shiftDate,
    clockIn: rec.actualStart,
    clockOut: rec.actualEnd,
    paidMinutes: Math.round(rec.hoursPayable * 60),
    rateMultiplier: 1,
    baseRate,
    calculatedPay: Math.round(rec.hoursPayable * baseRate * 100) / 100,
    callbackType: 'agency_placement',
    reason: `Agency placement reconciliation ${rec.id}`,
    minimumEngagementApplied: false,
    minimumEngagementHours: 0,
  });
  return {
    ...rec,
    status: 'pushed_to_timesheet',
    timesheetEntryId: res.data.timesheetEntryId,
    timesheetPushedAt: new Date().toISOString(),
  };
}

export function generateMockReconciliations(): AttendanceReconciliation[] {
  const today = new Date();
  const date = today.toISOString().slice(0, 10);

  const base = (
    id: string,
    candidateId: string,
    candidateName: string,
    sched: { start: string; end: string; breakMin: number },
    actual: { start?: string; end?: string; breakMin: number } | null,
    method: ClockMethod = 'qr_code',
    geofenceMatched = true,
  ): AttendanceReconciliation => {
    const scheduledStart = isoFromShiftTime(date, sched.start);
    const scheduledEnd = isoFromShiftTime(date, sched.end);
    const actualStart = actual?.start ? isoFromShiftTime(date, actual.start) : undefined;
    const actualEnd = actual?.end ? isoFromShiftTime(date, actual.end) : undefined;
    const clockEvents: ClockEvent[] = [];
    if (actualStart) {
      clockEvents.push(
        createClockEvent({
          placementId: `pl-${id}`,
          candidateId,
          type: 'clock_in',
          method,
          geofenceMatched,
          timestamp: actualStart,
        }),
      );
    }
    if (actualEnd) {
      clockEvents.push(
        createClockEvent({
          placementId: `pl-${id}`,
          candidateId,
          type: 'clock_out',
          method,
          geofenceMatched,
          timestamp: actualEnd,
        }),
      );
    }
    const rec: AttendanceReconciliation = {
      id,
      placementId: `pl-${id}`,
      candidateId,
      candidateName,
      shiftRequestId: 'shift-101',
      centreId: 'centre-1',
      centreName: 'Sunshine Early Learning',
      shiftDate: date,
      scheduledStart,
      scheduledEnd,
      scheduledBreakMinutes: sched.breakMin,
      actualStart,
      actualEnd,
      actualBreakMinutes: actual?.breakMin ?? 0,
      startDeltaMinutes: 0,
      endDeltaMinutes: 0,
      hoursWorked: 0,
      hoursBooked: 0,
      hoursPayable: 0,
      discrepancies: [],
      status: 'pending',
      clockEvents,
    };
    return reconcile(rec);
  };

  return [
    // Clean shift
    base('rec-1', 'cand-1', 'Sarah Mitchell', { start: '07:00', end: '15:00', breakMin: 30 }, { start: '06:58', end: '15:02', breakMin: 30 }),
    // Late start
    base('rec-2', 'cand-2', 'James Wong', { start: '08:00', end: '16:00', breakMin: 30 }, { start: '08:18', end: '16:05', breakMin: 30 }),
    // Early finish
    base('rec-3', 'cand-3', 'Emily Chen', { start: '09:00', end: '17:00', breakMin: 30 }, { start: '09:01', end: '16:15', breakMin: 30 }),
    // No show
    base('rec-4', 'cand-4', 'Michael Brown', { start: '07:00', end: '15:00', breakMin: 30 }, null),
    // Outside geofence + ran over
    base('rec-5', 'cand-5', 'Lisa Taylor', { start: '10:00', end: '18:00', breakMin: 30 }, { start: '09:55', end: '18:35', breakMin: 30 }, 'geofence', false),
  ];
}
