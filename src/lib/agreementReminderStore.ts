import { useEffect, useState } from 'react';
import {
  ALL_OWNERS,
  OWNER_ROLE_LABELS,
  OwnerRole,
  SalesRep,
  TenantAgreement,
  daysToDue,
  daysToTermEnd,
  isComplete,
  isOutstanding,
  isOverdue,
  isRenewalDue,
  ownerById,
  tenantAgreementStore,
} from '@/lib/tenantAgreementStore';

/**
 * Auto-reminder scheduling + owner work queue for tenant agreements.
 *
 * The policy describes when chasers go out (before the sign-by date, after it
 * lapses, and ahead of a term end). `dueReminders` turns the policy plus the
 * current agreements into a concrete list of sends; `runAutoReminders` posts
 * them via the existing `resend` action so the tracking timeline stays intact.
 */
export interface ReminderPolicy {
  enabled: boolean;
  /** Days before the sign-by date to nudge, e.g. [7, 2]. */
  beforeDueDays: number[];
  /** Cadence (in days) for chasing an overdue signature. */
  overdueEveryDays: number;
  /** Days before term end to start renewal outreach. */
  renewalLeadDays: number[];
  /** Never send more than this many reminders per agreement. */
  maxReminders: number;
  /** Only send on weekdays. */
  businessDaysOnly: boolean;
}

export const defaultReminderPolicy = (): ReminderPolicy => ({
  enabled: true,
  beforeDueDays: [7, 2],
  overdueEveryDays: 3,
  renewalLeadDays: [90, 45, 14],
  maxReminders: 5,
  businessDaysOnly: true,
});

const KEY = 'rai.platform.agreementReminderPolicy.v1';
const listeners = new Set<() => void>();
let cache: ReminderPolicy | null = null;

function read(): ReminderPolicy {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw
      ? { ...defaultReminderPolicy(), ...(JSON.parse(raw) as Partial<ReminderPolicy>) }
      : defaultReminderPolicy();
  } catch {
    cache = defaultReminderPolicy();
  }
  return cache;
}

export const reminderPolicyStore = {
  get: read,
  update: (patch: Partial<ReminderPolicy>) => {
    cache = { ...read(), ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      /* ignore */
    }
    listeners.forEach(l => l());
  },
  reset: () => reminderPolicyStore.update(defaultReminderPolicy()),
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useReminderPolicy(): ReminderPolicy {
  const [, force] = useState(0);
  useEffect(() => reminderPolicyStore.subscribe(() => force(n => n + 1)), []);
  return read();
}

/* ------------------------------------------------------------------ */
/* Scheduling                                                           */
/* ------------------------------------------------------------------ */

export type ReminderReason = 'due-soon' | 'overdue' | 'renewal';

export const REMINDER_REASON_LABEL: Record<ReminderReason, string> = {
  'due-soon': 'Signature due soon',
  overdue: 'Overdue signature',
  renewal: 'Renewal outreach',
};

export interface ScheduledReminder {
  agreement: TenantAgreement;
  reason: ReminderReason;
  /** Human explanation of why this one is queued today. */
  detail: string;
  /** Positive = days remaining, negative = days past. */
  days: number;
  sentToday: boolean;
  blocked?: string;
}

const daysSince = (iso?: string) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : Infinity;

const isWeekend = (d = new Date()) => d.getDay() === 0 || d.getDay() === 6;

/** Everything the policy says should be chased right now. */
export function dueReminders(
  agreements: TenantAgreement[],
  policy: ReminderPolicy = read(),
): ScheduledReminder[] {
  const out: ScheduledReminder[] = [];
  for (const a of agreements) {
    const sent = a.remindersSent ?? 0;
    const sentToday = daysSince(a.lastReminderAt) < 1;
    const blocked =
      sent >= policy.maxReminders
        ? `Reminder cap reached (${policy.maxReminders})`
        : sentToday
          ? 'Already reminded today'
          : policy.businessDaysOnly && isWeekend()
            ? 'Weekend — holds until Monday'
            : undefined;

    if (isOutstanding(a) && a.status !== 'draft') {
      const d = daysToDue(a);
      if (d !== null && d < 0) {
        const since = daysSince(a.lastReminderAt);
        if (since >= policy.overdueEveryDays) {
          out.push({
            agreement: a,
            reason: 'overdue',
            days: d,
            detail: `${Math.abs(d)}d overdue · every ${policy.overdueEveryDays}d`,
            sentToday,
            blocked,
          });
          continue;
        }
      } else if (d !== null && policy.beforeDueDays.some(x => d <= x)) {
        const trigger = Math.min(...policy.beforeDueDays.filter(x => d <= x));
        out.push({
          agreement: a,
          reason: 'due-soon',
          days: d,
          detail: `Due in ${d}d · ${trigger}d reminder`,
          sentToday,
          blocked,
        });
        continue;
      }
    }

    if (isComplete(a) && isRenewalDue(a)) {
      const d = daysToTermEnd(a);
      if (d !== null && policy.renewalLeadDays.some(x => d <= x)) {
        const trigger = Math.min(...policy.renewalLeadDays.filter(x => d <= x));
        out.push({
          agreement: a,
          reason: 'renewal',
          days: d,
          detail: d < 0 ? `Term ended ${Math.abs(d)}d ago` : `${d}d to term end · ${trigger}d touchpoint`,
          sentToday,
          blocked,
        });
      }
    }
  }
  return out.sort((x, y) => x.days - y.days);
}

export const sendableReminders = (list: ScheduledReminder[]) => list.filter(r => !r.blocked);

/** Send every reminder the policy currently allows. Returns how many went out. */
export function runAutoReminders(
  agreements: TenantAgreement[],
  policy: ReminderPolicy = read(),
): number {
  const sendable = sendableReminders(dueReminders(agreements, policy)).filter(
    r => r.reason !== 'renewal' || isOutstanding(r.agreement),
  );
  sendable.forEach(r => tenantAgreementStore.resend(r.agreement.id));
  return sendable.length;
}

/* ------------------------------------------------------------------ */
/* Owner work queue                                                     */
/* ------------------------------------------------------------------ */

export interface OwnerQueueRow {
  owner: SalesRep | { id: 'unassigned'; name: 'Unassigned'; email: '' };
  role: OwnerRole;
  total: number;
  awaitingSignature: number;
  overdue: number;
  renewalsDue: number;
  remindersDue: number;
  /** Total contract value in flight for this owner. */
  pipelineValue: number;
}

export const ownerRoleLabel = (role: OwnerRole) => OWNER_ROLE_LABELS[role];

export function ownerWorkQueue(
  agreements: TenantAgreement[],
  role: OwnerRole,
  policy: ReminderPolicy = read(),
): OwnerQueueRow[] {
  const reminders = dueReminders(agreements, policy);
  const remindersByAgreement = new Set(reminders.map(r => r.agreement.id));
  const rows = new Map<string, OwnerQueueRow>();

  for (const a of agreements) {
    const ownerId = a[role] ?? 'unassigned';
    if (!rows.has(ownerId)) {
      rows.set(ownerId, {
        owner: ownerById(ownerId) ?? { id: 'unassigned', name: 'Unassigned', email: '' },
        role,
        total: 0,
        awaitingSignature: 0,
        overdue: 0,
        renewalsDue: 0,
        remindersDue: 0,
        pipelineValue: 0,
      });
    }
    const row = rows.get(ownerId)!;
    row.total += 1;
    if (isOutstanding(a)) {
      row.awaitingSignature += 1;
      row.pipelineValue += a.contractValue ?? 0;
    }
    if (isOverdue(a)) row.overdue += 1;
    if (isRenewalDue(a)) row.renewalsDue += 1;
    if (remindersByAgreement.has(a.id)) row.remindersDue += 1;
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.overdue + b.remindersDue + b.renewalsDue - (a.overdue + a.remindersDue + a.renewalsDue) ||
      b.total - a.total,
  );
}

export const allOwners = ALL_OWNERS;
