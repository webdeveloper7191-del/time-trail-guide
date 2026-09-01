import { useMemo, useState } from 'react';
import { addDays, format, startOfWeek } from 'date-fns';
import { Calculator } from 'lucide-react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timesheet } from '@/types/timesheet';
import { PayCycle } from '@/types/payroll';
import { payrollStore } from '@/lib/payroll/payrollStore';
import { buildPayRun } from '@/lib/payroll/payRunEngine';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  timesheets: Timesheet[];
  onCreated: (id: string) => void;
}

const cycleDays: Record<PayCycle, number> = { weekly: 6, fortnightly: 13, monthly: 30 };

export function NewPayRunPanel({ open, onClose, timesheets, onCreated }: Props) {
  const settings = payrollStore.getSettings();
  const defaultStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const [cycle, setCycle] = useState<PayCycle>(settings.defaultCycle);
  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(format(addDays(new Date(defaultStart), cycleDays[settings.defaultCycle]), 'yyyy-MM-dd'));
  const [paymentDate, setPaymentDate] = useState(format(addDays(new Date(defaultStart), cycleDays[settings.defaultCycle] + 3), 'yyyy-MM-dd'));
  const [name, setName] = useState('');
  const [approvedOnly, setApprovedOnly] = useState(true);

  const onCycleChange = (value: PayCycle) => {
    setCycle(value);
    const end = format(addDays(new Date(periodStart), cycleDays[value]), 'yyyy-MM-dd');
    setPeriodEnd(end);
    setPaymentDate(format(addDays(new Date(end), 3), 'yyyy-MM-dd'));
  };

  const eligibleCount = useMemo(() => {
    const inRange = timesheets.filter((t) => {
      if (approvedOnly && t.status !== 'approved') return false;
      return (t.weekStartDate >= periodStart && t.weekStartDate <= periodEnd)
        || (t.weekEndDate >= periodStart && t.weekEndDate <= periodEnd);
    });
    return new Set(inRange.map((t) => t.employee.id)).size;
  }, [timesheets, periodStart, periodEnd, approvedOnly]);

  const create = () => {
    const run = buildPayRun({
      name: name.trim() || `${cycle[0].toUpperCase()}${cycle.slice(1)} pay run ${periodStart}`,
      cycle,
      periodStart,
      periodEnd,
      paymentDate,
      timesheets,
      settings: payrollStore.getSettings(),
      approvedOnly,
    });
    if (!run.lines.length) {
      toast.error('No eligible timesheets in this period.');
      return;
    }
    payrollStore.saveRun(run);
    toast.success(`Draft pay run created — ${run.lines.length} employees, $${run.totals.grossPay.toFixed(2)} gross.`);
    onCreated(run.id);
    onClose();
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="New pay run"
      description="Collect approved timesheets for a period and calculate gross, PAYG and super."
      icon={Calculator}
      size="lg"
      actions={[
        { label: 'Cancel', variant: 'outlined', onClick: onClose },
        { label: 'Create draft run', variant: 'primary', onClick: create, disabled: eligibleCount === 0 },
      ]}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Pay run name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fortnight ending 14 Sep" />
        </div>

        <div className="space-y-2">
          <Label>Pay cycle</Label>
          <Select value={cycle} onValueChange={(v) => onCycleChange(v as PayCycle)}>
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
            <Label>Period start</Label>
            <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Period end</Label>
            <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Payment date</Label>
          <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Approved timesheets only</p>
            <p className="text-xs text-muted-foreground">Turn off to include pending sheets (they will be flagged).</p>
          </div>
          <Switch checked={approvedOnly} onCheckedChange={setApprovedOnly} />
        </div>

        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <span className="font-medium">{eligibleCount}</span> employee{eligibleCount === 1 ? '' : 's'} will be included in this run.
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}
