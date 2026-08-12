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

/* ------------------------------------------------------------------ */
/* Proration preview (Stripe-style subscription update)                 */
/* ------------------------------------------------------------------ */

export interface ProrationPreview {
  /** Unused time credited back from the current subscription. */
  credit: number;
  /** Cost of the new subscription for the remainder of the period. */
  charge: number;
  /** charge - credit, before tax. Negative means credit balance. */
  subtotal: number;
  tax: number;
  /** Amount charged now (0 when the result is a credit). */
  dueToday: number;
  /** Credit carried to the next invoice when the change is a downgrade. */
  creditBalance: number;
  daysRemaining: number;
  daysInPeriod: number;
  /** Recurring total on the next invoice under the new configuration. */
  nextInvoiceTotal: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function prorationPreview(
  current: Pick<BillingState, 'tier' | 'cycle' | 'seats' | 'renewsOn'>,
  next: { tier: PlanTier; cycle: BillingCycle; seats: number },
  now: Date = new Date(),
): ProrationPreview {
  const daysInPeriod = current.cycle === 'annual' ? 365 : 30;
  const msLeft = new Date(current.renewsOn).getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.min(daysInPeriod, Math.round(msLeft / 86_400_000)));
  const fraction = daysRemaining / daysInPeriod;

  const currentPeriod = invoiceTotal(current.tier, current.cycle, current.seats).subtotal;
  const nextPeriod = invoiceTotal(next.tier, next.cycle, next.seats).subtotal;

  const credit = round2(currentPeriod * fraction);
  const charge = round2(nextPeriod * fraction);
  const subtotal = round2(charge - credit);
  const tax = round2(Math.max(0, subtotal) * 0.1);
  const dueToday = round2(Math.max(0, subtotal + tax));
  const creditBalance = subtotal < 0 ? round2(-subtotal) : 0;

  return {
    credit,
    charge,
    subtotal,
    tax,
    dueToday,
    creditBalance,
    daysRemaining,
    daysInPeriod,
    nextInvoiceTotal: invoiceTotal(next.tier, next.cycle, next.seats).total,
  };
}

export const billingStore = {
  get: read,
  update: (patch: Partial<BillingState>) => write({ ...read(), ...patch }),
  /** Applies a subscription change against the card already on file. */
  confirmUpdate: (args: {
    tier: PlanTier;
    cycle: BillingCycle;
    seats: number;
    proration: ProrationPreview;
  }) => {
    const state = read();
    const cycleChanged = args.cycle !== state.cycle;
    const invoices = [...state.invoices];
    if (args.proration.dueToday > 0 || args.proration.creditBalance > 0) {
      invoices.unshift({
        id: `in_${Math.random().toString(36).slice(2, 10)}`,
        date: new Date().toISOString(),
        description: `Proration · ${PLANS[args.tier].label} · ${args.seats} users${
          cycleChanged ? ` · ${args.cycle === 'annual' ? 'Annual' : 'Monthly'}` : ''
        }`,
        amount: args.proration.dueToday > 0 ? args.proration.dueToday : args.proration.creditBalance,
        status: args.proration.dueToday > 0 ? 'paid' : 'refunded',
      });
    }
    write({
      ...state,
      status: 'active',
      tier: args.tier,
      cycle: args.cycle,
      seats: args.seats,
      cancelAtPeriodEnd: false,
      // Cycle changes restart the billing period; otherwise the date holds.
      renewsOn: cycleChanged
        ? addMonths(new Date(), args.cycle === 'annual' ? 12 : 1).toISOString()
        : state.renewsOn,
      invoices: invoices.slice(0, 24),
    });
  },
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
