import { useEffect, useState } from 'react';
import { PlanTier, PLAN_ORDER } from '@/types/plans';

/**
 * Scheduled price book.
 *
 * Pricing is versioned: every revision has an `effectiveFrom` date and the
 * system always bills using the newest revision whose date has already passed.
 * Future-dated revisions are visible in the admin catalogue (and previewable)
 * but do not affect live pricing until their date arrives.
 */

export interface PriceRevision {
  id: string;
  /** ISO date (yyyy-mm-dd) the revision takes effect from, 00:00 local. */
  effectiveFrom: string;
  label: string;
  /** Per user, per month, billed monthly. */
  monthly: Record<PlanTier, number>;
  /** Per user, per month discount when billed annually. */
  annualDiscount: Record<PlanTier, number>;
}

const KEY = 'rai.pricing.schedule.v1';

export const BASE_REVISION: PriceRevision = {
  id: 'base',
  effectiveFrom: '2020-01-01',
  label: 'Current price book',
  monthly: { free: 0, essentials: 6, growth: 9, enterprise: 12 },
  annualDiscount: { free: 0, essentials: 1, growth: 1.5, enterprise: 2.5 },
};

let cached: PriceRevision[] | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

const sortByDate = (revs: PriceRevision[]) =>
  [...revs].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));

function read(): PriceRevision[] {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    const stored = raw ? (JSON.parse(raw) as PriceRevision[]) : [];
    cached = sortByDate([BASE_REVISION, ...stored.filter(r => r.id !== 'base')]);
  } catch {
    cached = [BASE_REVISION];
  }
  return cached;
}

function write(next: PriceRevision[]) {
  cached = sortByDate(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(cached.filter(r => r.id !== 'base')));
  } catch {
    /* ignore */
  }
  emit();
}

const startOfDay = (iso: string) => new Date(`${iso}T00:00:00`).getTime();

/** The revision in force at `at` (defaults to now). */
export function activeRevision(at: Date = new Date()): PriceRevision {
  const revs = read().filter(r => startOfDay(r.effectiveFrom) <= at.getTime());
  return revs[revs.length - 1] ?? BASE_REVISION;
}

/** Revisions that have not taken effect yet, soonest first. */
export function upcomingRevisions(at: Date = new Date()): PriceRevision[] {
  return read().filter(r => startOfDay(r.effectiveFrom) > at.getTime());
}

export const pricingSchedule = {
  all: read,
  active: activeRevision,
  upcoming: upcomingRevisions,
  save: (rev: PriceRevision) => {
    const rest = read().filter(r => r.id !== rev.id);
    write([...rest, rev]);
  },
  remove: (id: string) => {
    if (id === 'base') return;
    write(read().filter(r => r.id !== id));
  },
  /** New revision seeded from whatever is in force today. */
  draft: (): PriceRevision => {
    const base = activeRevision();
    const from = new Date();
    from.setMonth(from.getMonth() + 1);
    from.setDate(1);
    return {
      id: `rev_${Math.random().toString(36).slice(2, 9)}`,
      effectiveFrom: from.toISOString().slice(0, 10),
      label: 'Scheduled price change',
      monthly: { ...base.monthly },
      annualDiscount: { ...base.annualDiscount },
    };
  },
  tiers: PLAN_ORDER,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function usePricingSchedule() {
  const [, force] = useState(0);
  useEffect(() => pricingSchedule.subscribe(() => force(n => n + 1)), []);
  return {
    revisions: read(),
    active: activeRevision(),
    upcoming: upcomingRevisions(),
  };
}
