import { describe, it, expect } from 'vitest';
import { unscheduledClockRecords, type ScheduleClockRecord } from './employeeSchedule';

const record: ScheduleClockRecord = {
  id: 'clock-1', date: '2026-10-12', clockIn: '09:00', clockOut: '17:00',
  location: 'Main Location', status: 'pending', breaks: [], totalBreakMinutes: 0,
  grossHours: 8, netHours: 8, overtime: 0,
};
const shift = { id: 'shift-1', date: new Date(2026, 9, 12), location: 'Main Location', status: 'confirmed' };

describe('Unrostered clock entries in My Schedule', () => {
  it('includes a clock-in and clock-out entry when no shift is rostered', () => {
    expect(unscheduledClockRecords([record], [])).toEqual([record]);
  });
  it('includes clock entries still in progress without inventing an end time', () => {
    const active = { ...record, clockOut: null };
    expect(unscheduledClockRecords([active], [ { ...shift, date: new Date(2026, 9, 13) } ])).toEqual([active]);
  });
  it('does not duplicate a clock record on a rostered day at the same location', () => {
    expect(unscheduledClockRecords([{ ...record, clockIn: '09:15' }], [shift])).toEqual([]);
  });
  it('keeps clock records at another location separate', () => {
    expect(unscheduledClockRecords([record], [{ ...shift, location: 'North Location' }])).toEqual([record]);
  });
  it('honours explicit shift links rather than unrelated shifts on the same day', () => {
    const linked = { ...record, shiftId: 'shift-2' };
    expect(unscheduledClockRecords([linked], [shift])).toEqual([linked]);
    expect(unscheduledClockRecords([linked], [shift, { ...shift, id: 'shift-2' }])).toEqual([]);
  });
});