import { DateRange } from 'react-day-picker';
import { parseISO, isWithinInterval, isValid } from 'date-fns';

/**
 * Generic date-range filter for report records.
 * Tries common date field names: date, startDate, issueDate, period, weekStart.
 */
const DATE_FIELDS = ['date', 'startDate', 'issueDate', 'period', 'weekStart', 'weekEnding'] as const;

export function filterByDateRange<T extends Record<string, any>>(
  data: T[],
  range: DateRange | undefined,
  dateField?: string
): T[] {
  if (!range?.from) return data;
  const from = range.from;
  const to = range.to || from;

  return data.filter(item => {
    const field = dateField || DATE_FIELDS.find(f => f in item);
    if (!field || !item[field]) return true; // no date field → include
    try {
      const d = typeof item[field] === 'string' ? parseISO(item[field]) : item[field];
      if (!isValid(d)) return true;
      return isWithinInterval(d, { start: from, end: to });
    } catch {
      return true;
    }
  });
}

/**
 * Compute period-over-period delta metrics.
 * Returns { current, previous, delta, deltaPct } for a numeric accessor.
 */
export function computePeriodDelta<T>(
  currentData: T[],
  previousData: T[],
  accessor: (items: T[]) => number
): { current: number; previous: number; delta: number; deltaPct: number } {
  const current = accessor(currentData);
  const previous = accessor(previousData);
  const delta = current - previous;
  const deltaPct = previous !== 0 ? (delta / previous) * 100 : 0;
  return { current, previous, delta, deltaPct };
}
