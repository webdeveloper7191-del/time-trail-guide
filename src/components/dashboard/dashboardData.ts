import { useSyncExternalStore } from 'react';
import { startOfWeek, endOfWeek, subWeeks, subDays, format } from 'date-fns';
import { useTimesheets } from '@/lib/timesheetStore';
import { lmsStore } from '@/lib/lmsStore';
import { recruitmentStore } from '@/lib/recruitmentStore';
import { payrollStore } from '@/lib/payroll/payrollStore';
import type { Timesheet } from '@/types/timesheet';

export type DashboardPeriod = 'week' | 'last-week' | 'month' | 'all';
export function periodBounds(period: DashboardPeriod, today = new Date()) {
  if (period === 'all') return null;
  const date = period === 'last-week' ? subWeeks(today, 1) : today;
  return {
    start: format(period === 'month' ? subDays(today, 29) : startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(period === 'month' ? today : endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  };
}
export function filterDashboardTimesheets(records: Timesheet[], period: DashboardPeriod, locationId?: string, employeeEmail?: string, today = new Date()) {
  const bounds = periodBounds(period, today);
  return records.filter(t => (!locationId || t.location.id === locationId) && (!employeeEmail || t.employee.email.toLowerCase() === employeeEmail.toLowerCase())).map(t => {
    if (!bounds) return t;
    const entries = t.entries.filter(e => e.date >= bounds.start && e.date <= bounds.end);
    return { ...t, entries, totalHours: entries.reduce((sum, e) => sum + e.netHours, 0), overtimeHours: entries.reduce((sum, e) => sum + e.overtime, 0) };
  }).filter(t => !bounds || t.entries.length > 0);
}
export function useDashboardData() {
  const timesheets = useTimesheets();
  const learning = useSyncExternalStore(lmsStore.subscribe, lmsStore.getSnapshot);
  const recruitment = useSyncExternalStore(recruitmentStore.subscribe, recruitmentStore.get);
  const payroll = useSyncExternalStore(payrollStore.subscribe, payrollStore.getSnapshot);
  return { timesheets, learning, recruitment, payroll };
}
export const money = (value: number) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value);
export const hours = (value: number) => `${Number(value.toFixed(1))}h`;