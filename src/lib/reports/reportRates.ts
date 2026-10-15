import { useEffect, useState } from 'react';

/**
 * Organisation-level cost assumptions used across report calculations.
 * These were previously hardcoded ($32/h, $35/h, $45/h, $48/h, $180, $250, $280, $480, etc.)
 * scattered through individual report components. They are now centralised here as
 * editable, persisted "estimates" so a single change updates every report consistently.
 *
 * All figures are estimates unless a report has the staff member's actual rate/award
 * penalty/agency rate available — reports should prefer real data and only fall back
 * to these settings when an estimate is unavoidable (and should label it as such).
 */
export interface ReportRates {
  /** Estimated average internal hourly rate, used for unused-capacity and generic labour cost estimates. */
  internalHourlyRate: number;
  /** Estimated internal hourly rate used as the baseline for agency premium comparisons. */
  agencyBaselineRate: number;
  /** Hourly rate above which an agency's average rate is flagged as high in tables. */
  agencyHighRateThreshold: number;
  /** Flat estimate for a single agency-filled shift when no per-shift cost is recorded. */
  agencyShiftCost: number;
  /** Estimated overtime penalty rate per hour. */
  overtimePenaltyRate: number;
  /** Estimated hourly rate used for coverage-gap cost impact. */
  coverageGapHourlyRate: number;
  /** Assumed average shift duration (hours) used for coverage-gap cost impact. */
  coverageGapShiftHours: number;
  /** Estimated cost per open shift of exposure/risk (used in Multi-Location dashboard). */
  openShiftExposureRate: number;
  /** Estimated cost per missed recurring-pattern shift. */
  missedPatternShiftCost: number;
  /** Estimated cost per absent staff day (used in attendance-type reports). */
  absenceDailyCost: number;
  /** On-costs (super, leave loading, workers' comp, payroll tax) as a % added on top of wages. */
  onCostPercent: number;
}

export const REPORT_RATE_DEFAULTS: ReportRates = {
  internalHourlyRate: 32,
  agencyBaselineRate: 35,
  agencyHighRateThreshold: 55,
  agencyShiftCost: 480,
  overtimePenaltyRate: 48,
  coverageGapHourlyRate: 45,
  coverageGapShiftHours: 4,
  openShiftExposureRate: 280,
  missedPatternShiftCost: 180,
  absenceDailyCost: 250,
  onCostPercent: 25,
};

export const REPORT_RATE_FIELDS: {
  key: keyof ReportRates;
  label: string;
  prefix?: string;
  suffix?: string;
  description: string;
}[] = [
  { key: 'internalHourlyRate', label: 'Internal hourly rate', prefix: '$', suffix: '/h', description: 'Used to cost unused capacity when a staff member\'s actual rate is unavailable.' },
  { key: 'agencyBaselineRate', label: 'Agency premium baseline rate', prefix: '$', suffix: '/h', description: 'Internal rate used to calculate the agency premium %.' },
  { key: 'agencyHighRateThreshold', label: 'Agency high-rate threshold', prefix: '$', suffix: '/h', description: 'Agency rates above this are flagged in tables.' },
  { key: 'agencyShiftCost', label: 'Agency shift cost (estimate)', prefix: '$', description: 'Flat per-shift estimate used when an agency fill has no recorded cost.' },
  { key: 'overtimePenaltyRate', label: 'Overtime penalty rate (estimate)', prefix: '$', suffix: '/h', description: 'Used to estimate overtime cost when an actual award rate isn\'t available.' },
  { key: 'coverageGapHourlyRate', label: 'Coverage gap hourly rate (estimate)', prefix: '$', suffix: '/h', description: 'Used with the assumed shift length to estimate the cost of coverage gaps.' },
  { key: 'coverageGapShiftHours', label: 'Coverage gap shift length (estimate)', suffix: 'h', description: 'Assumed average shift length used in the coverage gap cost estimate.' },
  { key: 'openShiftExposureRate', label: 'Open shift exposure cost (estimate)', prefix: '$', description: 'Per-open-shift cost exposure estimate used on the Multi-Location dashboard.' },
  { key: 'missedPatternShiftCost', label: 'Missed pattern shift cost (estimate)', prefix: '$', description: 'Estimated cost of a shift missed against a recurring pattern.' },
  { key: 'absenceDailyCost', label: 'Absence daily cost (estimate)', prefix: '$', description: 'Estimated daily cost of an unplanned absence.' },
  { key: 'onCostPercent', label: 'On-costs', suffix: '%', description: 'Superannuation, leave loading, workers\' comp and payroll tax added on top of wages.' },
];

const STORAGE_KEY = 'reports.costAssumptions.v1';
const listeners = new Set<() => void>();
let cache: ReportRates | null = null;

function load(): ReportRates {
  if (typeof window === 'undefined') return { ...REPORT_RATE_DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...REPORT_RATE_DEFAULTS, ...JSON.parse(raw) } : { ...REPORT_RATE_DEFAULTS };
  } catch {
    return { ...REPORT_RATE_DEFAULTS };
  }
}

export function getReportRates(): ReportRates {
  if (!cache) cache = load();
  return cache;
}

export function setReportRates(update: Partial<ReportRates>): ReportRates {
  cache = { ...getReportRates(), ...update };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
  listeners.forEach((fn) => fn());
  return cache;
}

export function resetReportRates(): ReportRates {
  cache = { ...REPORT_RATE_DEFAULTS };
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn());
  return cache;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** React hook returning the current cost assumptions, re-rendering when they change. */
export function useReportRates(): ReportRates {
  const [rates, setRates] = useState<ReportRates>(() => getReportRates());
  useEffect(() => subscribe(() => setRates(getReportRates())), []);
  return rates;
}
