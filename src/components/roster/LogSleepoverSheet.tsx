import { useState, useMemo } from 'react';
import { Shift, StaffMember } from '@/types/roster';
import { SleepoverEvent, SleepoverDisturbance } from '@/types/shiftEvents';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Moon,
  Clock,
  DollarSign,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Baby,
  Thermometer,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface LogSleepoverSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentShift?: Shift | null;
  staff?: StaffMember | null;
  onSleepoverLogged?: (event: SleepoverEvent) => void;
}

const disturbanceReasons = [
  'Child distress / crying',
  'Child illness / fever',
  'Bathroom assistance',
  'Noise / environmental',
  'Security alarm',
  'Parent contact',
  'Medical emergency',
  'Other',
];

const actionOptions = [
  'Comforted child, returned to sleep',
  'Administered first aid / medication',
  'Called parent / guardian',
  'Called emergency services',
  'Stayed awake remainder of shift',
  'Logged and monitored',
  'Other',
];

// Award thresholds for overtime conversion (per US-RST-076)
// Conversion triggers when EITHER threshold is met (OR logic, not AND)
const DISTURBANCE_COUNT_THRESHOLD = 3; // >2 disturbances triggers conversion
const DISTURBANCE_DURATION_THRESHOLD_MINUTES = 120; // >120 cumulative minutes triggers conversion
const DEFAULT_FLAT_RATE = 65.00; // Per SRS flat sleepover allowance
const OVERTIME_MULTIPLIER = 2.0; // Post-conversion overnight OT rate

export function LogSleepoverSheet({
  open,
  onOpenChange,
  parentShift,
  staff,
  onSleepoverLogged,
}: LogSleepoverSheetProps) {
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [flatRate, setFlatRate] = useState(DEFAULT_FLAT_RATE.toString());
  const [baseHourlyRate, setBaseHourlyRate] = useState('35.00');
  const [disturbances, setDisturbances] = useState<SleepoverDisturbance[]>([]);
  const [childWelfareChecks, setChildWelfareChecks] = useState('2');
  const [environmentNotes, setEnvironmentNotes] = useState('');
  const [notes, setNotes] = useState('');

  const addDisturbance = () => {
    setDisturbances(prev => [...prev, {
      id: `dist-${Date.now()}`,
      time: '',
      durationMinutes: 15,
      reason: '',
      actionTaken: '',
      emergencyServicesContacted: false,
    }]);
  };

  const updateDisturbance = (id: string, updates: Partial<SleepoverDisturbance>) => {
    setDisturbances(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const removeDisturbance = (id: string) => {
    setDisturbances(prev => prev.filter(d => d.id !== id));
  };

  const payCalc = useMemo(() => {
    const totalDisturbanceMinutes = disturbances.reduce((sum, d) => sum + (d.durationMinutes || 0), 0);
    // C4 fix: OR logic — either count OR duration threshold triggers conversion
    const countExceeded = disturbances.length >= DISTURBANCE_COUNT_THRESHOLD;
    const durationExceeded = totalDisturbanceMinutes >= DISTURBANCE_DURATION_THRESHOLD_MINUTES;
    const overtimeTriggered = countExceeded || durationExceeded;

    const flat = parseFloat(flatRate) || DEFAULT_FLAT_RATE;
    const hourlyRate = parseFloat(baseHourlyRate) || 35;

    if (overtimeTriggered) {
      // Post-conversion: entire sleepover period converts to active hours at OT rate
      // Sleepover allowance is voided (not stacked)
      const checkIn = checkInTime || '22:00';
      const checkOut = checkOutTime || '06:00';
      const [inH, inM] = checkIn.split(':').map(Number);
      const [outH, outM] = checkOut.split(':').map(Number);
      let totalHours = (outH + outM / 60) - (inH + inM / 60);
      if (totalHours < 0) totalHours += 24; // overnight
      const conversionPay = totalHours * hourlyRate * OVERTIME_MULTIPLIER;

      return {
        totalDisturbanceMinutes,
        disturbanceCount: disturbances.length,
        overtimeTriggered: true,
        overtimeMinutes: totalHours * 60,
        conversionReason: countExceeded ? `Count threshold exceeded (${disturbances.length} ≥ ${DISTURBANCE_COUNT_THRESHOLD})` : `Duration threshold exceeded (${totalDisturbanceMinutes}min ≥ ${DISTURBANCE_DURATION_THRESHOLD_MINUTES}min)`,
        flatRate: 0, // Voided on conversion
        overtimePay: Math.round(conversionPay * 100) / 100,
        totalPay: Math.round(conversionPay * 100) / 100,
      };
    }

    // Below threshold: flat allowance + per-disturbance pay
    const disturbancePay = disturbances.reduce((sum, d) => {
      const mins = Math.max(d.durationMinutes || 0, 60); // 1h minimum per disturbance
      return sum + (mins / 60) * hourlyRate * 1.5; // disturbance multiplier
    }, 0);

    return {
      totalDisturbanceMinutes,
      disturbanceCount: disturbances.length,
      overtimeTriggered: false,
      overtimeMinutes: 0,
      conversionReason: '',
      flatRate: flat,
      overtimePay: Math.round(disturbancePay * 100) / 100,
      totalPay: Math.round((flat + disturbancePay) * 100) / 100,
    };
  }, [disturbances, flatRate, baseHourlyRate]);

  const handleSubmit = () => {
    if (!checkInTime || !checkOutTime) {
      toast.error('Please fill in check-in and check-out times');
      return;
    }

    const event: SleepoverEvent = {
      id: `sleep-${Date.now()}`,
      shiftId: parentShift?.id || '',
      staffId: staff?.id || parentShift?.staffId || '',
      staffName: staff?.name || 'Unknown Staff',
      centreId: parentShift?.centreId || '',
      date: parentShift?.date || format(new Date(), 'yyyy-MM-dd'),
      checkInTime,
      checkOutTime,
      disturbances,
      totalDisturbanceMinutes: payCalc.totalDisturbanceMinutes,
      overtimeTriggered: payCalc.overtimeTriggered,
      overtimeMinutes: payCalc.overtimeMinutes,
      environmentNotes,
      childWelfareChecks: parseInt(childWelfareChecks) || 0,
      flatRate: payCalc.flatRate,
      overtimePay: payCalc.overtimePay,
      totalPay: payCalc.totalPay,
      status: 'logged',
      loggedBy: 'Admin',
      loggedAt: new Date().toISOString(),
      notes,
    };

    onSleepoverLogged?.(event);
    onOpenChange(false);
    toast.success(
      `Sleepover logged — $${payCalc.totalPay.toFixed(2)}${payCalc.overtimeTriggered ? ' (overtime triggered)' : ''}`,
      { duration: 5000 }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-purple-600" />
            Log Sleepover Journal
          </SheetTitle>
          <SheetDescription>Record sleepover details, disturbances, and welfare checks</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Parent shift context */}
          {parentShift && staff && (
            <Card className="border-purple-300 bg-purple-500/10">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Sleepover Shift</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: staff.color || 'hsl(var(--muted-foreground))' }}
                    >
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{staff.name}</p>
                      <p className="text-xs text-muted-foreground">{parentShift.startTime} – {parentShift.endTime} · {parentShift.date}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600">
                    Sleepover
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check-in / Check-out */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Clock className="h-4 w-4" /> Check-in / Check-out
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check-in Time *</Label>
                <Input type="datetime-local" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Check-out Time *</Label>
                <Input type="datetime-local" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Child Welfare Checks */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Baby className="h-4 w-4" /> Welfare & Environment
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Welfare / Safety Checks Performed</Label>
                <Input type="number" min="0" value={childWelfareChecks} onChange={e => setChildWelfareChecks(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Environment Notes</Label>
                <Input placeholder="Temperature, noise level..." value={environmentNotes} onChange={e => setEnvironmentNotes(e.target.value)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Disturbances */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Bell className="h-4 w-4" /> Disturbances ({disturbances.length})
              </h4>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addDisturbance}>
                <Plus className="h-3 w-3" /> Add Disturbance
              </Button>
            </div>

            {/* Overtime threshold warning */}
            <div className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg border text-xs",
              payCalc.overtimeTriggered
                ? "bg-destructive/10 border-destructive/40 text-destructive"
                : "bg-muted/30 border-border text-muted-foreground"
            )}>
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                {payCalc.overtimeTriggered
                  ? `Overtime triggered — ${payCalc.disturbanceCount} disturbances / ${payCalc.totalDisturbanceMinutes}min total exceeds threshold`
                  : `Overtime triggers at ${DISTURBANCE_COUNT_THRESHOLD}+ disturbances or ${DISTURBANCE_DURATION_THRESHOLD_MINUTES}+ minutes total`
                }
              </span>
            </div>

            {disturbances.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Moon className="h-6 w-6 mx-auto mb-1 opacity-40" />
                No disturbances — undisturbed sleepover
              </div>
            ) : (
              <div className="space-y-3">
                {disturbances.map((dist, idx) => (
                  <Card key={dist.id} className="border-purple-200/50">
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-purple-600">Disturbance #{idx + 1}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDisturbance(dist.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Time</Label>
                          <Input type="datetime-local" className="h-8 text-xs" value={dist.time} onChange={e => updateDisturbance(dist.id, { time: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Duration (min)</Label>
                          <Input type="number" className="h-8 text-xs" min="1" value={dist.durationMinutes} onChange={e => updateDisturbance(dist.id, { durationMinutes: parseInt(e.target.value) || 0 })} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Reason</Label>
                        <Select value={dist.reason} onValueChange={v => updateDisturbance(dist.id, { reason: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {disturbanceReasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">Action Taken</Label>
                        <Select value={dist.actionTaken} onValueChange={v => updateDisturbance(dist.id, { actionTaken: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {actionOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px]">Emergency services contacted?</Label>
                        <Switch checked={dist.emergencyServicesContacted} onCheckedChange={v => updateDisturbance(dist.id, { emergencyServicesContacted: v })} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Pay Rates */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Pay Rates
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sleepover Flat Rate ($)</Label>
                <Input type="number" step="0.01" value={flatRate} onChange={e => setFlatRate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Base Hourly Rate ($)</Label>
                <Input type="number" step="0.01" value={baseHourlyRate} onChange={e => setBaseHourlyRate(e.target.value)} />
                <p className="text-[10px] text-muted-foreground">Used for overtime calculation ({OVERTIME_MULTIPLIER}x)</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea placeholder="Any other observations..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          {/* Pay Calculation Preview */}
          <Card className="border-purple-300 bg-purple-500/10">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-purple-600">
                <DollarSign className="h-4 w-4" />
                Pay Calculation
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-background rounded border">
                  <span className="text-muted-foreground text-xs">Flat Rate</span>
                  <p className="font-semibold">${payCalc.flatRate.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-background rounded border">
                  <span className="text-muted-foreground text-xs">Disturbances</span>
                  <p className="font-semibold">{payCalc.disturbanceCount} ({payCalc.totalDisturbanceMinutes}min)</p>
                </div>
                {payCalc.overtimeTriggered && (
                  <>
                    <div className="p-2 bg-background rounded border border-destructive/30">
                      <span className="text-destructive text-xs">Overtime Pay</span>
                      <p className="font-bold text-destructive">${payCalc.overtimePay.toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-background rounded border border-destructive/30">
                      <span className="text-destructive text-xs">OT Minutes</span>
                      <p className="font-bold text-destructive">{payCalc.overtimeMinutes}min @ {OVERTIME_MULTIPLIER}x</p>
                    </div>
                  </>
                )}
                <div className="p-2 bg-background rounded border col-span-2">
                  <span className="text-muted-foreground text-xs">Total Pay</span>
                  <p className="font-bold text-lg text-emerald-600">${payCalc.totalPay.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Logged</span>
            <ArrowRight className="h-3 w-3" />
            <span>Manager Approval</span>
            <ArrowRight className="h-3 w-3" />
            <span>Timesheet Entry</span>
            <ArrowRight className="h-3 w-3" />
            <span>Payroll</span>
          </div>
        </div>

        <SheetFooter className="flex gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} className="flex-1 gap-2">
            <Save className="h-4 w-4" />
            Log Sleepover
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
