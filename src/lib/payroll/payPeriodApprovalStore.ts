import { useSyncExternalStore } from 'react';
import { PayPeriodApproval, PayPeriodApprovalStatus } from '@/types/payroll';
import { payrollStore } from './payrollStore';

/**
 * Pre-run pay period approvals (maker-checker before money is calculated).
 *
 * Payroll raises a request for a period; an authorised approver signs it off on
 * the Period approvals page. Only an approved, unconsumed request lets a pay run
 * be created for that period — and each approval can only be used once.
 */

const KEY = 'payroll:periodApprovals';

function load(): PayPeriodApproval[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as PayPeriodApproval[];
  } catch {/* noop */}
  return [];
}

let approvals: PayPeriodApproval[] = load();
const listeners = new Set<() => void>();
let snapshot: PayPeriodApproval[] = approvals;

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(approvals)); } catch {/* noop */}
  snapshot = [...approvals];
  listeners.forEach((l) => l());
}

const overlaps = (a: { periodStart: string; periodEnd: string }, start: string, end: string) =>
  a.periodStart <= end && a.periodEnd >= start;

export const payPeriodApprovalStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  getSnapshot: () => snapshot,

  all: () => [...approvals].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
  get: (id: string) => approvals.find((a) => a.id === id),

  byStatus: (status: PayPeriodApprovalStatus) => approvals.filter((a) => a.status === status),

  /** Pending request covering the period, if one is already in flight. */
  pendingFor(periodStart: string, periodEnd: string) {
    return approvals.find((a) => a.status === 'pending' && overlaps(a, periodStart, periodEnd));
  },

  /** An approved, unused sign-off that covers the requested period. */
  approvalFor(periodStart: string, periodEnd: string) {
    return approvals.find(
      (a) => a.status === 'approved' && !a.consumedByRunId
        && a.periodStart <= periodStart && a.periodEnd >= periodEnd,
    );
  },

  /** Gate used by pay run creation. */
  canCreateRun(periodStart: string, periodEnd: string): { ok: boolean; approval?: PayPeriodApproval; message: string } {
    if (!payrollStore.getSettings().requirePeriodApproval) {
      return { ok: true, message: 'Period approval is not required.' };
    }
    const approval = this.approvalFor(periodStart, periodEnd);
    if (approval) {
      return { ok: true, approval, message: `Approved by ${approval.decidedBy} on ${(approval.decidedAt || '').slice(0, 10)}.` };
    }
    const pending = this.pendingFor(periodStart, periodEnd);
    if (pending) return { ok: false, message: `Approval requested ${pending.requestedAt.slice(0, 10)} — awaiting sign-off.` };
    const rejected = approvals.find((a) => a.status === 'rejected' && overlaps(a, periodStart, periodEnd));
    if (rejected) return { ok: false, message: `A request for this period was rejected: ${rejected.decisionNote || 'no reason given'}.` };
    return { ok: false, message: 'This pay period has not been approved yet.' };
  },

  request(input: Omit<PayPeriodApproval, 'id' | 'status' | 'requestedAt'>): PayPeriodApproval {
    const approval: PayPeriodApproval = {
      ...input,
      id: `PPA-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    approvals = [approval, ...approvals];
    persist();
    return approval;
  },

  approve(id: string, approver: string, note?: string): { ok: boolean; message: string } {
    const a = approvals.find((x) => x.id === id);
    if (!a) return { ok: false, message: 'Approval request not found.' };
    if (a.status !== 'pending') return { ok: false, message: `This request is already ${a.status}.` };
    const name = approver.trim();
    const settings = payrollStore.getSettings();
    if (settings.requireApproverName && !name) return { ok: false, message: 'Enter the approver name.' };
    if (settings.requireSeparateApprover && name.toLowerCase() === a.requestedBy.trim().toLowerCase()) {
      return { ok: false, message: `Segregation of duties: ${a.requestedBy} raised this request and cannot approve it.` };
    }
    approvals = approvals.map((x) => (x.id === id
      ? { ...x, status: 'approved' as const, decidedBy: name || 'Approver', decidedAt: new Date().toISOString(), decisionNote: note }
      : x));
    persist();
    return { ok: true, message: 'Pay period approved — payroll can now create the run.' };
  },

  reject(id: string, approver: string, note: string): { ok: boolean; message: string } {
    const a = approvals.find((x) => x.id === id);
    if (!a) return { ok: false, message: 'Approval request not found.' };
    if (a.status !== 'pending') return { ok: false, message: `This request is already ${a.status}.` };
    if (!note.trim()) return { ok: false, message: 'Add a reason so payroll knows what to fix.' };
    approvals = approvals.map((x) => (x.id === id
      ? { ...x, status: 'rejected' as const, decidedBy: approver.trim() || 'Approver', decidedAt: new Date().toISOString(), decisionNote: note.trim() }
      : x));
    persist();
    return { ok: true, message: 'Request rejected and sent back to payroll.' };
  },

  withdraw(id: string) {
    approvals = approvals.map((x) => (x.id === id && x.status === 'pending' ? { ...x, status: 'withdrawn' as const } : x));
    persist();
  },

  /** Reopen a rejected/withdrawn request so payroll can resubmit it. */
  resubmit(id: string, requestedBy: string) {
    approvals = approvals.map((x) => (x.id === id && (x.status === 'rejected' || x.status === 'withdrawn')
      ? { ...x, status: 'pending' as const, requestedBy, requestedAt: new Date().toISOString(), decidedBy: undefined, decidedAt: undefined, decisionNote: undefined }
      : x));
    persist();
  },

  markConsumed(id: string, runId: string) {
    approvals = approvals.map((x) => (x.id === id ? { ...x, consumedByRunId: runId, consumedAt: new Date().toISOString() } : x));
    persist();
  },

  /** Release the approval when the run it produced is deleted. */
  releaseRun(runId: string) {
    approvals = approvals.map((x) => (x.consumedByRunId === runId ? { ...x, consumedByRunId: undefined, consumedAt: undefined } : x));
    persist();
  },

  remove(id: string) {
    approvals = approvals.filter((x) => x.id !== id);
    persist();
  },
};

export function usePayPeriodApprovals() {
  return useSyncExternalStore(payPeriodApprovalStore.subscribe, payPeriodApprovalStore.getSnapshot, payPeriodApprovalStore.getSnapshot);
}
