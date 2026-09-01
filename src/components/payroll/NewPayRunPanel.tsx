import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
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
import { cycleLabel, periodAtOffset, periodContaining } from '@/lib/payroll/payCalendar';
import { getPayrollStaffDirectory, matchStaffRecord } from '@/lib/payroll/payrollEmployeeBridge';
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
  const calendars = payrollStore.getCalendars().filter((c) => c.active);
  const defaultCalendar = payrollStore.getCalendar(settings.defaultCalendarId);
  const initialPeriod = defaultCalendar ? periodContaining(defaultCalendar) : null;

  const [calendarId, setCalendarId] = useState<string>(defaultCalendar?.id ?? 'custom');
  const [cycle, setCycle] = useState<PayCycle>(defaultCalendar?.cycle ?? settings.defaultCycle);
  const [periodStart, setPeriodStart] = useState(initialPeriod?.periodStart ?? format(new Date(), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(
    initialPeriod?.periodEnd ?? format(addDays(new Date(), cycleDays[settings.defaultCycle]), 'yyyy-MM-dd'),
  );
  const [paymentDate, setPaymentDate] = useState(
    initialPeriod?.paymentDate ?? format(addDays(new Date(), cycleDays[settings.defaultCycle] + 3), 'yyyy-MM-dd'),
  );
  const [name, setName] = useState('');
  const [approvedOnly, setApprovedOnly] = useState(true);

  const applyCalendar = (id: string, offset = 0) => {
    setCalendarId(id);
    const cal = calendars.find((c) => c.id === id);
    if (!cal) return;
    const p = offset ? periodAtOffset(cal, offset) : periodContaining(cal);
    setCycle(cal.cycle);
    setPeriodStart(p.periodStart);
    setPeriodEnd(p.periodEnd);
    setPaymentDate(p.paymentDate);
  };

  const onCycleChange = (value: PayCycle) => {
    setCycle(value);
    setCalendarId('custom');
    const end = format(addDays(new Date(periodStart), cycleDays[value]), 'yyyy-MM-dd');
    setPeriodEnd(end);
    setPaymentDate(format(addDays(new Date(end), 3), 'yyyy-MM-dd'));
  };

  const countIn = (start: string, end: string) => {
    const inRange = timesheets.filter((t) => {
      if (approvedOnly && t.status !== 'approved') return false;
      return (t.weekStartDate >= start && t.weekStartDate <= end)
        || (t.weekEndDate >= start && t.weekEndDate <= end);
    });
    return new Set(inRange.map((t) => t.employee.id)).size;
  };

  /**
   * When the panel opens, land on the most recent period that actually has
   * timesheets so the run isn't created against an empty period.
   */
  const [autoSelected, setAutoSelected] = useState(false);
  useEffect(() => {
    if (!open) { setAutoSelected(false); return; }
    if (autoSelected || !defaultCalendar) return;
    setAutoSelected(true);
    if (countIn(periodStart, periodEnd) > 0) return;
    for (let offset = -1; offset >= -12; offset--) {
      const p = periodAtOffset(defaultCalendar, offset);
      if (countIn(p.periodStart, p.periodEnd) > 0) {
        setCalendarId(defaultCalendar.id);
        setCycle(defaultCalendar.cycle);
        setPeriodStart(p.periodStart);
        setPeriodEnd(p.periodEnd);
        setPaymentDate(p.paymentDate);
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** Existing runs whose period overlaps the selected dates — paying twice is a real risk. */
  const overlappingRuns = useMemo(
    () => payrollStore.getRuns().filter((r) => r.periodStart <= periodEnd && r.periodEnd >= periodStart),
    [periodStart, periodEnd, open],
  );

  const eligible = useMemo(() => {
    const staff = getPayrollStaffDirectory();
    const inRange = timesheets.filter((t) => {
      if (approvedOnly && t.status !== 'approved') return false;
      return (t.weekStartDate >= periodStart && t.weekStartDate <= periodEnd)
        || (t.weekEndDate >= periodStart && t.weekEndDate <= periodEnd);
    });
    const employees = new Map(inRange.map((t) => [t.employee.id, t.employee]));
    const matched = Array.from(employees.values()).filter((e) => matchStaffRecord(e, staff)).length;
    return { count: employees.size, matched };
  }, [timesheets, periodStart, periodEnd, approvedOnly]);


  const eligibleCount = eligible.count;
  const [overlapConfirmed, setOverlapConfirmed] = useState(false);
  const blockingOverlap = overlappingRuns.length > 0 && !overlapConfirmed;

  const create = () => {
    if (blockingOverlap) {
      toast.error('This period overlaps an existing pay run — confirm the overlap before creating.');
      return;
    }

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
        { label: 'Create draft run', variant: 'primary', onClick: create, disabled: eligibleCount === 0 || blockingOverlap },
      ]}
    >
      <div className="space-y-5">
        {overlappingRuns.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2">
            <p className="text-sm font-medium text-destructive">Period overlaps an existing pay run</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {overlappingRuns.map((r) => (
                <li key={r.id}>{r.name} · {r.periodStart} → {r.periodEnd} · {r.status}</li>
              ))}
            </ul>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={overlapConfirmed} onChange={(e) => setOverlapConfirmed(e.target.checked)} />
              I understand these hours may already have been paid — create anyway.
            </label>
          </div>
        )}

        <div className="space-y-2">
          <Label>Pay run name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fortnight ending 14 Sep" />
        </div>


        <div className="space-y-2">
          <Label>Pay calendar</Label>
          <Select value={calendarId} onValueChange={(v) => applyCalendar(v)}>
            <SelectTrigger><SelectValue placeholder="Select a pay calendar" /></SelectTrigger>
            <SelectContent>
              {calendars.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} · {cycleLabel[c.cycle]}</SelectItem>
              ))}
              <SelectItem value="custom">Custom dates</SelectItem>
            </SelectContent>
          </Select>
          {calendarId !== 'custom' && (
            <div className="flex gap-2 pt-1">
              <button type="button" className="text-xs text-primary underline" onClick={() => applyCalendar(calendarId, -1)}>Previous period</button>
              <button type="button" className="text-xs text-primary underline" onClick={() => applyCalendar(calendarId, 0)}>Current period</button>
            </div>
          )}
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

        <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
          <p><span className="font-medium">{eligibleCount}</span> employee{eligibleCount === 1 ? '' : 's'} will be included in this run.</p>
          <p className="text-xs text-muted-foreground">
            {eligible.matched} matched to a workforce record — rates, awards and super come from those profiles.
            {eligibleCount - eligible.matched > 0 && ` ${eligibleCount - eligible.matched} will fall back to the timesheet rate.`}
          </p>
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}
