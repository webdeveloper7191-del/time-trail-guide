import { useSyncExternalStore } from 'react';
import {
  AccountingConnection,
  AccountingPlatform,
  EmployeeTaxProfile,
  PayRun,
  PayRunAuditEvent,
  PayRunExportRecord,
  PayrollSettings,
  PayCalendar,
  StandingDeduction,
  StpSettings,
  defaultMappings,
  defaultPayCalendars,
  defaultPayrollSettings,
  defaultStpSettings,
} from '@/types/payroll';
import { timesheetLockStore } from './timesheetLock';
import { applyLeaveForRun, reverseLeaveForRun } from './leaveIntegration';

/**
 * localStorage-backed payroll store (mock mode).
 * Mirrors the pattern used by timesheetPolicyStore.
 */

const RUNS_KEY = 'payroll:runs';
const SETTINGS_KEY = 'payroll:settings';
const CONN_KEY = 'payroll:connections';
const CALENDARS_KEY = 'payroll:calendars';
const STP_KEY = 'payroll:stp';
const DEDUCTIONS_KEY = 'payroll:deductions';
const TAX_KEY = 'payroll:taxProfiles';

const platforms: AccountingPlatform[] = ['xero', 'myob', 'quickbooks'];

function defaultConnections(): Record<AccountingPlatform, AccountingConnection> {
  return platforms.reduce((acc, p) => {
    acc[p] = {
      platform: p,
      connected: false,
      exportMode: 'journal',
      mappings: defaultMappings(p),
    };
    return acc;
  }, {} as Record<AccountingPlatform, AccountingConnection>);
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {/* noop */}
  return fallback;
}

let runs: PayRun[] = load<PayRun[]>(RUNS_KEY, []);
let settings: PayrollSettings = { ...defaultPayrollSettings, ...load<Partial<PayrollSettings>>(SETTINGS_KEY, {}) };
let connections: Record<AccountingPlatform, AccountingConnection> = {
  ...defaultConnections(),
  ...load<Partial<Record<AccountingPlatform, AccountingConnection>>>(CONN_KEY, {}),
} as Record<AccountingPlatform, AccountingConnection>;

let calendars: PayCalendar[] = load<PayCalendar[]>(CALENDARS_KEY, defaultPayCalendars);
let stp: StpSettings = { ...defaultStpSettings, ...load<Partial<StpSettings>>(STP_KEY, {}) };
let deductions: StandingDeduction[] = load<StandingDeduction[]>(DEDUCTIONS_KEY, []);
let taxProfiles: EmployeeTaxProfile[] = load<EmployeeTaxProfile[]>(TAX_KEY, []);

const listeners = new Set<() => void>();
let snapshot = { runs, settings, connections, calendars, stp, deductions, taxProfiles };

/** Cloud mirroring (audit retention) — best effort, never blocks the UI. */
let cloudTimer: ReturnType<typeof setTimeout> | undefined;
let cloudEnabled = true;
function mirrorToCloud() {
  if (!cloudEnabled || runs.length === 0) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => {
    import('./payrollCloud')
      .then((m) => m.pushCloudRuns(runs))
      .catch((err) => {
        cloudEnabled = false;
        console.warn('Pay run cloud sync unavailable; using local storage only.', err);
      });
  }, 600);
}

function persist() {
  try {
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(CONN_KEY, JSON.stringify(connections));
    localStorage.setItem(CALENDARS_KEY, JSON.stringify(calendars));
    localStorage.setItem(STP_KEY, JSON.stringify(stp));
    localStorage.setItem(DEDUCTIONS_KEY, JSON.stringify(deductions));
    localStorage.setItem(TAX_KEY, JSON.stringify(taxProfiles));
  } catch {/* noop */}
  snapshot = { runs, settings, connections, calendars, stp, deductions, taxProfiles };
  listeners.forEach((fn) => fn());
  mirrorToCloud();
}

/** Release timesheet locks and roll back leave postings held by a run. */
function releaseRunSideEffects(runId: string) {
  try { timesheetLockStore.releaseRun(runId); } catch {/* noop */}
  try { reverseLeaveForRun(runId); } catch {/* noop */}
}

function auditEvent(action: PayRunAuditEvent['action'], detail?: string): PayRunAuditEvent {
  return { id: crypto.randomUUID(), at: new Date().toISOString(), action, detail };
}

export const payrollStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  getSnapshot() {
    return snapshot;
  },

  // --- Pay runs -------------------------------------------------------
  getRuns(): PayRun[] {
    return runs;
  },
  getRun(id: string): PayRun | undefined {
    return runs.find((r) => r.id === id);
  },
  saveRun(run: PayRun) {
    const idx = runs.findIndex((r) => r.id === run.id);
    if (idx >= 0) runs = runs.map((r) => (r.id === run.id ? run : r));
    else runs = [run, ...runs];
    persist();
  },
  deleteRun(id: string) {
    releaseRunSideEffects(id);
    runs = runs.filter((r) => r.id !== id);
    persist();
    import('./payrollCloud').then((m) => m.deleteCloudRun(id)).catch(() => {/* offline */});
  },
  /**
   * Pull retained pay runs from the cloud archive and merge them in.
   * Cloud wins for runs that exist in both places (posted/locked/reversed
   * state is the audit source of truth).
   */
  async hydrateFromCloud(): Promise<number> {
    const { fetchCloudRuns } = await import('./payrollCloud');
    const cloudRuns = await fetchCloudRuns();
    if (cloudRuns.length === 0) return 0;
    const byId = new Map(runs.map((r) => [r.id, r] as const));
    cloudRuns.forEach((r) => { if (r?.id) byId.set(r.id, r); });
    runs = Array.from(byId.values());
    persist();
    return cloudRuns.length;
  },
  updateRun(id: string, patch: Partial<PayRun>) {
    const idx = runs.findIndex((r) => r.id === id);
    if (idx < 0) return;
    runs = runs.map((r) => (r.id === id ? { ...r, ...patch } : r));
    persist();
  },
  recordExport(runId: string, record: PayRunExportRecord) {
    const idx = runs.findIndex((r) => r.id === runId);
    if (idx < 0) return;
    runs = runs.map((r) => (r.id === runId ? { ...r, exports: [record, ...(r.exports ?? [])] } : r));
    persist();
  },

  // --- Audit, lock and reversal ---------------------------------------
  addAudit(runId: string, action: PayRunAuditEvent['action'], detail?: string) {
    runs = runs.map((r) =>
      r.id === runId ? { ...r, auditTrail: [auditEvent(action, detail), ...(r.auditTrail ?? [])] } : r,
    );
    persist();
  },
  /**
   * Approve a run (checker step of maker-checker):
   *  - blocks self-approval when segregation of duties is required
   *  - locks the source timesheets back so they cannot be re-edited or re-paid
   *  - posts leave accruals and drawdowns to the leave ledger
   */
  approveRun(runId: string, approver: string): { ok: boolean; message: string } {
    const run = runs.find((r) => r.id === runId);
    if (!run) return { ok: false, message: 'Pay run not found.' };
    const name = approver.trim();
    if (settings.requireApproverName && !name) {
      return { ok: false, message: 'An approver name is required for the audit trail.' };
    }
    const maker = (run.createdBy ?? run.submittedBy ?? '').trim().toLowerCase();
    if (settings.requireSeparateApprover && maker && maker === name.toLowerCase()) {
      return { ok: false, message: `Segregation of duties: ${run.createdBy} created this run and cannot approve it.` };
    }

    const now = new Date().toISOString();
    const timesheetIds = run.lines.filter((l) => !l.excluded).flatMap((l) => l.timesheetIds ?? []);
    const notes: string[] = [];

    let lockedIds: string[] = [];
    if (settings.lockTimesheetsOnApproval && timesheetIds.length) {
      const conflicts = timesheetLockStore.conflictsWith(runId, timesheetIds);
      if (conflicts.length) {
        return {
          ok: false,
          message: `${conflicts.length} timesheet(s) are already locked by ${conflicts[0].runName}. Reverse or unlock that run first.`,
        };
      }
      const count = timesheetLockStore.lockForRun(runId, run.name, timesheetIds);
      lockedIds = Array.from(new Set(timesheetIds));
      notes.push(`${count} timesheet(s) locked back`);
    }

    let leaveAppliedAt: string | undefined;
    try {
      const result = applyLeaveForRun(run, settings);
      leaveAppliedAt = now;
      notes.push(`leave ledger updated (+${result.accruedHours}h accrued, ${result.drawnHours}h taken)`);
      if (result.warnings.length) notes.push(`${result.warnings.length} leave warning(s)`);
    } catch (err) {
      console.warn('Leave integration failed for pay run', runId, err);
    }

    runs = runs.map((r) =>
      r.id === runId
        ? {
            ...r,
            status: 'approved' as const,
            approvedAt: now,
            approvedBy: name || undefined,
            leaveAppliedAt,
            lockedTimesheetIds: lockedIds.length ? lockedIds : r.lockedTimesheetIds,
            auditTrail: [
              auditEvent('approved', `Approved by ${name || 'unnamed operator'}${notes.length ? ` — ${notes.join('; ')}` : ''}.`),
              ...(r.auditTrail ?? []),
            ],
          }
        : r,
    );
    persist();
    return { ok: true, message: `Approved by ${name}${notes.length ? ` — ${notes.join('; ')}.` : '.'}` };
  },

  /** Post a run and lock it against further edits. */
  postAndLock(runId: string) {
    const now = new Date().toISOString();
    runs = runs.map((r) =>
      r.id === runId
        ? {
            ...r,
            status: 'posted' as const,
            postedAt: now,
            locked: true,
            auditTrail: [auditEvent('posted', 'Run posted and locked.'), ...(r.auditTrail ?? [])],
          }
        : r,
    );
    persist();
  },
  /** Unlock a posted run so corrections can be made; keeps the audit trail. */
  unlockRun(runId: string, reason: string) {
    const now = new Date().toISOString();
    releaseRunSideEffects(runId);
    runs = runs.map((r) =>
      r.id === runId
        ? {
            ...r,
            locked: false,
            status: 'approved' as const,
            unlockedAt: now,
            unlockReason: reason,
            leaveAppliedAt: undefined,
            auditTrail: [auditEvent('unlocked', `${reason} — timesheet locks released and leave postings rolled back.`), ...(r.auditTrail ?? [])],
          }
        : r,
    );
    persist();
  },
  /**
   * Reverse a posted run: creates a mirrored negative run for the ledger and
   * marks the original as reversed. Nothing is deleted — audit retention.
   */
  reverseRun(runId: string, reason: string): PayRun | undefined {
    const original = runs.find((r) => r.id === runId);
    if (!original) return undefined;
    releaseRunSideEffects(runId);
    const now = new Date().toISOString();
    const negate = (n: number) => Math.round(-n * 100) / 100;
    const reversal: PayRun = {
      ...original,
      id: `PR-REV-${Date.now().toString(36).toUpperCase()}`,
      name: `Reversal — ${original.name}`,
      status: 'posted',
      createdAt: now,
      postedAt: now,
      locked: true,
      reversalOfRunId: original.id,
      notes: reason,
      exports: [],
      payslipsPublishedAt: undefined,
      lines: original.lines.map((l) => ({
        ...l,
        grossPay: negate(l.grossPay),
        taxableGross: negate(l.taxableGross),
        paygTax: negate(l.paygTax),
        superGuarantee: negate(l.superGuarantee),
        deductions: negate(l.deductions),
        netPay: negate(l.netPay),
        components: l.components.map((c) => ({ ...c, amount: negate(c.amount), lumpSumTax: c.lumpSumTax ? negate(c.lumpSumTax) : undefined })),
      })),
      totals: {
        ...original.totals,
        grossPay: negate(original.totals.grossPay),
        paygTax: negate(original.totals.paygTax),
        superGuarantee: negate(original.totals.superGuarantee),
        deductions: negate(original.totals.deductions),
        netPay: negate(original.totals.netPay),
      },
      auditTrail: [auditEvent('reversed', `Reversal of ${original.id}: ${reason}`)],
    };
    runs = [
      reversal,
      ...runs.map((r) =>
        r.id === runId
          ? {
              ...r,
              reversedAt: now,
              reversedByRunId: reversal.id,
              locked: true,
              auditTrail: [auditEvent('reversed', reason), ...(r.auditTrail ?? [])],
            }
          : r,
      ),
    ];
    persist();
    return reversal;
  },

  // --- Employee tax declarations --------------------------------------
  getTaxProfiles(): EmployeeTaxProfile[] {
    return taxProfiles;
  },
  getTaxProfile(staffId: string, staffRecordId?: string): EmployeeTaxProfile | undefined {
    return taxProfiles.find((p) => p.staffId === staffId || (staffRecordId && p.staffId === staffRecordId));
  },
  saveTaxProfile(profile: EmployeeTaxProfile) {
    const next = { ...profile, updatedAt: new Date().toISOString() };
    taxProfiles = taxProfiles.some((p) => p.staffId === profile.staffId)
      ? taxProfiles.map((p) => (p.staffId === profile.staffId ? next : p))
      : [...taxProfiles, next];
    persist();
  },
  deleteTaxProfile(staffId: string) {
    taxProfiles = taxProfiles.filter((p) => p.staffId !== staffId);
    persist();
  },


  // --- Settings -------------------------------------------------------
  getSettings(): PayrollSettings {
    return settings;
  },
  updateSettings(patch: Partial<PayrollSettings>) {
    settings = { ...settings, ...patch };
    persist();
  },

  // --- Pay calendars --------------------------------------------------
  getCalendars(): PayCalendar[] {
    return calendars;
  },
  getCalendar(id?: string): PayCalendar | undefined {
    if (id) return calendars.find((c) => c.id === id);
    return calendars.find((c) => c.isDefault && c.active) ?? calendars.find((c) => c.active) ?? calendars[0];
  },
  saveCalendar(calendar: PayCalendar) {
    const idx = calendars.findIndex((c) => c.id === calendar.id);
    if (idx >= 0) calendars = calendars.map((c) => (c.id === calendar.id ? calendar : c));
    else calendars = [...calendars, calendar];
    if (calendar.isDefault) {
      calendars = calendars.map((c) => (c.id === calendar.id ? c : { ...c, isDefault: false }));
      settings = { ...settings, defaultCalendarId: calendar.id };
    }
    persist();
  },
  deleteCalendar(id: string) {
    calendars = calendars.filter((c) => c.id !== id);
    if (settings.defaultCalendarId === id) settings = { ...settings, defaultCalendarId: calendars[0]?.id };
    persist();
  },

  // --- STP Phase 2 -----------------------------------------------------
  getStpSettings(): StpSettings {
    return stp;
  },
  updateStpSettings(patch: Partial<StpSettings>) {
    stp = { ...stp, ...patch };
    persist();
  },

  // --- Standing deductions & salary sacrifice --------------------------
  getDeductions(): StandingDeduction[] {
    return deductions;
  },
  /** Deductions that apply to a given employee (empty staffIds = everyone). */
  getDeductionsForStaff(staffId: string, staffRecordId?: string): StandingDeduction[] {
    return deductions.filter(
      (d) => d.active && (!d.staffIds.length || d.staffIds.includes(staffId) || (staffRecordId ? d.staffIds.includes(staffRecordId) : false)),
    );
  },
  saveDeduction(deduction: StandingDeduction) {
    const idx = deductions.findIndex((d) => d.id === deduction.id);
    if (idx >= 0) deductions[idx] = deduction;
    else deductions = [...deductions, deduction];
    persist();
  },
  deleteDeduction(id: string) {
    deductions = deductions.filter((d) => d.id !== id);
    persist();
  },

  // --- Accounting connections ----------------------------------------
  getConnections(): AccountingConnection[] {
    return platforms.map((p) => connections[p]);
  },
  getConnection(platform: AccountingPlatform): AccountingConnection {
    return connections[platform];
  },
  updateConnection(platform: AccountingPlatform, patch: Partial<AccountingConnection>) {
    connections = { ...connections, [platform]: { ...connections[platform], ...patch } };
    persist();
  },
  updateMapping(platform: AccountingPlatform, key: string, patch: Partial<{ accountCode: string; taxCode: string; trackingCategory: string }>) {
    const conn = connections[platform];
    const mappings = conn.mappings.map((m) => (m.key === key ? { ...m, ...patch } : m));
    connections = { ...connections, [platform]: { ...conn, mappings } };
    persist();
  },
  resetMappings(platform: AccountingPlatform) {
    connections = { ...connections, [platform]: { ...connections[platform], mappings: defaultMappings(platform) } };
    persist();
  },
};

export function usePayroll() {
  return useSyncExternalStore(payrollStore.subscribe, payrollStore.getSnapshot, payrollStore.getSnapshot);
}
