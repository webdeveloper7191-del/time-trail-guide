import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PayCycle, PayrollSettings } from '@/types/payroll';
import { payrollStore, usePayroll } from '@/lib/payroll/payrollStore';
import { TAX_SCALE_LABELS } from '@/lib/payroll/atoTaxScales';

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
            <Label>Withholding mode</Label>
            <Select value={s.taxScale} onValueChange={(v) => set({ taxScale: v as PayrollSettings['taxScale'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="resident">Withhold PAYG</SelectItem>
                <SelectItem value="no_tfn">Treat everyone as no TFN (47%)</SelectItem>
                <SelectItem value="none">No withholding (export only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Use ATO withholding scales</p>
              <p className="text-xs text-muted-foreground">
                NAT 1004 weekly coefficients, Medicare exemptions and STSL, instead of the simplified annualised model.
              </p>
            </div>
            <Switch checked={s.useAtoTaxScales} onCheckedChange={(v) => set({ useAtoTaxScales: v })} />
          </div>
          {s.useAtoTaxScales && (
            <div className="space-y-2">
              <Label>Default tax scale</Label>
              <Select value={s.defaultAtoScale} onValueChange={(v) => set({ defaultAtoScale: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TAX_SCALE_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Applied when an employee has no tax declaration recorded. Employees without a TFN are always withheld on scale 4.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Apply super maximum contribution base</p>
              <p className="text-xs text-muted-foreground">Stop super accruing on earnings above the quarterly cap.</p>
            </div>
            <Switch checked={s.applySuperMaxContributionBase} onCheckedChange={(v) => set({ applySuperMaxContributionBase: v })} />
          </div>
          {s.applySuperMaxContributionBase && (
            <div className="space-y-2">
              <Label>Maximum contribution base ($ per quarter)</Label>
              <Input
                type="number"
                step="100"
                value={s.superMaxContributionBaseQuarterly}
                onChange={(e) => set({ superMaxContributionBaseQuarterly: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Pro-rated to each pay period when super is calculated.</p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Ordinary hours per week</Label>
            <Input type="number" step="0.5" value={s.ordinaryHoursPerWeek} onChange={(e) => set({ ordinaryHoursPerWeek: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground">Used to convert salaries and weekly pay conditions into an hourly rate.</p>
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
          <CardTitle className="text-base">Award & employee data</CardTitle>
          <CardDescription>How pay runs read the workforce, award and roster records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'useAwardRates' as const, title: 'Price from staff pay conditions and awards', desc: 'Base rate comes from the employee record; the award rate acts as the floor.' },
            { key: 'useAwardPenalties' as const, title: 'Apply award penalty rates', desc: 'Saturday, Sunday, public holiday and night penalties from the assigned award.' },
            { key: 'useAwardOvertimeRates' as const, title: 'Use award overtime steps', desc: 'First 2 hours then thereafter rates, instead of the flat multiplier.' },
            { key: 'applyCasualLoading' as const, title: 'Apply casual loading', desc: 'Loads casual employees at their award loading percentage.' },
            { key: 'superOnOvertime' as const, title: 'Accrue super on overtime', desc: 'Off by default — overtime is generally not ordinary time earnings.' },
            { key: 'compareToRoster' as const, title: 'Reconcile against the roster', desc: 'Flags lines where paid hours differ from scheduled hours.' },
            { key: 'requireBankDetails' as const, title: 'Require bank and TFN details', desc: 'Warns before posting when payment details are missing.' },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between rounded-lg border p-3">
              <div className="pr-4">
                <p className="text-sm font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground">{row.desc}</p>
              </div>
              <Switch checked={Boolean(s[row.key])} onCheckedChange={(v) => set({ [row.key]: v } as Partial<PayrollSettings>)} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default casual loading %</Label>
              <Input type="number" step="0.5" value={s.defaultCasualLoadingPct} onChange={(e) => set({ defaultCasualLoadingPct: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Roster variance tolerance (hrs)</Label>
              <Input type="number" step="0.25" value={s.rosterVarianceToleranceHours} onChange={(e) => set({ rosterVarianceToleranceHours: Number(e.target.value) })} />
            </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Withdrawal BSB</Label>
              <Input placeholder="083-004" value={s.abaBsb ?? ''} onChange={(e) => set({ abaBsb: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Withdrawal account number</Label>
              <Input placeholder="123456789" value={s.abaAccountNumber ?? ''} onChange={(e) => set({ abaAccountNumber: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>APCA user ID</Label>
              <Input placeholder="6 digits, e.g. 123456" value={s.abaUserNumber ?? ''} onChange={(e) => set({ abaUserNumber: e.target.value })} />
              <p className="text-xs text-muted-foreground">Issued by your bank for direct entry files.</p>
            </div>
            <div className="space-y-2">
              <Label>Lodgement reference</Label>
              <Input placeholder="PAYROLL" value={s.abaLodgementReference ?? ''} onChange={(e) => set({ abaLodgementReference: e.target.value })} />
              <p className="text-xs text-muted-foreground">Shown on the employee's bank statement.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Super guarantee monthly threshold ($)</Label>
            <Input type="number" step="10" value={s.superMonthlyThreshold} onChange={(e) => set({ superMonthlyThreshold: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground">$0 since 1 July 2022 — super accrues from the first dollar.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave & termination pay</CardTitle>
          <CardDescription>Leave loading and the flat withholding rates applied to final pays.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Annual leave loading %</Label>
              <Input type="number" step="0.5" value={s.annualLeaveLoadingPct} onChange={(e) => set({ annualLeaveLoadingPct: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Unused leave tax rate %</Label>
              <Input type="number" step="1" value={s.terminationLeaveTaxRate} onChange={(e) => set({ terminationLeaveTaxRate: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground">Schedule 7 flat rate on unused annual and long service leave.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ETP tax rate %</Label>
              <Input type="number" step="1" value={s.etpTaxRate} onChange={(e) => set({ etpTaxRate: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Redundancy tax-free base ($)</Label>
              <Input type="number" step="1" value={s.redundancyTaxFreeBase} onChange={(e) => set({ redundancyTaxFreeBase: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Redundancy tax-free per completed year ($)</Label>
            <Input type="number" step="1" value={s.redundancyTaxFreePerYear} onChange={(e) => set({ redundancyTaxFreePerYear: Number(e.target.value) })} />
          </div>
          {[
            { key: 'payLeaveLoadingOnLeaveTaken' as const, title: 'Pay leave loading on annual leave taken', desc: 'Adds the loading percentage to paid annual leave in a pay run.' },
            { key: 'payLeaveLoadingOnTermination' as const, title: 'Pay leave loading on termination payouts', desc: 'Only where the award or agreement requires it on unused leave.' },
            { key: 'superOnTerminationPay' as const, title: 'Accrue super on termination lump sums', desc: 'Off by default — unused leave and ETPs are not ordinary time earnings.' },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between rounded-lg border p-3">
              <div className="pr-4">
                <p className="text-sm font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground">{row.desc}</p>
              </div>
              <Switch checked={Boolean(s[row.key])} onCheckedChange={(v) => set({ [row.key]: v } as Partial<PayrollSettings>)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

