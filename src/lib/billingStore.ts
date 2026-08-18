import { useEffect, useState } from 'react';
import { PlanTier, PLANS } from '@/types/plans';
import { activeRevision, BASE_REVISION } from '@/lib/pricingScheduleStore';

/* ------------------------------------------------------------------ */
/* Pricing (UI only — no charges are processed)                         */
/* ------------------------------------------------------------------ */

export type BillingCycle = 'monthly' | 'annual';

/**
 * Prices come from the scheduled price book, so a future-dated revision
 * automatically becomes the live price on its effective date.
 */

/** Price per user, per month, billed monthly, in force at `at`. */
export const priceFor = (tier: PlanTier, at: Date = new Date()) =>
  activeRevision(at).monthly[tier] ?? BASE_REVISION.monthly[tier];

/** Per-user, per-month discount applied when the plan is paid annually. */
export const annualDiscountFor = (tier: PlanTier, at: Date = new Date()) =>
  activeRevision(at).annualDiscount[tier] ?? BASE_REVISION.annualDiscount[tier];

/** Today's list price, kept for call sites that read a plain map. */
export const PRICE_PER_USER: Record<PlanTier, number> = new Proxy({} as Record<PlanTier, number>, {
  get: (_t, key: string) => priceFor(key as PlanTier),
});

export const ANNUAL_DISCOUNT_PER_USER: Record<PlanTier, number> = new Proxy(
  {} as Record<PlanTier, number>,
  { get: (_t, key: string) => annualDiscountFor(key as PlanTier) },
);

/** Annual plans are invoiced 12 months up front at the discounted rate. */
export const ANNUAL_MONTHS_CHARGED = 12;

export const CURRENCY = 'AUD';

export const formatMoney = (amount: number, currency = CURRENCY) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);

/** Effective per-user, per-month rate for a cycle, at a point in time. */
export const unitRate = (tier: PlanTier, cycle: BillingCycle, at: Date = new Date()) =>
  cycle === 'annual'
    ? Math.max(0, priceFor(tier, at) - annualDiscountFor(tier, at))
    : priceFor(tier, at);


/** Tax applied per billing country. Drives the live checkout breakdown. */
export const TAX_RULES: Record<string, { label: string; rate: number }> = {
  Australia: { label: 'GST (10%)', rate: 0.1 },
  'New Zealand': { label: 'GST (15%)', rate: 0.15 },
  'United Kingdom': { label: 'VAT (20%)', rate: 0.2 },
  'United States': { label: 'Sales tax', rate: 0 },
  Singapore: { label: 'GST (9%)', rate: 0.09 },
};

export const DEFAULT_TAX_RATE = 0.1;

export const taxRuleFor = (country?: string) =>
  (country && TAX_RULES[country]) || { label: 'GST (10%)', rate: DEFAULT_TAX_RATE };

/** What Stripe would charge on each invoice for this configuration. */
export function invoiceTotal(
  tier: PlanTier,
  cycle: BillingCycle,
  seats: number,
  taxRate: number = DEFAULT_TAX_RATE,
  at: Date = new Date(),
) {
  const months = cycle === 'annual' ? ANNUAL_MONTHS_CHARGED : 1;
  const subtotal = unitRate(tier, cycle, at) * seats * months;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100, months, taxRate };
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
  /** Cost of the new subscription (remainder of the period, or a full new term). */
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
  /** True when the billing cycle itself changes (monthly <-> annual). */
  cycleChanged: boolean;
  /** Months covered by the charge above. */
  termMonths: number;
  /** ISO date the next renewal falls on after the change. */
  renewsOn: string;
  /** Savings over 12 months of switching monthly -> annual, before tax. */
  annualSaving: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Stripe-style proration.
 *
 * Same cycle  → credit the unused slice of the current period and charge the
 *               new configuration for the same remaining slice. The renewal
 *               date does not move.
 * Cycle change → the current term ends immediately: credit the unused slice,
 *               then charge a full new term (12 months annual, 1 month
 *               monthly) starting today. The renewal date resets.
 */
export function prorationPreview(
  current: Pick<BillingState, 'tier' | 'cycle' | 'seats' | 'renewsOn'>,
  next: { tier: PlanTier; cycle: BillingCycle; seats: number },
  now: Date = new Date(),
  taxRate: number = DEFAULT_TAX_RATE,
): ProrationPreview {
  const daysInPeriod = current.cycle === 'annual' ? 365 : 30;
  const msLeft = new Date(current.renewsOn).getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.min(daysInPeriod, Math.round(msLeft / 86_400_000)));
  const fraction = daysRemaining / daysInPeriod;
  const cycleChanged = next.cycle !== current.cycle;

  const currentPeriod = invoiceTotal(current.tier, current.cycle, current.seats, taxRate).subtotal;
  const nextTotals = invoiceTotal(next.tier, next.cycle, next.seats, taxRate);

  const credit = round2(currentPeriod * fraction);
  // A cycle switch starts a brand new term, so the whole term is charged now.
  const charge = round2(cycleChanged ? nextTotals.subtotal : nextTotals.subtotal * fraction);
  const subtotal = round2(charge - credit);
  const tax = round2(Math.max(0, subtotal) * taxRate);
  const dueToday = round2(Math.max(0, subtotal + tax));
  const creditBalance = subtotal < 0 ? round2(-subtotal) : 0;

  const renewal = new Date(now);
  if (cycleChanged) renewal.setMonth(renewal.getMonth() + nextTotals.months);

  const monthlyYear = unitRate(next.tier, 'monthly', now) * next.seats * 12;
  const annualYear = unitRate(next.tier, 'annual', now) * next.seats * 12;

  return {
    credit,
    charge,
    subtotal,
    tax,
    dueToday,
    creditBalance,
    daysRemaining,
    daysInPeriod,
    nextInvoiceTotal: nextTotals.total,
    cycleChanged,
    termMonths: cycleChanged ? nextTotals.months : 0,
    renewsOn: cycleChanged ? renewal.toISOString() : current.renewsOn,
    annualSaving: round2(monthlyYear - annualYear),
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
      renewsOn: args.proration.renewsOn ?? state.renewsOn,
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
    taxRate?: number;
  }) => {
    const state = read();
    const { total, months } = invoiceTotal(args.tier, args.cycle, args.seats, args.taxRate);

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
      renewsOn: addMonths(new Date(), months === 12 ? 12 : 1).toISOString(),
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
  /** Capability that triggered the flow, shown for continuity with the offer. */
  feature?: string;
  moduleId?: string;
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
