/**
 * Back-pay for late-approved rate changes. The manager chooses per approval:
 * backdate to the date the change was due, or start from the approval date.
 */
export type BackPayChoice = 'backdate' | 'from_approval';

export interface BackPayAdjustment {
  id: string;
  staffId: string;
  reviewTitle: string;
  /** Date the new rate should have started (inclusive). */
  from: string;
  /** Approval date (exclusive) — new rate applies from here anyway. */
  to: string;
  fromPercent: number;
  toPercent: number;
  status: 'pending_pay_run' | 'paid';
  createdAt: string;
}

const DAY = 86_400_000;

export function daysLate(effectiveFrom: string | undefined, approvalDate: Date): number {
  if (!effectiveFrom) return 0;
  const e = new Date(effectiveFrom + 'T00:00:00');
  const a = new Date(approvalDate.getFullYear(), approvalDate.getMonth(), approvalDate.getDate());
  return Math.max(0, Math.round((a.getTime() - e.getTime()) / DAY));
}

/**
 * Amount owed for hours worked between `from` and `to` at the old rate.
 * (adultRate × (toPercent − fromPercent) / 100) × hours, rounded to cents.
 */
export function backPayAmount(adultRate: number, hoursWorked: number, fromPercent: number, toPercent: number): number {
  return Math.round(adultRate * ((toPercent - fromPercent) / 100) * hoursWorked * 100) / 100;
}
