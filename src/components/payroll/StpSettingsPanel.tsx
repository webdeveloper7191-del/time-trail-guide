import { ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StpIncomeStream, StpSettings } from '@/types/payroll';
import { payrollStore, usePayroll } from '@/lib/payroll/payrollStore';

const incomeStreams: { value: StpIncomeStream; label: string }[] = [
  { value: 'SAW', label: 'SAW — Salary and wages' },
  { value: 'CHP', label: 'CHP — Closely held payees' },
  { value: 'WHM', label: 'WHM — Working holiday makers' },
  { value: 'LAB', label: 'LAB — Labour hire' },
];

export function StpSettingsPanel() {
  usePayroll();
  const s = payrollStore.getStpSettings();
  const set = (patch: Partial<StpSettings>) => payrollStore.updateStpSettings(patch);

  const toggle = (key: keyof StpSettings, title: string, description: string) => (
    <div className="flex items-center justify-between rounded-lg border p-3" key={key}>
      <div className="pr-4">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={Boolean(s[key])} onCheckedChange={(v) => set({ [key]: v } as Partial<StpSettings>)} />
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Payer details</CardTitle>
          <CardDescription>These identifiers appear on every STP Phase 2 summary and export produced in Payroll.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">STP Phase 2 reporting enabled</p>
              <p className="text-xs text-muted-foreground">Turn on to produce lodgement-ready summaries after each pay run.</p>
            </div>
            <Switch checked={s.enabled} onCheckedChange={(v) => set({ enabled: v })} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Payer / employing entity name</Label>
              <Input value={s.payerName} onChange={(e) => set({ payerName: e.target.value })} placeholder="Rostered.ai Demo Pty Ltd" />
            </div>
            <div className="space-y-2">
              <Label>ABN</Label>
              <Input value={s.abn} onChange={(e) => set({ abn: e.target.value })} placeholder="11 222 333 444" />
            </div>
            <div className="space-y-2">
              <Label>Branch code</Label>
              <Input value={s.branchCode} onChange={(e) => set({ branchCode: e.target.value })} placeholder="001" />
            </div>
            <div className="space-y-2">
              <Label>BMS identifier</Label>
              <Input value={s.bmsId} onChange={(e) => set({ bmsId: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Declaration contact</CardTitle>
            <CardDescription>Who the ATO contacts about a lodgement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Reporting party</Label>
              <Select value={s.reportingParty} onValueChange={(v) => set({ reportingParty: v as StpSettings['reportingParty'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employer">Employer</SelectItem>
                  <SelectItem value="registered_agent">Registered tax/BAS agent</SelectItem>
                  <SelectItem value="intermediary">Sending service provider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {s.reportingParty !== 'employer' && (
              <div className="space-y-2">
                <Label>Agent / intermediary number</Label>
                <Input value={s.agentNumber ?? ''} onChange={(e) => set({ agentNumber: e.target.value })} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Contact name</Label>
              <Input value={s.contactName} onChange={(e) => set({ contactName: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact email</Label>
                <Input type="email" value={s.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Contact phone</Label>
                <Input value={s.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phase 2 disaggregation</CardTitle>
            <CardDescription>Controls how earnings are itemised on the STP summary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Default income stream</Label>
              <Select value={s.defaultIncomeStream} onValueChange={(v) => set({ defaultIncomeStream: v as StpIncomeStream })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {incomeStreams.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Contractors on the staff record are reported as labour hire automatically.</p>
            </div>
            {toggle('disaggregateOvertime', 'Report overtime separately', 'Required under Phase 2 — overtime is split out of gross.')}
            {toggle('reportAllowancesSeparately', 'Itemise allowances', 'Each allowance type is reported against its own code.')}
            {toggle('reportPaidLeaveSeparately', 'Itemise paid leave', 'Leave payments are reported apart from ordinary earnings.')}
            {toggle('reportSalarySacrifice', 'Report salary sacrifice', 'Include salary-sacrificed super and other benefits.')}
            {toggle('finalEventForFy', 'Mark next lodgement as final', 'Flags the finalisation declaration for the financial year.')}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
