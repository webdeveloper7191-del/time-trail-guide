/**
 * Leave balance integration for pay runs.
 *
 * When a pay run is approved we:
 *   • accrue annual / personal / long service leave from paid ordinary hours
 *     (pro-rata to the NES entitlement, casuals excluded when configured), and
 *   • draw leave payments in the run down from the employee's balance.
 *
 * RDO / ADO / TOIL postings are mirrored to the roster leave accrual engine so
 * the roster badges and the payroll ledger never disagree.
 *
 * Everything is keyed by run id and therefore idempotent — re-applying a run
 * clears its previous postings first, and unlocking or reversing a run removes
 * them entirely.
 */

import { PayRun, PayrollSettings } from '@/types/payroll';
import { LeaveStore, LeaveKind } from '@/lib/leaveAccrualEngine';
import { leaveBalanceStore, LeaveLedgerEntry, PayrollLeaveKind } from './leaveBalances';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Hours of leave accrued per ordinary hour worked, from the NES entitlement. */
export function accrualRates(settings: PayrollSettings) {
  const weekly = settings.ordinaryHoursPerWeek || 38;
  const annualOrdinaryHours = weekly * 52;
  return {
    annual: (settings.annualLeaveWeeksPerYear * weekly) / annualOrdinaryHours,
    personal: (settings.personalLeaveDaysPerYear * (weekly / 5)) / annualOrdinaryHours,
    lsl: (settings.lslWeeksPerYear * weekly) / annualOrdinaryHours,
  };
}

const LEAVE_CODE_MAP: Record<string, PayrollLeaveKind | LeaveKind> = {
  annual: 'annual',
  annual_leave: 'annual',
  al: 'annual',
  personal: 'personal',
  personal_leave: 'personal',
  sick: 'personal',
  carers: 'personal',
  lsl: 'lsl',
  long_service: 'lsl',
  rdo: 'RDO',
  ado: 'ADO',
  toil: 'TOIL',
};

function classifyLeave(codeOrLabel: string): PayrollLeaveKind | LeaveKind | undefined {
  const key = codeOrLabel.toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
  if (LEAVE_CODE_MAP[key]) return LEAVE_CODE_MAP[key];
  const text = codeOrLabel.toLowerCase();
  if (text.includes('annual')) return 'annual';
  if (text.includes('sick') || text.includes('personal') || text.includes('carer')) return 'personal';
  if (text.includes('long service')) return 'lsl';
  if (text.includes('rdo')) return 'RDO';
  if (text.includes('ado')) return 'ADO';
  if (text.includes('toil')) return 'TOIL';
  return undefined;
}

export interface LeaveApplyResult {
  accruedHours: number;
  drawnHours: number;
  entries: number;
  warnings: string[];
}

/** Post accruals and drawdowns for a run. Safe to call repeatedly. */
export function applyLeaveForRun(run: PayRun, settings: PayrollSettings): LeaveApplyResult {
  leaveBalanceStore.clearRun(run.id);

  const rates = accrualRates(settings);
  const postings: Omit<LeaveLedgerEntry, 'id' | 'at'>[] = [];
  const warnings: string[] = [];
  let accruedHours = 0;
  let drawnHours = 0;

  run.lines.filter((l) => !l.excluded).forEach((line) => {
    const isCasual = (line.employmentType ?? '').toLowerCase().includes('casual');

    // --- Accrual from paid ordinary hours ------------------------------
    if (settings.accrueLeaveFromPaidHours && !(settings.excludeCasualsFromLeaveAccrual && isCasual)) {
      (Object.keys(rates) as PayrollLeaveKind[]).forEach((kind) => {
        const hours = round2(line.ordinaryHours * rates[kind]);
        if (hours <= 0) return;
        accruedHours += hours;
        postings.push({
          staffId: line.staffId,
          staffName: line.staffName,
          kind,
          hours,
          sourceRunId: run.id,
          note: `Accrued on ${line.ordinaryHours}h ordinary — ${run.name}`,
        });
      });
    }

    // --- Drawdown for leave paid in this run ---------------------------
    if (!settings.drawDownLeaveOnPayment) return;
    line.components
      .filter((c) => c.kind === 'leave' && (c.units ?? 0) > 0)
      .forEach((c) => {
        const code = classifyLeave(`${(c as { stpCode?: string }).stpCode ?? ''} ${c.label}`);
        if (!code) {
          warnings.push(`${line.staffName}: "${c.label}" could not be matched to a leave type — balance not reduced.`);
          return;
        }
        const hours = round2(c.units ?? 0);
        drawnHours += hours;
        if (code === 'RDO' || code === 'ADO' || code === 'TOIL') {
          LeaveStore.postLedger({
            staffId: line.staffId,
            staffName: line.staffName,
            kind: code,
            type: 'consumption',
            hours: -hours,
            note: `Paid in ${run.name} (${run.id})`,
            date: run.paymentDate,
          } as never);
          postings.push({
            staffId: line.staffId, staffName: line.staffName, kind: code, hours: -hours,
            sourceRunId: run.id, note: `${c.label} paid — ${run.name}`,
          });
        } else {
          postings.push({
            staffId: line.staffId, staffName: line.staffName, kind: code, hours: -hours,
            sourceRunId: run.id, note: `${c.label} paid — ${run.name}`,
          });
        }
      });
  });

  // Warn when a drawdown pushes a balance negative.
  leaveBalanceStore.post(postings);
  run.lines.filter((l) => !l.excluded).forEach((line) => {
    const bal = leaveBalanceStore.balances(line.staffId);
    (['annual', 'personal', 'lsl'] as const).forEach((k) => {
      if ((bal[k] ?? 0) < -0.01) warnings.push(`${line.staffName}: ${k} leave balance is negative (${bal[k]?.toFixed(2)}h).`);
    });
  });

  return { accruedHours: round2(accruedHours), drawnHours: round2(drawnHours), entries: postings.length, warnings };
}

/** Remove a run's leave postings (unlock, reverse or delete). */
export function reverseLeaveForRun(runId: string) {
  leaveBalanceStore.clearRun(runId);
}

/** Balances shown on a payslip for one employee. */
export function payslipLeaveBalances(staffId: string) {
  const b = leaveBalanceStore.balances(staffId);
  return [
    { label: 'Annual leave', hours: b.annual ?? 0 },
    { label: "Personal / carer's leave", hours: b.personal ?? 0 },
    { label: 'Long service leave', hours: b.lsl ?? 0 },
    { label: 'RDO', hours: b.RDO ?? 0 },
    { label: 'ADO', hours: b.ADO ?? 0 },
    { label: 'TOIL', hours: b.TOIL ?? 0 },
  ].filter((r) => Math.abs(r.hours) > 0.001);
}
