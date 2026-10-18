import { useSyncExternalStore } from 'react';
import type { Dispatch, SetStateAction } from 'react';

const stores = new Map<string, ReturnType<typeof createBrowserState<any>>>();
export function createBrowserState<T>(key: string, initial: T) {
  const read = (): T => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : structuredClone(initial); }
    catch { return structuredClone(initial); }
  };
  let value = read();
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(fn => fn());
  if (typeof window !== 'undefined') window.addEventListener('storage', e => {
    if (e.key === key || e.key === null) { value = read(); emit(); }
  });
  return {
    get: () => value,
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; },
    set: (next: SetStateAction<T>) => {
      const updated = typeof next === 'function' ? (next as (old: T) => T)(value) : next;
      // Do not report success when browser saving fails.
      localStorage.setItem(key, JSON.stringify(updated));
      value = updated;
      emit();
    },
  };
}
export function useBrowserState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  let store = stores.get(key);
  if (!store) { store = createBrowserState(key, initial); stores.set(key, store); }
  const value = useSyncExternalStore(store.subscribe, store.get, store.get) as T;
  return [value, store.set];
}