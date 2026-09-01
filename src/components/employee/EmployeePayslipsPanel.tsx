import { useMemo, useState } from 'react';
import { Download, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { usePayroll } from '@/lib/payroll/payrollStore';
import { EmployeePayslip, getPayslipsForEmployee, payslipYtd } from '@/lib/payroll/payslips';
import { exportPayslipPdf } from '@/lib/payroll/accountingExport';
import { toast } from 'sonner';

interface Props {
  employeeId: string;
  staffRecordId?: string;
  employeeName: string;
}

const currency = (n: number) =>
  `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function EmployeePayslipsPanel({ employeeId, staffRecordId, employeeName }: Props) {
  usePayroll();
  const [selected, setSelected] = useState<EmployeePayslip | null>(null);

  const payslips = useMemo(
    () => getPayslipsForEmployee({ id: employeeId, staffRecordId, name: employeeName }),
    [employeeId, staffRecordId, employeeName],
  );
  const ytd = useMemo(() => payslipYtd(payslips), [payslips]);

  const download = (p: EmployeePayslip) => {
    exportPayslipPdf(p.run, p.line);
    toast.success('Payslip downloaded.');
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Payslips this FY', value: String(ytd.payslipCount) },
          { label: 'Gross YTD', value: currency(ytd.grossPay) },
          { label: 'Tax withheld YTD', value: currency(ytd.paygTax) },
          { label: 'Super YTD', value: currency(ytd.superGuarantee) },
          { label: 'Net paid YTD', value: currency(ytd.netPay) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-semibold tracking-tight">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pay period</TableHead>
              <TableHead>Paid on</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Super</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payslips.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No payslips published yet. They appear here as soon as payroll publishes the pay run.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {payslips.map((p) => (
              <TableRow key={`${p.run.id}-${p.line.id}`} className="cursor-pointer" onClick={() => setSelected(p)}>
                <TableCell className="font-medium">
                  {p.run.periodStart} → {p.run.periodEnd}
                  <span className="block text-xs text-muted-foreground">{p.run.name}</span>
                </TableCell>
                <TableCell className="text-sm">{p.run.paymentDate}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {(p.line.ordinaryHours + p.line.overtimeHours).toFixed(2)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{currency(p.line.grossPay)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {currency(p.line.paygTax + (p.line.lumpSumTax ?? 0))}
                </TableCell>
                <TableCell className="text-right tabular-nums">{currency(p.line.superGuarantee)}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">{currency(p.line.netPay)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); download(p); }}>
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PrimaryOffCanvas
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Payslip"
        description={selected ? `${selected.run.periodStart} to ${selected.run.periodEnd} · paid ${selected.run.paymentDate}` : ''}
        icon={Receipt}
        size="2xl"
        actions={[
          { label: 'Close', variant: 'outlined' as const, onClick: () => setSelected(null) },
          ...(selected ? [{ label: 'Download PDF', variant: 'primary' as const, onClick: () => download(selected) }] : []),
        ]}
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Gross', value: currency(selected.line.grossPay) },
                { label: 'Tax withheld', value: currency(selected.line.paygTax + (selected.line.lumpSumTax ?? 0)) },
                { label: 'Super', value: currency(selected.line.superGuarantee) },
                { label: 'Net pay', value: currency(selected.line.netPay) },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-semibold tracking-tight">{s.value}</p>
                </div>
              ))}
            </div>

            {selected.line.stslWithheld ? (
              <p className="text-sm text-muted-foreground">
                Includes {currency(selected.line.stslWithheld)} study and training support loan (STSL) withholding.
              </p>
            ) : null}

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pay item</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.line.components.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        {c.label}
                        <Badge variant="outline" className="ml-2 capitalize text-[10px]">{c.kind}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.units}</TableCell>
                      <TableCell className="text-right tabular-nums">{currency(c.rate)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.kind === 'deduction' ? `-${currency(c.amount)}` : currency(c.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Ordinary hours', value: selected.line.ordinaryHours.toFixed(2) },
                { label: 'Overtime hours', value: selected.line.overtimeHours.toFixed(2) },
                ...(selected.line.backPay ? [{ label: 'Back pay included', value: currency(selected.line.backPay) }] : []),
                ...(selected.line.leavePay ? [{ label: 'Paid leave', value: currency(selected.line.leavePay) }] : []),
                ...(selected.line.terminationPay ? [{ label: 'Termination payments', value: currency(selected.line.terminationPay) }] : []),
                ...(selected.line.salarySacrificeSuper ? [{ label: 'Salary sacrifice to super', value: currency(selected.line.salarySacrificeSuper) }] : []),
                { label: 'Super fund', value: selected.line.superFundName ?? 'Not nominated' },
                { label: 'Paid to', value: selected.line.bankAccountMasked ?? 'No account on file' },
              ].map((i) => (
                <div key={i.label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{i.label}</p>
                  <p className="text-sm font-medium">{i.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </PrimaryOffCanvas>
    </div>
  );
}
