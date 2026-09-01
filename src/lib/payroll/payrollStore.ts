import { useSyncExternalStore } from 'react';
import {
  AccountingConnection,
  AccountingPlatform,
  PayRun,
  PayRunExportRecord,
  PayrollSettings,
  defaultMappings,
  defaultPayrollSettings,
} from '@/types/payroll';

/**
 * localStorage-backed payroll store (mock mode).
 * Mirrors the pattern used by timesheetPolicyStore.
 */

const RUNS_KEY = 'payroll:runs';
const SETTINGS_KEY = 'payroll:settings';
const CONN_KEY = 'payroll:connections';

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

const listeners = new Set<() => void>();
let snapshot = { runs, settings, connections };

function persist() {
  try {
    localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(CONN_KEY, JSON.stringify(connections));
  } catch {/* noop */}
  snapshot = { runs, settings, connections };
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
    if (idx >= 0) runs[idx] = run;
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
    runs[idx] = { ...runs[idx], ...patch };
    persist();
  },
  recordExport(runId: string, record: PayRunExportRecord) {
    const idx = runs.findIndex((r) => r.id === runId);
    if (idx < 0) return;
    runs[idx] = { ...runs[idx], exports: [record, ...(runs[idx].exports ?? [])] };
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
