import { useEffect, useState } from 'react';
import { PlanTier, PLANS, PlanLimits } from '@/types/plans';

const PLAN_KEY = 'rai.subscription.plan.v1';

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());

let cached: PlanTier | null = null;

function readTier(): PlanTier {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(PLAN_KEY) as PlanTier | null;
    cached = raw && raw in PLANS ? raw : 'growth';
  } catch {
    cached = 'growth';
  }
  return cached;
}

export const planStore = {
  getTier: readTier,
  setTier: (tier: PlanTier) => {
    cached = tier;
    try {
      localStorage.setItem(PLAN_KEY, tier);
    } catch {
      /* ignore */
    }
    emit();
  },
  getLimits: (): PlanLimits => PLANS[readTier()].limits,
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function usePlan() {
  const [, force] = useState(0);
  useEffect(() => planStore.subscribe(() => force(n => n + 1)), []);
  const tier = planStore.getTier();
  return { tier, plan: PLANS[tier], limits: PLANS[tier].limits, setTier: planStore.setTier };
}
