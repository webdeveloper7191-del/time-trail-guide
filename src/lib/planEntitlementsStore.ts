import { useEffect, useState } from 'react';
import { PermissionAction, PERMISSION_MODULES, getSubPermissions, subKey } from '@/types/permissions';
import {
  PLAN_ORDER,
  PlanEntitlementMatrix,
  PlanTier,
  buildDefaultEntitlements,
  moduleActionUniverse,
  planRank,
  subActionUniverse,
} from '@/types/plans';

const KEY = 'rai.plan.entitlements.v2';

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());

let cache: PlanEntitlementMatrix | null = null;

function load(): PlanEntitlementMatrix {
  if (cache) return cache;
  const defaults = buildDefaultEntitlements();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlanEntitlementMatrix>;
      // Merge so new modules shipped later still get their baseline.
      cache = PLAN_ORDER.reduce((acc, t) => {
        acc[t] = { ...defaults[t], ...(parsed[t] ?? {}) };
        return acc;
      }, {} as PlanEntitlementMatrix);
      return cache;
    }
  } catch {
    /* fall through to defaults */
  }
  cache = defaults;
  return cache;
}

function persist(next: PlanEntitlementMatrix) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  emit();
}

const uniq = (a: PermissionAction[]) => [...new Set(a)];

/**
 * Plans are cumulative: anything included in a lower tier must also be
 * included in every higher tier. These helpers keep that invariant whenever a
 * cell is edited.
 */
function applyKey(
  matrix: PlanEntitlementMatrix,
  tier: PlanTier,
  key: string,
  actions: PermissionAction[],
  universe: PermissionAction[],
) {
  const next: PlanEntitlementMatrix = PLAN_ORDER.reduce((acc, t) => {
    acc[t] = { ...matrix[t] };
    return acc;
  }, {} as PlanEntitlementMatrix);

  next[tier][key] = universe.filter(a => actions.includes(a));

  for (const t of PLAN_ORDER) {
    if (planRank(t) > planRank(tier)) {
      // Higher tiers inherit everything this tier now includes.
      next[t][key] = universe.filter(
        a => next[tier][key].includes(a) || (next[t][key] ?? []).includes(a),
      );
    } else if (planRank(t) < planRank(tier)) {
      // Lower tiers can never include more than this tier.
      next[t][key] = (next[t][key] ?? []).filter(a => next[tier][key].includes(a));
    }
  }
  return next;
}

export const planEntitlementsStore = {
  get: load,

  /** Toggle one action of a module for one plan (cascades to sub-permissions). */
  toggleModuleAction: (tier: PlanTier, moduleId: string, action: PermissionAction) => {
    const matrix = load();
    const universe = moduleActionUniverse(moduleId);
    const current = matrix[tier][moduleId] ?? [];
    const has = current.includes(action);
    let nextActions = has ? current.filter(a => a !== action) : uniq([...current, action]);
    if (!has && action !== 'view' && universe.includes('view')) {
      nextActions = uniq(['view' as PermissionAction, ...nextActions]);
    }
    if (has && action === 'view') nextActions = [];

    let next = applyKey(matrix, tier, moduleId, nextActions, universe);

    // Children can never exceed the parent module.
    for (const sub of getSubPermissions(moduleId)) {
      const key = subKey(moduleId, sub.id);
      const subUniverse = subActionUniverse(moduleId, sub.id);
      const subCurrent = (next[tier][key] ?? []).filter(a => nextActions.includes(a));
      const subNext =
        !has && subUniverse.includes(action)
          ? uniq([
              ...subCurrent,
              action,
              ...(action !== 'view' && subUniverse.includes('view')
                ? (['view'] as PermissionAction[])
                : []),
            ])
          : subCurrent;
      next = applyKey(next, tier, key, subNext, subUniverse);
    }
    persist(next);
  },

  /** Toggle one action of a sub-permission for one plan (implies the parent). */
  toggleSubAction: (
    tier: PlanTier,
    moduleId: string,
    subId: string,
    action: PermissionAction,
  ) => {
    const matrix = load();
    const key = subKey(moduleId, subId);
    const universe = subActionUniverse(moduleId, subId);
    const current = matrix[tier][key] ?? [];
    const has = current.includes(action);
    let nextActions = has ? current.filter(a => a !== action) : uniq([...current, action]);
    if (!has && action !== 'view' && universe.includes('view')) {
      nextActions = uniq(['view' as PermissionAction, ...nextActions]);
    }
    if (has && action === 'view') nextActions = [];

    let next = applyKey(matrix, tier, key, nextActions, universe);
    if (!has) {
      const parentUniverse = moduleActionUniverse(moduleId);
      const parentNext = uniq([...(next[tier][moduleId] ?? []), ...nextActions]).filter(a =>
        parentUniverse.includes(a),
      );
      next = applyKey(next, tier, moduleId, parentNext, parentUniverse);
    }
    persist(next);
  },

  /** Set every action of a module (and its sub-permissions) for one plan. */
  setModule: (tier: PlanTier, moduleId: string, on: boolean) => {
    const universe = moduleActionUniverse(moduleId);
    let next = applyKey(load(), tier, moduleId, on ? universe : [], universe);
    for (const sub of getSubPermissions(moduleId)) {
      const subUniverse = subActionUniverse(moduleId, sub.id);
      next = applyKey(next, tier, subKey(moduleId, sub.id), on ? subUniverse : [], subUniverse);
    }
    persist(next);
  },

  setSub: (tier: PlanTier, moduleId: string, subId: string, on: boolean) => {
    const universe = subActionUniverse(moduleId, subId);
    let next = applyKey(load(), tier, subKey(moduleId, subId), on ? universe : [], universe);
    if (on) {
      const parentUniverse = moduleActionUniverse(moduleId);
      const parentNext = uniq([...(next[tier][moduleId] ?? []), ...universe]).filter(a =>
        parentUniverse.includes(a),
      );
      next = applyKey(next, tier, moduleId, parentNext, parentUniverse);
    }
    persist(next);
  },

  /** Turn a single action on/off for a module across every plan tier. */
  setActionForAllTiers: (moduleId: string, action: PermissionAction, on: boolean) => {
    let next = load();
    for (const t of PLAN_ORDER) {
      const universe = moduleActionUniverse(moduleId);
      if (!universe.includes(action)) continue;
      const current = next[t][moduleId] ?? [];
      const actions = on ? uniq([...current, action]) : current.filter(a => a !== action);
      next = applyKey(next, t, moduleId, actions, universe);
    }
    persist(next);
  },

  resetToDefaults: () => persist(buildDefaultEntitlements()),

  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function usePlanEntitlements() {
  const [, force] = useState(0);
  useEffect(() => planEntitlementsStore.subscribe(() => force(n => n + 1)), []);
  return planEntitlementsStore.get();
}

/* ------------------------------------------------------------------ */
/* Lookups used by the permission layer and the UI                      */
/* ------------------------------------------------------------------ */

export const planModuleActions = (tier: PlanTier, moduleId: string): PermissionAction[] =>
  load()[tier]?.[moduleId] ?? [];

export const planSubActions = (
  tier: PlanTier,
  moduleId: string,
  subId: string,
): PermissionAction[] => load()[tier]?.[subKey(moduleId, subId)] ?? [];

export const planAllows = (tier: PlanTier, moduleId: string, action: PermissionAction) =>
  planModuleActions(tier, moduleId).includes(action);

export const planAllowsSub = (
  tier: PlanTier,
  moduleId: string,
  subId: string,
  action: PermissionAction,
) => planSubActions(tier, moduleId, subId).includes(action);

/** Lowest tier that unlocks a module action — `null` when nothing unlocks it. */
export function requiredTier(moduleId: string, action: PermissionAction): PlanTier | null {
  for (const t of PLAN_ORDER) if (planAllows(t, moduleId, action)) return t;
  return null;
}

export function requiredSubTier(
  moduleId: string,
  subId: string,
  action: PermissionAction,
): PlanTier | null {
  for (const t of PLAN_ORDER) if (planAllowsSub(t, moduleId, subId, action)) return t;
  return null;
}

/** Lowest tier that unlocks a module at all (any action). */
export function requiredModuleTier(moduleId: string): PlanTier | null {
  for (const t of PLAN_ORDER) if (planModuleActions(t, moduleId).length) return t;
  return null;
}

/** Counts used by the plan comparison header. */
export function planCoverage(tier: PlanTier) {
  let granted = 0;
  let total = 0;
  for (const m of PERMISSION_MODULES) {
    total += m.actions.length;
    granted += planModuleActions(tier, m.id).length;
    for (const sub of getSubPermissions(m.id)) {
      total += sub.actions.length;
      granted += planSubActions(tier, m.id, sub.id).length;
    }
  }
  return { granted, total };
}
