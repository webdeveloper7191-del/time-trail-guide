import { Link } from 'react-router-dom';
import { ArrowRight, Banknote } from 'lucide-react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayCalendarsPanel } from '@/components/payroll/PayCalendarsPanel';
import { PayrollSettingsPanel } from '@/components/payroll/PayrollSettingsPanel';
import { AccountingIntegrationsPanel } from '@/components/payroll/AccountingIntegrationsPanel';
import { StpSettingsPanel } from '@/components/payroll/StpSettingsPanel';
import { DeductionsPanel } from '@/components/payroll/DeductionsPanel';
import { payrollStore, usePayroll } from '@/lib/payroll/payrollStore';
import { cycleLabel, periodContaining } from '@/lib/payroll/payCalendar';

export default function PayrollSettings() {
  usePayroll();
  const runs = payrollStore.getRuns();
  const calendar = payrollStore.getCalendar(payrollStore.getSettings().defaultCalendarId);
  const stp = payrollStore.getStpSettings();
  const connected = payrollStore.getConnections().filter((c) => c.connected);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
                <Banknote className="h-6 w-6" />Payroll settings
              </h1>
              <p className="text-muted-foreground mt-1 max-w-3xl">
                Pay periods, calculation rules, accounting account mappings and STP Phase 2 details. Everything configured
                here drives pay run generation and exports in the Payroll workspace.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/payroll">Open Payroll<ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Default calendar</p>
              <p className="text-sm font-medium">{calendar ? `${calendar.name}` : 'Not set'}</p>
              <p className="text-xs text-muted-foreground">{calendar ? cycleLabel[calendar.cycle] : '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Current period</p>
              <p className="text-sm font-medium">{calendar ? `${periodContaining(calendar).periodStart} → ${periodContaining(calendar).periodEnd}` : '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Accounting</p>
              <p className="text-sm font-medium">{connected.length ? connected.map((c) => c.platform.toUpperCase()).join(', ') : 'Not connected'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">STP Phase 2</p>
              <Badge variant={stp.enabled ? 'default' : 'outline'}>{stp.enabled ? 'Enabled' : 'Disabled'}</Badge>
            </div>
          </div>

          <Tabs defaultValue="calendars">
            <TabsList>
              <TabsTrigger value="calendars">Pay periods</TabsTrigger>
              <TabsTrigger value="rules">Calculation rules</TabsTrigger>
              <TabsTrigger value="deductions">Deductions</TabsTrigger>
              <TabsTrigger value="accounts">Account mappings</TabsTrigger>
              <TabsTrigger value="stp">STP Phase 2</TabsTrigger>
            </TabsList>

            <TabsContent value="calendars" className="mt-4"><PayCalendarsPanel /></TabsContent>
            <TabsContent value="rules" className="mt-4"><PayrollSettingsPanel /></TabsContent>
            <TabsContent value="deductions" className="mt-4"><DeductionsPanel /></TabsContent>
            <TabsContent value="accounts" className="mt-4"><AccountingIntegrationsPanel runs={runs} /></TabsContent>
            <TabsContent value="stp" className="mt-4"><StpSettingsPanel /></TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
