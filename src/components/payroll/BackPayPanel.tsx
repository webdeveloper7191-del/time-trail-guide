import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Timesheet } from '@/types/timesheet';
import { payrollStore, usePayroll } from '@/lib/payroll/payrollStore';
import { getPayrollStaffDirectory } from '@/lib/payroll/payrollEmployeeBridge';
import { backPayReasonLabels, detectBackPay, useBackPayLedgerVersion } from '@/lib/payroll/backPayEngine';
import { AWR_2026 } from '@/lib/payroll/awardRateSchedule';

const money = (n: number) => `$${n.toFixed(2)}`;

export function BackPayPanel({ timesheets }: { timesheets: Timesheet[] }) {
  usePayroll();
  const v = useBackPayLedgerVersion();
  const items = useMemo(
    () => detectBackPay({ runs: payrollStore.getRuns(), staff: getPayrollStaffDirectory(), settings: payrollStore.getSettings(), timesheets }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [timesheets, v, payrollStore.getRuns()],
  );
  const owing = items.filter((i) => !i.includedInRunId);
  const runName = (id?: string) => payrollStore.getRun(id ?? '')?.name ?? id;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 text-sm space-y-1">
        <p className="font-medium">{owing.length ? `${money(owing.reduce((s, i) => s + i.amount, 0))} owing to ${new Set(owing.map((i) => i.staffId)).size} employee(s)` : 'No back pay owing'}</p>
        <p className="text-xs text-muted-foreground">
          Approved and posted pay runs are re-checked against the rate that was due: award increases (Annual Wage Review 2026, +{AWR_2026.increasePct}% from 1 July 2026),
          backdated pay changes, and late-approved junior, apprentice or trainee rate changes. Owing amounts are added to the next pay run that includes the employee.
        </p>
      </div>
      <div className="rounded-lg border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Paid /hr</TableHead>
              <TableHead className="text-right">Due /hr</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-sm text-muted-foreground">Nothing to back-pay. Underpayments show here once a pay run is approved at a lower rate than was due.</TableCell></TableRow>
            )}
            {items.map((i) => (
              <TableRow key={i.key}>
                <TableCell className="font-medium">{i.staffName}</TableCell>
                <TableCell>{backPayReasonLabels[i.reason]}{i.sourceRunName && <span className="block text-xs text-muted-foreground">{i.sourceRunName}</span>}</TableCell>
                <TableCell className="text-xs">{i.from} → {i.to}</TableCell>
                <TableCell className="text-right">{money(i.paidRate)}</TableCell>
                <TableCell className="text-right">{money(i.dueRate)}</TableCell>
                <TableCell className="text-right">{i.hours.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">{money(i.amount)}</TableCell>
                <TableCell>{i.includedInRunId ? <Badge variant="secondary">In {runName(i.includedInRunId)}</Badge> : <Badge variant="outline">Owing</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
