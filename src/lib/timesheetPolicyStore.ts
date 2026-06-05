import {
  TimesheetPolicy,
  TimesheetPolicyOverride,
  defaultTimesheetPolicy,
} from '@/types/timesheetPolicy';

/**
 * In-memory store for tenant policy + per-location overrides.
 * Persists to localStorage so settings survive reloads in mock mode.
 */

const TENANT_KEY = 'tsPolicy:tenant';
const LOC_KEY = 'tsPolicy:locations';

type LocationOverridesMap = Record<string, TimesheetPolicyOverride>;

let tenantPolicy: TimesheetPolicy = loadTenant();
let locationOverrides: LocationOverridesMap = loadLocations();
const listeners = new Set<() => void>();
const snapshotCache = new Map<string, TimesheetPolicy>();

function cacheKey(locationId?: string) { return locationId ?? '__tenant__'; }
function invalidateSnapshots() { snapshotCache.clear(); }

function loadTenant(): TimesheetPolicy {
  try {
    const raw = localStorage.getItem(TENANT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return mergePolicy(defaultTimesheetPolicy, parsed);
    }
  } catch {/* noop */}
  return structuredClone(defaultTimesheetPolicy);
}

function loadLocations(): LocationOverridesMap {
  try {
    const raw = localStorage.getItem(LOC_KEY);
    if (raw) return JSON.parse(raw);
  } catch {/* noop */}
  return {};
}

function persist() {
  try {
    localStorage.setItem(TENANT_KEY, JSON.stringify(tenantPolicy));
    localStorage.setItem(LOC_KEY, JSON.stringify(locationOverrides));
  } catch {/* noop */}
  invalidateSnapshots();
  listeners.forEach(fn => fn());
}

function mergePolicy(base: TimesheetPolicy, override?: TimesheetPolicyOverride): TimesheetPolicy {
  if (!override) return structuredClone(base);
  const out = structuredClone(base);
  (Object.keys(override) as (keyof TimesheetPolicy)[]).forEach(section => {
    const src = override[section];
    if (!src) return;
    Object.entries(src).forEach(([field, value]) => {
      if (value !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (out[section] as any)[field] = value;
      }
    });
  });
  return out;
}

export const timesheetPolicyStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  getTenantPolicy(): TimesheetPolicy {
    return tenantPolicy;
  },

  getLocationOverride(locationId: string): TimesheetPolicyOverride {
    return locationOverrides[locationId] ?? {};
  },

  /** Resolved policy — tenant defaults with location overrides applied. Cached. */
  getResolvedPolicy(locationId?: string): TimesheetPolicy {
    const key = cacheKey(locationId);
    const cached = snapshotCache.get(key);
    if (cached) return cached;
    const resolved = locationId
      ? mergePolicy(tenantPolicy, locationOverrides[locationId])
      : tenantPolicy;
    snapshotCache.set(key, resolved);
    return resolved;
  },

  setTenantField<S extends keyof TimesheetPolicy, F extends keyof TimesheetPolicy[S]>(
    section: S, field: F, value: TimesheetPolicy[S][F],
  ) {
    tenantPolicy = {
      ...tenantPolicy,
      [section]: { ...tenantPolicy[section], [field]: value },
    };
    persist();
  },

  setLocationOverride<S extends keyof TimesheetPolicy, F extends keyof TimesheetPolicy[S]>(
    locationId: string, section: S, field: F, value: TimesheetPolicy[S][F],
  ) {
    const existing = locationOverrides[locationId] ?? {};
    const sectionOverride = (existing[section] ?? {}) as Partial<TimesheetPolicy[S]>;
    locationOverrides = {
      ...locationOverrides,
      [locationId]: {
        ...existing,
        [section]: { ...sectionOverride, [field]: value },
      },
    };
    persist();
  },

  clearLocationField<S extends keyof TimesheetPolicy, F extends keyof TimesheetPolicy[S]>(
    locationId: string, section: S, field: F,
  ) {
    const existing = locationOverrides[locationId];
    if (!existing || !existing[section]) return;
    const sectionOverride = { ...(existing[section] as object) } as Record<string, unknown>;
    delete sectionOverride[field as string];
    locationOverrides = {
      ...locationOverrides,
      [locationId]: {
        ...existing,
        [section]: Object.keys(sectionOverride).length
          ? (sectionOverride as Partial<TimesheetPolicy[S]>)
          : undefined,
      },
    };
    persist();
  },

  resetLocation(locationId: string) {
    const next = { ...locationOverrides };
    delete next[locationId];
    locationOverrides = next;
    persist();
  },

  /** True if location has an explicit override for this field. */
  isOverridden<S extends keyof TimesheetPolicy, F extends keyof TimesheetPolicy[S]>(
    locationId: string, section: S, field: F,
  ): boolean {
    const ov = locationOverrides[locationId];
    if (!ov || !ov[section]) return false;
    return (ov[section] as Record<string, unknown>)[field as string] !== undefined;
  },
};

import { useSyncExternalStore } from 'react';

export function useTimesheetPolicy(locationId?: string): TimesheetPolicy {
  return useSyncExternalStore(
    timesheetPolicyStore.subscribe,
    () => timesheetPolicyStore.getResolvedPolicy(locationId),
  );
}
