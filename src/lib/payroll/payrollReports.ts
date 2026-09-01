/**
 * Payroll reporting.
 *
 * Four reports built from posted / approved pay runs:
 *   • Payroll register — one row per employee per run (gross → net)
 *   • Cost by location — labour cost, on-costs and headcount per site
 *   • Payroll liabilities — PAYG, super and net wages payable per payment date
 *   • Leave liability — outstanding balances valued at the employee's rate
 */

import { PayRun } from '@/types/payroll';
import { leaveBalanceStore } from './leaveBalances';

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface RegisterRow {
  runId: string;
  runName: string;
  paymentDate: string;
  staffId: string;
  staffName: string;
  locationName: string;
  employmentType: string;
  ordinaryHours: number;
  overtimeHours: number;
  grossPay: number;
  paygTax: number;
  superGuarantee: number;
  deductions: number;
  netPay: number;
}

export interface LocationCostRow {
  locationName: string;
  headcount: number;
  hours: number;
  grossPay: number;
  superGuarantee: number;
  onCostPct: number;
  totalCost: number;
}

export interface LiabilityRow {
  paymentDate: string;
  runs: number;
  paygTax: number;
  superGuarantee: number;
  deductions: number;
  netWages: number;
  total: number;
}

export interface LeaveLiabilityRow {
  staffId: string;
  staffName: string;
  annualHours: number;
  personalHours: number;
  lslHours: number;
  hourlyRate: number;
  /** Annual + LSL valued at the current rate (personal leave is not a payable liability). */
  liability: number;
}

export interface ReportFilter {
  from?: string;
  to?: string;
  locationName?: string;
  includeDrafts?: boolean;
}

export function filterRuns(runs: PayRun[], f: ReportFilter = {}): PayRun[] {
  return runs.filter((r) => {
    if (!f.includeDrafts && r.status !== 'approved' && r.status !== 'posted') return false;
    if (f.from && r.paymentDate < f.from) return false;
    if (f.to && r.paymentDate > f.to) return false;
    return true;
  });
}

export function buildRegister(runs: PayRun[], f: ReportFilter = {}): RegisterRow[] {
  const rows: RegisterRow[] = [];
  filterRuns(runs, f).forEach((run) => {
    run.lines.filter((l) => !l.excluded).forEach((l) => {
      const locationName = l.locationName ?? 'Unassigned';
      if (f.locationName && f.locationName !== locationName) return;
      rows.push({
        runId: run.id,
        runName: run.name,
        paymentDate: run.paymentDate,
        staffId: l.staffId,
        staffName: l.staffName,
        locationName,
        employmentType: l.employmentType ?? '—',
        ordinaryHours: l.ordinaryHours,
        overtimeHours: l.overtimeHours,
        grossPay: l.grossPay,
        paygTax: l.paygTax,
        superGuarantee: l.superGuarantee,
        deductions: l.deductions,
        netPay: l.netPay,
      });
    });
  });
  return rows.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate) || a.staffName.localeCompare(b.staffName));
}

export function buildLocationCosts(runs: PayRun[], f: ReportFilter = {}): LocationCostRow[] {
  const map = new Map<string, { gross: number; sup: number; hours: number; staff: Set<string> }>();
  buildRegister(runs, f).forEach((r) => {
    const cur = map.get(r.locationName) ?? { gross: 0, sup: 0, hours: 0, staff: new Set<string>() };
    cur.gross += r.grossPay;
    cur.sup += r.superGuarantee;
    cur.hours += r.ordinaryHours + r.overtimeHours;
    cur.staff.add(r.staffId);
    map.set(r.locationName, cur);
  });
  return Array.from(map.entries())
    .map(([locationName, v]) => ({
      locationName,
      headcount: v.staff.size,
      hours: round2(v.hours),
      grossPay: round2(v.gross),
      superGuarantee: round2(v.sup),
      onCostPct: v.gross ? round2((v.sup / v.gross) * 100) : 0,
      totalCost: round2(v.gross + v.sup),
    }))
    .sort((a, b) => b.totalCost - a.totalCost);
}

export function buildLiabilities(runs: PayRun[], f: ReportFilter = {}): LiabilityRow[] {
  const map = new Map<string, LiabilityRow>();
  filterRuns(runs, f).forEach((run) => {
    const row = map.get(run.paymentDate) ?? {
      paymentDate: run.paymentDate, runs: 0, paygTax: 0, superGuarantee: 0, deductions: 0, netWages: 0, total: 0,
    };
    row.runs += 1;
    row.paygTax = round2(row.paygTax + run.totals.paygTax);
    row.superGuarantee = round2(row.superGuarantee + run.totals.superGuarantee);
    row.deductions = round2(row.deductions + run.totals.deductions);
    row.netWages = round2(row.netWages + run.totals.netPay);
    row.total = round2(row.paygTax + row.superGuarantee + row.deductions + row.netWages);
    map.set(run.paymentDate, row);
  });
  return Array.from(map.values()).sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
}

export function buildLeaveLiability(runs: PayRun[]): LeaveLiabilityRow[] {
  const rateByStaff = new Map<string, number>();
  runs.forEach((r) => r.lines.forEach((l) => { if (l.baseRate) rateByStaff.set(l.staffId, l.baseRate); }));
  return leaveBalanceStore.allBalances().map((b) => {
    const hourlyRate = rateByStaff.get(b.staffId) ?? 0;
    return {
      staffId: b.staffId,
      staffName: b.staffName,
      annualHours: b.annual,
      personalHours: b.personal,
      lslHours: b.lsl,
      hourlyRate,
      liability: round2((b.annual + b.lsl) * hourlyRate),
    };
  });
}

// --- CSV ---------------------------------------------------------------

export function toCsv(rows: Record<string, string | number>[], headers?: string[]): string {
  if (!rows.length) return '';
  const keys = headers ?? Object.keys(rows[0]);
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n');
}
