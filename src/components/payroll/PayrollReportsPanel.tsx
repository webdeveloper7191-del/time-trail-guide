import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PayRun } from '@/types/payroll';
import {
  buildLeaveLiability,
  buildLiabilities,
  buildLocationCosts,
  buildRegister,
  toCsv,
} from '@/lib/payroll/payrollReports';
import { useLeaveBalances } from '@/lib/payroll/leaveBalances';
import { downloadFile } from '@/lib/payroll/accountingExport';
import { toast } from 'sonner';

const currency = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const hrs = (n: number) => `${n.toFixed(2)}h`;

interface Props {
  runs: PayRun[];
}

export function PayrollReportsPanel({ runs }: Props) {
  useLeaveBalances();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [includeDrafts, setIncludeDrafts] = useState(false);

  const filter = useMemo(() => ({ from: from || undefined, to: to || undefined, includeDrafts }), [from, to, includeDrafts]);
  const register = useMemo(() => buildRegister(runs, filter), [runs, filter]);
  const locations = useMemo(() => buildLocationCosts(runs, filter), [runs, filter]);
  const liabilities = useMemo(() => buildLiabilities(runs, filter), [runs, filter]);
  const leaveLiability = useMemo(() => buildLeaveLiability(runs), [runs]);

  const exportCsv = (rows: Record<string, string | number>[], name: string) => {
    if (!rows.length) { toast.error('Nothing to export for the current filters.'); return; }
    downloadFile(toCsv(rows), `${name}-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`${name.replace(/-/g, ' ')} exported.`);
  };

  const totals = register.reduce(
    (s, r) => ({
      gross: s.gross + r.grossPay,
      tax: s.tax + r.paygTax,
      sup: s.sup + r.superGuarantee,
      net: s.net + r.netPay,
    }),
    { gross: 0, tax: 0, sup: 0, net: 0 },
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label htmlFor="rep-from" className="text-xs">Payment date from</Label>
            <Input id="rep-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rep-to" className="text-xs">To</Label>
            <Input id="rep-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Switch id="rep-drafts" checked={includeDrafts} onCheckedChange={setIncludeDrafts} />
            <Label htmlFor="rep-drafts" className="text-xs">Include draft / in-review runs</Label>
          </div>
          <div className="ml-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Gross', value: currency(totals.gross) },
              { label: 'PAYG', value: currency(totals.tax) },
              { label: 'Super', value: currency(totals.sup) },
              { label: 'Net', value: currency(totals.net) },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border px-3 py-2">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-semibold tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register">Payroll register</TabsTrigger>
          <TabsTrigger value="locations">Cost by location</TabsTrigger>
          <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
          <TabsTrigger value="leave">Leave liability</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCsv(register as never, 'payroll-register')}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </div>
          <div className="rounded-lg border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Pay run</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Ord</TableHead>
                  <TableHead className="text-right">OT</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">PAYG</TableHead>
                  <TableHead className="text-right">Super</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {register.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">No pay run data for these filters.</TableCell></TableRow>
                )}
                {register.map((r, i) => (
                  <TableRow key={`${r.runId}-${r.staffId}-${i}`}>
                    <TableCell className="font-medium">{r.staffName}<span className="block text-xs text-muted-foreground">{r.employmentType}</span></TableCell>
                    <TableCell className="text-sm">{r.runName}</TableCell>
                    <TableCell className="text-sm">{r.paymentDate}</TableCell>
                    <TableCell className="text-sm">{r.locationName}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.ordinaryHours.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.overtimeHours.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(r.grossPay)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(r.paygTax)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(r.superGuarantee)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{currency(r.netPay)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="locations" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCsv(locations as never, 'payroll-cost-by-location')}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </div>
          <div className="rounded-lg border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Employees</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Super</TableHead>
                  <TableHead className="text-right">On-cost %</TableHead>
                  <TableHead className="text-right">Total cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No location cost data yet.</TableCell></TableRow>
                )}
                {locations.map((l) => (
                  <TableRow key={l.locationName}>
                    <TableCell className="font-medium">{l.locationName}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.headcount}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.hours.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(l.grossPay)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(l.superGuarantee)}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.onCostPct.toFixed(1)}%</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{currency(l.totalCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="liabilities" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCsv(liabilities as never, 'payroll-liabilities')}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </div>
          <div className="rounded-lg border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment date</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">PAYG payable</TableHead>
                  <TableHead className="text-right">Super payable</TableHead>
                  <TableHead className="text-right">Deductions held</TableHead>
                  <TableHead className="text-right">Net wages</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liabilities.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No liabilities for these filters.</TableCell></TableRow>
                )}
                {liabilities.map((l) => (
                  <TableRow key={l.paymentDate}>
                    <TableCell className="font-medium">{l.paymentDate}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.runs}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(l.paygTax)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(l.superGuarantee)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(l.deductions)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(l.netWages)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{currency(l.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="leave" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Balances accrued from paid ordinary hours in approved runs, valued at the employee's current base rate.
            </p>
            <Button variant="outline" size="sm" onClick={() => exportCsv(leaveLiability as never, 'leave-liability')}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </div>
          <div className="rounded-lg border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Annual</TableHead>
                  <TableHead className="text-right">Personal</TableHead>
                  <TableHead className="text-right">Long service</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Liability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveLiability.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Leave accrues once a pay run is approved.</TableCell></TableRow>
                )}
                {leaveLiability.map((l) => (
                  <TableRow key={l.staffId}>
                    <TableCell className="font-medium">{l.staffName}</TableCell>
                    <TableCell className="text-right tabular-nums">{hrs(l.annualHours)}</TableCell>
                    <TableCell className="text-right tabular-nums">{hrs(l.personalHours)}</TableCell>
                    <TableCell className="text-right tabular-nums">{hrs(l.lslHours)}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(l.hourlyRate)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{currency(l.liability)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
