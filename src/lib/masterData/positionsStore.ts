/**
 * Positions / Job Titles master.
 * Each position optionally binds to an Award + Classification which is the
 * source of truth for its base rate. Renaming/archiving a position never
 * changes historical shift or timesheet records — the log preserves history.
 */
import { useEffect, useState } from 'react';
import { australianAwards } from '@/data/australianAwards';
import { mockPositions } from '@/data/mockPositions';
import { logMasterChange } from './auditLog';
import type { MasterItem } from './types';

export interface PositionMaster extends MasterItem {
  category?: string;
  /** Award binding for automatic base-rate resolution. */
  awardId?: string;
  classificationId?: string;
}

const STORAGE_KEY = 'rai.masterData.positions';
export const MASTER_KEY = 'positions';

function seed(): PositionMaster[] {
  return mockPositions.map((p, idx) => ({
    id: p.id,
    code: p.id.replace(/^pos-/, '').toUpperCase(),
    label: p.title,
    category: p.category,
    status: 'active',
    scope: 'tenant',
    isSystemDefault: idx < 4,
    usageCount: 0,
  }));
}

function load(): PositionMaster[] {
  if (typeof window === 'undefined') return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return seed();
}

let current: PositionMaster[] = load();
const listeners = new Set<(items: PositionMaster[]) => void>();

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch {}
  listeners.forEach(fn => fn(current));
}

export function getPositions(): PositionMaster[] {
  return current;
}

export function upsertPosition(next: PositionMaster) {
  const existing = current.find(p => p.id === next.id);
  current = existing
    ? current.map(p => (p.id === next.id ? next : p))
    : [...current, next];
  persist();
  logMasterChange({
    masterKey: MASTER_KEY,
    itemId: next.id,
    itemLabel: next.label,
    action: existing ? 'update' : 'create',
    before: existing as unknown as Record<string, unknown>,
    after: next as unknown as Record<string, unknown>,
  });
}

export function archivePosition(id: string) {
  const item = current.find(p => p.id === id);
  if (!item) return;
  current = current.map(p => (p.id === id ? { ...p, status: 'archived' as const } : p));
  persist();
  logMasterChange({
    masterKey: MASTER_KEY,
    itemId: id,
    itemLabel: item.label,
    action: 'archive',
  });
}

export function restorePosition(id: string) {
  const item = current.find(p => p.id === id);
  if (!item) return;
  current = current.map(p => (p.id === id ? { ...p, status: 'active' as const } : p));
  persist();
  logMasterChange({
    masterKey: MASTER_KEY,
    itemId: id,
    itemLabel: item.label,
    action: 'restore',
  });
}

export function deletePosition(id: string) {
  const item = current.find(p => p.id === id);
  if (!item || item.isSystemDefault || (item.usageCount ?? 0) > 0) return false;
  current = current.filter(p => p.id !== id);
  persist();
  logMasterChange({
    masterKey: MASTER_KEY,
    itemId: id,
    itemLabel: item.label,
    action: 'delete',
  });
  return true;
}

export function usePositions() {
  const [list, setList] = useState(current);
  useEffect(() => {
    const fn = (items: PositionMaster[]) => setList(items);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return list;
}

/** Resolve the linked award classification (if any) to display its base rate. */
export function resolvePositionRate(position: PositionMaster): { rate?: number; classificationLabel?: string; awardName?: string } {
  if (!position.awardId || !position.classificationId) return {};
  const award = australianAwards.find(a => a.id === position.awardId);
  const cls = award?.classifications.find(c => c.id === position.classificationId);
  return {
    rate: cls?.baseHourlyRate,
    classificationLabel: cls ? `${cls.level} — ${cls.description}` : undefined,
    awardName: award?.shortName ?? award?.name,
  };
}
