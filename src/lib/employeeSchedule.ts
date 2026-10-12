import { isSameDay, parseISO } from 'date-fns';
import type { ClockEntry, TimesheetStatus } from '@/types/timesheet';

export interface ScheduleClockRecord extends ClockEntry {
  location: string;
  shiftId?: string;
  status: TimesheetStatus;
  sample?: boolean;
}

export interface ScheduledRecord {
  id: string;
  date: Date;
  location: string;
  status: string;
}

// Legacy clock records have no shift link: only classify days with no roster
// at that location. Do not infer an unrostered shift from a late clock-in.
export function unscheduledClockRecords(records: ScheduleClockRecord[], shifts: ScheduledRecord[]) {
  return records.filter(record => {
    if (!record.clockIn) return false;
    return !shifts.some(shift => shift.status !== 'rejected' && (
      record.shiftId
        ? shift.id === record.shiftId
        : isSameDay(shift.date, parseISO(record.date)) && shift.location === record.location
    ));
  });
}