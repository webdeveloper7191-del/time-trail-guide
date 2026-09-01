import { useState } from 'react';
import { AlertTriangle, Download, FileText, Receipt } from 'lucide-react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PayRun, PayRunLine } from '@/types/payroll';
import { payrollStore } from '@/lib/payroll/payrollStore';
import { recalcRun } from '@/lib/payroll/payRunEngine';
import { buildDetailCsv, buildAbaFile, downloadFile, exportPayslipPdf } from '@/lib/payroll/accountingExport';
import { toast } from 'sonner';

interface Props {
  run: PayRun | null;
  open: boolean;
  onClose: () => void;
}

const currency = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PayRunDetailPanel({ run, open, onClose }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!run) return null;

  const toggleExclude = (line: PayRunLine) => {
    const lines = run.lines.map((l) => (l.id === line.id ? { ...l, excluded: !l.excluded } : l));
    payrollStore.saveRun(recalcRun({ ...run, lines }));
  };

  const advance = (status: PayRun['status']) => {
    payrollStore.updateRun(run.id, {
      status,
      approvedAt: status === 'approved' ? new Date().toISOString() : run.approvedAt,
      postedAt: status === 'posted' ? new Date().toISOString() : run.postedAt,
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
    const f = buildAbaFile(run, s.abaBankCode, s.abaAccountName);
    downloadFile(f.content, f.fileName, 'text/plain');
    payrollStore.recordExport(run.id, { id: crypto.randomUUID(), platform: 'aba', exportedAt: new Date().toISOString(), fileName: f.fileName, lineCount: f.rowCount });
    toast.success('ABA payment file downloaded.');
  };

  const actions = [
    { label: 'Close', variant: 'outlined' as const, onClick: onClose },
    ...(run.status === 'draft' ? [{ label: 'Send for review', variant: 'primary' as const, onClick: () => advance('review') }] : []),
    ...(run.status === 'review' ? [{ label: 'Approve run', variant: 'primary' as const, onClick: () => advance('approved') }] : []),
    ...(run.status === 'approved' ? [{ label: 'Mark posted', variant: 'primary' as const, onClick: () => advance('posted') }] : []),
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
          ].map((s) => (
            <div key={s.label} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-semibold tracking-tight">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportDetail}><Download className="h-4 w-4 mr-2" />Detail CSV</Button>
          <Button variant="outline" size="sm" onClick={exportAba}><FileText className="h-4 w-4 mr-2" />ABA payment file</Button>
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
                      <Button variant="ghost" size="sm" onClick={() => exportPayslipPdf(run, line)}>Payslip</Button>
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
    </PrimaryOffCanvas>
  );
}
