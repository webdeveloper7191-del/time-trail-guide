import { useState } from 'react';
import { AlertTriangle, Download, FileText, Receipt, Send } from 'lucide-react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PayRun, PayRunLine } from '@/types/payroll';
import { payrollStore } from '@/lib/payroll/payrollStore';
import { recalcRun } from '@/lib/payroll/payRunEngine';
import { buildDetailCsv, buildAbaFile, buildJournal, downloadFile, exportPayslipPdf } from '@/lib/payroll/accountingExport';
import { postJournalToXero } from '@/lib/payroll/payrollCloud';
import { PayRunAdjustmentSheet } from './PayRunAdjustmentSheet';
import { toast } from 'sonner';

interface Props {
  run: PayRun | null;
  open: boolean;
  onClose: () => void;
}

const currency = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PayRunDetailPanel({ run, open, onClose }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<PayRunLine | null>(null);
  const [postingXero, setPostingXero] = useState(false);
  if (!run) return null;

  const current = adjusting ? run.lines.find((l) => l.id === adjusting.id) ?? adjusting : null;

  const toggleExclude = (line: PayRunLine) => {
    if (run.locked) { toast.error('This pay run is locked. Unlock it before making changes.'); return; }
    const lines = run.lines.map((l) => (l.id === line.id ? { ...l, excluded: !l.excluded } : l));
    payrollStore.saveRun(recalcRun({ ...run, lines }));
  };

  const advance = (status: PayRun['status']) => {
    if (status === 'posted') {
      payrollStore.postAndLock(run.id);
      toast.success('Pay run posted and locked for audit.');
      return;
    }
    payrollStore.addAudit(run.id, status === 'approved' ? 'approved' : 'review');
    payrollStore.updateRun(run.id, {
      status,
      approvedAt: status === 'approved' ? new Date().toISOString() : run.approvedAt,
    });
    toast.success(`Pay run marked ${status}.`);
  };

  const exportDetail = () => {
    const f = buildDetailCsv(run);
    downloadFile(f.content, f.fileName);
    payrollStore.recordExport(run.id, { id: crypto.randomUUID(), platform: 'csv', exportedAt: new Date().toISOString(), fileName: f.fileName, lineCount: f.rowCount });
    toast.success('Detail CSV downloaded.');
  };

  const exportAba = () => {
    const s = payrollStore.getSettings();
    const f = buildAbaFile(run, {
      bankCode: s.abaBankCode,
      accountName: s.abaAccountName,
      userNumber: s.abaUserNumber,
      bsb: s.abaBsb,
      accountNumber: s.abaAccountNumber,
      lodgementReference: s.abaLodgementReference,
    });
    if (!f.rowCount) {
      toast.error('No employees have bank details on file — nothing to pay in the ABA file.');
      return;
    }
    downloadFile(f.content, f.fileName, 'text/plain');
    payrollStore.recordExport(run.id, { id: crypto.randomUUID(), platform: 'aba', exportedAt: new Date().toISOString(), fileName: f.fileName, lineCount: f.rowCount });
    if (f.skipped.length) {
      toast.warning(`ABA file downloaded — ${f.skipped.length} employee(s) skipped for missing bank details: ${f.skipped.join(', ')}.`);
    } else {
      toast.success(`ABA payment file downloaded — ${f.rowCount} payment(s).`);
    }
  };


  const postToXero = async () => {
    const conn = payrollStore.getSnapshot().connections.xero;
    setPostingXero(true);
    try {
      const journal = buildJournal(run, conn);
      const result = await postJournalToXero(run, journal);
      if (!result.ok) {
        toast.error(result.connected ? `Xero rejected the journal: ${result.message}` : result.message);
        return;
      }
      payrollStore.recordExport(run.id, {
        id: crypto.randomUUID(),
        platform: 'xero',
        exportedAt: new Date().toISOString(),
        fileName: `Xero manual journal ${result.manualJournalId ?? ''}`.trim(),
        lineCount: journal.length,
      });
      payrollStore.addAudit(run.id, 'exported', `Posted to Xero (journal ${result.manualJournalId ?? 'created'}).`);
      toast.success('Payroll journal posted to Xero.');
    } finally {
      setPostingXero(false);
    }
  };

  const publishPayslips = () => {
    payrollStore.updateRun(run.id, { payslipsPublishedAt: new Date().toISOString() });
    payrollStore.addAudit(run.id, 'published', `${run.lines.filter((l) => !l.excluded).length} payslip(s) published to the employee portal.`);
    toast.success('Payslips published — employees can now see them in their portal.');
  };

  const unlock = () => {
    const reason = window.prompt('Why is this posted pay run being unlocked? (recorded in the audit trail)');
    if (!reason) return;
    payrollStore.unlockRun(run.id, reason);
    toast.success('Pay run unlocked for correction.');
  };

  const reverse = () => {
    const reason = window.prompt('Reason for reversing this pay run? (recorded in the audit trail)');
    if (!reason) return;
    const reversal = payrollStore.reverseRun(run.id, reason);
    toast.success(reversal ? `Reversal run ${reversal.id} created.` : 'Reversal created.');
    onClose();
  };

  const actions = [
    { label: 'Close', variant: 'outlined' as const, onClick: onClose },
    ...(run.status === 'draft' ? [{ label: 'Send for review', variant: 'primary' as const, onClick: () => advance('review') }] : []),
    ...(run.status === 'review' ? [{ label: 'Approve run', variant: 'primary' as const, onClick: () => advance('approved') }] : []),
    ...(run.status === 'approved' ? [{ label: 'Post & lock', variant: 'primary' as const, onClick: () => advance('posted') }] : []),
    ...(run.status === 'posted' && !run.reversedAt && run.locked ? [{ label: 'Unlock', variant: 'outlined' as const, onClick: unlock }] : []),
    ...(run.status === 'posted' && !run.reversedAt ? [{ label: 'Reverse run', variant: 'outlined' as const, onClick: reverse }] : []),
    ...((run.status === 'approved' || run.status === 'posted') && !run.payslipsPublishedAt
      ? [{ label: 'Publish payslips', variant: 'primary' as const, onClick: publishPayslips }]
      : []),
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={run.name}
      description={`${run.periodStart} to ${run.periodEnd} · paid ${run.paymentDate}`}
      icon={Receipt}
      size="4xl"
      actions={actions}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Employees', value: String(run.totals.headcount) },
            { label: 'Gross', value: currency(run.totals.grossPay) },
            { label: 'PAYG', value: currency(run.totals.paygTax) },
            { label: 'Super', value: currency(run.totals.superGuarantee) },
            { label: 'Net', value: currency(run.totals.netPay) },
            ...(run.totals.deductions ? [{ label: 'Deductions', value: currency(run.totals.deductions) }] : []),
            ...(run.totals.salarySacrificeSuper ? [{ label: 'Salary sacrifice', value: currency(run.totals.salarySacrificeSuper) }] : []),
            ...(run.totals.leavePay ? [{ label: 'Leave pay', value: currency(run.totals.leavePay) }] : []),
            ...(run.totals.terminationPay ? [{ label: 'Termination pay', value: currency(run.totals.terminationPay) }] : []),
          ].map((s) => (
            <div key={s.label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-semibold tracking-tight">{s.value}</p>
            </div>
          ))}
        </div>

        {(run.locked || run.reversedAt || run.payslipsPublishedAt) && (
          <div className="flex flex-wrap gap-2">
            {run.locked && <Badge variant="secondary">Locked — posted {run.postedAt?.slice(0, 10)}</Badge>}
            {run.reversedAt && <Badge variant="outline">Reversed {run.reversedAt.slice(0, 10)}{run.reversedByRunId ? ` · ${run.reversedByRunId}` : ''}</Badge>}
            {run.reversalOfRunId && <Badge variant="outline">Reversal of {run.reversalOfRunId}</Badge>}
            {run.payslipsPublishedAt && <Badge variant="secondary">Payslips published {run.payslipsPublishedAt.slice(0, 10)}</Badge>}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportDetail}><Download className="h-4 w-4 mr-2" />Detail CSV</Button>
          <Button variant="outline" size="sm" onClick={exportAba}><FileText className="h-4 w-4 mr-2" />ABA payment file</Button>
          <Button variant="outline" size="sm" onClick={postToXero} disabled={postingXero || run.status === 'draft'}>
            <Send className="h-4 w-4 mr-2" />{postingXero ? 'Posting to Xero…' : 'Post to Xero'}
          </Button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Pay</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Ord hrs</TableHead>
                <TableHead className="text-right">OT hrs</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">PAYG</TableHead>
                <TableHead className="text-right">Super</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.lines.map((line) => (
                <>
                  <TableRow key={line.id} className={line.excluded ? 'opacity-50' : ''}>
                    <TableCell>
                      <Checkbox checked={!line.excluded} onCheckedChange={() => toggleExclude(line)} aria-label={`Include ${line.staffName}`} />
                    </TableCell>
                    <TableCell>
                      <button className="text-left" onClick={() => setExpanded(expanded === line.id ? null : line.id)}>
                        <span className="font-medium">{line.staffName}</span>
                        <span className="block text-xs text-muted-foreground">
                          {line.locationName}
                          {line.awardName ? ` · ${line.classification ?? line.awardName}` : ''}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {currency(line.baseRate)}/hr {line.rateSource === 'award' ? 'award rate' : line.rateSource === 'timesheet' ? 'timesheet rate' : 'pay conditions'}
                          {line.casualLoadingPct ? ` + ${line.casualLoadingPct}% casual` : ''}
                        </span>
                      </button>
                      {line.warnings.length > 0 && (
                        <Badge variant="outline" className="mt-1 gap-1 text-warning border-warning/40">
                          <AlertTriangle className="h-3 w-3" />{line.warnings.length}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{line.ordinaryHours}</TableCell>
                    <TableCell className="text-right tabular-nums">{line.overtimeHours}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(line.grossPay)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(line.paygTax)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(line.superGuarantee)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{currency(line.netPay)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setAdjusting(line)}>Adjust</Button>
                        <Button variant="ghost" size="sm" onClick={() => exportPayslipPdf(run, line)}>Payslip</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expanded === line.id && (
                    <TableRow key={`${line.id}-detail`}>
                      <TableCell colSpan={9} className="bg-muted/40">
                        <div className="space-y-2 py-2">
                          {line.warnings.map((w) => (
                            <p key={w} className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{w}</p>
                          ))}
                          <div className="grid gap-1">
                            {line.components.map((c) => (
                              <div key={c.id} className="flex justify-between text-sm">
                                <span>{c.label} <span className="text-muted-foreground">({c.units} × {currency(c.rate)})</span></span>
                                <span className="tabular-nums">{currency(c.amount)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="grid gap-1 pt-2 text-xs text-muted-foreground sm:grid-cols-2">
                            <span>Timesheets: {line.timesheetIds.join(', ')}</span>
                            <span>Source: {line.dataSource === 'staff_record' ? `Workforce record ${line.payrollId ?? line.employeeNumber ?? ''}` : 'Timesheet only (no workforce match)'}</span>
                            {line.awardName && <span>Award: {line.awardName}{line.classification ? ` — ${line.classification}` : ''}</span>}
                            {line.rosteredHours !== undefined && (
                              <span>
                                Rostered {line.rosteredHours}h vs paid {(line.ordinaryHours + line.overtimeHours).toFixed(2)}h
                                {line.rosterVarianceHours ? ` (${line.rosterVarianceHours > 0 ? '+' : ''}${line.rosterVarianceHours}h)` : ''}
                              </span>
                            )}
                            {line.superFundName && <span>Super fund: {line.superFundName}</span>}
                            {line.bankAccountMasked && <span>Bank: {line.bankAccountMasked}</span>}
                            <span>TFN on file: {line.hasTfn ? 'Yes' : 'No'}</span>
                            {Boolean(line.preTaxDeductions) && <span>Pre-tax deductions: {currency(line.preTaxDeductions ?? 0)}</span>}
                            {Boolean(line.postTaxDeductions) && <span>Post-tax deductions: {currency(line.postTaxDeductions ?? 0)}</span>}
                            {Boolean(line.salarySacrificeSuper) && <span>Salary sacrifice (RESC): {currency(line.salarySacrificeSuper ?? 0)}</span>}
                            {Boolean(line.lumpSumTax) && <span>Lump-sum tax withheld: {currency(line.lumpSumTax ?? 0)}</span>}
                            {Boolean(line.totalSuperContribution) && <span>Total super: {currency(line.totalSuperContribution ?? 0)}</span>}
                            {line.isTermination && <span>Final pay — includes termination lump sums</span>}
                            {line.incomeStream && <span>STP income stream: {line.incomeStream}</span>}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>

        {run.exports.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Export history</h3>
            <div className="space-y-1">
              {run.exports.map((e) => (
                <p key={e.id} className="text-xs text-muted-foreground">
                  {new Date(e.exportedAt).toLocaleString()} — {e.platform.toUpperCase()} · {e.fileName} ({e.lineCount} rows)
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {current && (
        <PayRunAdjustmentSheet
          run={run}
          line={current}
          open={Boolean(adjusting)}
          onClose={() => setAdjusting(null)}
        />
      )}
    </PrimaryOffCanvas>
  );
}
