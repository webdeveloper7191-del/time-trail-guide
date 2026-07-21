/**
 * Generic factory for simple Master Data stores backed by localStorage.
 * Individual masters (leave types, shift types, allowance types, exception
 * reasons) share this shape and only differ by their `awardLogic` payload.
 */
import { useEffect, useState } from 'react';
import { logMasterChange } from './auditLog';
import type { MasterItem } from './types';

export interface SimpleMasterStore<T extends MasterItem> {
  MASTER_KEY: string;
  get: () => T[];
  use: () => T[];
  upsert: (item: T) => void;
  archive: (id: string) => void;
  restore: (id: string) => void;
  remove: (id: string) => boolean;
}

export function createMasterStore<T extends MasterItem>(opts: {
  masterKey: string;
  storageKey: string;
  seed: () => T[];
}): SimpleMasterStore<T> {
  const { masterKey, storageKey, seed } = opts;

  function load(): T[] {
    if (typeof window === 'undefined') return seed();
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return seed();
  }

  let current: T[] = load();
  const listeners = new Set<(items: T[]) => void>();

  const persist = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(current)); } catch {}
    listeners.forEach(fn => fn(current));
  };

  return {
    MASTER_KEY: masterKey,
    get: () => current,
    use: () => {
      const [list, setList] = useState(current);
      useEffect(() => {
        const fn = (items: T[]) => setList(items);
        listeners.add(fn);
        return () => { listeners.delete(fn); };
      }, []);
      return list;
    },
    upsert: (next: T) => {
      const existing = current.find(i => i.id === next.id);
      current = existing ? current.map(i => (i.id === next.id ? next : i)) : [...current, next];
      persist();
      logMasterChange({
        masterKey, itemId: next.id, itemLabel: next.label,
        action: existing ? 'update' : 'create',
        before: existing as unknown as Record<string, unknown>,
        after: next as unknown as Record<string, unknown>,
      });
    },
    archive: (id: string) => {
      const item = current.find(i => i.id === id);
      if (!item) return;
      current = current.map(i => (i.id === id ? { ...i, status: 'archived' as const } : i));
      persist();
      logMasterChange({ masterKey, itemId: id, itemLabel: item.label, action: 'archive' });
    },
    restore: (id: string) => {
      const item = current.find(i => i.id === id);
      if (!item) return;
      current = current.map(i => (i.id === id ? { ...i, status: 'active' as const } : i));
      persist();
      logMasterChange({ masterKey, itemId: id, itemLabel: item.label, action: 'restore' });
    },
    remove: (id: string) => {
      const item = current.find(i => i.id === id);
      if (!item || item.isSystemDefault || (item.usageCount ?? 0) > 0) return false;
      current = current.filter(i => i.id !== id);
      persist();
      logMasterChange({ masterKey, itemId: id, itemLabel: item.label, action: 'delete' });
      return true;
    },
  };
}
