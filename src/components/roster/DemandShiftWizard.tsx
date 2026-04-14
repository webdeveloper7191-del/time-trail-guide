import { useState, useMemo, useCallback } from 'react';
import {
  Sparkles, Settings2, Eye, CheckCircle2, Clock, Users, Baby,
  BarChart3, ChevronRight, ChevronLeft, AlertTriangle, Building2,
  Zap, TrendingUp, Info,
} from 'lucide-react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Shift, Room, Centre } from '@/types/roster';
import { DemandAnalyticsData } from '@/types/demandAnalytics';
import {
  DemandShiftConfig,
  DEFAULT_DEMAND_SHIFT_CONFIG,
  DemandShiftGenerationResult,
} from '@/types/demandShiftGeneration';
import {
  generateDemandDrivenShifts,
  convertEnvelopesToRosterShifts,
} from '@/lib/demandShiftEngine';
import { DemandCurveChart } from '@/components/roster/DemandCurveChart';

interface DemandShiftWizardProps {
  open: boolean;
  onClose: () => void;
  centreId: string;
  centre: Centre;
  rooms: Room[];
  demandData: DemandAnalyticsData[];
  dates: string[];
  existingShifts: Shift[];
  onApplyShifts: (shifts: Omit<Shift, 'id'>[]) => void;
}

type WizardStep = 'configure' | 'preview' | 'confirm';

const STEPS: { key: WizardStep; label: string; icon: React.ElementType }[] = [
  { key: 'configure', label: 'Configure', icon: Settings2 },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'confirm', label: 'Confirm', icon: CheckCircle2 },
];

export function DemandShiftWizard({
  open,
  onClose,
  centreId,
  centre,
  rooms,
  demandData,
  dates,
  existingShifts,
  onApplyShifts,
}: DemandShiftWizardProps) {
  const [step, setStep] = useState<WizardStep>('configure');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [config, setConfig] = useState<DemandShiftConfig>({ ...DEFAULT_DEMAND_SHIFT_CONFIG });
  const [result, setResult] = useState<DemandShiftGenerationResult | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const centreRooms = useMemo(() => rooms.filter(r => r.centreId === centreId), [rooms, centreId]);

  const handleGenerate = useCallback(() => {
    const targetRooms = selectedRoomId === 'all'
      ? centreRooms
      : centreRooms.filter(r => r.id === selectedRoomId);

    const genResult = generateDemandDrivenShifts(demandData, targetRooms, dates, config);
    setResult(genResult);
    setRemovedIds(new Set());
    setStep('preview');
    toast.success(`Generated ${genResult.shiftEnvelopes.length} shift envelopes`);
  }, [centreRooms, selectedRoomId, demandData, dates, config]);

  const handleApply = useCallback(() => {
    if (!result) return;
    const kept = result.shiftEnvelopes.filter(e => !removedIds.has(e.id));
    const rosterShifts = convertEnvelopesToRosterShifts(kept);
    onApplyShifts(rosterShifts);
    toast.success(`Added ${rosterShifts.length} open shifts to roster`);
    onClose();
    // Reset
    setStep('configure');
    setResult(null);
    setRemovedIds(new Set());
  }, [result, removedIds, onApplyShifts, onClose]);

  const toggleRemove = (id: string) => {
    setRemovedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stepIndex = STEPS.findIndex(s => s.key === step);

  const actions = useMemo((): import('@/components/ui/off-canvas/PrimaryOffCanvas').OffCanvasAction[] => {
    if (step === 'configure') {
      return [
        { label: 'Generate Shifts', onClick: handleGenerate, variant: 'primary', icon: <Sparkles className="h-4 w-4" /> },
      ];
    }
    if (step === 'preview') {
      return [
        { label: 'Back', onClick: () => setStep('configure'), variant: 'outlined', icon: <ChevronLeft className="h-4 w-4" /> },
        { label: 'Review & Confirm', onClick: () => setStep('confirm'), variant: 'primary', icon: <ChevronRight className="h-4 w-4" /> },
      ];
    }
    return [
      { label: 'Back', onClick: () => setStep('preview'), variant: 'outlined', icon: <ChevronLeft className="h-4 w-4" /> },
      {
        label: `Apply ${result ? result.shiftEnvelopes.length - removedIds.size : 0} Shifts`,
        onClick: handleApply,
        variant: 'primary',
        icon: <CheckCircle2 className="h-4 w-4" />,
      },
    ];
  }, [step, handleGenerate, handleApply, result, removedIds]);

  const keptCount = result ? result.shiftEnvelopes.length - removedIds.size : 0;

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Generate Shifts from Demand"
      icon={TrendingUp}
      width="4xl"
      actions={actions}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 px-1 pb-4">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (s.key === 'configure') setStep('configure');
                else if (s.key === 'preview' && result) setStep('preview');
                else if (s.key === 'confirm' && result) setStep('confirm');
              }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                stepIndex === i
                  ? "bg-primary text-primary-foreground"
                  : stepIndex > i
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <s.icon className="h-3 w-3" />
              {s.label}
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      <Separator className="mb-4" />

      {/* STEP 1: Configure */}
      {step === 'configure' && (
        <div className="space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              This wizard analyses booked children and historical attendance in 15-minute intervals,
              applies your room's compliance ratios, and generates optimised open shift envelopes 
              ready for staff assignment.
            </p>
          </div>

          {/* Room selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Target Rooms</Label>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms ({centreRooms.length})</SelectItem>
                {centreRooms.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} — 1:{r.requiredRatio} ratio, cap {r.capacity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operating hours */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Operating Start</Label>
              <Select
                value={config.operatingStart}
                onValueChange={v => setConfig(c => ({ ...c, operatingStart: v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['05:00', '05:30', '06:00', '06:30', '07:00', '07:30'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Operating End</Label>
              <Select
                value={config.operatingEnd}
                onValueChange={v => setConfig(c => ({ ...c, operatingEnd: v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shift length */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Minimum Shift Length</Label>
                <span className="text-xs font-medium text-muted-foreground">{config.minShiftMinutes / 60}h</span>
              </div>
              <Slider
                value={[config.minShiftMinutes]}
                onValueChange={([v]) => setConfig(c => ({ ...c, minShiftMinutes: v }))}
                min={120}
                max={480}
                step={30}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Maximum Shift Length</Label>
                <span className="text-xs font-medium text-muted-foreground">{config.maxShiftMinutes / 60}h</span>
              </div>
              <Slider
                value={[config.maxShiftMinutes]}
                onValueChange={([v]) => setConfig(c => ({ ...c, maxShiftMinutes: v }))}
                min={360}
                max={720}
                step={30}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Overlap Buffer</Label>
                <span className="text-xs font-medium text-muted-foreground">{config.overlapBufferMinutes} min</span>
              </div>
              <Slider
                value={[config.overlapBufferMinutes]}
                onValueChange={([v]) => setConfig(c => ({ ...c, overlapBufferMinutes: v }))}
                min={0}
                max={60}
                step={5}
              />
            </div>
          </div>

          {/* Strategy */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Rounding Strategy</Label>
              <Select
                value={config.roundingStrategy}
                onValueChange={v => setConfig(c => ({ ...c, roundingStrategy: v as 'ceiling' | 'predicted' }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ceiling">Ceiling (Compliance)</SelectItem>
                  <SelectItem value="predicted">Predicted (Cost-saving)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Optimization Goal</Label>
              <Select
                value={config.optimizationGoal}
                onValueChange={v => setConfig(c => ({ ...c, optimizationGoal: v as any }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliance">Compliance First</SelectItem>
                  <SelectItem value="cost">Cost Optimized</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Attendance override */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Override Attendance Rate</Label>
              <Switch
                checked={config.attendanceRateOverride !== null}
                onCheckedChange={checked => setConfig(c => ({
                  ...c,
                  attendanceRateOverride: checked ? 0.9 : null,
                }))}
              />
            </div>
            {config.attendanceRateOverride !== null && (
              <div className="space-y-1">
                <Slider
                  value={[config.attendanceRateOverride * 100]}
                  onValueChange={([v]) => setConfig(c => ({ ...c, attendanceRateOverride: v / 100 }))}
                  min={50}
                  max={100}
                  step={1}
                />
                <p className="text-[10px] text-muted-foreground text-right">{Math.round(config.attendanceRateOverride * 100)}%</p>
              </div>
            )}
          </div>

          {/* Summary of what will be generated */}
          <Card>
            <CardContent className="pt-3 pb-3">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{centre.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Baby className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{selectedRoomId === 'all' ? `${centreRooms.length} rooms` : centreRooms.find(r => r.id === selectedRoomId)?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{dates.length} day{dates.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 2: Preview */}
      {step === 'preview' && result && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-2">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-primary">{result.summary.totalShifts}</p>
                <p className="text-[10px] text-muted-foreground">Total Shifts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-emerald-600">{result.summary.totalHours}h</p>
                <p className="text-[10px] text-muted-foreground">Total Hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-amber-600">{result.summary.peakStaffRequired}</p>
                <p className="text-[10px] text-muted-foreground">Peak Staff</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold text-red-600">{result.summary.coverageGaps.length}</p>
                <p className="text-[10px] text-muted-foreground">Coverage Gaps</p>
              </CardContent>
            </Card>
          </div>

          {/* Room tabs with demand charts */}
          <Tabs
            defaultValue={result.roomProfiles[0]?.roomId || 'none'}
            className="space-y-3"
          >
            <TabsList className="h-8">
              {result.roomProfiles
                .filter((p, i, arr) => arr.findIndex(x => x.roomId === p.roomId) === i)
                .map(p => (
                  <TabsTrigger key={p.roomId} value={p.roomId} className="text-xs px-2 py-1 h-6">
                    {p.roomName}
                  </TabsTrigger>
                ))}
            </TabsList>
            {result.roomProfiles
              .filter((p, i, arr) => arr.findIndex(x => x.roomId === p.roomId) === i)
              .map(p => (
                <TabsContent key={p.roomId} value={p.roomId}>
                  <DemandCurveChart
                    profiles={result.roomProfiles.filter(rp => rp.roomId === p.roomId)}
                    envelopes={result.shiftEnvelopes.filter(e => e.roomId === p.roomId)}
                    selectedRoomId={p.roomId}
                    height={280}
                  />
                </TabsContent>
              ))}
          </Tabs>

          {/* Room breakdown table */}
          <Card>
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xs font-medium">Room Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-1">
                {result.summary.roomBreakdown.map(rb => (
                  <div key={rb.roomId} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                    <span className="font-medium">{rb.roomName}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{rb.shifts} shifts</span>
                      <span>{rb.hours}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: Confirm */}
      {step === 'confirm' && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {keptCount} of {result.shiftEnvelopes.length} shifts selected
            </p>
            {removedIds.size > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setRemovedIds(new Set())}>
                Restore all
              </Button>
            )}
          </div>

          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {result.shiftEnvelopes.map(env => {
              const isRemoved = removedIds.has(env.id);
              const hours = Math.round((env.durationMinutes - env.breakMinutes) / 60 * 10) / 10;
              return (
                <div
                  key={env.id}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg border transition-all",
                    isRemoved
                      ? "opacity-40 bg-muted border-border"
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: env.color }}
                    />
                    <div>
                      <p className="text-xs font-medium">{env.roomName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {env.date} · {env.startTime}–{env.endTime} ({hours}h)
                        {env.breakMinutes > 0 && ` · ${env.breakMinutes}m break`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={env.priority === 'critical' ? 'destructive' : 'secondary'}
                      className="text-[9px] px-1.5 h-4"
                    >
                      {env.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => toggleRemove(env.id)}
                    >
                      {isRemoved ? 'Restore' : 'Remove'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {result.summary.coverageGaps.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                      {result.summary.coverageGaps.length} coverage gap(s) detected
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Some time slots may have fewer staff than required by compliance ratios.
                      Consider adding manual shifts or adjusting parameters.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PrimaryOffCanvas>
  );
}
