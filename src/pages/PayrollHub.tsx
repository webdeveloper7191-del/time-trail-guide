import { useMemo, useState } from 'react';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockTimesheets } from '@/data/mockTimesheets';
import { PayRun, PayRunStatus } from '@/types/payroll';
import { payrollStore, usePayroll } from '@/lib/payroll/payrollStore';
import { periodContaining } from '@/lib/payroll/payCalendar';
import { NewPayRunPanel } from '@/components/payroll/NewPayRunPanel';
import { PayRunDetailPanel } from '@/components/payroll/PayRunDetailPanel';
import { AccountingIntegrationsPanel } from '@/components/payroll/AccountingIntegrationsPanel';
import { StpSummaryPanel } from '@/components/payroll/StpSummaryPanel';
import { PayrollReportsPanel } from '@/components/payroll/PayrollReportsPanel';
import { Link } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';

const currency = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusVariant: Record<PayRunStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline',
  review: 'secondary',
  approved: 'default',
  posted: 'default',
};

export default function PayrollHub() {
  usePayroll();
  const runs = payrollStore.getRuns();
  const settings = payrollStore.getSettings();
  const calendar = payrollStore.getCalendar(settings.defaultCalendarId);
  const stp = payrollStore.getStpSettings();
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected: PayRun | null = useMemo(
    () => runs.find((r) => r.id === selectedId) ?? null,
    [runs, selectedId],
  );

  const ytd = runs.reduce((s, r) => s + r.totals.grossPay, 0);
  const pending = runs.filter((r) => r.status === 'draft' || r.status === 'review').length;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Payroll</h1>
              <p className="text-muted-foreground mt-1">
                Turn approved timesheets into pay runs, export to your accounting platform, and track STP year-to-date totals.
              </p>
            </div>
            <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-2" />New pay run</Button>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Pay runs', value: String(runs.length) },
              { label: 'Awaiting approval', value: String(pending) },
              { label: 'Gross processed', value: currency(ytd) },
              { label: 'Timesheets available', value: String(mockTimesheets.filter((t) => t.status === 'approved').length) },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-semibold tracking-tight">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="runs">
            <TabsList>
              <TabsTrigger value="runs">Pay runs</TabsTrigger>
              <TabsTrigger value="accounting">Accounting exports</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="stp">STP summaries</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="runs" className="mt-4">
              <div className="rounded-lg border overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pay run</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Payment date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Employees</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">PAYG</TableHead>
                      <TableHead className="text-right">Super</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="py-12 text-center">
                          <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No pay runs yet. Create one from approved timesheets.</p>
                        </TableCell>
                      </TableRow>
                    )}
                    {runs.map((r) => (
                      <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedId(r.id)}>
                        <TableCell className="font-medium">{r.name}<span className="block text-xs text-muted-foreground">{r.id} · {r.cycle}</span></TableCell>
                        <TableCell className="text-sm">{r.periodStart} → {r.periodEnd}</TableCell>
                        <TableCell className="text-sm">{r.paymentDate}</TableCell>
                        <TableCell><Badge variant={statusVariant[r.status]} className="capitalize">{r.status}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">{r.totals.headcount}</TableCell>
                        <TableCell className="text-right tabular-nums">{currency(r.totals.grossPay)}</TableCell>
                        <TableCell className="text-right tabular-nums">{currency(r.totals.paygTax)}</TableCell>
                        <TableCell className="text-right tabular-nums">{currency(r.totals.superGuarantee)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{currency(r.totals.netPay)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); payrollStore.deleteRun(r.id); toast.success('Pay run deleted.'); }}
                            aria-label={`Delete ${r.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="accounting" className="mt-4">
              <AccountingIntegrationsPanel runs={runs} />
            </TabsContent>

            <TabsContent value="reports" className="mt-4">
              <PayrollReportsPanel runs={runs} />
            </TabsContent>

            <TabsContent value="stp" className="mt-4">
              <StpSummaryPanel runs={runs} />
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h2 className="text-base font-semibold">Payroll configuration</h2>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                      Pay calendars, calculation rules, accounting account mappings and STP Phase 2 payer details are
                      managed in Settings and applied to every pay run generated here.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: 'Default pay calendar', value: calendar ? `${calendar.name}` : 'Not set' },
                      { label: 'Current period', value: calendar ? `${periodContaining(calendar).periodStart} → ${periodContaining(calendar).periodEnd}` : '—' },
                      { label: 'Super guarantee', value: `${settings.superRate}%` },
                      { label: 'STP Phase 2', value: stp.enabled ? `Enabled · ABN ${stp.abn || 'not set'}` : 'Disabled' },
                    ].map((i) => (
                      <div key={i.label} className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">{i.label}</p>
                        <p className="text-sm font-medium">{i.value}</p>
                      </div>
                    ))}
                  </div>
                  <Button asChild><Link to="/settings/payroll"><Settings2 className="h-4 w-4 mr-2" />Open payroll settings</Link></Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <NewPayRunPanel
        open={newOpen}
        onClose={() => setNewOpen(false)}
        timesheets={mockTimesheets}
        onCreated={(id) => setSelectedId(id)}
      />
      <PayRunDetailPanel run={selected} open={!!selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
