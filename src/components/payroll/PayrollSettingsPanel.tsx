import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PayCycle, PayrollSettings } from '@/types/payroll';
import { payrollStore, usePayroll } from '@/lib/payroll/payrollStore';

export function PayrollSettingsPanel() {
  usePayroll();
  const s = payrollStore.getSettings();
  const set = (patch: Partial<PayrollSettings>) => payrollStore.updateSettings(patch);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pay calculation</CardTitle>
          <CardDescription>Defaults applied when a pay run is generated.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default pay cycle</Label>
            <Select value={s.defaultCycle} onValueChange={(v) => set({ defaultCycle: v as PayCycle })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="fortnightly">Fortnightly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Super guarantee %</Label>
              <Input type="number" step="0.5" value={s.superRate} onChange={(e) => set({ superRate: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Overtime multiplier</Label>
              <Input type="number" step="0.25" value={s.overtimeMultiplier} onChange={(e) => set({ overtimeMultiplier: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tax scale</Label>
            <Select value={s.taxScale} onValueChange={(v) => set({ taxScale: v as PayrollSettings['taxScale'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="resident">Resident, tax-free threshold claimed</SelectItem>
                <SelectItem value="no_tfn">No TFN provided (47%)</SelectItem>
                <SelectItem value="none">No withholding (export only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Round net pay to cents</p>
              <p className="text-xs text-muted-foreground">Disable to keep full precision in exports.</p>
            </div>
            <Switch checked={s.roundNetToCents} onCheckedChange={(v) => set({ roundNetToCents: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reporting & payments</CardTitle>
          <CardDescription>Financial year and bank file details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Financial year start</Label>
            <Input type="date" value={s.financialYearStart} onChange={(e) => set({ financialYearStart: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>ABA bank code</Label>
            <Input placeholder="e.g. ANZ" value={s.abaBankCode ?? ''} onChange={(e) => set({ abaBankCode: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>ABA account name</Label>
            <Input placeholder="Payroll Clearing" value={s.abaAccountName ?? ''} onChange={(e) => set({ abaAccountName: e.target.value })} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
