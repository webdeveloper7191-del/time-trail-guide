/**
 * Shared store for timesheet break rules.
 * Single source of truth: configured in Timesheet Settings → Breaks tab,
 * consumed by Shift Template editor (name dropdown) and compliance engine.
 */
import { useEffect, useState } from 'react';
import type { BreakRule } from '@/types/compliance';

const STORAGE_KEY = 'rai.timesheet.breakRules';

const defaultBreakRules: BreakRule[] = [
  { id: 'br-1', name: 'Lunch Break', minWorkHoursRequired: 6, breakDurationMinutes: 30, type: 'unpaid', isMandatory: true },
  { id: 'br-2', name: 'Morning Rest', minWorkHoursRequired: 4, breakDurationMinutes: 15, type: 'paid', isMandatory: false },
  { id: 'br-3', name: 'Afternoon Rest', minWorkHoursRequired: 8, breakDurationMinutes: 15, type: 'paid', isMandatory: false },
];

function load(): BreakRule[] {
  if (typeof window === 'undefined') return defaultBreakRules;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultBreakRules;
}

let current: BreakRule[] = load();
const listeners = new Set<(rules: BreakRule[]) => void>();

export function getBreakRules(): BreakRule[] {
  return current;
}

export function setBreakRulesStore(rules: BreakRule[]) {
  current = rules;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch {}
  listeners.forEach(fn => fn(rules));
}

/** React hook: subscribe to shared break rules. */
export function useBreakRules(): [BreakRule[], (rules: BreakRule[]) => void] {
  const [rules, setRules] = useState<BreakRule[]>(current);
  useEffect(() => {
    const fn = (next: BreakRule[]) => setRules(next);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return [rules, setBreakRulesStore];
}
