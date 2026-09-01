import { Timesheet } from '@/types/timesheet';
import { calculateAllowanceTotal } from '@/types/allowances';
import {
  PayComponent,
  PayRun,
  PayRunLine,
  PayRunTotals,
  PayCycle,
  PayrollSettings,
} from '@/types/payroll';

/**
 * Pay run engine.
 *
 * Turns approved timesheets inside a pay period into payable lines:
 *   ordinary hours x rate
 * + overtime hours x rate x overtime multiplier
 * + allowances (from the timesheet's applied allowances)
 * = gross -> PAYG withholding -> net, plus super guarantee on ordinary earnings.
 *
 * All maths is pure and deterministic so a run can be regenerated at any time.
 */

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface BuildPayRunInput {
  name: string;
  cycle: PayCycle;
  periodStart: string; // yyyy-MM-dd
  periodEnd: string;   // yyyy-MM-dd
  paymentDate: string; // yyyy-MM-dd
  timesheets: Timesheet[];
  settings: PayrollSettings;
  /** Only include approved timesheets (default true) */
  approvedOnly?: boolean;
  locationIds?: string[];
}

/** Annualisation factors used to gross up a period for the tax scale. */
const PERIODS_PER_YEAR: Record<PayCycle, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
};

/**
 * Simplified resident PAYG withholding using the ATO annual thresholds.
 * Annualises period gross, applies marginal rates, then divides back down.
 */
export function calculatePaygTax(taxableGross: number, cycle: PayCycle, scale: PayrollSettings['taxScale']): number {
  if (scale === 'none' || taxableGross <= 0) return 0;
  if (scale === 'no_tfn') return round2(taxableGross * 0.47);

  const periods = PERIODS_PER_YEAR[cycle];
  const annual = taxableGross * periods;

  let tax = 0;
  if (annual <= 18200) tax = 0;
  else if (annual <= 45000) tax = (annual - 18200) * 0.16;
  else if (annual <= 135000) tax = 4288 + (annual - 45000) * 0.3;
  else if (annual <= 190000) tax = 31288 + (annual - 135000) * 0.37;
  else tax = 51638 + (annual - 190000) * 0.45;

  // Medicare levy (2%) above the low-income threshold
  if (annual > 27222) tax += annual * 0.02;

  return round2(tax / periods);
}

function inPeriod(dateStr: string, start: string, end: string) {
  return dateStr >= start && dateStr <= end;
}

function buildLine(
  timesheets: Timesheet[],
  settings: PayrollSettings,
  cycle: PayCycle,
): PayRunLine {
  const first = timesheets[0];
  const rate = first.employee.hourlyRate ?? 0;
  const warnings: string[] = [];

  if (!rate) warnings.push('No hourly rate on file — line pays $0 until a rate is set.');

  const overtimeHours = round2(timesheets.reduce((s, t) => s + (t.overtimeHours || 0), 0));
  const totalHours = round2(timesheets.reduce((s, t) => s + (t.totalHours || 0), 0));
  const ordinaryHours = round2(Math.max(totalHours - overtimeHours, 0));

  const components: PayComponent[] = [];

  if (ordinaryHours > 0) {
    components.push({
      id: `${first.employee.id}-ordinary`,
      kind: 'ordinary',
      label: 'Ordinary hours',
      units: ordinaryHours,
      rate,
      amount: round2(ordinaryHours * rate),
      superable: true,
      taxable: true,
    });
  }

  if (overtimeHours > 0) {
    const otRate = round2(rate * settings.overtimeMultiplier);
    components.push({
      id: `${first.employee.id}-overtime`,
      kind: 'overtime',
      label: `Overtime x${settings.overtimeMultiplier}`,
      units: overtimeHours,
      rate: otRate,
      amount: round2(overtimeHours * otRate),
      superable: false,
      taxable: true,
    });
  }

  timesheets.forEach((t) => {
    (t.appliedAllowances ?? []).forEach((a, i) => {
      components.push({
        id: `${t.id}-allow-${i}`,
        kind: 'allowance',
        label: a.allowanceType?.name ?? 'Allowance',
        units: a.quantity ?? 1,
        rate: a.rate ?? 0,
        amount: round2(a.total ?? calculateAllowanceTotal([a])),
        superable: a.allowanceType?.superIncluded ?? false,
        taxable: a.allowanceType?.taxable ?? true,
      });
    });
  });

  const grossPay = round2(components.filter((c) => c.kind !== 'deduction').reduce((s, c) => s + c.amount, 0));
  const deductions = round2(components.filter((c) => c.kind === 'deduction').reduce((s, c) => s + c.amount, 0));
  const taxableGross = round2(components.filter((c) => c.taxable && c.kind !== 'deduction').reduce((s, c) => s + c.amount, 0));
  const superableGross = round2(components.filter((c) => c.superable).reduce((s, c) => s + c.amount, 0));

  const paygTax = calculatePaygTax(taxableGross, cycle, settings.taxScale);
  const superGuarantee = round2(superableGross * (settings.superRate / 100));
  const netPay = round2(grossPay - paygTax - deductions);

  const unapproved = timesheets.filter((t) => t.status !== 'approved');
  if (unapproved.length) warnings.push(`${unapproved.length} timesheet(s) not approved.`);
  const openEntries = timesheets.some((t) => t.entries.some((e) => !e.clockOut));
  if (openEntries) warnings.push('Open clock entry with no clock-out.');
  const exceptions = timesheets.some((t) => t.entries.some((e) => e.exception && !e.exception.resolved));
  if (exceptions) warnings.push('Unresolved timesheet exception.');

  return {
    id: `line-${first.employee.id}`,
    staffId: first.employee.id,
    staffName: first.employee.name,
    employeeNumber: first.employee.id,
    locationId: first.location?.id,
    locationName: first.location?.name,
    employmentType: first.employee.position,
    timesheetIds: timesheets.map((t) => t.id),
    components,
    ordinaryHours,
    overtimeHours,
    grossPay,
    taxableGross,
    paygTax,
    superGuarantee,
    deductions,
    netPay,
    warnings,
  };
}

export function summariseTotals(lines: PayRunLine[]): PayRunTotals {
  const active = lines.filter((l) => !l.excluded);
  const sum = (fn: (l: PayRunLine) => number) => round2(active.reduce((s, l) => s + fn(l), 0));
  return {
    headcount: active.length,
    ordinaryHours: sum((l) => l.ordinaryHours),
    overtimeHours: sum((l) => l.overtimeHours),
    grossPay: sum((l) => l.grossPay),
    paygTax: sum((l) => l.paygTax),
    superGuarantee: sum((l) => l.superGuarantee),
    deductions: sum((l) => l.deductions),
    netPay: sum((l) => l.netPay),
  };
}

export function buildPayRun(input: BuildPayRunInput): PayRun {
  const { periodStart, periodEnd, settings, cycle, approvedOnly = true } = input;

  const eligible = input.timesheets.filter((t) => {
    if (approvedOnly && t.status !== 'approved') return false;
    if (input.locationIds?.length && !input.locationIds.includes(t.location?.id ?? '')) return false;
    // include the timesheet when its week overlaps the pay period
    return inPeriod(t.weekStartDate, periodStart, periodEnd) || inPeriod(t.weekEndDate, periodStart, periodEnd);
  });

  const byStaff = new Map<string, Timesheet[]>();
  eligible.forEach((t) => {
    const list = byStaff.get(t.employee.id) ?? [];
    list.push(t);
    byStaff.set(t.employee.id, list);
  });

  const lines = Array.from(byStaff.values())
    .map((ts) => buildLine(ts, settings, cycle))
    .sort((a, b) => a.staffName.localeCompare(b.staffName));

  return {
    id: `PR-${Date.now().toString(36).toUpperCase()}`,
    name: input.name,
    cycle,
    periodStart,
    periodEnd,
    paymentDate: input.paymentDate,
    status: 'draft',
    createdAt: new Date().toISOString(),
    lines,
    totals: summariseTotals(lines),
    exports: [],
  };
}

/** Recalculate a run in place (after excluding lines or changing settings). */
export function recalcRun(run: PayRun): PayRun {
  return { ...run, totals: summariseTotals(run.lines) };
}
