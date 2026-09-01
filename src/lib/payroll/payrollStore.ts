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

const listeners = new Set<() => void>();
let snapshot = { runs, settings, connections, calendars, stp, deductions };

function persist() {
  try {
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(CONN_KEY, JSON.stringify(connections));
    localStorage.setItem(CALENDARS_KEY, JSON.stringify(calendars));
    localStorage.setItem(STP_KEY, JSON.stringify(stp));
    localStorage.setItem(DEDUCTIONS_KEY, JSON.stringify(deductions));
  } catch {/* noop */}
  snapshot = { runs, settings, connections, calendars, stp, deductions };
  listeners.forEach((fn) => fn());
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
    runs = runs.filter((r) => r.id !== id);
    persist();
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
