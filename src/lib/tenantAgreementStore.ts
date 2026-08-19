import { useEffect, useState } from 'react';
import { PlanTier } from '@/types/plans';
import { BillingCycle } from '@/lib/billingStore';

/**
 * Tenant (organisation) subscription agreement signing store.
 *
 * Mirrors the staff contract workflow but for the commercial documents a
 * platform admin exchanges with a client organisation:
 *  1. Send a subscription/plan agreement out for e-signature.
 *  2. Record an agreement that was signed offline (wet-ink / emailed PDF).
 */

export type TenantAgreementStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'declined'
  | 'expired'
  | 'uploaded';

export type TenantAgreementType =
  | 'subscription_agreement'
  | 'order_form'
  | 'renewal'
  | 'price_variation'
  | 'msa'
  | 'dpa'
  | 'other';

export const tenantAgreementTypeLabels: Record<TenantAgreementType, string> = {
  subscription_agreement: 'Subscription agreement',
  order_form: 'Order form',
  renewal: 'Renewal agreement',
  price_variation: 'Price variation letter',
  msa: 'Master services agreement',
  dpa: 'Data processing agreement',
  other: 'Other document',
};

export const tenantAgreementStatusLabels: Record<TenantAgreementStatus, string> = {
  draft: 'Draft',
  sent: 'Awaiting signature',
  viewed: 'Viewed',
  signed: 'Signed',
  declined: 'Declined',
  expired: 'Expired',
  uploaded: 'Signed (uploaded)',
};

/** Sales people who can be assigned as document owner. */
export interface SalesRep {
  id: string;
  name: string;
  email: string;
  territory?: string;
}

export const SALES_REPS: SalesRep[] = [
  { id: 'sr_priya', name: 'Priya Nair', email: 'priya.nair@rostered.ai', territory: 'VIC / TAS' },
  { id: 'sr_dan', name: 'Daniel Brooks', email: 'daniel.brooks@rostered.ai', territory: 'NSW / ACT' },
  { id: 'sr_mei', name: 'Mei Lin', email: 'mei.lin@rostered.ai', territory: 'QLD' },
  { id: 'sr_sam', name: 'Sam Okafor', email: 'sam.okafor@rostered.ai', territory: 'WA / SA / NT' },
  { id: 'sr_house', name: 'House account', email: 'sales@rostered.ai', territory: 'Unassigned' },
];

export const ONBOARDING_MANAGERS: SalesRep[] = [
  { id: 'om_lucy', name: 'Lucy Hart', email: 'lucy.hart@rostered.ai', territory: 'Implementation' },
  { id: 'om_raj', name: 'Raj Patel', email: 'raj.patel@rostered.ai', territory: 'Implementation' },
  { id: 'om_tara', name: 'Tara Nguyen', email: 'tara.nguyen@rostered.ai', territory: 'Enterprise onboarding' },
  { id: 'om_pool', name: 'Onboarding pool', email: 'onboarding@rostered.ai', territory: 'Unassigned' },
];

export const ACCOUNT_MANAGERS: SalesRep[] = [
  { id: 'am_josh', name: 'Josh Reilly', email: 'josh.reilly@rostered.ai', territory: 'Customer success' },
  { id: 'am_ana', name: 'Ana Silva', email: 'ana.silva@rostered.ai', territory: 'Customer success' },
  { id: 'am_ken', name: 'Ken Watanabe', email: 'ken.watanabe@rostered.ai', territory: 'Strategic accounts' },
  { id: 'am_pool', name: 'Support pool', email: 'success@rostered.ai', territory: 'Unassigned' },
];

/** Every internal owner across the three roles, for lookups. */
const ALL_OWNERS = () => [...SALES_REPS, ...ONBOARDING_MANAGERS, ...ACCOUNT_MANAGERS];

export const salesRepById = (id?: string) => ALL_OWNERS().find(r => r.id === id);
export const ownerById = salesRepById;

export type OwnerRole = 'salesRepId' | 'onboardingManagerId' | 'accountManagerId';

export const OWNER_ROLE_LABELS: Record<OwnerRole, string> = {
  salesRepId: 'Sales person',
  onboardingManagerId: 'Onboarding manager',
  accountManagerId: 'Account manager',
};

export const OWNER_ROLE_OPTIONS: Record<OwnerRole, SalesRep[]> = {
  salesRepId: SALES_REPS,
  onboardingManagerId: ONBOARDING_MANAGERS,
  accountManagerId: ACCOUNT_MANAGERS,
};

/** Whether the paper is net-new business or a renewal of an existing term. */
export type AgreementDealType = 'new' | 'renewal';

export const dealTypeLabels: Record<AgreementDealType, string> = {
  new: 'New business',
  renewal: 'Renewal',
};

/** How the per-user price moves at each anniversary of the term. */
export type UpliftBasis = 'none' | 'fixed' | 'cpi';

export const upliftBasisLabels: Record<UpliftBasis, string> = {
  none: 'No annual increase',
  fixed: 'Fixed % increase',
  cpi: 'CPI-linked increase',
};

export interface AnnualPriceTerms {
  basis: UpliftBasis;
  /** Fixed uplift %, or the assumed/indexed CPI % used for forecasting. */
  percent: number;
  /** Optional cap applied to a CPI-linked increase. */
  capPercent?: number;
  autoRenew: boolean;
  /** Days of notice required before term end to stop auto-renewal. */
  noticeDays: number;
}

export const defaultPriceTerms = (): AnnualPriceTerms => ({
  basis: 'cpi',
  percent: 3.5,
  capPercent: 5,
  autoRenew: true,
  noticeDays: 60,
});

export interface TenantAgreementSignatory {
  name: string;
  email: string;
  role: 'client' | 'platform';
  signedAt?: string;
}

export interface TenantAgreement {
  id: string;
  tenantId: string;
  tenantName: string;
  title: string;
  type: TenantAgreementType;
  status: TenantAgreementStatus;
  /** Commercial terms captured on the document at the time it was issued. */
  plan?: PlanTier;
  cycle?: BillingCycle;
  seats?: number;
  /** Contract value per period, in dollars. */
  contractValue?: number;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  completedAt?: string;
  dueDate?: string;
  effectiveDate?: string;
  termEndsOn?: string;
  signatories: TenantAgreementSignatory[];
  message?: string;
  /** Sales person who owns this deal / document. */
  salesRepId?: string;
  /** Onboarding / implementation manager for this client. */
  onboardingManagerId?: string;
  /** Ongoing account manager (customer success). */
  accountManagerId?: string;
  /** New business vs renewal of an earlier agreement. */
  dealType?: AgreementDealType;
  /** Agreement this one renews, when dealType is 'renewal'. */
  renewalOfId?: string;
  /** Contract term length in months. */
  termMonths?: number;
  /** Annual price movement / renewal terms. */
  priceTerms?: AnnualPriceTerms;
  /** Free-text contractual terms and special conditions. */
  termsNotes?: string;
  /** Delivery + engagement tracking. */
  remindersSent?: number;
  lastReminderAt?: string;
  openCount?: number;
  declineReason?: string;
  /** Set when the signed copy was uploaded rather than e-signed. */
  fileName?: string;
  fileSize?: number;
  source: 'e-signature' | 'upload';
  history: { at: string; label: string; by?: string }[];
}

const KEY = 'rai.platform.tenantAgreements.v1';
const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

function seed(): TenantAgreement[] {
  return [
    {
      id: 'ta-001',
      tenantId: 'tn_rs',
      tenantName: 'Krishna Business',
      title: 'Subscription Agreement — Growth (annual)',
      type: 'subscription_agreement',
      status: 'signed',
      plan: 'growth',
      cycle: 'annual',
      seats: 48,
      contractValue: 4320,
      createdAt: daysAgo(96),
      sentAt: daysAgo(95),
      viewedAt: daysAgo(94),
      completedAt: daysAgo(93),
      effectiveDate: daysAgo(90).slice(0, 10),
      termEndsOn: daysAhead(275).slice(0, 10),
      signatories: [
        { name: 'Krishna Kotadiya', email: 'krishna.kotadiya@example.com', role: 'client', signedAt: daysAgo(93) },
        { name: 'Rostered.ai', email: 'contracts@rostered.ai', role: 'platform', signedAt: daysAgo(93) },
      ],
      salesRepId: 'sr_priya',
      dealType: 'new',
      termMonths: 12,
      priceTerms: { basis: 'cpi', percent: 3.5, capPercent: 5, autoRenew: true, noticeDays: 60 },
      onboardingManagerId: 'om_lucy',
      accountManagerId: 'am_josh',
      remindersSent: 1,
      lastReminderAt: daysAgo(94),
      openCount: 3,
      source: 'e-signature',
      history: [
        { at: daysAgo(95), label: 'Sent for signature', by: 'Platform admin' },
        { at: daysAgo(93), label: 'Signed by client' },
      ],
    },
    {
      id: 'ta-002',
      tenantId: 'tn_ankit',
      tenantName: 'Ankit Digital',
      title: 'Order Form — Essentials (monthly)',
      type: 'order_form',
      status: 'sent',
      plan: 'essentials',
      cycle: 'monthly',
      seats: 22,
      contractValue: 132,
      createdAt: daysAgo(4),
      sentAt: daysAgo(4),
      dueDate: daysAhead(6).slice(0, 10),
      effectiveDate: daysAhead(12).slice(0, 10),
      signatories: [{ name: 'Ankit Sharma', email: 'ankit.sharma@example.com', role: 'client' }],
      message: 'Please review and sign to activate your Essentials subscription.',
      salesRepId: 'sr_dan',
      dealType: 'new',
      termMonths: 12,
      priceTerms: { basis: 'fixed', percent: 4, autoRenew: true, noticeDays: 30 },
      onboardingManagerId: 'om_raj',
      accountManagerId: 'am_ana',
      remindersSent: 0,
      openCount: 0,
      source: 'e-signature',
      history: [{ at: daysAgo(4), label: 'Sent for signature', by: 'Platform admin' }],
    },
    {
      id: 'ta-003',
      tenantId: 'tn_test',
      tenantName: 'Test Care Group',
      title: 'Price Variation — negotiated rate',
      type: 'price_variation',
      status: 'uploaded',
      plan: 'enterprise',
      cycle: 'annual',
      seats: 310,
      contractValue: 29450,
      createdAt: daysAgo(31),
      completedAt: daysAgo(30),
      effectiveDate: daysAgo(28).slice(0, 10),
      signatories: [{ name: 'Test Care Group', email: 'ops@testcare.example.com', role: 'client', signedAt: daysAgo(30) }],
      fileName: 'test-care-price-variation-signed.pdf',
      fileSize: 486_000,
      salesRepId: 'sr_mei',
      dealType: 'renewal',
      renewalOfId: 'ta-001',
      termMonths: 24,
      priceTerms: { basis: 'none', percent: 0, autoRenew: false, noticeDays: 90 },
      onboardingManagerId: 'om_tara',
      accountManagerId: 'am_ken',
      source: 'upload',
      history: [{ at: daysAgo(30), label: 'Signed copy uploaded', by: 'Platform admin' }],
    },
  ];
}

let agreements: TenantAgreement[] = [];
try {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  agreements = raw ? (JSON.parse(raw) as TenantAgreement[]) : seed();
} catch {
  agreements = seed();
}

const listeners = new Set<() => void>();
/** Cached immutable snapshot so subscribers stay stable between emits. */
let snapshot: TenantAgreement[] = [];
const rebuild = () => {
  snapshot = [...agreements].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
};
rebuild();

const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(agreements));
  } catch {
    /* ignore */
  }
};

const emit = () => {
  rebuild();
  persist();
  listeners.forEach(l => l());
};

export interface SendAgreementInput {
  tenantId: string;
  tenantName: string;
  title: string;
  type: TenantAgreementType;
  plan?: PlanTier;
  cycle?: BillingCycle;
  seats?: number;
  contractValue?: number;
  signatoryName: string;
  signatoryEmail: string;
  countersignerName?: string;
  countersignerEmail?: string;
  dueDate?: string;
  effectiveDate?: string;
  termEndsOn?: string;
  message?: string;
  salesRepId?: string;
  onboardingManagerId?: string;
  accountManagerId?: string;
  dealType?: AgreementDealType;
  renewalOfId?: string;
  termMonths?: number;
  priceTerms?: AnnualPriceTerms;
  termsNotes?: string;
}

export interface UploadAgreementInput
  extends Omit<SendAgreementInput, 'dueDate' | 'message' | 'countersignerName' | 'countersignerEmail'> {
  fileName: string;
  fileSize: number;
  signedOn: string;
}

export const tenantAgreementStore = {
  all: () => snapshot,
  forTenant: (tenantId: string) => snapshot.filter(a => a.tenantId === tenantId),
  get: (id: string) => snapshot.find(a => a.id === id),

  send(input: SendAgreementInput): TenantAgreement {
    const signatories: TenantAgreementSignatory[] = [
      { name: input.signatoryName, email: input.signatoryEmail, role: 'client' },
    ];
    if (input.countersignerName && input.countersignerEmail) {
      signatories.push({ name: input.countersignerName, email: input.countersignerEmail, role: 'platform' });
    }
    const doc: TenantAgreement = {
      id: `ta-${Math.random().toString(36).slice(2, 9)}`,
      tenantId: input.tenantId,
      tenantName: input.tenantName,
      title: input.title,
      type: input.type,
      status: 'sent',
      plan: input.plan,
      cycle: input.cycle,
      seats: input.seats,
      contractValue: input.contractValue,
      createdAt: now(),
      sentAt: now(),
      dueDate: input.dueDate,
      effectiveDate: input.effectiveDate,
      termEndsOn: input.termEndsOn,
      signatories,
      message: input.message,
      salesRepId: input.salesRepId,
      onboardingManagerId: input.onboardingManagerId,
      dealType: input.dealType ?? 'new',
      renewalOfId: input.renewalOfId,
      termMonths: input.termMonths,
      priceTerms: input.priceTerms,
      termsNotes: input.termsNotes,
      accountManagerId: input.accountManagerId,
      remindersSent: 0,
      openCount: 0,
      source: 'e-signature',
      history: [{ at: now(), label: `Sent for signature to ${input.signatoryEmail}`, by: 'Platform admin' }],
    };
    agreements = [doc, ...agreements];
    emit();
    return doc;
  },

  upload(input: UploadAgreementInput): TenantAgreement {
    const doc: TenantAgreement = {
      id: `ta-${Math.random().toString(36).slice(2, 9)}`,
      tenantId: input.tenantId,
      tenantName: input.tenantName,
      title: input.title,
      type: input.type,
      status: 'uploaded',
      plan: input.plan,
      cycle: input.cycle,
      seats: input.seats,
      contractValue: input.contractValue,
      createdAt: now(),
      completedAt: new Date(`${input.signedOn}T00:00:00`).toISOString(),
      effectiveDate: input.effectiveDate,
      termEndsOn: input.termEndsOn,
      signatories: [
        {
          name: input.signatoryName,
          email: input.signatoryEmail,
          role: 'client',
          signedAt: new Date(`${input.signedOn}T00:00:00`).toISOString(),
        },
      ],
      fileName: input.fileName,
      fileSize: input.fileSize,
      salesRepId: input.salesRepId,
      onboardingManagerId: input.onboardingManagerId,
      dealType: input.dealType ?? 'new',
      renewalOfId: input.renewalOfId,
      termMonths: input.termMonths,
      priceTerms: input.priceTerms,
      termsNotes: input.termsNotes,
      accountManagerId: input.accountManagerId,
      source: 'upload',
      history: [{ at: now(), label: `Signed copy uploaded (${input.fileName})`, by: 'Platform admin' }],
    };
    agreements = [doc, ...agreements];
    emit();
    return doc;
  },

  markSigned(id: string, by?: string) {
    agreements = agreements.map(a =>
      a.id === id
        ? {
            ...a,
            status: 'signed',
            completedAt: now(),
            signatories: a.signatories.map(s => ({ ...s, signedAt: s.signedAt ?? now() })),
            history: [...a.history, { at: now(), label: 'Marked as signed', by }],
          }
        : a,
    );
    emit();
  },

  markDeclined(id: string, reason?: string) {
    agreements = agreements.map(a =>
      a.id === id
        ? {
            ...a,
            status: 'declined',
            declineReason: reason,
            history: [
              ...a.history,
              { at: now(), label: reason ? `Declined by client — ${reason}` : 'Declined by client' },
            ],
          }
        : a,
    );
    emit();
  },

  /** Record that the client opened the document (delivery tracking). */
  markViewed(id: string) {
    agreements = agreements.map(a =>
      a.id === id
        ? {
            ...a,
            status: a.status === 'sent' ? 'viewed' : a.status,
            viewedAt: a.viewedAt ?? now(),
            openCount: (a.openCount ?? 0) + 1,
            history: [...a.history, { at: now(), label: 'Opened by client' }],
          }
        : a,
    );
    emit();
  },

  /** Assign any internal owner role (sales, onboarding, account management). */
  assignOwner(id: string, role: OwnerRole, ownerId: string) {
    agreements = agreements.map(a =>
      a.id === id
        ? {
            ...a,
            [role]: ownerId,
            history: [
              ...a.history,
              {
                at: now(),
                label: `${OWNER_ROLE_LABELS[role]} set to ${salesRepById(ownerId)?.name ?? 'unassigned'}`,
                by: 'Platform admin',
              },
            ],
          }
        : a,
    );
    emit();
  },

  assignSalesRep(id: string, salesRepId: string) {
    tenantAgreementStore.assignOwner(id, 'salesRepId', salesRepId);
  },

  resend(id: string) {
    agreements = agreements.map(a =>
      a.id === id
        ? {
            ...a,
            sentAt: now(),
            status: a.status === 'draft' ? 'sent' : a.status,
            remindersSent: (a.remindersSent ?? 0) + 1,
            lastReminderAt: now(),
            history: [...a.history, { at: now(), label: 'Reminder sent', by: 'Platform admin' }],
          }
        : a,
    );
    emit();
  },

  remove(id: string) {
    agreements = agreements.filter(a => a.id !== id);
    emit();
  },

  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useTenantAgreements(tenantId?: string) {
  const [, force] = useState(0);
  useEffect(() => tenantAgreementStore.subscribe(() => force(n => n + 1)), []);
  return tenantId ? snapshot.filter(a => a.tenantId === tenantId) : snapshot;
}

export const isOutstanding = (a: TenantAgreement) =>
  a.status === 'sent' || a.status === 'viewed' || a.status === 'draft';

export const isComplete = (a: TenantAgreement) => a.status === 'signed' || a.status === 'uploaded';

/** Add whole months to an ISO yyyy-mm-dd date, returning yyyy-mm-dd. */
export function addMonths(dateISO: string, months: number): string {
  const d = new Date(`${dateISO}T00:00:00`);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d.toISOString().slice(0, 10);
}

/** Effective annual uplift %, respecting a CPI cap when one is set. */
export function effectiveUplift(terms?: AnnualPriceTerms): number {
  if (!terms || terms.basis === 'none') return 0;
  if (terms.basis === 'cpi' && terms.capPercent != null) {
    return Math.min(terms.percent, terms.capPercent);
  }
  return terms.percent;
}

/** Value after applying `years` of annual uplift. */
export function upliftedValue(value: number, terms?: AnnualPriceTerms, years = 1): number {
  const pct = effectiveUplift(terms) / 100;
  return value * Math.pow(1 + pct, years);
}

/** Days until the term ends (negative once expired). */
export function daysToTermEnd(a: TenantAgreement): number | null {
  if (!a.termEndsOn) return null;
  return Math.ceil((new Date(`${a.termEndsOn}T23:59:59`).getTime() - Date.now()) / 86400000);
}

/** A signed agreement inside its renewal notice window (or already expired). */
export function isRenewalDue(a: TenantAgreement, windowDays?: number): boolean {
  if (!isComplete(a)) return false;
  const d = daysToTermEnd(a);
  if (d === null) return false;
  const window = windowDays ?? a.priceTerms?.noticeDays ?? 90;
  return d <= window;
}

export function renewalSummary(a: TenantAgreement): string {
  const d = daysToTermEnd(a);
  if (d === null) return 'No term end set';
  if (d < 0) return `Term ended ${Math.abs(d)}d ago`;
  return `${d}d to term end${a.priceTerms?.autoRenew ? ' · auto-renews' : ''}`;
}

/** Days until (positive) or past (negative) the sign-by date. */
export function daysToDue(a: TenantAgreement): number | null {
  if (!a.dueDate) return null;
  const due = new Date(`${a.dueDate}T23:59:59`).getTime();
  return Math.ceil((due - Date.now()) / 86400000);
}

export const isOverdue = (a: TenantAgreement) => {
  const d = daysToDue(a);
  return isOutstanding(a) && d !== null && d < 0;
};

/** One-line tracking summary of where a sent document currently sits. */
export function trackingSummary(a: TenantAgreement): string {
  if (a.status === 'uploaded') return 'Signed copy on file';
  if (a.status === 'signed') return 'Signed by all parties';
  if (a.status === 'declined') return a.declineReason ? `Declined — ${a.declineReason}` : 'Declined by client';
  if (a.status === 'expired') return 'Expired without signature';
  if (a.status === 'draft') return 'Draft — not sent yet';
  const opens = a.openCount ?? 0;
  const reminders = a.remindersSent ?? 0;
  const parts = [opens > 0 ? `Opened ${opens}×` : 'Not opened yet'];
  if (reminders) parts.push(`${reminders} reminder${reminders > 1 ? 's' : ''}`);
  const d = daysToDue(a);
  if (d !== null) parts.push(d < 0 ? `${Math.abs(d)}d overdue` : `${d}d to sign`);
  return parts.join(' · ');
}
