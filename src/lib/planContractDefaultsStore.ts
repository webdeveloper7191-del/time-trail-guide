import { useEffect, useState } from 'react';
import { PlanTier, PLAN_ORDER } from '@/types/plans';
import { AnnualPriceTerms, defaultPriceTerms } from '@/lib/tenantAgreementStore';

/**
 * Subscription plan-level contract defaults.
 *
 * Every new agreement (and every renewal that has nothing to inherit) starts
 * from the term length and annual CPI/KPI price-change rules configured here
 * for the plan being sold, so renewals stay consistent with the plan policy.
 */
export interface PlanContractDefaults {
  /** Default contract term length in months. */
  termMonths: number;
  /** Default annual price movement / renewal rules. */
  priceTerms: AnnualPriceTerms;
  /** Default free-text terms placed on new paper for this plan. */
  termsNotes?: string;
}

export type PlanContractDefaultsMap = Record<PlanTier, PlanContractDefaults>;

const KEY = 'rai.platform.planContractDefaults.v1';

const seed = (): PlanContractDefaultsMap => ({
  free: {
    termMonths: 1,
    priceTerms: { basis: 'none', percent: 0, autoRenew: true, noticeDays: 0 },
    termsNotes: 'Free tier — month to month, no minimum commitment.',
  },
  essentials: {
    termMonths: 12,
    priceTerms: { basis: 'cpi', percent: 3.5, capPercent: 5, autoRenew: true, noticeDays: 30 },
  },
  growth: {
    termMonths: 12,
    priceTerms: { basis: 'cpi', percent: 3.5, capPercent: 5, autoRenew: true, noticeDays: 60 },
  },
  enterprise: {
    termMonths: 24,
    priceTerms: { basis: 'fixed', percent: 4, autoRenew: true, noticeDays: 90 },
    termsNotes: 'Enterprise terms — negotiated uplift reviewed at each anniversary.',
  },
});

type Listener = () => void;
const listeners = new Set<Listener>();

function load(): PlanContractDefaultsMap {
  const base = seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<PlanContractDefaultsMap>;
    for (const tier of PLAN_ORDER) {
      if (parsed[tier]) {
        base[tier] = {
          ...base[tier],
          ...parsed[tier],
          priceTerms: { ...base[tier].priceTerms, ...(parsed[tier]?.priceTerms ?? {}) },
        };
      }
    }
  } catch {
    /* ignore */
  }
  return base;
}

let defaults: PlanContractDefaultsMap = load();
let snapshot = defaults;

function emit() {
  snapshot = { ...defaults };
  try {
    localStorage.setItem(KEY, JSON.stringify(defaults));
  } catch {
    /* ignore */
  }
  listeners.forEach(l => l());
}

export const planContractDefaultsStore = {
  all: () => snapshot,
  get: (tier: PlanTier): PlanContractDefaults =>
    snapshot[tier] ?? { termMonths: 12, priceTerms: defaultPriceTerms() },
  update(tier: PlanTier, patch: Partial<PlanContractDefaults>) {
    defaults = {
      ...defaults,
      [tier]: {
        ...defaults[tier],
        ...patch,
        priceTerms: { ...defaults[tier].priceTerms, ...(patch.priceTerms ?? {}) },
      },
    };
    emit();
  },
  reset() {
    defaults = seed();
    emit();
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function usePlanContractDefaults() {
  const [, force] = useState(0);
  useEffect(() => planContractDefaultsStore.subscribe(() => force(n => n + 1)), []);
  return snapshot;
}
