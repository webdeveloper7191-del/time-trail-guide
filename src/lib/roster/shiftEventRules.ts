/** Which event kinds each shift type allows (single source for the Events tab). */
export type ShiftEventKind = 'callback' | 'sleepover' | 'split';

export const ALLOWED_EVENTS_BY_SHIFT_TYPE: Record<string, ShiftEventKind[]> = {
  regular: ['callback', 'split'],
  on_call: ['callback'],
  recall: ['callback'],
  sleepover: ['sleepover'],
  split: ['split'],
  broken: ['split'],
};

export function allowedEventsFor(shiftType?: string): ShiftEventKind[] {
  return ALLOWED_EVENTS_BY_SHIFT_TYPE[shiftType || 'regular'] ?? ['callback', 'split'];
}

/** An event belongs to a shift when its shiftId matches; legacy events without a shiftId fall back to staff + date. */
export function eventBelongsToShift(
  e: { shiftId?: string; staffId: string; date?: string },
  shift: { id: string; staffId?: string | null; date: string },
): boolean {
  if (e.shiftId) return e.shiftId === shift.id;
  return e.staffId === shift.staffId && e.date === shift.date;
}
