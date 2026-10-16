/**
 * Shared timesheet store. Timesheet admin edits/approves here and payroll
 * reads from here, so an approval immediately makes the timesheet available
 * to the next pay run. Saved in this browser (localStorage) and synced across tabs.
 */
import { useEffect, useState, useCallback } from 'react';
import type { Timesheet } from '@/types/timesheet';
import { mockTimesheets } from '@/data/mockTimesheets';

const KEY = 'rostered.timesheets.v1';
const listeners = new Set<() => void>();

function load(): Timesheet[] {
  if (typeof window === 'undefined') return mockTimesheets;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Timesheet[];
  } catch { /* ignore */ }
  return mockTimesheets;
}

let current: Timesheet[] = load();

function emit() { listeners.forEach((fn) => fn()); }

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { current = load(); emit(); }
  });
}

export const timesheetStore = {
  getAll: (): Timesheet[] => current,
  getApproved: (): Timesheet[] => current.filter((t) => t.status === 'approved'),
  set(next: Timesheet[] | ((prev: Timesheet[]) => Timesheet[])) {
    current = typeof next === 'function' ? (next as (p: Timesheet[]) => Timesheet[])(current) : next;
    try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* quota */ }
    emit();
  },
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  reset() { this.set(mockTimesheets); },
};

/** Drop-in replacement for useState<Timesheet[]> backed by the shared store. */
export function useTimesheetsState(): [Timesheet[], (next: Timesheet[] | ((prev: Timesheet[]) => Timesheet[])) => void] {
  const [list, setList] = useState(current);
  useEffect(() => timesheetStore.subscribe(() => setList(current)), []);
  const setter = useCallback((next: Timesheet[] | ((prev: Timesheet[]) => Timesheet[])) => timesheetStore.set(next), []);
  return [list, setter];
}

export function useTimesheets(): Timesheet[] {
  return useTimesheetsState()[0];
}
