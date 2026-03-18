import { useState, useEffect, useMemo } from 'react';
import { Shift, StaffMember } from '@/types/roster';
import { CallbackEvent } from './CallbackEventLoggingPanel';
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
  PhoneCall,
  AlertTriangle,
  Clock,
  DollarSign,
  Save,
  Car,
  Shield,
  Zap,
  MapPin,
  Timer,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface LogCallbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentShift?: Shift | null;
  staff?: StaffMember | null;
  defaultType?: 'callback' | 'recall' | 'emergency';
  onCallbackLogged?: (event: CallbackEvent) => void;
}

const callbackTypeConfig = {
  callback: {
    label: 'Callback',
    description: 'Staff called back from on-call standby',
    icon: PhoneCall,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-300',
    minEngagement: { weekday: 2, saturday: 3, sunday: 3, public_holiday: 4 },
    multipliers: { weekday: 1.5, saturday: 1.5, sunday: 2.0, public_holiday: 2.5 },
  },
  recall: {
    label: 'Recall',
    description: 'Off-duty staff recalled urgently',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-300',
    minEngagement: { weekday: 3, saturday: 3, sunday: 4, public_holiday: 4 },
    multipliers: { weekday: 1.75, saturday: 1.75, sunday: 2.0, public_holiday: 2.5 },
  },
  emergency: {
    label: 'Emergency',
    description: 'Critical emergency response required',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-300',
    minEngagement: { weekday: 4, saturday: 4, sunday: 4, public_holiday: 4 },
    multipliers: { weekday: 2.0, saturday: 2.5, sunday: 2.5, public_holiday: 3.0 },
  },
};

const reasonOptions = [
  'Staff absence / sick call',
  'Child welfare check',
  'Security alarm / incident',
  'Ratio compliance',
  'Medical emergency',
  'Natural disaster / weather event',
  'Parent complaint / escalation',
  'Facility maintenance emergency',
  'Other',
];

const outcomeOptions = [
  'Resolved on-site',
  'Escalated to management',
  'Required additional staff',
  'False alarm / no action needed',
  'Ongoing — follow-up required',
  'Transferred to emergency services',
];

export function LogCallbackSheet({
  open,
  onOpenChange,
  parentShift,
  staff,
  defaultType = 'callback',
  onCallbackLogged,
}: LogCallbackSheetProps) {
  const now = new Date();
  const nowStr = format(now, "yyyy-MM-dd'T'HH:mm");

  const [form, setForm] = useState({
    callbackType: defaultType,
    callReceivedAt: nowStr,
    workStartTime: '',
    workEndTime: '',
    dayType: 'weekday' as CallbackEvent['dayType'],
    baseRate: '35.00',
    reason: '',
    reasonCustom: '',
    notes: '',
    travelTimeMinutes: '30',
    travelKm: '0',
    includeTravelAllowance: false,
    outcome: '',
    escalatedTo: '',
    restPeriodCheck: true,
  });

  // Reset form when sheet opens with new data
  useEffect(() => {
    if (open) {
      const dayOfWeek = now.getDay();
      const autoDay = dayOfWeek === 0 ? 'sunday' : dayOfWeek === 6 ? 'saturday' : 'weekday';
      
      setForm({
        callbackType: defaultType,
        callReceivedAt: nowStr,
        workStartTime: '',
        workEndTime: '',
        dayType: autoDay as CallbackEvent['dayType'],
        baseRate: '35.00',
        reason: '',
        reasonCustom: '',
        notes: '',
        travelTimeMinutes: '30',
        travelKm: '0',
        includeTravelAllowance: false,
        outcome: '',
        escalatedTo: '',
        restPeriodCheck: true,
      });
    }
  }, [open, defaultType, staff, nowStr]);

  const typeConfig = callbackTypeConfig[form.callbackType as keyof typeof callbackTypeConfig];
  const TypeIcon = typeConfig.icon;

  // Auto-calculate pay
  const payCalc = useMemo(() => {
    if (!form.workStartTime || !form.workEndTime) return null;

    const start = new Date(form.workStartTime);
    const end = new Date(form.workEndTime);
    const actualMinutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);

    const config = callbackTypeConfig[form.callbackType as keyof typeof callbackTypeConfig];
    const minHours = config.minEngagement[form.dayType] || 2;
    const minMinutes = minHours * 60;
    const paidMinutes = Math.max(actualMinutes, minMinutes);
    const rateMultiplier = config.multipliers[form.dayType] || 1.5;
    const baseRate = parseFloat(form.baseRate) || 35;
    const pay = (paidMinutes / 60) * baseRate * rateMultiplier;

    const travelPay = form.includeTravelAllowance
      ? (parseInt(form.travelTimeMinutes) || 0) / 60 * baseRate + (parseFloat(form.travelKm) || 0) * 0.85
      : 0;

    return {
      actualMinutes: Math.round(actualMinutes),
      paidMinutes: Math.round(paidMinutes),
      minimumEngagementApplied: actualMinutes < minMinutes,
      minimumEngagementHours: minHours,
      rateMultiplier,
      shiftPay: Math.round(pay * 100) / 100,
      travelPay: Math.round(travelPay * 100) / 100,
      totalPay: Math.round((pay + travelPay) * 100) / 100,
    };
  }, [form.workStartTime, form.workEndTime, form.callbackType, form.dayType, form.baseRate, form.travelTimeMinutes, form.travelKm, form.includeTravelAllowance]);

  const handleSubmit = () => {
    if (!form.workStartTime || !form.workEndTime || (!form.reason && !form.reasonCustom)) {
      toast.error('Please fill in required fields: work times and reason');
      return;
    }
    if (!payCalc) return;

    const newEvent: CallbackEvent = {
      id: `cb-${Date.now()}`,
      onCallShiftId: parentShift?.id || `oncall-${Date.now()}`,
      staffId: staff?.id || parentShift?.staffId || '',
      staffName: staff?.name || 'Unknown Staff',
      centreId: parentShift?.centreId || '',
      centreName: parentShift?.centreId || '',
      callbackType: form.callbackType as CallbackEvent['callbackType'],
      callReceivedAt: form.callReceivedAt || form.workStartTime,
      workStartTime: form.workStartTime,
      workEndTime: form.workEndTime,
      actualWorkedMinutes: payCalc.actualMinutes,
      paidMinutes: payCalc.paidMinutes,
      minimumEngagementApplied: payCalc.minimumEngagementApplied,
      minimumEngagementHours: payCalc.minimumEngagementHours,
      dayType: form.dayType,
      rateMultiplier: payCalc.rateMultiplier,
      baseRate: parseFloat(form.baseRate) || 35,
      calculatedPay: payCalc.totalPay,
      travelTimeMinutes: parseInt(form.travelTimeMinutes) || 0,
      reason: form.reason === 'Other' ? form.reasonCustom : form.reason,
      notes: [form.notes, form.outcome ? `Outcome: ${form.outcome}` : '', form.escalatedTo ? `Escalated to: ${form.escalatedTo}` : ''].filter(Boolean).join(' | '),
      status: 'logged',
      loggedBy: 'Admin',
      loggedAt: new Date().toISOString(),
    };

    onCallbackLogged?.(newEvent);
    onOpenChange(false);
    toast.success(
      `${typeConfig.label} logged — ${(payCalc.paidMinutes / 60).toFixed(1)}h at ${payCalc.rateMultiplier}x ($${payCalc.totalPay.toFixed(2)})`,
      { duration: 5000 }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <TypeIcon className={cn("h-5 w-5", typeConfig.color)} />
            Log {typeConfig.label}
          </SheetTitle>
          <SheetDescription>{typeConfig.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Parent shift context */}
          {parentShift && staff && (
            <Card className={cn("border", typeConfig.borderColor, typeConfig.bgColor)}>
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Logging from On-Call Shift</p>
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
                  <Badge variant="outline" className={cn("text-xs", typeConfig.bgColor, typeConfig.color)}>
                    {typeConfig.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Callback Type Selector */}
          <div className="space-y-2">
            <Label>Event Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(callbackTypeConfig) as [string, typeof callbackTypeConfig.callback][]).map(([type, config]) => {
                const Icon = config.icon;
                const isSelected = form.callbackType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setForm(p => ({ ...p, callbackType: type as 'callback' | 'recall' | 'emergency' }))}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center",
                      isSelected
                        ? `${config.borderColor} ${config.bgColor}`
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isSelected ? config.color : "text-muted-foreground")} />
                    <span className={cn("text-xs font-medium", isSelected ? config.color : "text-muted-foreground")}>
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Times */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Clock className="h-4 w-4" /> Times
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Call Received</Label>
                <Input type="datetime-local" value={form.callReceivedAt} onChange={e => setForm(p => ({ ...p, callReceivedAt: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Day Type</Label>
                <Select value={form.dayType} onValueChange={(v: CallbackEvent['dayType']) => setForm(p => ({ ...p, dayType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday">Weekday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="public_holiday">Public Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Work Start *</Label>
                <Input type="datetime-local" value={form.workStartTime} onChange={e => setForm(p => ({ ...p, workStartTime: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Work End *</Label>
                <Input type="datetime-local" value={form.workEndTime} onChange={e => setForm(p => ({ ...p, workEndTime: e.target.value }))} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Travel & Rest */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Car className="h-4 w-4" /> Travel & Rest Period
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <Label>Include Travel Allowance</Label>
                <p className="text-xs text-muted-foreground">Add travel time pay + km reimbursement</p>
              </div>
              <Switch
                checked={form.includeTravelAllowance}
                onCheckedChange={(checked) => setForm(p => ({ ...p, includeTravelAllowance: checked }))}
              />
            </div>
            {form.includeTravelAllowance && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Travel Time (min)</Label>
                  <Input type="number" value={form.travelTimeMinutes} onChange={e => setForm(p => ({ ...p, travelTimeMinutes: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Distance (km)</Label>
                  <Input type="number" value={form.travelKm} onChange={e => setForm(p => ({ ...p, travelKm: e.target.value }))} />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">10-Hour Rest Period Check</p>
                  <p className="text-xs text-muted-foreground">Flag if next shift violates minimum rest</p>
                </div>
              </div>
              <Switch
                checked={form.restPeriodCheck}
                onCheckedChange={(checked) => setForm(p => ({ ...p, restPeriodCheck: checked }))}
              />
            </div>
          </div>

          <Separator />

          {/* Reason & Outcome */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Reason & Outcome</h4>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={form.reason} onValueChange={(v) => setForm(p => ({ ...p, reason: v }))}>
                <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
                <SelectContent>
                  {reasonOptions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.reason === 'Other' && (
                <Input
                  placeholder="Describe the reason..."
                  value={form.reasonCustom}
                  onChange={e => setForm(p => ({ ...p, reasonCustom: e.target.value }))}
                  className="mt-2"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Outcome</Label>
              <Select value={form.outcome} onValueChange={(v) => setForm(p => ({ ...p, outcome: v }))}>
                <SelectTrigger><SelectValue placeholder="Select outcome..." /></SelectTrigger>
                <SelectContent>
                  {outcomeOptions.map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(form.outcome === 'Escalated to management' || form.outcome === 'Required additional staff') && (
              <div className="space-y-2">
                <Label>Escalated To</Label>
                <Input placeholder="Name or role..." value={form.escalatedTo} onChange={e => setForm(p => ({ ...p, escalatedTo: e.target.value }))} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional details..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
            </div>
          </div>

          <Separator />

          {/* Rate */}
          <div className="space-y-2">
            <Label>Base Hourly Rate ($)</Label>
            <Input type="number" step="0.01" value={form.baseRate} onChange={e => setForm(p => ({ ...p, baseRate: e.target.value }))} />
          </div>

          {/* Pay Calculation Preview */}
          {payCalc && (
            <Card className={cn("border", typeConfig.borderColor, typeConfig.bgColor)}>
              <CardContent className="p-4">
                <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", typeConfig.color)}>
                  <DollarSign className="h-4 w-4" />
                  Pay Calculation Preview
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 bg-background rounded border">
                    <span className="text-muted-foreground text-xs">Actual Worked</span>
                    <p className="font-semibold">{Math.floor(payCalc.actualMinutes / 60)}h {payCalc.actualMinutes % 60}m</p>
                  </div>
                  <div className="p-2 bg-background rounded border">
                    <span className="text-muted-foreground text-xs">Paid Hours</span>
                    <p className={cn("font-bold", typeConfig.color)}>{(payCalc.paidMinutes / 60).toFixed(1)}h</p>
                  </div>
                  <div className="p-2 bg-background rounded border">
                    <span className="text-muted-foreground text-xs">Rate Multiplier</span>
                    <p className="font-semibold">{payCalc.rateMultiplier}x</p>
                  </div>
                  <div className="p-2 bg-background rounded border">
                    <span className="text-muted-foreground text-xs">Shift Pay</span>
                    <p className="font-bold text-emerald-600">${payCalc.shiftPay.toFixed(2)}</p>
                  </div>
                  {payCalc.travelPay > 0 && (
                    <>
                      <div className="p-2 bg-background rounded border">
                        <span className="text-muted-foreground text-xs">Travel Allowance</span>
                        <p className="font-semibold">${payCalc.travelPay.toFixed(2)}</p>
                      </div>
                      <div className="p-2 bg-background rounded border">
                        <span className="text-muted-foreground text-xs">Total Pay</span>
                        <p className="font-bold text-emerald-700">${payCalc.totalPay.toFixed(2)}</p>
                      </div>
                    </>
                  )}
                </div>
                {payCalc.minimumEngagementApplied && (
                  <div className="mt-3 flex items-center gap-2 p-2 bg-background/80 rounded text-xs">
                    <AlertTriangle className={cn("h-3.5 w-3.5", typeConfig.color)} />
                    <span>Minimum engagement of {payCalc.minimumEngagementHours}h applied ({form.dayType.replace('_', ' ')} rule)</span>
                  </div>
                )}

                {/* Rest period warning */}
                {form.restPeriodCheck && payCalc && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-700 dark:text-blue-400">
                    <Timer className="h-3.5 w-3.5" />
                    <span>10-hour rest period will be enforced from work end time</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Workflow indicator */}
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
          <Button onClick={handleSubmit} className={cn("flex-1 gap-2")}>
            <Save className="h-4 w-4" />
            Log {typeConfig.label}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
