import { useEffect, useState } from 'react';
import { PlanTier, PLANS, PlanLimits } from '@/types/plans';
import { permissionsStore } from '@/lib/permissionsStore';
import { planStore } from '@/lib/planStore';
import { mockStaff } from '@/data/mockStaffData';
import { getAllLocationLinks } from '@/data/locationCentreMapping';

/**
 * Plan limit validation.
 *
 * Every plan ships hard limits (Free is capped at 3 staff and 1 location).
 * Those caps are enforced everywhere the tenant grows — but sales and support
 * need an escape hatch, so each limit can carry a documented override with an
 * owner, a reason and an optional expiry.
 */

export type LimitKey = keyof PlanLimits;

export const LIMIT_KEYS: LimitKey[] = ['staff', 'locations', 'customRoles', 'apiCredentials'];

export const LIMIT_LABEL: Record<LimitKey, string> = {
  staff: 'Staff',
  locations: 'Locations',
  customRoles: 'Custom roles',
  apiCredentials: 'API credentials',
};

export interface LimitOverride {
  /** `null` = unlimited. */
  value: number | null;
  reason: string;
  approvedBy?: string;
  /** ISO date; the override lapses after this day. */
  expiresOn?: string;
}

export type LimitOverrides = Partial<Record<LimitKey, LimitOverride>>;

export interface PlanUsage {
  staff: number;
  locations: number;
  customRoles: number;
  apiCredentials: number;
}

export interface LimitCheck {
  key: LimitKey;
  label: string;
  used: number;
  /** Limit actually applied (after overrides). `null` = unlimited. */
  limit: number | null;
  /** The plan's shipped limit, before any override. */
  planLimit: number | null;
  overridden: boolean;
  override?: LimitOverride;
  status: 'ok' | 'near' | 'breach';
  /** Seats/records that must be removed (or the override raised) to comply. */
  excess: number;
}

export interface PlanValidation {
  tier: PlanTier;
  checks: LimitCheck[];
  breaches: LimitCheck[];
  ok: boolean;
}

const isLive = (o: LimitOverride | undefined, at: Date) =>
  !!o && (!o.expiresOn || new Date(`${o.expiresOn}T23:59:59`).getTime() >= at.getTime());

/** Limits in force for a tier once live overrides are applied. */
export function effectiveLimits(
  tier: PlanTier,
  overrides: LimitOverrides = {},
  at: Date = new Date(),
): PlanLimits {
  const base = PLANS[tier].limits;
  const out = { ...base };
  for (const key of LIMIT_KEYS) {
    const o = overrides[key];
    if (isLive(o, at)) out[key] = o!.value;
  }
  return out;
}

/** Validate usage against a tier. Returns a check per limit plus the breaches. */
export function validatePlanLimits(
  tier: PlanTier,
  usage: PlanUsage,
  overrides: LimitOverrides = {},
  at: Date = new Date(),
): PlanValidation {
  const base = PLANS[tier].limits;
  const checks = LIMIT_KEYS.map<LimitCheck>(key => {
    const o = overrides[key];
    const live = isLive(o, at);
    const limit = live ? o!.value : base[key];
    const used = usage[key] ?? 0;
    const excess = limit === null ? 0 : Math.max(0, used - limit);
    const status: LimitCheck['status'] =
      limit === null ? 'ok' : excess > 0 ? 'breach' : used >= limit * 0.8 ? 'near' : 'ok';
    return {
      key,
      label: LIMIT_LABEL[key],
      used,
      limit,
      planLimit: base[key],
      overridden: live && o!.value !== base[key],
      override: live ? o : undefined,
      status,
      excess,
    };
  });
  const breaches = checks.filter(c => c.status === 'breach');
  return { tier, checks, breaches, ok: breaches.length === 0 };
}

/** Max seats that can be bought on a tier (after overrides). `null` = unlimited. */
export const seatCeiling = (tier: PlanTier, overrides: LimitOverrides = {}) =>
  effectiveLimits(tier, overrides).staff;

/* ------------------------------------------------------------------ */
/* Tenant's own overrides (this workspace)                              */
/* ------------------------------------------------------------------ */

const KEY = 'rai.plan.limit.overrides.v1';

let cached: LimitOverrides | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function read(): LimitOverrides {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    cached = raw ? (JSON.parse(raw) as LimitOverrides) : {};
  } catch {
    cached = {};
  }
  return cached;
}

function write(next: LimitOverrides) {
  cached = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  emit();
}

export const planLimitStore = {
  all: read,
  set: (key: LimitKey, override: LimitOverride) => write({ ...read(), [key]: override }),
  clear: (key: LimitKey) => {
    const next = { ...read() };
    delete next[key];
    write(next);
  },
  replace: (next: LimitOverrides) => write(next),
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

/** Live usage for the current workspace. */
export function currentUsage(): PlanUsage {
  let locations = 1;
  try {
    locations = new Set(getAllLocationLinks().map(l => l.locationId)).size || 1;
  } catch {
    /* ignore */
  }
  const customRoles = permissionsStore.getRoles().filter(r => !r.system).length;
  return {
    staff: mockStaff.length,
    locations,
    customRoles,
    apiCredentials: 0,
  };
}

export function usePlanLimits() {
  const [, force] = useState(0);
  useEffect(() => {
    const a = planLimitStore.subscribe(() => force(n => n + 1));
    const b = planStore.subscribe(() => force(n => n + 1));
    const c = permissionsStore.subscribe(() => force(n => n + 1));
    return () => {
      a();
      b();
      c();
    };
  }, []);
  const tier = planStore.getTier();
  const overrides = planLimitStore.all();
  const usage = currentUsage();
  return {
    tier,
    usage,
    overrides,
    limits: effectiveLimits(tier, overrides),
    validation: validatePlanLimits(tier, usage, overrides),
    /** Would this tier hold today's usage? */
    validateFor: (t: PlanTier) => validatePlanLimits(t, usage, overrides),
    setOverride: planLimitStore.set,
    clearOverride: planLimitStore.clear,
  };
}
