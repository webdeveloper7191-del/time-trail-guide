/**
 * Payslip delivery.
 *
 * Payslips are not a separate record — they are the pay run line published to
 * the employee. A run must be approved or posted and explicitly published
 * before its lines appear in the Employee Portal.
 */

import { PayRun, PayRunLine } from '@/types/payroll';
import { payrollStore } from './payrollStore';

export interface EmployeePayslip {
  run: PayRun;
  line: PayRunLine;
}

const norm = (v?: string) => (v ?? '').trim().toLowerCase();

export interface PayslipEmployeeRef {
  /** Timesheet employee id used as the pay run line staffId. */
  id?: string;
  /** Workforce staff record id. */
  staffRecordId?: string;
  name: string;
}

function matchesEmployee(line: PayRunLine, employee: PayslipEmployeeRef) {
  return (
    (employee.id && line.staffId === employee.id) ||
    (employee.staffRecordId && line.staffRecordId === employee.staffRecordId) ||
    norm(line.staffName) === norm(employee.name)
  );
}

/** Published payslips for an employee, newest payment date first. */
export function getPayslipsForEmployee(employee: PayslipEmployeeRef): EmployeePayslip[] {
  return payrollStore
    .getRuns()
    .filter((r) => Boolean(r.payslipsPublishedAt))
    .flatMap((run) =>
      run.lines
        .filter((line) => !line.excluded && matchesEmployee(line, employee))
        .map((line) => ({ run, line })),
    )
    .sort((a, b) => b.run.paymentDate.localeCompare(a.run.paymentDate));
}

export interface PayslipYtd {
  grossPay: number;
  paygTax: number;
  superGuarantee: number;
  netPay: number;
  backPay: number;
  payslipCount: number;
}

/** Year-to-date totals across published payslips within the financial year. */
export function payslipYtd(payslips: EmployeePayslip[], financialYearStart?: string): PayslipYtd {
  const start = financialYearStart ?? payrollStore.getSettings().financialYearStart;
  const inYear = payslips.filter((p) => !start || p.run.paymentDate >= start);
  const sum = (fn: (p: EmployeePayslip) => number) =>
    Math.round(inYear.reduce((s, p) => s + fn(p), 0) * 100) / 100;
  return {
    grossPay: sum((p) => p.line.grossPay),
    paygTax: sum((p) => p.line.paygTax + (p.line.lumpSumTax ?? 0)),
    superGuarantee: sum((p) => p.line.superGuarantee),
    netPay: sum((p) => p.line.netPay),
    backPay: sum((p) => p.line.backPay ?? 0),
    payslipCount: inYear.length,
  };
}
