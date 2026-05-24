// Booking Confirmation Service
// Centre-side accept/reject of candidate submissions before Placement is created.
// Implements a reverse SLA where the centre must respond within N minutes
// or the submission auto-confirms (or auto-rejects, configurable).

import {
  BookingConfirmation,
  BookingConfirmationSettings,
  BookingConfirmationStatus,
} from '@/types/agencyCompliance';
import type { ShiftUrgency } from '@/types/agency';

export const DEFAULT_BOOKING_SETTINGS: BookingConfirmationSettings = {
  defaultResponseSlaMinutes: 60,
  urgentResponseSlaMinutes: 30,
  criticalResponseSlaMinutes: 15,
  autoConfirmOnExpiry: false, // safer default - require explicit confirmation
  reminderIntervalsMinutes: [30, 10],
  allowPreviewBooking: true,
};

export function getResponseSlaMinutes(
  urgency: ShiftUrgency,
  settings: BookingConfirmationSettings = DEFAULT_BOOKING_SETTINGS,
): number {
  if (urgency === 'critical') return settings.criticalResponseSlaMinutes;
  if (urgency === 'urgent') return settings.urgentResponseSlaMinutes;
  return settings.defaultResponseSlaMinutes;
}

export function createBookingConfirmation(args: {
  submissionId: string;
  shiftRequestId: string;
  candidateId: string;
  candidateName: string;
  agencyId: string;
  agencyName: string;
  centreId: string;
  centreName: string;
  roleName?: string;
  shiftDate: string;
  shiftStartTime: string;
  shiftEndTime: string;
  urgency: ShiftUrgency;
  settings?: BookingConfirmationSettings;
}): BookingConfirmation {
  const settings = args.settings ?? DEFAULT_BOOKING_SETTINGS;
  const slaMinutes = getResponseSlaMinutes(args.urgency, settings);
  const submittedAt = new Date();
  const deadline = new Date(submittedAt.getTime() + slaMinutes * 60 * 1000);
  return {
    id: `bc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    submissionId: args.submissionId,
    shiftRequestId: args.shiftRequestId,
    candidateId: args.candidateId,
    candidateName: args.candidateName,
    agencyId: args.agencyId,
    agencyName: args.agencyName,
    centreId: args.centreId,
    centreName: args.centreName,
    roleName: args.roleName,
    shiftDate: args.shiftDate,
    shiftStartTime: args.shiftStartTime,
    shiftEndTime: args.shiftEndTime,
    submittedAt: submittedAt.toISOString(),
    responseDeadline: deadline.toISOString(),
    responseSlaMinutes: slaMinutes,
    autoConfirmOnExpiry: settings.autoConfirmOnExpiry,
    status: 'awaiting_centre',
    remindersSent: 0,
  };
}

export function confirmBooking(
  bc: BookingConfirmation,
  decidedBy: string,
): BookingConfirmation {
  return {
    ...bc,
    status: 'confirmed',
    decidedAt: new Date().toISOString(),
    decidedBy,
  };
}

export function rejectBooking(
  bc: BookingConfirmation,
  decidedBy: string,
  reason: string,
  category: NonNullable<BookingConfirmation['rejectionCategory']>,
): BookingConfirmation {
  return {
    ...bc,
    status: 'rejected',
    decidedAt: new Date().toISOString(),
    decidedBy,
    rejectionReason: reason,
    rejectionCategory: category,
  };
}

export function schedulePreview(
  bc: BookingConfirmation,
  scheduledAt: string,
  mode: NonNullable<BookingConfirmation['previewMode']>,
  notes?: string,
): BookingConfirmation {
  return {
    ...bc,
    status: 'preview_scheduled',
    previewScheduledAt: scheduledAt,
    previewMode: mode,
    previewNotes: notes,
  };
}

export function checkSlaExpiry(bc: BookingConfirmation): BookingConfirmation {
  if (bc.status !== 'awaiting_centre' && bc.status !== 'preview_scheduled') return bc;
  const now = Date.now();
  const deadline = new Date(bc.responseDeadline).getTime();
  if (now < deadline) return bc;
  return {
    ...bc,
    status: bc.autoConfirmOnExpiry ? 'auto_confirmed' : 'auto_rejected',
    decidedAt: new Date(deadline).toISOString(),
    decidedBy: 'system:reverse_sla',
  };
}

export function timeUntilDeadline(bc: BookingConfirmation): {
  minutes: number;
  isOverdue: boolean;
  formatted: string;
  severity: 'normal' | 'warning' | 'critical' | 'overdue';
} {
  const diff = Math.floor((new Date(bc.responseDeadline).getTime() - Date.now()) / 60000);
  if (diff <= 0) {
    return { minutes: Math.abs(diff), isOverdue: true, formatted: `${Math.abs(diff)}m overdue`, severity: 'overdue' };
  }
  const severity: 'normal' | 'warning' | 'critical' = diff <= 5 ? 'critical' : diff <= 15 ? 'warning' : 'normal';
  if (diff < 60) return { minutes: diff, isOverdue: false, formatted: `${diff}m`, severity };
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return { minutes: diff, isOverdue: false, formatted: `${h}h ${m}m`, severity };
}

export function generateMockBookingConfirmations(): BookingConfirmation[] {
  const now = Date.now();
  const min = 60 * 1000;
  const mk = (
    id: string,
    candidateId: string,
    candidateName: string,
    urgency: ShiftUrgency,
    submittedMinutesAgo: number,
    status: BookingConfirmationStatus = 'awaiting_centre',
    overrides: Partial<BookingConfirmation> = {},
  ): BookingConfirmation => {
    const sla = getResponseSlaMinutes(urgency);
    const submittedAt = new Date(now - submittedMinutesAgo * min);
    return {
      id,
      submissionId: `sub-${id}`,
      shiftRequestId: 'shift-101',
      candidateId,
      candidateName,
      agencyId: 'agency-1',
      agencyName: 'Elite Childcare Staffing',
      centreId: 'centre-1',
      centreName: 'Sunshine Early Learning',
      roleName: 'Early Childhood Educator',
      shiftDate: new Date(now + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      shiftStartTime: '07:00',
      shiftEndTime: '15:00',
      submittedAt: submittedAt.toISOString(),
      responseDeadline: new Date(submittedAt.getTime() + sla * min).toISOString(),
      responseSlaMinutes: sla,
      autoConfirmOnExpiry: false,
      status,
      remindersSent: submittedMinutesAgo > 15 ? 1 : 0,
      ...overrides,
    };
  };

  return [
    mk('bc-1', 'cand-1', 'Sarah Mitchell', 'critical', 8),
    mk('bc-2', 'cand-2', 'James Wong', 'urgent', 22),
    mk('bc-3', 'cand-3', 'Emily Chen', 'standard', 12, 'preview_scheduled', {
      previewScheduledAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      previewMode: 'video',
      previewNotes: '15-min intro call',
    }),
    mk('bc-4', 'cand-4', 'Michael Brown', 'urgent', 35, 'confirmed', {
      decidedAt: new Date(now - 5 * min).toISOString(),
      decidedBy: 'Centre Director',
    }),
    mk('bc-5', 'cand-5', 'Lisa Taylor', 'standard', 90, 'rejected', {
      decidedAt: new Date(now - 30 * min).toISOString(),
      decidedBy: 'Centre Director',
      rejectionReason: 'Rate above ceiling',
      rejectionCategory: 'rate',
    }),
  ];
}
