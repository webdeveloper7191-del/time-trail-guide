import { useSyncExternalStore, useMemo } from 'react';
import {
  performanceTaxonomyStore,
  type PerformanceRules,
  type TaxonomyKey,
  type TaxonomyOption,
} from '@/lib/performanceTaxonomyStore';

function useTaxonomyState() {
  return useSyncExternalStore(
    cb => performanceTaxonomyStore.subscribe(cb),
    () => performanceTaxonomyStore.get(),
    () => performanceTaxonomyStore.get(),
  );
}

/** Tenant-configured rules for the Performance module. */
export function usePerformanceRules(): PerformanceRules {
  return useTaxonomyState().rules;
}

/** Active options for a taxonomy list. */
export function useTaxonomy(key: TaxonomyKey): TaxonomyOption[] {
  const state = useTaxonomyState();
  return useMemo(() => (state.taxonomies[key] ?? []).filter(o => o.isActive), [state, key]);
}

/** Active options shaped for Select components. */
export function useTaxonomyOptions(key: TaxonomyKey): { value: string; label: string }[] {
  const list = useTaxonomy(key);
  return useMemo(() => list.map(o => ({ value: o.id, label: o.label })), [list]);
}

export function useNineBoxCells() {
  return useTaxonomyState().nineBox;
}
