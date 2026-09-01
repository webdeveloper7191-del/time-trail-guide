import { addDays, addMonths, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { PayCalendar, PayCycle } from '@/types/payroll';

/** Number of days in one period of a cycle (monthly is handled by calendar month). */
export const cycleLengthDays: Record<PayCycle, number> = {
  weekly: 7,
  fortnightly: 14,
  monthly: 30,
};

export interface PayPeriod {
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  index: number;
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

/** The period of a calendar that contains `reference`. */
export function periodContaining(calendar: PayCalendar, reference: Date = new Date()): PayPeriod {
  const anchor = parseISO(calendar.anchorDate);

  if (calendar.cycle === 'monthly') {
    const months =
      (reference.getFullYear() - anchor.getFullYear()) * 12 + (reference.getMonth() - anchor.getMonth());
    const start = addMonths(anchor, Math.max(months, 0));
    const end = addDays(addMonths(start, 1), -1);
    return {
      periodStart: iso(start),
      periodEnd: iso(end),
      paymentDate: iso(addDays(end, calendar.paymentOffsetDays)),
      index: Math.max(months, 0),
    };
  }

  const len = cycleLengthDays[calendar.cycle];
  const elapsed = differenceInCalendarDays(reference, anchor);
  const index = Math.floor(elapsed / len);
  const start = addDays(anchor, index * len);
  const end = addDays(start, len - 1);
  return {
    periodStart: iso(start),
    periodEnd: iso(end),
    paymentDate: iso(addDays(end, calendar.paymentOffsetDays)),
    index,
  };
}

/** Shift a period forward or backward by `offset` periods. */
export function periodAtOffset(calendar: PayCalendar, offset: number, reference: Date = new Date()): PayPeriod {
  const current = periodContaining(calendar, reference);
  const base = parseISO(current.periodStart);
  const next =
    calendar.cycle === 'monthly'
      ? addMonths(base, offset)
      : addDays(base, offset * cycleLengthDays[calendar.cycle]);
  return periodContaining(calendar, next);
}

/** The most recent periods for a calendar, newest first. */
export function recentPeriods(calendar: PayCalendar, count = 6, reference: Date = new Date()): PayPeriod[] {
  return Array.from({ length: count }, (_, i) => periodAtOffset(calendar, -i, reference));
}

export const cycleLabel: Record<PayCycle, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
};
