/**
 * Automatic back-pay.
 *
 * Re-checks every approved/posted pay run line against the rate that was
 * actually due for that period, and lists what is still owing:
 *   • Annual award increase — the published award minimum in force on the
 *     period start (e.g. AWR 2026 from 1 July 2026) is above the rate paid.
 *   • Manual pay change — a pay condition backdated to on/before the period
 *     start sets a higher rate than the rate paid.
 *   • Late-approved rate change — junior birthday / apprentice year /
 *     qualification changes approved late with "backdate" chosen.
 *
 * Owed amount re-prices all time-based earnings (ordinary, penalty, overtime)
 * proportionally: earnings × (due ÷ paid − 1). Each item is included in the
 * next pay run that contains the employee and recorded in a ledger so it is
 * never paid twice; deleting that draft run releases it again.
 */
import { useEffect, useState } from 'react';
import type { PayRun, PayRunAdjustment, PayRunLine, PayrollSettings } from '@/types/payroll';
import type { StaffMember, PayCondition } from '@/types/staff';
import type { Timesheet } from '@/types/timesheet';
import { resolveHourlyRate } from '@/lib/payRateResolver';
import { rateCategoryStore } from '@/lib/rateCategoryStore';
import { backPayAmount } from '@/lib/rateBackPay';
import { awardFloorOn } from './payrollEmployeeBridge';

export type BackPayReason = 'award_increase' | 'manual_pay_change' | 'late_rate_change';

export const backPayReasonLabels: Record<BackPayReason, string> = {
  award_increase: 'Annual award increase',
  manual_pay_change: 'Backdated pay change',
  late_rate_change: 'Late-approved rate change',
};

export interface BackPayItem {
  key: string;
  staffId: string;
  staffRecordId?: string;
  staffName: string;
  reason: BackPayReason;
  from: string;
  to: string;
  sourceRunId?: string;
  sourceRunName?: string;
  paidRate: number;
  dueRate: number;
  /** Equivalent ordinary hours at the paid rate. */
  hours: number;
  amount: number;
  /** Set when an existing run already includes it. */
  includedInRunId?: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const TIME_COMPONENT = /-(ord|ot)-\d+$/;

/** Pay condition in force on a date (latest effectiveFrom on or before it). */
export function payConditionOn(record: StaffMember, dateIso: string): PayCondition | undefined {
  const all = [...(record.payConditionHistory ?? []), ...(record.currentPayCondition ? [record.currentPayCondition] : [])];
  return all
    .filter((p) => p.effectiveFrom && p.effectiveFrom.slice(0, 10) <= dateIso && (!p.effectiveTo || p.effectiveTo.slice(0, 10) >= dateIso))
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
}

/** Ordinary base rate that was due on a date, before junior/apprentice percentage and casual loading. */
export function dueBaseRate(record: StaffMember, dateIso: string, settings: PayrollSettings) {
  const pc = payConditionOn(record, dateIso);
  const contract = pc
    ? resolveHourlyRate({
        hourlyRate: pc.payRateType === 'salary' ? undefined : pc.hourlyRate,
        annualRate: pc.annualSalary,
        ordinaryHoursPerWeek: settings.ordinaryHoursPerWeek,
      }).hourlyRate
    : 0;
  const award = settings.useAwardRates ? awardFloorOn(record.applicableAward, dateIso) : 0;
  return { contract, award, rate: Math.max(contract, award) };
}

function lineTimeEarnings(line: PayRunLine): number {
  return round2(line.components.filter((c) => c.source !== 'adjustment' && TIME_COMPONENT.test(c.id)).reduce((s, c) => s + c.amount, 0));
}

// ---------------------------------------------------------------------------
// Ledger — which items have been placed into which run
// ---------------------------------------------------------------------------
const LEDGER_KEY = 'rostered.payroll.backPayLedger.v1';
let ledger: Record<string, string> = (() => {
  try { return JSON.parse(localStorage.getItem(LEDGER_KEY) ?? '{}'); } catch { return {}; }
})();
const listeners = new Set<() => void>();
function saveLedger() {
  try { localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger)); } catch { /* ignore */ }
  listeners.forEach((f) => f());
}
export const backPayLedger = {
  get: () => ledger,
  mark(keys: string[], runId: string) { keys.forEach((k) => { ledger[k] = runId; }); saveLedger(); },
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
};

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------
export interface DetectInput {
  runs: PayRun[];
  staff: StaffMember[];
  settings: PayrollSettings;
  timesheets: Timesheet[];
  ledger?: Record<string, string>;
}

export function detectBackPay({ runs, staff, settings, timesheets, ledger: led = ledger }: DetectInput): BackPayItem[] {
  const items: BackPayItem[] = [];
  const runIds = new Set(runs.map((r) => r.id));
  const byId = new Map(staff.map((s) => [s.id, s]));

  runs
    .filter((r) => r.status === 'approved' || r.status === 'posted')
    .forEach((run) => {
      run.lines.forEach((line) => {
        if (line.excluded || !line.staffRecordId || line.rateSource === 'timesheet') return;
        const record = byId.get(line.staffRecordId);
        if (!record || !line.baseRate) return;
        const due = dueBaseRate(record, run.periodStart, settings);
        // Junior/apprentice/trainee percentage applies to the adult rate.
        const cat = rateCategoryStore.applyToRate(record.id, due.rate, record.applicableAward?.classification ?? 'Adult');
        const dueRate = round2(cat.hourlyRate);
        const diff = round2(dueRate - line.baseRate);
        if (diff < 0.01) return;
        const earnings = lineTimeEarnings(line);
        if (!earnings) return;
        const amount = round2(earnings * (dueRate / line.baseRate - 1));
        const key = `run:${run.id}:${line.id}:${dueRate.toFixed(2)}`;
        const included = led[key];
        items.push({
          key,
          staffId: line.staffId,
          staffRecordId: line.staffRecordId,
          staffName: line.staffName,
          reason: due.award > due.contract ? 'award_increase' : 'manual_pay_change',
          from: run.periodStart,
          to: run.periodEnd,
          sourceRunId: run.id,
          sourceRunName: run.name,
          paidRate: line.baseRate,
          dueRate,
          hours: round2(earnings / line.baseRate),
          amount,
          includedInRunId: included && runIds.has(included) ? included : undefined,
        });
      });
    });

  // Late-approved junior/apprentice/trainee changes recorded as "backdate".
  rateCategoryStore.getBackPay().filter((b) => b.status === 'pending_pay_run').forEach((b) => {
    const record = byId.get(b.staffId);
    if (!record) return;
    const name = `${record.firstName} ${record.lastName}`.trim();
    const hours = round2(
      timesheets
        .filter((t) => t.status === 'approved' && (t.employee.email?.toLowerCase() === record.email?.toLowerCase() || t.employee.name === name))
        .flatMap((t) => t.entries)
        .filter((e) => e.date >= b.from && e.date < b.to)
        .reduce((s, e) => s + (e.netHours ?? 0), 0),
    );
    if (!hours) return;
    const adult = dueBaseRate(record, b.from, settings).rate;
    const amount = backPayAmount(adult, hours, b.fromPercent, b.toPercent);
    if (amount <= 0) return;
    const key = `cat:${b.id}`;
    const included = led[key];
    items.push({
      key,
      staffId: record.id,
      staffRecordId: record.id,
      staffName: name,
      reason: 'late_rate_change',
      from: b.from,
      to: b.to,
      paidRate: round2(adult * b.fromPercent / 100),
      dueRate: round2(adult * b.toPercent / 100),
      hours,
      amount,
      includedInRunId: included && runIds.has(included) ? included : undefined,
    });
  });

  return items.sort((a, b) => a.staffName.localeCompare(b.staffName) || a.from.localeCompare(b.from));
}

/** Turn owing items into back-pay adjustments for the lines of a new run. */
export function backPayAdjustmentsFor(run: PayRun, items: BackPayItem[]): { adjustments: PayRunAdjustment[]; keys: string[]; notInRun: BackPayItem[] } {
  const adjustments: PayRunAdjustment[] = [];
  const keys: string[] = [];
  const notInRun: BackPayItem[] = [];
  items.filter((i) => !i.includedInRunId).forEach((i) => {
    const line = run.lines.find((l) => (i.staffRecordId && l.staffRecordId === i.staffRecordId) || l.staffId === i.staffId);
    if (!line) { notInRun.push(i); return; }
    adjustments.push({
      id: `bp-${Math.abs(hash(i.key)).toString(36)}`,
      lineId: line.id,
      staffId: line.staffId,
      kind: 'back_pay',
      label: backPayReasonLabels[i.reason],
      backPayFrom: i.from,
      backPayTo: i.to,
      backPayHours: i.hours,
      backPayRateDifference: round2(i.dueRate - i.paidRate),
      amount: i.amount,
      superable: true,
      notes: `Paid $${i.paidRate.toFixed(2)}/hr, due $${i.dueRate.toFixed(2)}/hr${i.sourceRunName ? ` in ${i.sourceRunName}` : ''}.`,
    });
    keys.push(i.key);
  });
  return { adjustments, keys, notInRun };
}

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

export function useBackPayLedgerVersion() {
  const [v, setV] = useState(0);
  useEffect(() => backPayLedger.subscribe(() => setV((x) => x + 1)), []);
  return v;
}
