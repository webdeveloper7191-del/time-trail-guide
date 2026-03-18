import { useState, useMemo } from 'react';
import { Shift, StaffMember } from '@/types/roster';
import { SplitShiftEvent, SplitShiftSegment } from '@/types/shiftEvents';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Zap,
  Clock,
  DollarSign,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface LogSplitShiftSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentShift?: Shift | null;
  staff?: StaffMember | null;
  onSplitShiftLogged?: (event: SplitShiftEvent) => void;
}

// Award rules for split shift compliance
const MIN_GAP_MINUTES = 60; // Minimum unpaid break between segments
const MAX_GAP_MINUTES = 240; // Maximum gap before non-compliance
const SPLIT_SHIFT_ALLOWANCE_PER_OCCURRENCE = 15.50; // Flat allowance per award

export function LogSplitShiftSheet({
  open,
  onOpenChange,
  parentShift,
  staff,
  onSplitShiftLogged,
}: LogSplitShiftSheetProps) {
  const [segments, setSegments] = useState<SplitShiftSegment[]>([
    { id: `seg-1`, segmentNumber: 1, startTime: '', endTime: '', breakMinutes: 0, workedMinutes: 0 },
    { id: `seg-2`, segmentNumber: 2, startTime: '', endTime: '', breakMinutes: 0, workedMinutes: 0 },
  ]);
  const [baseRate, setBaseRate] = useState('35.00');
  const [notes, setNotes] = useState('');

  const addSegment = () => {
    setSegments(prev => [...prev, {
      id: `seg-${Date.now()}`,
      segmentNumber: prev.length + 1,
      startTime: '',
      endTime: '',
      breakMinutes: 0,
      workedMinutes: 0,
    }]);
  };

  const updateSegment = (id: string, updates: Partial<SplitShiftSegment>) => {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 2) {
      toast.error('Split shifts require at least 2 segments');
      return;
    }
    setSegments(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, segmentNumber: i + 1 })));
  };

  const payCalc = useMemo(() => {
    const rate = parseFloat(baseRate) || 35;
    let totalWorkedMinutes = 0;
    let gapMinutes = 0;
    let gapCompliant = true;

    // Calculate worked minutes per segment
    const calculatedSegments = segments.map(seg => {
      if (!seg.startTime || !seg.endTime) return { ...seg, workedMinutes: 0 };
      const start = new Date(seg.startTime);
      const end = new Date(seg.endTime);
      const worked = Math.max(0, (end.getTime() - start.getTime()) / 60000 - seg.breakMinutes);
      return { ...seg, workedMinutes: Math.round(worked) };
    });

    calculatedSegments.forEach(s => { totalWorkedMinutes += s.workedMinutes; });

    // Calculate gap between segments
    for (let i = 0; i < calculatedSegments.length - 1; i++) {
      const current = calculatedSegments[i];
      const next = calculatedSegments[i + 1];
      if (current.endTime && next.startTime) {
        const end = new Date(current.endTime);
        const start = new Date(next.startTime);
        const gap = Math.round((start.getTime() - end.getTime()) / 60000);
        gapMinutes = Math.max(gapMinutes, gap);
        if (gap < MIN_GAP_MINUTES || gap > MAX_GAP_MINUTES) {
          gapCompliant = false;
        }
      }
    }

    const totalSegmentPay = Math.round((totalWorkedMinutes / 60) * rate * 100) / 100;
    const allowance = SPLIT_SHIFT_ALLOWANCE_PER_OCCURRENCE;

    return {
      calculatedSegments,
      totalWorkedMinutes,
      gapMinutes,
      gapCompliant,
      totalSegmentPay,
      allowance,
      totalPay: Math.round((totalSegmentPay + allowance) * 100) / 100,
    };
  }, [segments, baseRate]);

  const handleSubmit = () => {
    const hasEmptySegments = segments.some(s => !s.startTime || !s.endTime);
    if (hasEmptySegments) {
      toast.error('Please fill in all segment times');
      return;
    }

    const event: SplitShiftEvent = {
      id: `split-${Date.now()}`,
      shiftId: parentShift?.id || '',
      staffId: staff?.id || parentShift?.staffId || '',
      staffName: staff?.name || 'Unknown Staff',
      centreId: parentShift?.centreId || '',
      date: parentShift?.date || format(new Date(), 'yyyy-MM-dd'),
      segments: payCalc.calculatedSegments,
      gapMinutes: payCalc.gapMinutes,
      gapCompliant: payCalc.gapCompliant,
      splitShiftAllowance: payCalc.allowance,
      baseRate: parseFloat(baseRate) || 35,
      totalSegmentPay: payCalc.totalSegmentPay,
      totalPay: payCalc.totalPay,
      status: 'logged',
      loggedBy: 'Admin',
      loggedAt: new Date().toISOString(),
      notes,
    };

    onSplitShiftLogged?.(event);
    onOpenChange(false);
    toast.success(
      `Split shift logged — ${segments.length} segments, $${payCalc.totalPay.toFixed(2)} total`,
      { duration: 5000 }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Log Split / Broken Shift
          </SheetTitle>
          <SheetDescription>Record segment times, gaps, and calculate split shift allowance</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Parent shift context */}
          {parentShift && staff && (
            <Card className="border-orange-300 bg-orange-500/10">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Split/Broken Shift</p>
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
                  <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600">
                    Split Shift
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Segments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Clock className="h-4 w-4" /> Segments ({segments.length})
              </h4>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addSegment}>
                <Plus className="h-3 w-3" /> Add Segment
              </Button>
            </div>

            {segments.map((seg, idx) => (
              <Card key={seg.id} className="border-orange-200/50">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-orange-600">Segment {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      {payCalc.calculatedSegments[idx]?.workedMinutes > 0 && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                          {(payCalc.calculatedSegments[idx].workedMinutes / 60).toFixed(1)}h
                        </Badge>
                      )}
                      {segments.length > 2 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSegment(seg.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Start *</Label>
                      <Input type="datetime-local" className="h-8 text-xs" value={seg.startTime} onChange={e => updateSegment(seg.id, { startTime: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">End *</Label>
                      <Input type="datetime-local" className="h-8 text-xs" value={seg.endTime} onChange={e => updateSegment(seg.id, { endTime: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Break (min)</Label>
                      <Input type="number" className="h-8 text-xs" min="0" value={seg.breakMinutes} onChange={e => updateSegment(seg.id, { breakMinutes: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>

                  {/* Gap indicator between segments */}
                  {idx < segments.length - 1 && payCalc.gapMinutes > 0 && idx === 0 && (
                    <div className={cn(
                      "flex items-center gap-2 p-2 rounded text-xs mt-2",
                      payCalc.gapCompliant
                        ? "bg-emerald-500/10 text-emerald-700 border border-emerald-300"
                        : "bg-destructive/10 text-destructive border border-destructive/40"
                    )}>
                      <Timer className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {payCalc.gapMinutes}min gap
                        {payCalc.gapCompliant
                          ? ` — compliant (${MIN_GAP_MINUTES}-${MAX_GAP_MINUTES}min required)`
                          : ` — non-compliant (must be ${MIN_GAP_MINUTES}-${MAX_GAP_MINUTES}min)`
                        }
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Pay Rate */}
          <div className="space-y-2">
            <Label>Base Hourly Rate ($)</Label>
            <Input type="number" step="0.01" value={baseRate} onChange={e => setBaseRate(e.target.value)} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea placeholder="Additional details..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          {/* Pay Calculation Preview */}
          <Card className="border-orange-300 bg-orange-500/10">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-orange-600">
                <DollarSign className="h-4 w-4" />
                Pay Calculation
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-background rounded border">
                  <span className="text-muted-foreground text-xs">Total Worked</span>
                  <p className="font-semibold">{(payCalc.totalWorkedMinutes / 60).toFixed(1)}h</p>
                </div>
                <div className="p-2 bg-background rounded border">
                  <span className="text-muted-foreground text-xs">Segment Pay</span>
                  <p className="font-semibold">${payCalc.totalSegmentPay.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-background rounded border">
                  <span className="text-muted-foreground text-xs">Split Allowance</span>
                  <p className="font-semibold text-orange-600">+${payCalc.allowance.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-background rounded border">
                  <span className="text-muted-foreground text-xs">Total Pay</span>
                  <p className="font-bold text-lg text-emerald-600">${payCalc.totalPay.toFixed(2)}</p>
                </div>
              </div>
              {!payCalc.gapCompliant && (
                <div className="mt-3 flex items-center gap-2 p-2 bg-background/80 rounded text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Gap between segments is outside the compliant range ({MIN_GAP_MINUTES}-{MAX_GAP_MINUTES} minutes)</span>
                </div>
              )}
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
            Log Split Shift
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
