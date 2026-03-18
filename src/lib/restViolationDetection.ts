import { Shift } from '@/types/roster';
import { CallbackEvent } from '@/components/roster/CallbackEventLoggingPanel';

export interface RestViolation {
  callbackEventId: string;
  staffId: string;
  staffName: string;
  callbackEndTime: string;
  nextShiftDate: string;
  nextShiftStartTime: string;
  gapHours: number;
  requiredRestHours: number;
}

/**
 * Checks if a callback event's end time leaves insufficient rest
 * before the staff member's next scheduled shift (10-hour minimum).
 */
export function detectRestViolation(
  event: CallbackEvent,
  allShifts: Shift[],
  requiredRestHours: number = 10
): RestViolation | null {
  if (!event.workEndTime) return null;

  const endTime = new Date(event.workEndTime);
  
  // Find the staff member's next shift after the callback end time
  const staffShifts = allShifts
    .filter(s => s.staffId === event.staffId && !s.isAbsent)
    .map(s => {
      const shiftStart = new Date(`${s.date}T${s.startTime}`);
      return { shift: s, startTime: shiftStart };
    })
    .filter(({ startTime }) => startTime.getTime() > endTime.getTime())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  if (staffShifts.length === 0) return null;

  const nextShift = staffShifts[0];
  const gapMs = nextShift.startTime.getTime() - endTime.getTime();
  const gapHours = gapMs / (1000 * 60 * 60);

  if (gapHours < requiredRestHours) {
    return {
      callbackEventId: event.id,
      staffId: event.staffId,
      staffName: event.staffName,
      callbackEndTime: event.workEndTime,
      nextShiftDate: nextShift.shift.date,
      nextShiftStartTime: nextShift.shift.startTime,
      gapHours: Math.round(gapHours * 10) / 10,
      requiredRestHours,
    };
  }

  return null;
}

/**
 * Annotate callback events with rest violation info.
 * Returns events with `restViolation` property attached.
 */
export function annotateRestViolations(
  events: CallbackEvent[],
  allShifts: Shift[],
  requiredRestHours: number = 10
): (CallbackEvent & { restViolation?: RestViolation })[] {
  return events.map(event => {
    const violation = detectRestViolation(event, allShifts, requiredRestHours);
    return violation ? { ...event, restViolation: violation } : event;
  });
}
