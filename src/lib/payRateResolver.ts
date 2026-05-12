/**
 * Pay rate resolver
 * Single source of truth for converting between weekly/annual/hourly rates.
 * Uses ordinaryHoursPerWeek (NES default 38) when deriving hourly from weekly.
 */

export interface PayRateInput {
  hourlyRate?: number;
  weeklyRate?: number;
  annualRate?: number;
  /** Defaults to 38 (Australian NES). */
  ordinaryHoursPerWeek?: number;
  /** Defaults to 52. */
  weeksPerYear?: number;
}

export interface ResolvedPayRate {
  hourlyRate: number;
  weeklyRate: number;
  annualRate: number;
  ordinaryHoursPerWeek: number;
  source: 'hourly' | 'weekly' | 'annual';
}

const DEFAULT_HOURS_PER_WEEK = 38;
const DEFAULT_WEEKS_PER_YEAR = 52;

/**
 * Resolve a single canonical hourly rate from any combination of inputs.
 * Priority: explicit hourly > weekly / hours > annual / (weeks * hours).
 */
export function resolveHourlyRate(input: PayRateInput): ResolvedPayRate {
  const ordinaryHoursPerWeek = input.ordinaryHoursPerWeek && input.ordinaryHoursPerWeek > 0
    ? input.ordinaryHoursPerWeek
    : DEFAULT_HOURS_PER_WEEK;
  const weeksPerYear = input.weeksPerYear ?? DEFAULT_WEEKS_PER_YEAR;

  let hourlyRate: number;
  let source: ResolvedPayRate['source'];

  if (input.hourlyRate && input.hourlyRate > 0) {
    hourlyRate = input.hourlyRate;
    source = 'hourly';
  } else if (input.weeklyRate && input.weeklyRate > 0) {
    hourlyRate = input.weeklyRate / ordinaryHoursPerWeek;
    source = 'weekly';
  } else if (input.annualRate && input.annualRate > 0) {
    hourlyRate = input.annualRate / (weeksPerYear * ordinaryHoursPerWeek);
    source = 'annual';
  } else {
    hourlyRate = 0;
    source = 'hourly';
  }

  const weeklyRate = hourlyRate * ordinaryHoursPerWeek;
  const annualRate = weeklyRate * weeksPerYear;

  return { hourlyRate, weeklyRate, annualRate, ordinaryHoursPerWeek, source };
}

export function weeklyToHourly(weekly: number, ordinaryHoursPerWeek = DEFAULT_HOURS_PER_WEEK): number {
  if (!weekly || ordinaryHoursPerWeek <= 0) return 0;
  return weekly / ordinaryHoursPerWeek;
}

export function annualToHourly(annual: number, ordinaryHoursPerWeek = DEFAULT_HOURS_PER_WEEK, weeksPerYear = DEFAULT_WEEKS_PER_YEAR): number {
  if (!annual || ordinaryHoursPerWeek <= 0) return 0;
  return annual / (weeksPerYear * ordinaryHoursPerWeek);
}
