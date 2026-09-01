/**
 * Payroll leave balance ledger.
 *
 * Holds statutory paid-leave balances (annual, personal/carer's, long service)
 * per employee, accrued from paid ordinary hours in each pay run and drawn
 * down when leave is paid. RDO / ADO / TOIL balances stay in the roster-side
 * leave accrual engine — this module mirrors postings across to it so both
 * views agree.
 */

import { useSyncExternalStore } from 'react';
import { LeaveStore } from '@/lib/leaveAccrualEngine';

export type PayrollLeaveKind = 'annual' | 'personal' | 'lsl';

export interface LeaveLedgerEntry {
  id: string;
  staffId: string;
  staffName: string;
  kind: PayrollLeaveKind | 'RDO' | 'ADO' | 'TOIL';
  /** Positive = accrual, negative = leave taken / paid out. */
  hours: number;
  at: string;
  sourceRunId?: string;
  note: string;
}

const KEY = 'payroll:leaveLedger';

function load(): LeaveLedgerEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as LeaveLedgerEntry[];
  } catch {/* noop */}
  return [];
}

let ledger: LeaveLedgerEntry[] = load();
let snapshot: LeaveLedgerEntry[] = ledger;
const listeners = new Set<() => void>();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(ledger)); } catch {/* noop */}
  snapshot = ledger;
  listeners.forEach((fn) => fn());
}

export const leaveBalanceStore = {
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
  getSnapshot() { return snapshot; },
  getLedger(): LeaveLedgerEntry[] { return ledger; },
  entriesForRun(runId: string) { return ledger.filter((e) => e.sourceRunId === runId); },
  post(entries: Omit<LeaveLedgerEntry, 'id' | 'at'>[]) {
    if (!entries.length) return;
    const at = new Date().toISOString();
    ledger = [...entries.map((e) => ({ ...e, id: crypto.randomUUID(), at })), ...ledger];
    persist();
  },
  /** Remove every entry created by a run (used when a run is unlocked or reversed). */
  clearRun(runId: string) {
    const before = ledger.length;
    ledger = ledger.filter((e) => e.sourceRunId !== runId);
    if (ledger.length !== before) persist();
  },
  /** Balance in hours for one employee across all leave kinds. */
  balances(staffId: string): Record<string, number> {
    const totals: Record<string, number> = { annual: 0, personal: 0, lsl: 0 };
    ledger.filter((e) => e.staffId === staffId).forEach((e) => {
      totals[e.kind] = Math.round(((totals[e.kind] ?? 0) + e.hours) * 100) / 100;
    });
    const roster = LeaveStore.getStaffBalance(staffId);
    return { ...totals, RDO: roster.RDO, ADO: roster.ADO, TOIL: roster.TOIL };
  },
  /** Balances for every employee that has ledger activity. */
  allBalances(): { staffId: string; staffName: string; annual: number; personal: number; lsl: number }[] {
    const byStaff = new Map<string, { staffId: string; staffName: string; annual: number; personal: number; lsl: number }>();
    ledger.forEach((e) => {
      const row = byStaff.get(e.staffId) ?? { staffId: e.staffId, staffName: e.staffName, annual: 0, personal: 0, lsl: 0 };
      if (e.kind === 'annual' || e.kind === 'personal' || e.kind === 'lsl') {
        row[e.kind] = Math.round((row[e.kind] + e.hours) * 100) / 100;
      }
      byStaff.set(e.staffId, row);
    });
    return Array.from(byStaff.values()).sort((a, b) => a.staffName.localeCompare(b.staffName));
  },
};

export function useLeaveBalances() {
  return useSyncExternalStore(leaveBalanceStore.subscribe, leaveBalanceStore.getSnapshot, leaveBalanceStore.getSnapshot);
}
