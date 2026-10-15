/**
 * Shared metric helpers used across report components so that the same
 * metric (weighted average, band classification, trend, annual projection)
 * is calculated the same way everywhere in the product.
 */

/** Volume-weighted average. Falls back to 0 when there is no weight (e.g. empty data). */
export function weightedAverage<T>(
  items: T[],
  valueFn: (item: T) => number,
  weightFn: (item: T) => number
): number {
  let totalWeight = 0;
  let totalValue = 0;
  for (const item of items) {
    const w = weightFn(item);
    if (!Number.isFinite(w) || w <= 0) continue;
    totalWeight += w;
    totalValue += valueFn(item) * w;
  }
  return totalWeight > 0 ? totalValue / totalWeight : 0;
}

/** Simple (unweighted) average — kept for cases where every item genuinely carries equal weight. */
export function simpleAverage<T>(items: T[], valueFn: (item: T) => number): number {
  if (items.length === 0) return 0;
  return items.reduce((s, i) => s + valueFn(i), 0) / items.length;
}

export type BandVariant = 'success' | 'warning' | 'danger';

export interface Band {
  /** Inclusive upper bound of this band (use Infinity for the top band). */
  upTo: number;
  label: string;
  variant: BandVariant;
}

export interface BandResult {
  label: string;
  variant: BandVariant;
}

/**
 * Classify a value against a set of contiguous, ascending bands.
 * Bands must have no gaps between them — the first band whose `upTo` is
 * greater than or equal to the value wins, so the whole number line from
 * -Infinity to the last band's Infinity is covered with no holes.
 */
export function classifyBand(value: number, bands: Band[]): BandResult {
  const sorted = [...bands].sort((a, b) => a.upTo - b.upTo);
  for (const band of sorted) {
    if (value <= band.upTo) return { label: band.label, variant: band.variant };
  }
  const last = sorted[sorted.length - 1];
  return last ? { label: last.label, variant: last.variant } : { label: '—', variant: 'warning' };
}

/** Builds a contiguous band set from ascending thresholds, closing any gaps automatically. */
export function buildContiguousBands(
  thresholds: { upTo: number; label: string; variant: BandVariant }[]
): Band[] {
  return [...thresholds].sort((a, b) => a.upTo - b.upTo);
}

export interface TrendResult {
  /** Percentage change of the latter half vs the former half of the series. */
  deltaPct: number;
  /** Absolute change of the latter half average vs the former half average. */
  deltaAbs: number;
  direction: 'up' | 'down' | 'flat';
}

/**
 * Deterministically derives a period-over-period trend from a real historical
 * series (e.g. an 8-week per-record history), comparing the average of the
 * second half of the series against the average of the first half. No
 * randomness is involved — the same input always produces the same output.
 */
export function trendFromSeries(series: number[]): TrendResult {
  if (!series || series.length < 2) return { deltaPct: 0, deltaAbs: 0, direction: 'flat' };
  const mid = Math.floor(series.length / 2);
  const first = series.slice(0, mid);
  const second = series.slice(mid);
  const firstAvg = simpleAverage(first, (v) => v);
  const secondAvg = simpleAverage(second, (v) => v);
  const deltaAbs = secondAvg - firstAvg;
  const deltaPct = firstAvg !== 0 ? (deltaAbs / firstAvg) * 100 : 0;
  return {
    deltaAbs: Math.round(deltaAbs * 100) / 100,
    deltaPct: Math.round(deltaPct * 10) / 10,
    direction: deltaAbs > 0.001 ? 'up' : deltaAbs < -0.001 ? 'down' : 'flat',
  };
}

/**
 * Averages a numeric history array (e.g. `utilisationPercentTrend`) across a set of
 * records, position by position, to build a real, data-derived series for charts
 * instead of generating one with Math.random() on every render.
 */
export function aggregateTrendSeries<T>(
  records: T[],
  accessor: (item: T) => number[] | undefined
): number[] {
  const series = records.map((r) => accessor(r) || []).filter((s) => s.length > 0);
  if (series.length === 0) return [];
  const length = Math.max(...series.map((s) => s.length));
  const result: number[] = [];
  for (let i = 0; i < length; i++) {
    const valuesAtIndex = series
      .map((s) => (i < s.length ? s[i] : undefined))
      .filter((v): v is number => typeof v === 'number');
    result.push(valuesAtIndex.length > 0 ? simpleAverage(valuesAtIndex, (v) => v) : 0);
  }
  return result;
}

/**
 * Period-over-period comparison computed directly from the dataset: splits the
 * records into two equal time-based halves (same length) and compares a metric
 * across them. Used instead of fixed "vs last period" numbers.
 */
export function periodOverPeriod<T>(
  data: T[],
  dateAccessor: (item: T) => string | Date | undefined,
  valueFn: (items: T[]) => number
): TrendResult {
  const withDates = data
    .map((item) => ({ item, date: dateAccessor(item) }))
    .filter((d): d is { item: T; date: string | Date } => !!d.date)
    .map((d) => ({ item: d.item, time: new Date(d.date).getTime() }))
    .filter((d) => !Number.isNaN(d.time))
    .sort((a, b) => a.time - b.time);

  if (withDates.length < 2) return { deltaPct: 0, deltaAbs: 0, direction: 'flat' };

  const minTime = withDates[0].time;
  const maxTime = withDates[withDates.length - 1].time;
  const midpoint = minTime + (maxTime - minTime) / 2;

  const previous = withDates.filter((d) => d.time < midpoint).map((d) => d.item);
  const current = withDates.filter((d) => d.time >= midpoint).map((d) => d.item);

  const currentValue = valueFn(current);
  const previousValue = valueFn(previous);
  const deltaAbs = currentValue - previousValue;
  const deltaPct = previousValue !== 0 ? (deltaAbs / previousValue) * 100 : 0;

  return {
    deltaAbs: Math.round(deltaAbs * 100) / 100,
    deltaPct: Math.round(deltaPct * 10) / 10,
    direction: deltaAbs > 0.001 ? 'up' : deltaAbs < -0.001 ? 'down' : 'flat',
  };
}

/**
 * Projects a period figure to a full year, scaled by the number of days
 * actually covered rather than a fixed multiplier (e.g. x52 assuming a week,
 * or x4 assuming a quarter).
 */
export function annualProjection(periodValue: number, daysInPeriod: number): number {
  if (!daysInPeriod || daysInPeriod <= 0) return 0;
  return Math.round((periodValue * 365) / daysInPeriod);
}

/** Number of whole days spanned by a set of dated records (minimum 1). */
export function daysSpanned(dates: (string | Date | undefined)[]): number {
  const times = dates
    .filter((d): d is string | Date => !!d)
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t));
  if (times.length === 0) return 1;
  const span = Math.max(...times) - Math.min(...times);
  return Math.max(1, Math.round(span / (1000 * 60 * 60 * 24)) + 1);
}

/** Gini coefficient of inequality (0 = perfectly equal, 1 = maximally unequal). Shared so every report using it agrees. */
export function giniCoefficient(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return 0;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  if (mean === 0) return 0;
  const sumDiffs = sorted.reduce((s, v, i) => s + (2 * (i + 1) - n - 1) * v, 0);
  return Math.round((sumDiffs / (n * n * mean)) * 100) / 100;
}
