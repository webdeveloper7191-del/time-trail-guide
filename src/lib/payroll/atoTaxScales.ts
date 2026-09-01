/**
 * ATO PAYG withholding — coefficient based (NAT 1004 style).
 *
 * The ATO publishes withholding as a set of weekly coefficients per tax scale:
 *
 *     weekly withholding = round( a * x - b )
 *
 * where x is weekly earnings rounded down to a whole dollar plus 99 cents.
 * Fortnightly / monthly amounts are derived by converting the period earnings
 * to a weekly equivalent, computing the weekly withholding, and converting back
 * (monthly earnings are first adjusted by the ATO's 13/3 rule).
 *
 * Study and Training Support Loans (STSL — HELP/VET/SFSS) are withheld as an
 * additional component on repayment income using the marginal repayment rates.
 */

import { PayCycle } from '@/types/payroll';

export type AtoTaxScale =
  | 'scale1' // no tax-free threshold claimed
  | 'scale2' // tax-free threshold claimed (most employees)
  | 'scale3' // foreign resident
  | 'scale4' // no TFN provided
  | 'scale5' // full Medicare levy exemption
  | 'scale6'; // half Medicare levy exemption

export const TAX_SCALE_LABELS: Record<AtoTaxScale, string> = {
  scale1: 'Scale 1 — no tax-free threshold',
  scale2: 'Scale 2 — tax-free threshold claimed',
  scale3: 'Scale 3 — foreign resident',
  scale4: 'Scale 4 — no TFN provided',
  scale5: 'Scale 5 — full Medicare levy exemption',
  scale6: 'Scale 6 — half Medicare levy exemption',
};

interface Coefficient {
  /** Upper bound of weekly earnings (exclusive). */
  upTo: number;
  a: number;
  b: number;
}

/** Scale 1 — TFN provided, tax-free threshold not claimed. */
const SCALE_1: Coefficient[] = [
  { upTo: 150, a: 0.16, b: 0.16 },
  { upTo: 371, a: 0.2117, b: 7.755 },
  { upTo: 515, a: 0.189, b: -0.6702 },
  { upTo: 932, a: 0.3227, b: 68.2367 },
  { upTo: 2246, a: 0.32, b: 65.7202 },
  { upTo: 3303, a: 0.39, b: 222.951 },
  { upTo: Infinity, a: 0.47, b: 487.2587 },
];

/** Scale 2 — TFN provided, tax-free threshold claimed. */
const SCALE_2: Coefficient[] = [
  { upTo: 361, a: 0, b: 0 },
  { upTo: 500, a: 0.16, b: 57.8462 },
  { upTo: 625, a: 0.2117, b: 83.6462 },
  { upTo: 721, a: 0.189, b: 69.4712 },
  { upTo: 865, a: 0.3227, b: 165.4423 },
  { upTo: 1282, a: 0.32, b: 163.0865 },
  { upTo: 2596, a: 0.39, b: 252.7789 },
  { upTo: 3653, a: 0.47, b: 460.4981 },
  { upTo: Infinity, a: 0.55, b: 752.7981 },
];

/** Scale 3 — foreign resident (no tax-free threshold, no Medicare levy). */
const SCALE_3: Coefficient[] = [
  { upTo: 2596, a: 0.3, b: 0.3 },
  { upTo: 3653, a: 0.37, b: 181.7308 },
  { upTo: Infinity, a: 0.45, b: 474.0385 },
];

const SCALES: Record<'scale1' | 'scale2' | 'scale3', Coefficient[]> = {
  scale1: SCALE_1,
  scale2: SCALE_2,
  scale3: SCALE_3,
};

const MEDICARE_LEVY = 0.02;

/** Weekly conversion factors. Monthly uses the ATO 13/3 rule. */
const WEEKS: Record<PayCycle, number> = { weekly: 1, fortnightly: 2, monthly: 13 / 3 };

const round2 = (n: number) => Math.round(n * 100) / 100;

function weeklyWithholding(weeklyEarnings: number, scale: AtoTaxScale): number {
  if (weeklyEarnings <= 0) return 0;

  // No TFN: flat 47% of earnings, no coefficients, no rounding to the dollar.
  if (scale === 'scale4') return round2(weeklyEarnings * 0.47);

  const table = SCALES[scale === 'scale3' ? 'scale3' : scale === 'scale1' ? 'scale1' : 'scale2'];
  // x = whole dollars + 99 cents, per the ATO instructions.
  const x = Math.floor(weeklyEarnings) + 0.99;
  const row = table.find((r) => x < r.upTo) ?? table[table.length - 1];
  let withheld = row.a * x - row.b;

  // Medicare levy exemptions: scale 2 includes the full 2% levy in its
  // coefficients, so remove all or half of it for the exemption scales.
  if (scale === 'scale5') withheld -= x * MEDICARE_LEVY;
  if (scale === 'scale6') withheld -= x * (MEDICARE_LEVY / 2);

  return Math.max(0, Math.round(withheld));
}

// --- STSL (HELP / VET Student Loan / SFSS) ---------------------------------
// Marginal repayment system: nothing below the minimum threshold, then a
// marginal rate on income above each threshold.
const STSL_BANDS = [
  { from: 67000, to: 125000, rate: 0.15 },
  { from: 125000, to: Infinity, rate: 0.17 },
];

export function stslWeeklyComponent(weeklyEarnings: number): number {
  const annual = weeklyEarnings * 52;
  const repayment = STSL_BANDS.reduce(
    (sum, band) => sum + Math.max(0, Math.min(annual, band.to) - band.from) * band.rate,
    0,
  );
  return Math.max(0, Math.round(repayment / 52));
}

export interface WithholdingInput {
  taxableGross: number;
  cycle: PayCycle;
  scale: AtoTaxScale;
  hasStsl?: boolean;
}

export interface WithholdingResult {
  /** Total withheld (tax + STSL) — what goes on the payslip as PAYG. */
  total: number;
  /** Income tax component only. */
  tax: number;
  /** Study and training support loan component. */
  stsl: number;
}

/** Withholding for a pay period using the ATO weekly coefficients. */
export function calculateWithholding({ taxableGross, cycle, scale, hasStsl }: WithholdingInput): WithholdingResult {
  if (taxableGross <= 0) return { total: 0, tax: 0, stsl: 0 };

  const weeks = WEEKS[cycle];
  const weekly = taxableGross / weeks;

  const weeklyTax = weeklyWithholding(weekly, scale);
  // STSL is not withheld for foreign residents on scale 3 who have no loan,
  // and never applies when no TFN was provided (already withheld at 47%).
  const weeklyStsl = hasStsl && scale !== 'scale4' ? stslWeeklyComponent(weekly) : 0;

  const tax = round2(weeklyTax * weeks);
  const stsl = round2(weeklyStsl * weeks);
  return { total: round2(tax + stsl), tax, stsl };
}

/** Map the legacy payroll-settings scale onto an ATO scale. */
export function legacyScaleToAto(scale: 'resident' | 'no_tfn' | 'none'): AtoTaxScale | null {
  if (scale === 'none') return null;
  if (scale === 'no_tfn') return 'scale4';
  return 'scale2';
}
