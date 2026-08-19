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

  markDeclined(id: string) {
    agreements = agreements.map(a =>
      a.id === id
        ? { ...a, status: 'declined', history: [...a.history, { at: now(), label: 'Declined by client' }] }
        : a,
    );
    emit();
  },

  resend(id: string) {
    agreements = agreements.map(a =>
      a.id === id
        ? { ...a, sentAt: now(), status: a.status === 'draft' ? 'sent' : a.status, history: [...a.history, { at: now(), label: 'Reminder sent', by: 'Platform admin' }] }
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
