import { useMemo, useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PayRun } from '@/types/payroll';
import { payrollStore } from '@/lib/payroll/payrollStore';
import { buildStpCsv, buildStpYtd, downloadFile } from '@/lib/payroll/accountingExport';
import { toast } from 'sonner';

const currency = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function StpSummaryPanel({ runs }: { runs: PayRun[] }) {
  const settings = payrollStore.getSettings();
  const [fyStart, setFyStart] = useState(settings.financialYearStart);

  const posted = useMemo(() => runs.filter((r) => r.status === 'approved' || r.status === 'posted'), [runs]);
  const rows = useMemo(() => buildStpYtd(posted, fyStart), [posted, fyStart]);

  const totals = rows.reduce(
    (t, r) => ({
      gross: t.gross + r.grossPay,
      payg: t.payg + r.paygTax,
      superG: t.superG + r.superGuarantee,
    }),
    { gross: 0, payg: 0, superG: 0 },
  );

  const exportCsv = () => {
    const f = buildStpCsv(rows, fyStart);
    downloadFile(f.content, f.fileName);
    toast.success('STP YTD summary downloaded.');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" />STP Phase 2 year-to-date</CardTitle>
              <CardDescription>Payee totals accumulated from approved and posted pay runs, ready for lodgement or reconciliation.</CardDescription>
            </div>
            <div className="flex items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Financial year start</Label>
                <Input type="date" className="h-9 w-[160px]" value={fyStart} onChange={(e) => { setFyStart(e.target.value); payrollStore.updateSettings({ financialYearStart: e.target.value }); }} />
              </div>
              <Button onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4 mr-2" />Export YTD</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Payees</p><p className="text-lg font-semibold">{rows.length}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Gross YTD</p><p className="text-lg font-semibold">{currency(totals.gross)}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">PAYG withheld</p><p className="text-lg font-semibold">{currency(totals.payg)}</p></div>
            <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Super guarantee</p><p className="text-lg font-semibold">{currency(totals.superG)}</p></div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payee</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Allowances</TableHead>
                  <TableHead className="text-right">PAYG</TableHead>
                  <TableHead className="text-right">Super</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Approve a pay run to accumulate YTD figures.</TableCell></TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.staffId}>
                    <TableCell className="font-medium">{r.staffName}<span className="block text-xs text-muted-foreground">{r.payrollId ?? r.staffId}</span></TableCell>
                    <TableCell className="text-right tabular-nums">{currency(r.grossPay)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(r.overtime)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(r.allowances)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(r.paygTax)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(r.superGuarantee)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{currency(r.netPay)}</TableCell>
                    <TableCell className="text-right"><Badge variant="outline">{r.payRunCount}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
