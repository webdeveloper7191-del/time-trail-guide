/**
 * Payroll ↔ workforce/awards/roster bridge.
 *
 * Timesheets carry a lightweight `Employee` (id, name, email, position, hourlyRate).
 * The authoritative pay data lives on the workforce `StaffMember` record
 * (pay conditions, award rule, bank/super details) and the roster holds the
 * scheduled hours the payment should reconcile against.
 *
 * This module matches those three sources and produces a single resolved
 * pay profile the pay run engine can price against — no placeholder figures.
 */

import { StaffMember, EmploymentType, PayCondition, AwardRule } from '@/types/staff';
import { Employee as TimesheetEmployee } from '@/types/timesheet';
import { Shift } from '@/types/roster';
import { PayrollSettings, StpIncomeStream } from '@/types/payroll';
import { resolveHourlyRate } from '@/lib/payRateResolver';
import { mockStaff } from '@/data/mockStaffData';
import { generateMockShifts, mockStaff as rosterStaff } from '@/data/mockRosterData';

export interface EmployeePayProfile {
  staffRecordId?: string;
  dataSource: 'staff_record' | 'timesheet_fallback';
  payrollId?: string;
  employeeNumber?: string;
  employmentType?: EmploymentType;
  position?: string;
  /** Base ordinary hourly rate before penalties/loading. */
  baseRate: number;
  rateSource: 'award' | 'pay_condition_hourly' | 'pay_condition_salary' | 'timesheet';
  casualLoadingPct: number;
  award?: AwardRule;
  payCondition?: PayCondition;
  superFundName?: string;
  bankAccountMasked?: string;
  hasTfn: boolean;
  contractedHours?: number;
  incomeStream: StpIncomeStream;
  /** Roster staff id, when the employee could also be matched to the roster. */
  rosterStaffId?: string;
  notes: string[];
}

const norm = (v?: string) => (v ?? '').trim().toLowerCase();
const fullName = (s: StaffMember) => `${s.firstName} ${s.lastName}`.trim();

/** The workforce staff directory payroll prices against. */
export function getPayrollStaffDirectory(): StaffMember[] {
  return mockStaff;
}

/** Match a timesheet employee to a workforce staff record by email, then name, then payroll id. */
export function matchStaffRecord(
  employee: TimesheetEmployee,
  staff: StaffMember[] = getPayrollStaffDirectory(),
): StaffMember | undefined {
  const email = norm(employee.email);
  const name = norm(employee.name);
  return (
    staff.find((s) => email && norm(s.email) === email) ??
    staff.find((s) => name && norm(fullName(s)) === name) ??
    staff.find((s) => name && norm(s.preferredName ? `${s.preferredName} ${s.lastName}` : '') === name) ??
    staff.find((s) => norm(s.employeeId) === norm(employee.id) || norm(s.payrollId) === norm(employee.id))
  );
}

function matchRosterStaffId(name: string, email?: string): string | undefined {
  const n = norm(name);
  const e = norm(email);
  const hit = rosterStaff.find((r) => (e && norm(r.email) === e) || norm(r.name) === n);
  return hit?.id;
}

function maskAccount(accountNumber?: string) {
  if (!accountNumber) return undefined;
  const tail = accountNumber.slice(-3);
  return `••• ${tail}`;
}

const incomeStreamFor = (type?: EmploymentType): StpIncomeStream =>
  type === 'contractor' ? 'LAB' : 'SAW';

/**
 * Resolve the pay profile for a timesheet employee.
 * Rate precedence: award rate (when enabled) → pay condition hourly →
 * pay condition salary annualised → timesheet rate (fallback).
 */
export function resolveEmployeePayProfile(
  employee: TimesheetEmployee,
  settings: PayrollSettings,
  staff: StaffMember[] = getPayrollStaffDirectory(),
): EmployeePayProfile {
  const record = matchStaffRecord(employee, staff);
  const notes: string[] = [];

  if (!record) {
    return {
      dataSource: 'timesheet_fallback',
      baseRate: employee.hourlyRate ?? 0,
      rateSource: 'timesheet',
      casualLoadingPct: 0,
      hasTfn: false,
      position: employee.position,
      incomeStream: 'SAW',
      rosterStaffId: matchRosterStaffId(employee.name, employee.email),
      notes: ['No workforce record matched — paying at the timesheet rate.'],
    };
  }

  const pc = record.currentPayCondition;
  const award = record.applicableAward;
  const employmentType = pc?.employmentType;

  const resolved = resolveHourlyRate({
    hourlyRate: pc?.payRateType === 'salary' ? undefined : pc?.hourlyRate,
    annualRate: pc?.annualSalary,
    ordinaryHoursPerWeek: pc?.contractedHours && pc.payPeriod === 'weekly'
      ? pc.contractedHours
      : settings.ordinaryHoursPerWeek,
  });

  let baseRate = resolved.hourlyRate;
  let rateSource: EmployeePayProfile['rateSource'] =
    resolved.source === 'annual' ? 'pay_condition_salary' : 'pay_condition_hourly';

  if (settings.useAwardRates && award?.baseHourlyRate) {
    if (award.baseHourlyRate > baseRate || !baseRate) {
      // The award rate is the legal floor — never pay under it.
      if (baseRate && award.baseHourlyRate > baseRate) {
        notes.push(`Pay condition rate $${baseRate.toFixed(2)} is under the ${award.classification} award floor — paid at the award rate.`);
      }
      baseRate = award.baseHourlyRate;
      rateSource = 'award';
    }
  }

  if (!baseRate) {
    baseRate = employee.hourlyRate ?? 0;
    rateSource = 'timesheet';
    notes.push('No pay condition or award rate on file — using the timesheet rate.');
  }

  const casualLoadingPct =
    settings.applyCasualLoading && employmentType === 'casual'
      ? (award?.casualLoading ?? settings.defaultCasualLoadingPct)
      : 0;

  if (!record.taxFileNumber) notes.push('No TFN on file — withhold at the no-TFN rate or collect a TFN declaration.');
  if (settings.requireBankDetails && !record.bankDetails?.accountNumber) notes.push('No bank account on file — excluded from the ABA file.');
  if (!record.bankDetails?.superFundName) notes.push('No super fund nominated — super will accrue but cannot be paid.');
  if (record.status === 'terminated') notes.push('Employee is terminated — confirm this is a final pay.');

  return {
    staffRecordId: record.id,
    dataSource: 'staff_record',
    payrollId: record.payrollId,
    employeeNumber: record.employeeId,
    employmentType,
    position: pc?.position ?? record.position,
    baseRate,
    rateSource,
    casualLoadingPct,
    award,
    payCondition: pc,
    superFundName: record.bankDetails?.superFundName,
    bankAccountMasked: maskAccount(record.bankDetails?.accountNumber),
    hasTfn: Boolean(record.taxFileNumber),
    contractedHours: pc?.contractedHours,
    incomeStream: incomeStreamFor(employmentType),
    rosterStaffId: matchRosterStaffId(fullName(record), record.email),
    notes,
  };
}

const hoursBetween = (start: string, end: string, breakMinutes = 0) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // overnight
  return Math.max(0, (mins - breakMinutes) / 60);
};

let shiftCache: Shift[] | null = null;
function allShifts(): Shift[] {
  if (!shiftCache) shiftCache = generateMockShifts();
  return shiftCache;
}

/** Rostered (scheduled) hours per roster staff id inside a period — used for pay vs roster variance. */
export function rosteredHoursByStaff(periodStart: string, periodEnd: string): Record<string, number> {
  const totals: Record<string, number> = {};
  allShifts().forEach((s) => {
    if (s.date < periodStart || s.date > periodEnd) return;
    if (s.isOpenShift || !s.staffId || s.isAbsent) return;
    totals[s.staffId] = (totals[s.staffId] ?? 0) + hoursBetween(s.startTime, s.endTime, s.breakMinutes ?? 0);
  });
  Object.keys(totals).forEach((k) => { totals[k] = Math.round(totals[k] * 100) / 100; });
  return totals;
}
