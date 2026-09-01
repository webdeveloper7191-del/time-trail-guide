import { useState } from 'react';
import { CalendarOff, Trash2 } from 'lucide-react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DeductionCategory,
  PayRun,
  PayRunAdjustment,
  PayRunAdjustmentKind,
  PayRunLine,
} from '@/types/payroll';
import { payrollStore } from '@/lib/payroll/payrollStore';
import { recalcRun } from '@/lib/payroll/payRunEngine';
import { leaveTypesStore } from '@/lib/masterData/leaveTypesStore';
import { toast } from 'sonner';

interface Props {
  run: PayRun;
  line: PayRunLine | null;
  open: boolean;
  onClose: () => void;
}

const currency = (n: number) => `$${n.toFixed(2)}`;

export function PayRunAdjustmentSheet({ run, line, open, onClose }: Props) {
  const settings = payrollStore.getSettings();
  const leaveTypes = leaveTypesStore.get().filter((l) => l.status === 'active' && l.paid);

  const [kind, setKind] = useState<PayRunAdjustmentKind>('leave');
  const [leaveTypeCode, setLeaveTypeCode] = useState(leaveTypes[0]?.code ?? 'AL');
  const [hours, setHours] = useState(7.6);
  const [rate, setRate] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(settings.payLeaveLoadingOnLeaveTaken);

  const [backLabel, setBackLabel] = useState('Back pay');
  const [backHours, setBackHours] = useState(0);
  const [backDiff, setBackDiff] = useState(0);
  const [backAmount, setBackAmount] = useState(0);
  const [backFrom, setBackFrom] = useState('');
  const [backTo, setBackTo] = useState('');
  const [backSuperable, setBackSuperable] = useState(true);

  const [dedLabel, setDedLabel] = useState('');
  const [dedCategory, setDedCategory] = useState<DeductionCategory>('post_tax');
  const [dedAmount, setDedAmount] = useState(0);

  const [unusedAl, setUnusedAl] = useState(0);
  const [unusedLsl, setUnusedLsl] = useState(0);
  const [piln, setPiln] = useState(0);
  const [redundancy, setRedundancy] = useState(0);
  const [years, setYears] = useState(0);
  const [genuine, setGenuine] = useState(true);
  const [etp, setEtp] = useState(0);
  const [notes, setNotes] = useState('');

  if (!line) return null;

  const existing = (run.adjustments ?? []).filter((a) => a.lineId === line.id || a.staffId === line.staffId);

  const persist = (adjustments: PayRunAdjustment[]) => {
    if (run.locked) { toast.error('This pay run is locked. Unlock it before adding adjustments.'); return; }
    payrollStore.saveRun(recalcRun({ ...run, adjustments }, settings));
  };

  const remove = (id: string) => {
    persist((run.adjustments ?? []).filter((a) => a.id !== id));
    toast.success('Adjustment removed and the line recalculated.');
  };

  const add = () => {
    const base = { id: crypto.randomUUID(), lineId: line.id, staffId: line.staffId, kind } as PayRunAdjustment;
    let adj: PayRunAdjustment;

    if (kind === 'leave') {
      if (!hours) { toast.error('Enter the leave hours to pay.'); return; }
      const type = leaveTypes.find((l) => l.code === leaveTypeCode);
      adj = {
        ...base,
        label: type ? `${type.label} paid` : 'Paid leave',
        leaveTypeCode,
        hours,
        rate: rate ?? line.baseRate,
        loadingPct: loading && leaveTypeCode === 'AL' ? settings.annualLeaveLoadingPct : 0,
      };
    } else if (kind === 'back_pay') {
      const total = backAmount || Number((backHours * backDiff).toFixed(2));
      if (!total) { toast.error('Enter a back pay amount, or hours and a rate difference.'); return; }
      adj = {
        ...base,
        label: backLabel || 'Back pay',
        amount: total,
        backPayHours: backHours || undefined,
        backPayRateDifference: backDiff || undefined,
        backPayFrom: backFrom || undefined,
        backPayTo: backTo || undefined,
        superable: backSuperable,
      };
    } else if (kind === 'deduction') {
      if (!dedAmount) { toast.error('Enter a deduction amount.'); return; }
      adj = { ...base, label: dedLabel || 'One-off deduction', category: dedCategory, amount: dedAmount };
    } else {
      if (!unusedAl && !unusedLsl && !piln && !redundancy && !etp) {
        toast.error('Enter at least one termination component.');
        return;
      }
      adj = {
        ...base,
        label: 'Termination pay',
        rate: rate ?? line.baseRate,
        unusedAnnualLeaveHours: unusedAl,
        unusedLslHours: unusedLsl,
        paymentInLieuAmount: piln,
        redundancyAmount: redundancy,
        completedYearsOfService: years,
        genuineRedundancy: genuine,
        etpTaxableAmount: etp,
        notes,
      };
    }

    persist([...(run.adjustments ?? []), adj]);
    toast.success('Adjustment added — the line has been recalculated.');
  };

  const taxFreeCap = genuine ? settings.redundancyTaxFreeBase + settings.redundancyTaxFreePerYear * years : 0;

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={`Adjust pay — ${line.staffName}`}
      description={`Base rate ${currency(line.baseRate)}/hr · gross ${currency(line.grossPay)} · net ${currency(line.netPay)}`}
      icon={CalendarOff}
      size="xl"
      actions={[
        { label: 'Close', variant: 'outlined', onClick: onClose },
        { label: 'Add adjustment', variant: 'primary', onClick: add },
      ]}
    >
      <div className="space-y-6">
        {existing.length > 0 && (
          <div className="rounded-lg border divide-y">
            {existing.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-medium">{a.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.kind === 'leave' && `${a.hours} hrs @ ${currency(a.rate ?? line.baseRate)}${a.loadingPct ? ` + ${a.loadingPct}% loading` : ''}`}
                    {a.kind === 'back_pay' && `${currency(a.amount ?? 0)}${a.backPayFrom ? ` · ${a.backPayFrom} → ${a.backPayTo}` : ''}`}
                    {a.kind === 'deduction' && `${currency(a.amount ?? 0)} · ${a.category?.replace('_', ' ')}`}
                    {a.kind === 'termination' && 'Unused leave, notice and ETP components'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}

        <Tabs value={kind} onValueChange={(v) => setKind(v as PayRunAdjustmentKind)}>
          <TabsList>
            <TabsTrigger value="leave">Leave payment</TabsTrigger>
            <TabsTrigger value="back_pay">Back pay</TabsTrigger>
            <TabsTrigger value="deduction">One-off deduction</TabsTrigger>
            <TabsTrigger value="termination">Termination pay</TabsTrigger>
          </TabsList>

          <TabsContent value="leave" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Leave type</Label>
                <Select value={leaveTypeCode} onValueChange={setLeaveTypeCode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((l) => <SelectItem key={l.id} value={l.code}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hours paid</Label>
                <Input type="number" step="0.1" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rate ($/hr)</Label>
                <Input type="number" step="0.01" value={rate ?? line.baseRate} onChange={(e) => setRate(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground">Defaults to the base rate — leave is paid at ordinary time, without penalties.</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Pay {settings.annualLeaveLoadingPct}% leave loading</p>
                  <p className="text-xs text-muted-foreground">Annual leave only.</p>
                </div>
                <Switch checked={loading} onCheckedChange={setLoading} disabled={leaveTypeCode !== 'AL'} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Adds {currency(hours * (rate ?? line.baseRate) * (1 + (loading && leaveTypeCode === 'AL' ? settings.annualLeaveLoadingPct / 100 : 0)))} to
              gross, taxed at the normal scale and superable.
            </p>
          </TabsContent>

          <TabsContent value="back_pay" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={backLabel} onChange={(e) => setBackLabel(e.target.value)} placeholder="e.g. Award increase back pay" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Period from</Label>
                <Input type="date" value={backFrom} onChange={(e) => setBackFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Period to</Label>
                <Input type="date" value={backTo} onChange={(e) => setBackTo(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Hours re-priced</Label>
                <Input type="number" step="0.1" value={backHours} onChange={(e) => setBackHours(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Rate difference ($/hr)</Label>
                <Input type="number" step="0.01" value={backDiff} onChange={(e) => setBackDiff(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Or total amount ($)</Label>
                <Input type="number" step="0.01" value={backAmount} onChange={(e) => setBackAmount(Number(e.target.value))} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Superable</p>
                <p className="text-xs text-muted-foreground">Back pay on ordinary time earnings attracts super guarantee.</p>
              </div>
              <Switch checked={backSuperable} onCheckedChange={setBackSuperable} />
            </div>
            <p className="text-sm text-muted-foreground">
              Adds {currency(backAmount || backHours * backDiff)} to gross, taxed at the employee's normal scale and
              itemised separately on the payslip.
            </p>
          </TabsContent>

          <TabsContent value="deduction" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={dedLabel} onChange={(e) => setDedLabel(e.target.value)} placeholder="e.g. Overpayment recovery" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Treatment</Label>
                <Select value={dedCategory} onValueChange={(v) => setDedCategory(v as DeductionCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_tax">Pre-tax</SelectItem>
                    <SelectItem value="post_tax">Post-tax</SelectItem>
                    <SelectItem value="salary_sacrifice_super">Salary sacrifice to super</SelectItem>
                    <SelectItem value="child_support">Child support</SelectItem>
                    <SelectItem value="union">Union fees</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input type="number" step="0.01" value={dedAmount} onChange={(e) => setDedAmount(Number(e.target.value))} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="termination" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unused annual leave (hours)</Label>
                <Input type="number" step="0.1" value={unusedAl} onChange={(e) => setUnusedAl(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Unused long service leave (hours)</Label>
                <Input type="number" step="0.1" value={unusedLsl} onChange={(e) => setUnusedLsl(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payout rate ($/hr)</Label>
                <Input type="number" step="0.01" value={rate ?? line.baseRate} onChange={(e) => setRate(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Payment in lieu of notice ($)</Label>
                <Input type="number" step="0.01" value={piln} onChange={(e) => setPiln(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Redundancy pay ($)</Label>
                <Input type="number" step="0.01" value={redundancy} onChange={(e) => setRedundancy(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Completed years of service</Label>
                <Input type="number" step="1" value={years} onChange={(e) => setYears(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Other taxable ETP ($)</Label>
                <Input type="number" step="0.01" value={etp} onChange={(e) => setEtp(Number(e.target.value))} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Genuine redundancy</p>
                <p className="text-xs text-muted-foreground">
                  Tax-free cap {currency(taxFreeCap)} ({currency(settings.redundancyTaxFreeBase)} base + {currency(settings.redundancyTaxFreePerYear)} per year).
                </p>
              </div>
              <Switch checked={genuine} onCheckedChange={setGenuine} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for termination, final day worked…" />
            </div>
            <p className="text-xs text-muted-foreground">
              Unused leave is withheld at {settings.terminationLeaveTaxRate}% and ETP components at {settings.etpTaxRate}% —
              these lump sums are excluded from the normal PAYG scale and from super.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </PrimaryOffCanvas>
  );
}
