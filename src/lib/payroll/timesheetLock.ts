/**
 * Timesheet lock-back.
 *
 * Once a pay run is approved, the timesheets it priced are locked so they
 * cannot be edited, re-approved or picked up by a second pay run. Unlocking
 * or reversing the run releases them again. Locks record which run holds them
 * so the timesheet UI can explain why an entry is read-only.
 */

import { useSyncExternalStore } from 'react';

export interface TimesheetLock {
  timesheetId: string;
  runId: string;
  runName: string;
  lockedAt: string;
}

const KEY = 'payroll:timesheetLocks';

function load(): TimesheetLock[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as TimesheetLock[];
  } catch {/* noop */}
  return [];
}

let locks: TimesheetLock[] = load();
let snapshot = locks;
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(locks)); } catch {/* noop */}
  snapshot = locks;
  listeners.forEach((fn) => fn());
}

export const timesheetLockStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  getSnapshot() { return snapshot; },
  all(): TimesheetLock[] { return locks; },
  lockFor(timesheetId: string): TimesheetLock | undefined {
    return locks.find((l) => l.timesheetId === timesheetId);
  },
  isLocked(timesheetId: string) { return locks.some((l) => l.timesheetId === timesheetId); },
  /** Lock every timesheet referenced by a run. Returns how many were locked. */
  lockForRun(runId: string, runName: string, timesheetIds: string[]): number {
    const lockedAt = new Date().toISOString();
    const existing = new Set(locks.filter((l) => l.runId !== runId).map((l) => l.timesheetId));
    const next = timesheetIds
      .filter((id, i, arr) => id && arr.indexOf(id) === i && !existing.has(id))
      .map((timesheetId) => ({ timesheetId, runId, runName, lockedAt }));
    locks = [...locks.filter((l) => l.runId !== runId), ...next];
    persist();
    return next.length;
  },
  releaseRun(runId: string): number {
    const before = locks.length;
    locks = locks.filter((l) => l.runId !== runId);
    if (locks.length !== before) persist();
    return before - locks.length;
  },
  /** Timesheets already claimed by another run — used to block double payment. */
  conflictsWith(runId: string, timesheetIds: string[]): TimesheetLock[] {
    return locks.filter((l) => l.runId !== runId && timesheetIds.includes(l.timesheetId));
  },
};

export function useTimesheetLocks() {
  return useSyncExternalStore(timesheetLockStore.subscribe, timesheetLockStore.getSnapshot, timesheetLockStore.getSnapshot);
}
