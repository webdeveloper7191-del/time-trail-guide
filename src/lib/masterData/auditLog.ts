/**
 * Generic audit log for all Master Data edits.
 * Every create / update / archive / delete on a master list appends here.
 * Non-effective-dated model: history is preserved in the log, not on the record.
 */
import { useEffect, useState } from 'react';

export type MasterAuditAction = 'create' | 'update' | 'archive' | 'restore' | 'delete';

export interface MasterAuditEntry {
  id: string;
  masterKey: string;          // e.g. 'positions', 'employmentTypes'
  itemId: string;
  itemLabel: string;
  action: MasterAuditAction;
  actor: string;              // user display name
  timestamp: string;          // ISO
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  note?: string;
}

const STORAGE_KEY = 'rai.masterData.auditLog';
const MAX_ENTRIES = 500;

function load(): MasterAuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

let entries: MasterAuditEntry[] = load();
const listeners = new Set<(e: MasterAuditEntry[]) => void>();

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch {}
  listeners.forEach(fn => fn(entries));
}

export function logMasterChange(entry: Omit<MasterAuditEntry, 'id' | 'timestamp' | 'actor'> & { actor?: string }) {
  const full: MasterAuditEntry = {
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    actor: entry.actor ?? 'Current User',
    ...entry,
  };
  entries = [full, ...entries].slice(0, MAX_ENTRIES);
  persist();
}

export function getAuditLog(masterKey?: string, itemId?: string): MasterAuditEntry[] {
  return entries.filter(e =>
    (!masterKey || e.masterKey === masterKey) &&
    (!itemId || e.itemId === itemId)
  );
}

export function useAuditLog(masterKey?: string, itemId?: string) {
  const [list, setList] = useState(() => getAuditLog(masterKey, itemId));
  useEffect(() => {
    const fn = () => setList(getAuditLog(masterKey, itemId));
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, [masterKey, itemId]);
  return list;
}
