import { Timesheet, ClockEntry } from '@/types/timesheet';
import { calculateAllowanceTotal } from '@/types/allowances';
import { StaffMember } from '@/types/staff';
import { getDayType } from '@/lib/awardInterpreter';
import {
  PayComponent,
  PayRun,
  PayRunAdjustment,
  PayRunLine,
  PayRunTotals,
  PayCycle,
  PayrollSettings,
  StandingDeduction,
} from '@/types/payroll';
import { payrollStore } from './payrollStore';
import {
  EmployeePayProfile,
  getPayrollStaffDirectory,
  resolveEmployeePayProfile,
  rosteredHoursByStaff,
} from './payrollEmployeeBridge';

/**
 * Pay run engine.
 *
 * Prices approved timesheets against real employee data:
 *   • base rate resolved from the staff member's pay conditions / award floor
 *   • casual loading for casual employment types
 *   • Saturday / Sunday / public holiday penalties from the award
 *   • overtime at the award's first-2-hours / thereafter steps (or a flat multiplier)
 *   • allowances applied on the timesheet plus the staff member's standing allowances
 *   • PAYG withholding, super guarantee and net pay from the payroll settings
 *
 * Rostered hours from the schedule are attached for pay-vs-roster variance checks.
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
  /** Workforce directory override (defaults to the live staff list). */
  staff?: StaffMember[];
  calendarId?: string;
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

interface Bucket {
  hours: number;
  multiplier: number;
  label: string;
}

/** Split a day's paid hours into ordinary/penalty buckets and overtime steps. */
function bucketEntry(
  entry: ClockEntry,
  profile: EmployeePayProfile,
  settings: PayrollSettings,
): { ordinary: Bucket[]; overtime: Bucket[] } {
  const paidHours = Math.max(entry.netHours ?? 0, 0);
  const overtimeHours = Math.min(Math.max(entry.overtime ?? 0, 0), paidHours);
  const ordinaryHours = round2(paidHours - overtimeHours);

  const award = profile.award;
  const dayType = getDayType(entry.date);

  let multiplier = 1;
  let label = 'Ordinary hours';
  if (settings.useAwardPenalties && award) {
    if (dayType === 'saturday' && award.saturdayRate) {
      multiplier = award.saturdayRate / 100;
      label = 'Saturday penalty';
    } else if (dayType === 'sunday' && award.sundayRate) {
      multiplier = award.sundayRate / 100;
      label = 'Sunday penalty';
    } else if (dayType === 'public_holiday' && award.publicHolidayRate) {
      multiplier = award.publicHolidayRate / 100;
      label = 'Public holiday penalty';
    } else if (award.penaltyRates) {
      const startHour = Number((entry.clockIn ?? '00:00').split(':')[0]);
      const endHour = Number((entry.clockOut ?? '00:00').split(':')[0]);
      if (award.penaltyRates.night && (startHour >= 22 || endHour >= 22 || endHour < 6)) {
        multiplier = award.penaltyRates.night / 100;
        label = 'Night penalty';
      } else if (award.penaltyRates.earlyMorning && startHour < 6) {
        multiplier = award.penaltyRates.earlyMorning / 100;
        label = 'Early morning penalty';
      } else if (award.penaltyRates.evening && endHour >= 18) {
        multiplier = award.penaltyRates.evening / 100;
        label = 'Evening penalty';
      }
    }
  }

  const ordinary: Bucket[] = ordinaryHours > 0 ? [{ hours: ordinaryHours, multiplier, label }] : [];

  const overtime: Bucket[] = [];
  if (overtimeHours > 0) {
    if (settings.useAwardOvertimeRates && award?.overtimeRates) {
      const first = Math.min(overtimeHours, 2);
      const rest = round2(overtimeHours - first);
      if (first > 0) overtime.push({ hours: round2(first), multiplier: award.overtimeRates.first2Hours / 100, label: `Overtime first 2 hrs (${award.overtimeRates.first2Hours}%)` });
      if (rest > 0) overtime.push({ hours: rest, multiplier: award.overtimeRates.after2Hours / 100, label: `Overtime thereafter (${award.overtimeRates.after2Hours}%)` });
    } else {
      overtime.push({ hours: round2(overtimeHours), multiplier: settings.overtimeMultiplier, label: `Overtime x${settings.overtimeMultiplier}` });
    }
  }

  return { ordinary, overtime };
}

function mergeBuckets(buckets: Bucket[]): Bucket[] {
  const map = new Map<string, Bucket>();
  buckets.forEach((b) => {
    const key = `${b.label}|${b.multiplier}`;
    const existing = map.get(key);
    if (existing) existing.hours = round2(existing.hours + b.hours);
    else map.set(key, { ...b });
  });
  return Array.from(map.values());
}

function buildLine(
  timesheets: Timesheet[],
  settings: PayrollSettings,
  cycle: PayCycle,
  staff: StaffMember[],
  rosterHours: Record<string, number>,
  periodStart: string,
  periodEnd: string,
): PayRunLine {
  const first = timesheets[0];
  const profile = resolveEmployeePayProfile(first.employee, settings, staff);
  const warnings: string[] = [...profile.notes];

  const loadedRate = round2(profile.baseRate * (1 + profile.casualLoadingPct / 100));
  if (!loadedRate) warnings.push('No hourly rate on file — line pays $0 until a rate is set.');

  const ordinaryBuckets: Bucket[] = [];
  const overtimeBuckets: Bucket[] = [];

  timesheets.forEach((t) => {
    t.entries
      .filter((e) => inPeriod(e.date, periodStart, periodEnd))
      .forEach((e) => {
        const { ordinary, overtime } = bucketEntry(e, profile, settings);
        ordinaryBuckets.push(...ordinary);
        overtimeBuckets.push(...overtime);
      });
  });

  const components: PayComponent[] = [];

  mergeBuckets(ordinaryBuckets).forEach((b, i) => {
    const rate = round2(loadedRate * b.multiplier);
    components.push({
      id: `${first.employee.id}-ord-${i}`,
      kind: b.multiplier > 1 ? 'penalty' : 'ordinary',
      label: profile.casualLoadingPct ? `${b.label} (incl. ${profile.casualLoadingPct}% casual loading)` : b.label,
      units: b.hours,
      rate,
      amount: round2(b.hours * rate),
      superable: true,
      taxable: true,
    });
  });

  mergeBuckets(overtimeBuckets).forEach((b, i) => {
    const rate = round2(loadedRate * b.multiplier);
    components.push({
      id: `${first.employee.id}-ot-${i}`,
      kind: 'overtime',
      label: b.label,
      units: b.hours,
      rate,
      amount: round2(b.hours * rate),
      superable: settings.superOnOvertime,
      taxable: true,
    });
  });

  // Allowances captured on the timesheet
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

  const ordinaryHours = round2(mergeBuckets(ordinaryBuckets).reduce((s, b) => s + b.hours, 0));
  const overtimeHours = round2(mergeBuckets(overtimeBuckets).reduce((s, b) => s + b.hours, 0));
  const penaltyHours = round2(mergeBuckets(ordinaryBuckets).filter((b) => b.multiplier > 1).reduce((s, b) => s + b.hours, 0));
  const shiftCount = timesheets.reduce((s, t) => s + t.entries.filter((e) => inPeriod(e.date, periodStart, periodEnd)).length, 0);

  // Standing allowances from the staff record (award + custom)
  const record = staff.find((s) => s.id === profile.staffRecordId);
  const standing = [...(profile.award?.allowances ?? []), ...(record?.customAllowances ?? [])];
  standing.forEach((a, i) => {
    const units = a.type === 'per_hour' ? round2(ordinaryHours + overtimeHours) : a.type === 'per_shift' ? shiftCount : 1;
    if (!units) return;
    components.push({
      id: `${profile.staffRecordId ?? first.employee.id}-standing-${a.id ?? i}`,
      kind: 'allowance',
      label: `${a.name} (${a.type.replace('_', ' ')})`,
      units,
      rate: a.amount,
      amount: round2(units * a.amount),
      superable: a.superGuarantee,
      taxable: a.taxable,
    });
  });

  const grossPay = round2(components.filter((c) => c.kind !== 'deduction').reduce((s, c) => s + c.amount, 0));
  const deductions = round2(components.filter((c) => c.kind === 'deduction').reduce((s, c) => s + c.amount, 0));
  const taxableGross = round2(components.filter((c) => c.taxable && c.kind !== 'deduction').reduce((s, c) => s + c.amount, 0));
  const superableGross = round2(components.filter((c) => c.superable).reduce((s, c) => s + c.amount, 0));

  const scale: PayrollSettings['taxScale'] =
    settings.taxScale === 'resident' && profile.dataSource === 'staff_record' && !profile.hasTfn
      ? 'no_tfn'
      : settings.taxScale;

  const paygTax = calculatePaygTax(taxableGross, cycle, scale);
  const monthlyEquivalent = superableGross * (PERIODS_PER_YEAR[cycle] / 12);
  const superGuarantee = monthlyEquivalent >= settings.superMonthlyThreshold
    ? round2(superableGross * (settings.superRate / 100))
    : 0;
  const rawNet = grossPay - paygTax - deductions;
  const netPay = settings.roundNetToCents ? round2(rawNet) : rawNet;

  const unapproved = timesheets.filter((t) => t.status !== 'approved');
  if (unapproved.length) warnings.push(`${unapproved.length} timesheet(s) not approved.`);
  if (timesheets.some((t) => t.entries.some((e) => !e.clockOut))) warnings.push('Open clock entry with no clock-out.');
  if (timesheets.some((t) => t.entries.some((e) => e.exception && !e.exception.resolved))) warnings.push('Unresolved timesheet exception.');

  let rosteredHours: number | undefined;
  let rosterVarianceHours: number | undefined;
  if (settings.compareToRoster && profile.rosterStaffId) {
    rosteredHours = rosterHours[profile.rosterStaffId] ?? 0;
    rosterVarianceHours = round2(ordinaryHours + overtimeHours - rosteredHours);
    if (Math.abs(rosterVarianceHours) > settings.rosterVarianceToleranceHours) {
      warnings.push(
        `Paid hours differ from the roster by ${rosterVarianceHours > 0 ? '+' : ''}${rosterVarianceHours}h (rostered ${rosteredHours}h).`,
      );
    }
  }

  return {
    id: `line-${first.employee.id}`,
    staffId: first.employee.id,
    staffName: first.employee.name,
    employeeNumber: profile.employeeNumber ?? first.employee.id,
    payrollId: profile.payrollId,
    locationId: first.location?.id,
    locationName: first.location?.name,
    employmentType: profile.employmentType ?? first.employee.position,
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
    staffRecordId: profile.staffRecordId,
    dataSource: profile.dataSource,
    baseRate: profile.baseRate,
    rateSource: profile.rateSource,
    awardName: profile.award?.awardName,
    classification: profile.award ? `${profile.award.classification} ${profile.award.level}` : profile.payCondition?.classification,
    casualLoadingPct: profile.casualLoadingPct || undefined,
    penaltyHours,
    rosteredHours,
    rosterVarianceHours,
    superFundName: profile.superFundName,
    bankAccountMasked: profile.bankAccountMasked,
    bankBsb: profile.bankBsb,
    bankAccountNumber: profile.bankAccountNumber,
    bankAccountName: profile.bankAccountName,

    hasTfn: profile.hasTfn,
    incomeStream: profile.incomeStream,
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
  const staff = input.staff ?? getPayrollStaffDirectory();

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

  const rosterHours = settings.compareToRoster ? rosteredHoursByStaff(periodStart, periodEnd) : {};

  const lines = Array.from(byStaff.values())
    .map((ts) => buildLine(ts, settings, cycle, staff, rosterHours, periodStart, periodEnd))
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
