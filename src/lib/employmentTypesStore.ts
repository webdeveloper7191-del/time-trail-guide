/**
 * Shared store for employment types.
 * The 4 system defaults (full_time, part_time, casual, contractor) map to the
 * underlying EmploymentType enum used by payroll/award logic. Their display
 * names can be renamed. Custom types can be added but must map to a base type
 * so downstream payroll rules (loading %, overtime eligibility, leave) continue
 * to resolve.
 */
import { useEffect, useState } from 'react';
import type { EmploymentType } from '@/types/staff';

export interface EmploymentTypeOption {
  id: string;
  /** Display label shown to users */
  name: string;
  /** Short code for payroll exports */
  code: string;
  /** Underlying base type used by payroll/award engine */
  baseType: EmploymentType;
  /** True for the 4 seeded system entries — can be renamed but not deleted */
  isSystem: boolean;
  /** Optional casual loading % override (only meaningful for casual base) */
  loadingPercent?: number;
  accruesLeave: boolean;
  overtimeEligible: boolean;
  description?: string;
}

const STORAGE_KEY = 'rai.awards.employmentTypes';

const defaults: EmploymentTypeOption[] = [
  { id: 'sys-full-time', name: 'Full Time', code: 'FT', baseType: 'full_time', isSystem: true, accruesLeave: true, overtimeEligible: true },
  { id: 'sys-part-time', name: 'Part Time', code: 'PT', baseType: 'part_time', isSystem: true, accruesLeave: true, overtimeEligible: true },
  { id: 'sys-casual',    name: 'Casual',    code: 'CAS', baseType: 'casual',    isSystem: true, accruesLeave: false, overtimeEligible: true, loadingPercent: 25 },
  { id: 'sys-contractor',name: 'Contractor',code: 'CON', baseType: 'contractor',isSystem: true, accruesLeave: false, overtimeEligible: false },
];

function load(): EmploymentTypeOption[] {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaults;
}

let current: EmploymentTypeOption[] = load();
const listeners = new Set<(types: EmploymentTypeOption[]) => void>();

export function getEmploymentTypes(): EmploymentTypeOption[] {
  return current;
}

export function setEmploymentTypesStore(types: EmploymentTypeOption[]) {
  current = types;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(types)); } catch {}
  listeners.forEach(fn => fn(types));
}

export function useEmploymentTypes(): [EmploymentTypeOption[], (t: EmploymentTypeOption[]) => void] {
  const [types, setTypes] = useState<EmploymentTypeOption[]>(current);
  useEffect(() => {
    const fn = (next: EmploymentTypeOption[]) => setTypes(next);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return [types, setEmploymentTypesStore];
}
