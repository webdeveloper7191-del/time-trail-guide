import { useEffect, useState } from 'react';
import { PlanTier, PLANS } from '@/types/plans';

/* ------------------------------------------------------------------ */
/* Pricing (UI only — no charges are processed)                         */
/* ------------------------------------------------------------------ */

export type BillingCycle = 'monthly' | 'annual';

/** Price per user, per month, billed monthly. */
export const PRICE_PER_USER: Record<PlanTier, number> = {
  essentials: 4,
  growth: 6,
  enterprise: 8,
};

/** Annual is billed as 10 months up front (2 months free). */
export const ANNUAL_MONTHS_CHARGED = 10;

export const CURRENCY = 'AUD';

export const formatMoney = (amount: number, currency = CURRENCY) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);

/** Effective per-user, per-month rate for a cycle. */
export const unitRate = (tier: PlanTier, cycle: BillingCycle) =>
  cycle === 'annual'
    ? (PRICE_PER_USER[tier] * ANNUAL_MONTHS_CHARGED) / 12
    : PRICE_PER_USER[tier];

/** What Stripe would charge on each invoice for this configuration. */
export function invoiceTotal(tier: PlanTier, cycle: BillingCycle, seats: number) {
  const months = cycle === 'annual' ? ANNUAL_MONTHS_CHARGED : 1;
  const subtotal = PRICE_PER_USER[tier] * seats * months;
  const tax = Math.round(subtotal * 0.1 * 100) / 100; // GST 10%
  return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100, months };
}

/* ------------------------------------------------------------------ */
/* Subscription state                                                   */
/* ------------------------------------------------------------------ */

export interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  name: string;
}

export interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'open' | 'refunded';
}

export interface BillingState {
  status: 'trialing' | 'active' | 'canceled';
  tier: PlanTier;
  cycle: BillingCycle;
  seats: number;
  /** ISO date of the next scheduled charge. */
  renewsOn: string;
  cancelAtPeriodEnd: boolean;
  paymentMethod: PaymentMethod | null;
  billingEmail: string;
  companyName: string;
  invoices: Invoice[];
}

const KEY = 'rai.billing.v1';

const addMonths = (d: Date, n: number) => {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
};

const defaultState = (): BillingState => ({
  status: 'trialing',
  tier: 'growth',
  cycle: 'monthly',
  seats: 25,
  renewsOn: addMonths(new Date(), 1).toISOString(),
  cancelAtPeriodEnd: false,
  paymentMethod: null,
  billingEmail: '',
  companyName: '',
  invoices: [],
});

let cached: BillingState | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function read(): BillingState {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    cached = raw ? { ...defaultState(), ...(JSON.parse(raw) as BillingState) } : defaultState();
  } catch {
    cached = defaultState();
  }
  return cached;
}

function write(next: BillingState) {
  cached = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  emit();
}

export const billingStore = {
  get: read,
  update: (patch: Partial<BillingState>) => write({ ...read(), ...patch }),
  /** Simulates a completed Stripe Checkout session. */
  confirmCheckout: (args: {
    tier: PlanTier;
    cycle: BillingCycle;
    seats: number;
    paymentMethod: PaymentMethod;
    billingEmail: string;
    companyName: string;
  }) => {
    const state = read();
    const { total, months } = invoiceTotal(args.tier, args.cycle, args.seats);
    const invoice: Invoice = {
      id: `in_${Math.random().toString(36).slice(2, 10)}`,
      date: new Date().toISOString(),
      description: `${PLANS[args.tier].label} · ${args.seats} users · ${
        args.cycle === 'annual' ? 'Annual' : 'Monthly'
      }`,
      amount: total,
      status: 'paid',
    };
    write({
      ...state,
      status: 'active',
      tier: args.tier,
      cycle: args.cycle,
      seats: args.seats,
      cancelAtPeriodEnd: false,
      renewsOn: addMonths(new Date(), months === 10 ? 12 : 1).toISOString(),
      paymentMethod: args.paymentMethod,
      billingEmail: args.billingEmail,
      companyName: args.companyName,
      invoices: [invoice, ...state.invoices].slice(0, 24),
    });
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useBilling() {
  const [, force] = useState(0);
  useEffect(() => billingStore.subscribe(() => force(n => n + 1)), []);
  return read();
}

/* ------------------------------------------------------------------ */
/* Checkout dialog controller                                           */
/* ------------------------------------------------------------------ */

export interface CheckoutContext {
  tier: PlanTier;
  cycle?: BillingCycle;
  seats?: number;
  source?: string;
}

let checkoutContext: CheckoutContext | null = null;
const checkoutListeners = new Set<() => void>();

export const checkout = {
  open: (ctx: CheckoutContext) => {
    checkoutContext = ctx;
    checkoutListeners.forEach(l => l());
  },
  close: () => {
    checkoutContext = null;
    checkoutListeners.forEach(l => l());
  },
};

export function useCheckout() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force(n => n + 1);
    checkoutListeners.add(l);
    return () => {
      checkoutListeners.delete(l);
    };
  }, []);
  return { context: checkoutContext };
}
