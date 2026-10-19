import { describe, it, expect } from 'vitest';
import { filterDashboardTimesheets, periodBounds } from './dashboardData';
import type { Timesheet } from '@/types/timesheet';

const record = { id: 'one', employee: { id: 'staff-a', email: 'a@example.com' }, location: { id: 'loc-a' }, entries: [
  { date: '2026-10-18', netHours: 5, overtime: 1 },
  { date: '2026-10-19', netHours: 8, overtime: 2 },
], totalHours: 13, overtimeHours: 3 } as Timesheet;
describe('dashboard record scoping', () => {
  it('sums only entries inside the selected week', () => {
    const result=filterDashboardTimesheets([record],'week',undefined,undefined,new Date('2026-10-19T12:00:00'));
    expect(result[0].totalHours).toBe(8);
    expect(result[0].overtimeHours).toBe(2);
  });
  it('does not include other locations',()=>expect(filterDashboardTimesheets([record],'all','loc-b')).toEqual([]));
  it('does not include other employees',()=>expect(filterDashboardTimesheets([record],'all',undefined,'b@example.com')).toEqual([]));
  it('retains recorded totals for all periods',()=>expect(filterDashboardTimesheets([record],'all')[0].totalHours).toBe(13));
  it('uses a 30-day inclusive range',()=>expect(periodBounds('month',new Date('2026-10-19T12:00:00'))).toEqual({start:'2026-09-20',end:'2026-10-19'}));
});