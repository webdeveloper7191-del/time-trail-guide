/**
 * Shared store for employment types, scoped per award.
 *
 * Every FWC award defines its own coverage of employment types
 * (e.g. casual loading, part-time minimum hours). We therefore store
 * employment types keyed by awardId, so each award can rename its
 * defaults or add award-specific custom types (e.g. Apprentice Year 3,
 * Trainee, Fixed-term) without affecting other awards.
 *
 * A reserved `__global__` awardId holds organisation-wide types that
 * apply when no award-specific configuration exists.
 */
import { useEffect, useState } from 'react';
import type { EmploymentType } from '@/types/staff';
import { australianAwards } from '@/data/australianAwards';

export const GLOBAL_AWARD_ID = '__global__';

export interface EmploymentTypeOption {
  id: string;
  /** Display label shown to users */
  name: string;
  /** Short code for payroll exports */
  code: string;
  /** Underlying base type used by payroll/award engine */
  baseType: EmploymentType;
  /** True for seeded system entries — can be renamed but not deleted */
  isSystem: boolean;
  /** Optional casual loading % override (only meaningful for casual base) */
  loadingPercent?: number;
  accruesLeave: boolean;
  overtimeEligible: boolean;
  description?: string;
}

const STORAGE_KEY = 'rai.awards.employmentTypesByAward';
const LEGACY_KEY = 'rai.awards.employmentTypes';

function seedFor(awardId: string): EmploymentTypeOption[] {
  const award = australianAwards.find(a => a.id === awardId);
  const casualLoading = award?.casualLoading ?? 25;
  return [
    { id: `${awardId}-ft`,  name: 'Full Time',  code: 'FT',  baseType: 'full_time',  isSystem: true, accruesLeave: true,  overtimeEligible: true },
    { id: `${awardId}-pt`,  name: 'Part Time',  code: 'PT',  baseType: 'part_time',  isSystem: true, accruesLeave: true,  overtimeEligible: true },
    { id: `${awardId}-cas`, name: 'Casual',     code: 'CAS', baseType: 'casual',     isSystem: true, accruesLeave: false, overtimeEligible: true, loadingPercent: casualLoading },
    { id: `${awardId}-con`, name: 'Contractor', code: 'CON', baseType: 'contractor', isSystem: true, accruesLeave: false, overtimeEligible: false },
  ];
}

type Store = Record<string, EmploymentTypeOption[]>;

function load(): Store {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    // migrate legacy single-list store into the global bucket
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as EmploymentTypeOption[];
      return { [GLOBAL_AWARD_ID]: parsed };
    }
  } catch {}
  return {};
}

let store: Store = load();
const listeners = new Set<(s: Store) => void>();

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {}
  listeners.forEach(fn => fn(store));
}

export function getEmploymentTypesFor(awardId: string): EmploymentTypeOption[] {
  if (!store[awardId]) {
    store[awardId] = seedFor(awardId);
    persist();
  }
  return store[awardId];
}

export function setEmploymentTypesFor(awardId: string, types: EmploymentTypeOption[]) {
  store = { ...store, [awardId]: types };
  persist();
}

/**
 * Legacy/global accessor. Returns the global bucket; falls back to seeded
 * defaults for the reserved global id when nothing has been stored yet.
 */
export function getEmploymentTypes(): EmploymentTypeOption[] {
  return getEmploymentTypesFor(GLOBAL_AWARD_ID);
}

/**
 * React hook scoped to a single award.
 * Pass GLOBAL_AWARD_ID (or omit) for the cross-award default list.
 */
export function useEmploymentTypes(
  awardId: string = GLOBAL_AWARD_ID
): [EmploymentTypeOption[], (t: EmploymentTypeOption[]) => void] {
  const [types, setTypes] = useState<EmploymentTypeOption[]>(() => getEmploymentTypesFor(awardId));

  useEffect(() => {
    setTypes(getEmploymentTypesFor(awardId));
    const fn = (s: Store) => setTypes(s[awardId] ?? []);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, [awardId]);

  return [types, (t) => setEmploymentTypesFor(awardId, t)];
}
