import { useEffect, useState } from 'react';
import { PlanTier } from '@/types/plans';

/**
 * Central upgrade-promotion layer.
 *
 * Anywhere in the app can call `upgradePrompt.open({...})` when a user bumps
 * into a plan wall. A single <UpgradeDialog /> listens and renders the offer,
 * and every touch point is logged so the demand for each locked capability can
 * be reported back to sales.
 */

export interface UpgradeContext {
  /** Tier that unlocks the thing the user just tried to use. */
  needs: PlanTier;
  /** Human label of what was blocked, e.g. "Agency partners — Approve". */
  feature: string;
  /** Where the prompt fired from (matrix cell, banner, role sheet...). */
  source: string;
  moduleId?: string;
  /** Seats prefilled into checkout when the user continues. */
  seats?: number;
  /** Billing cycle prefilled into checkout when the user continues. */
  cycle?: 'monthly' | 'annual';
}


export interface UpgradeInterestEvent extends UpgradeContext {
  at: string;
  type: 'viewed' | 'requested';
}

const LOG_KEY = 'rai.upgrade.interest.v1';

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());

let current: UpgradeContext | null = null;

function readLog(): UpgradeInterestEvent[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? '[]') as UpgradeInterestEvent[];
  } catch {
    return [];
  }
}

function writeLog(events: UpgradeInterestEvent[]) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(events.slice(-200)));
  } catch {
    /* ignore quota */
  }
  emit();
}

export const upgradePrompt = {
  get: () => current,

  open: (ctx: UpgradeContext) => {
    current = ctx;
    writeLog([...readLog(), { ...ctx, at: new Date().toISOString(), type: 'viewed' }]);
    emit();
  },

  close: () => {
    current = null;
    emit();
  },

  /** Called when the user actually asks for the upgrade. */
  requestUpgrade: (ctx: UpgradeContext) => {
    writeLog([...readLog(), { ...ctx, at: new Date().toISOString(), type: 'requested' }]);
  },

  getInterest: readLog,

  clearInterest: () => writeLog([]),

  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useUpgradePrompt() {
  const [, force] = useState(0);
  useEffect(() => upgradePrompt.subscribe(() => force(n => n + 1)), []);
  return { context: upgradePrompt.get(), interest: upgradePrompt.getInterest() };
}
