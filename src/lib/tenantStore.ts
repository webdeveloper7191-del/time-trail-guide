import { useEffect, useState } from 'react';
import { PlanTier, PLAN_ORDER } from '@/types/plans';
import { BillingCycle } from '@/lib/billingStore';

/**
 * Platform-admin tenant (client) directory.
 *
 * Holds the organisations subscribed to the product plus any client-specific
 * pricing that overrides the standard price book for that tenant only.
 */

export type TenantStatus = 'active' | 'inactive' | 'trial' | 'suspended';

export interface TenantPricing {
  /** Per user, per month, billed monthly. Overrides the price book. */
  monthly: number;
  /** Per-user, per-month reduction when billed annually. */
  annualDiscount: number;
  /** ISO date the negotiated rate applies from. */
  effectiveFrom: string;
  /** Optional contract end (renegotiation) date. */
  expiresOn?: string;
  note?: string;
}

export interface Tenant {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  createdAt: string; // ISO date
  locations: number | null;
  staff: number;
  tags: string[];
  state: string | null;
  status: TenantStatus;
  plan: PlanTier;
  cycle: BillingCycle;
  seats: number;
  /** Negotiated rate for this client only. */
  customPricing?: TenantPricing;
  /** Documented lifts of the plan's hard limits for this client only. */
  limitOverrides?: LimitOverrides;
}

export const TENANT_STATUS_LABEL: Record<TenantStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  trial: 'Trial',
  suspended: 'Suspended',
};

const KEY = 'rai.platform.tenants.v1';

const STATES = ['VIC', 'NSW', 'QLD', 'SA', 'WA', 'ACT', 'TAS', 'NT', null];
const TAG_POOL = ['childcare', 'aged care', 'retail', 'hospitality', 'testing', 'pilot', 'enterprise'];
const FIRST = ['Krishna', 'Ankit', 'Rkte', 'Dfsdf', 'Test', 'Shivam', 'Ada', 'Piyush', 'Vivek', 'Mia', 'Noah', 'Aria', 'Leo', 'Zara', 'Omar'];
const LAST = ['Kotadiya', 'Sharma', 'Nguyen', 'Brown', 'Patel', 'Jha', 'Wilson', 'Chen', 'Ali', 'Rossi'];
const BIZ = ['Business', 'Digital', 'Care Group', 'Early Learning', 'Health Services', 'Logistics', 'Hospitality Group', 'Retail Co', 'Support Services'];

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

function seed(): Tenant[] {
  const out: Tenant[] = [];
  for (let i = 0; i < 64; i++) {
    const first = pick(FIRST, i * 3 + 1);
    const last = pick(LAST, i * 5 + 2);
    const created = new Date(2025, i % 12, ((i * 7) % 27) + 1);
    const hasLocations = i % 3 !== 0;
    out.push({
      id: `tn_${(1000 + i).toString(36)}`,
      name: `${first} ${pick(BIZ, i)}`,
      contactName: `${first} ${last}`,
      contactPhone: `61${(400000000 + i * 137911).toString().slice(0, 9)}`,
      contactEmail: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      createdAt: created.toISOString().slice(0, 10),
      locations: hasLocations ? ((i * 13) % 62) + 1 : null,
      staff: ((i * 37) % 480) + 5,
      tags: i % 4 === 0 ? [pick(TAG_POOL, i), pick(TAG_POOL, i + 3)] : i % 3 === 0 ? [pick(TAG_POOL, i)] : [],
      state: STATES[i % STATES.length],
      status: i % 11 === 0 ? 'inactive' : i % 7 === 0 ? 'trial' : i % 17 === 0 ? 'suspended' : 'active',
      plan: pick(PLAN_ORDER, i + 1),
      cycle: i % 3 === 0 ? 'annual' : 'monthly',
      seats: ((i * 17) % 220) + 3,
    });
  }
  return out;
}

let cached: Tenant[] | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function read(): Tenant[] {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    cached = raw ? (JSON.parse(raw) as Tenant[]) : seed();
  } catch {
    cached = seed();
  }
  return cached;
}

function write(next: Tenant[]) {
  cached = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  emit();
}

export const tenantStore = {
  all: read,
  get: (id: string) => read().find(t => t.id === id),
  add: (t: Omit<Tenant, 'id'>) =>
    write([{ ...t, id: `tn_${Math.random().toString(36).slice(2, 9)}` }, ...read()]),
  update: (id: string, patch: Partial<Tenant>) =>
    write(read().map(t => (t.id === id ? { ...t, ...patch } : t))),
  bulkUpdate: (ids: string[], patch: Partial<Tenant>) =>
    write(read().map(t => (ids.includes(t.id) ? { ...t, ...patch } : t))),
  remove: (ids: string[]) => write(read().filter(t => !ids.includes(t.id))),
  setPricing: (id: string, pricing: TenantPricing | undefined) =>
    write(read().map(t => (t.id === id ? { ...t, customPricing: pricing } : t))),
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useTenants() {
  const [, force] = useState(0);
  useEffect(() => tenantStore.subscribe(() => force(n => n + 1)), []);
  return read();
}

/** Effective per-user monthly rate for a tenant: custom rate wins over the price book. */
export function tenantRate(
  tenant: Tenant,
  listMonthly: number,
  listAnnualDiscount: number,
  at: Date = new Date(),
): { monthly: number; annualDiscount: number; custom: boolean } {
  const p = tenant.customPricing;
  const live =
    p &&
    new Date(`${p.effectiveFrom}T00:00:00`).getTime() <= at.getTime() &&
    (!p.expiresOn || new Date(`${p.expiresOn}T23:59:59`).getTime() >= at.getTime());
  if (live && p) return { monthly: p.monthly, annualDiscount: p.annualDiscount, custom: true };
  return { monthly: listMonthly, annualDiscount: listAnnualDiscount, custom: false };
}
