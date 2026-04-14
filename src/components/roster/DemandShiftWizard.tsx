import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns';
import {
  Sparkles, Settings2, Eye, CheckCircle2, Clock, Users, Baby,
  BarChart3, ChevronRight, ChevronLeft, AlertTriangle, Building2,
  Zap, TrendingUp, Info, UserCheck, Loader2, Globe,
  Save, Bookmark, Trash2, FolderOpen, CalendarIcon,
  DollarSign, Scale, Check, Star,
} from 'lucide-react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Shift, Room, Centre, StaffMember } from '@/types/roster';
import { DemandAnalyticsData } from '@/types/demandAnalytics';
import {
  DemandShiftConfig,
  DEFAULT_DEMAND_SHIFT_CONFIG,
  DemandShiftGenerationResult,
  ShiftEnvelope,
} from '@/types/demandShiftGeneration';
import {
  generateDemandDrivenShifts,
  convertEnvelopesToRosterShifts,
} from '@/lib/demandShiftEngine';
import { DemandCurveChart } from '@/components/roster/DemandCurveChart';
import { demandApi } from '@/lib/api/demandApi';
import {
  scoreStaffForShift,
  batchAssignStaff,
  GeneratedShiftSlot,
  SchedulerWeights,
  DEFAULT_WEIGHTS,
  shiftDurationMinutes,
  AssignmentResult,
} from '@/lib/autoScheduler';
import { TimefoldConstraintConfiguration, defaultConstraintConfig } from '@/types/timefoldConstraintConfig';

interface DemandShiftWizardProps {
  open: boolean;
  onClose: () => void;
  centreId: string;
  centre: Centre;
  rooms: Room[];
  demandData: DemandAnalyticsData[];
  dates: string[];
  existingShifts: Shift[];
  staff?: StaffMember[];
  onApplyShifts: (shifts: Omit<Shift, 'id'>[]) => void;
  preSelectedRoomId?: string;
}

type WizardStep = 'configure' | 'preview' | 'confirm';

interface StaffAssignment {
  envelopeId: string;
  staffId: string;
  staffName: string;
  score: number;
  issues: string[];
}

const STEPS: { key: WizardStep; label: string; icon: React.ElementType }[] = [
  { key: 'configure', label: 'Configure', icon: Settings2 },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'confirm', label: 'Confirm', icon: CheckCircle2 },
];

const WEIGHT_PRESETS = {
  balanced: { label: 'Balanced', weights: { availability: 25, qualifications: 40, cost: 5, fairness: 15, preference: 15 } },
  compliance: { label: 'Compliance First', weights: { availability: 25, qualifications: 40, cost: 5, fairness: 15, preference: 15 } },
  costOptimized: { label: 'Cost Optimized', weights: { availability: 25, qualifications: 15, cost: 40, fairness: 10, preference: 10 } },
  fairDistribution: { label: 'Fair Distribution', weights: { availability: 20, qualifications: 15, cost: 10, fairness: 45, preference: 10 } },
};

// --- Config Presets ---
interface DemandConfigPreset {
  id: string;
  name: string;
  description: string;
  config: DemandShiftConfig;
  autoAssignEnabled: boolean;
  assignWeightPreset: string;
  isBuiltIn: boolean;
  createdAt: string;
}

const BUILT_IN_PRESETS: DemandConfigPreset[] = [
  {
    id: 'standard-day',
    name: 'Standard Day',
    description: 'Regular operating day with balanced optimization',
    config: { ...DEFAULT_DEMAND_SHIFT_CONFIG },
    autoAssignEnabled: false,
    assignWeightPreset: 'balanced',
    isBuiltIn: true,
    createdAt: '',
  },
  {
    id: 'holiday-coverage',
    name: 'Holiday Coverage',
    description: 'Reduced attendance expected, cost-optimized shifts',
    config: {
      ...DEFAULT_DEMAND_SHIFT_CONFIG,
      attendanceRateOverride: 0.65,
      optimizationGoal: 'cost',
      minShiftMinutes: 300,
      roundingStrategy: 'predicted',
    },
    autoAssignEnabled: true,
    assignWeightPreset: 'costOptimized',
    isBuiltIn: true,
    createdAt: '',
  },
  {
    id: 'peak-compliance',
    name: 'Peak Day (Compliance)',
    description: 'High attendance day, compliance-first with max coverage',
    config: {
      ...DEFAULT_DEMAND_SHIFT_CONFIG,
      attendanceRateOverride: 0.95,
      optimizationGoal: 'compliance',
      overlapBufferMinutes: 30,
      roundingStrategy: 'ceiling',
    },
    autoAssignEnabled: true,
    assignWeightPreset: 'compliance',
    isBuiltIn: true,
    createdAt: '',
  },
  {
    id: 'extended-hours',
    name: 'Extended Hours',
    description: 'Early open / late close with longer shifts',
    config: {
      ...DEFAULT_DEMAND_SHIFT_CONFIG,
      operatingStart: '05:00',
      operatingEnd: '20:00',
      maxShiftMinutes: 660,
      overlapBufferMinutes: 20,
    },
    autoAssignEnabled: false,
    assignWeightPreset: 'balanced',
    isBuiltIn: true,
    createdAt: '',
  },
];

const PRESETS_STORAGE_KEY = 'demand-config-presets';

function loadSavedPresets(): DemandConfigPreset[] {
  try {
    const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function savePersistPresets(presets: DemandConfigPreset[]) {
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
}

export function DemandShiftWizard({
  open,
  onClose,
  centreId,
  centre,
  rooms,
  demandData,
  dates,
  existingShifts,
  staff = [],
  onApplyShifts,
  preSelectedRoomId,
}: DemandShiftWizardProps) {
  const [step, setStep] = useState<WizardStep>('configure');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(preSelectedRoomId || 'all');

  // Sync preSelectedRoomId when wizard opens
  useEffect(() => {
    if (open && preSelectedRoomId) {
      setSelectedRoomId(preSelectedRoomId);
    }
  }, [open, preSelectedRoomId]);
  const [config, setConfig] = useState<DemandShiftConfig>({ ...DEFAULT_DEMAND_SHIFT_CONFIG });
  const [result, setResult] = useState<DemandShiftGenerationResult | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // Auto-assign state
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [assignments, setAssignments] = useState<Map<string, StaffAssignment>>(new Map());
  const [assignmentMetrics, setAssignmentMetrics] = useState<{ estimatedCost: number; fairnessScore: number } | null>(null);
  const [assignWeightPreset, setAssignWeightPreset] = useState<string>('balanced');
  const [assignWeights, setAssignWeights] = useState<SchedulerWeights>({ ...DEFAULT_WEIGHTS });

  // API loading state
  const [useApi, setUseApi] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Preset state
  const [savedPresets, setSavedPresets] = useState<DemandConfigPreset[]>(loadSavedPresets);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const allPresets = useMemo(() => [...BUILT_IN_PRESETS, ...savedPresets], [savedPresets]);

  // Date range state
  const today = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(() => {
    if (dates.length > 0) {
      const d = dates[0];
      return typeof d === 'string' ? parseISO(d) : new Date(d);
    }
    return startOfWeek(today, { weekStartsOn: 1 });
  }, [dates, today]);
  const defaultTo = useMemo(() => {
    if (dates.length > 0) {
      const d = dates[dates.length - 1];
      return typeof d === 'string' ? parseISO(d) : new Date(d);
    }
    return endOfWeek(today, { weekStartsOn: 1 });
  }, [dates, today]);

  const [dateFrom, setDateFrom] = useState<Date>(defaultFrom);
  const [dateTo, setDateTo] = useState<Date>(defaultTo);

  // Sync defaults when wizard opens
  useEffect(() => {
    if (open) {
      setDateFrom(defaultFrom);
      setDateTo(defaultTo);
    }
  }, [open, defaultFrom, defaultTo]);

  const effectiveDates = useMemo(() => {
    try {
      return eachDayOfInterval({ start: dateFrom, end: dateTo }).map(d => format(d, 'yyyy-MM-dd'));
    } catch {
      return dates.map(d => typeof d === 'string' ? d : format(new Date(d), 'yyyy-MM-dd'));
    }
  }, [dateFrom, dateTo, dates]);

  const periodLabel = useMemo(() => {
    const days = effectiveDates.length;
    return `${format(dateFrom, 'dd MMM')} — ${format(dateTo, 'dd MMM yyyy')} (${days} day${days !== 1 ? 's' : ''})`;
  }, [dateFrom, dateTo, effectiveDates]);

  const setQuickPeriod = useCallback((key: string) => {
    const now = new Date();
    switch (key) {
      case 'this-week':
        setDateFrom(startOfWeek(now, { weekStartsOn: 1 }));
        setDateTo(endOfWeek(now, { weekStartsOn: 1 }));
        break;
      case 'next-week':
        setDateFrom(startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 }));
        setDateTo(endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 }));
        break;
      case 'next-2-weeks':
        setDateFrom(startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 }));
        setDateTo(endOfWeek(addWeeks(now, 2), { weekStartsOn: 1 }));
        break;
      case 'this-month':
        setDateFrom(startOfMonth(now));
        setDateTo(endOfMonth(now));
        break;
    }
  }, []);

  const handleLoadPreset = useCallback((preset: DemandConfigPreset) => {
    setConfig({ ...preset.config });
    setAutoAssignEnabled(preset.autoAssignEnabled);
    setAssignWeightPreset(preset.assignWeightPreset);
    const wp = WEIGHT_PRESETS[preset.assignWeightPreset as keyof typeof WEIGHT_PRESETS];
    if (wp) setAssignWeights(wp.weights);
    setActivePresetId(preset.id);
    toast.success(`Loaded preset: ${preset.name}`);
  }, []);

  const handleSavePreset = useCallback(() => {
    if (!newPresetName.trim()) return;
    const preset: DemandConfigPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: newPresetDesc.trim(),
      config: { ...config },
      autoAssignEnabled,
      assignWeightPreset,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedPresets, preset];
    setSavedPresets(updated);
    savePersistPresets(updated);
    setActivePresetId(preset.id);
    setShowSavePreset(false);
    setNewPresetName('');
    setNewPresetDesc('');
    toast.success(`Saved preset: ${preset.name}`);
  }, [newPresetName, newPresetDesc, config, autoAssignEnabled, assignWeightPreset, savedPresets]);

  const handleDeletePreset = useCallback((presetId: string) => {
    const updated = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updated);
    savePersistPresets(updated);
    if (activePresetId === presetId) setActivePresetId(null);
    toast.success('Preset deleted');
  }, [savedPresets, activePresetId]);

  const centreRooms = useMemo(() => rooms.filter(r => r.centreId === centreId), [rooms, centreId]);

  // Demand overview summary (from AutoSchedulerPanel)
  const demandSummary = useMemo(() => {
    const filtered = demandData.filter(d => d.centreId === centreId);
    const totalRequired = filtered.reduce((sum, d) => sum + d.requiredStaff, 0);
    const totalScheduled = filtered.reduce((sum, d) => sum + d.scheduledStaff, 0);
    const nonCompliant = filtered.filter(d => !d.staffRatioCompliant).length;
    return { totalRequired, totalScheduled, gap: totalRequired - totalScheduled, nonCompliant };
  }, [demandData, centreId]);

  const handleGenerate = useCallback(async () => {
    const targetRooms = selectedRoomId === 'all'
      ? centreRooms
      : centreRooms.filter(r => r.id === selectedRoomId);

    setIsLoading(true);

    try {
      let genResult: DemandShiftGenerationResult;

      if (useApi) {
        const apiResponse = await demandApi.generateShiftsFromDemand({
          centreId,
          rooms: targetRooms,
          dates: effectiveDates,
          config,
        });
        genResult = apiResponse.data.result;
      } else {
        genResult = generateDemandDrivenShifts(demandData, targetRooms, effectiveDates, config);
      }

      setResult(genResult);
      setRemovedIds(new Set());
      setAssignments(new Map());
      setStep('preview');
      toast.success(`Generated ${genResult.shiftEnvelopes.length} shift envelopes`);

      // Auto-assign if enabled
      if (autoAssignEnabled && staff.length > 0) {
        runAutoAssignment(genResult.shiftEnvelopes);
      }
    } catch (err) {
      console.error('Shift generation failed:', err);
      toast.error('Failed to generate shifts. Check demand data.');
    } finally {
      setIsLoading(false);
    }
  }, [centreRooms, selectedRoomId, demandData, effectiveDates, config, useApi, centreId, autoAssignEnabled, staff]);

  const runAutoAssignment = useCallback((envelopes: ShiftEnvelope[]) => {
    if (staff.length === 0) {
      toast.info('No staff available for auto-assignment');
      return;
    }

    setIsAutoAssigning(true);

    setTimeout(() => {
      // Convert envelopes to GeneratedShiftSlots for the unified assignment engine
      const slots: GeneratedShiftSlot[] = envelopes.map(envelope => ({
        id: envelope.id,
        centreId: envelope.centreId,
        roomId: envelope.roomId,
        roomName: envelope.roomName,
        date: envelope.date,
        startTime: envelope.startTime,
        endTime: envelope.endTime,
        breakMinutes: envelope.breakMinutes,
        requiredCount: 1,
        demandSource: 'booking' as const,
        priority: envelope.priority,
      }));

      // Use the unified batch assignment engine
      const result = batchAssignStaff(slots, staff, existingShifts, assignWeights, defaultConstraintConfig);

      // Convert to StaffAssignment map
      const newAssignments = new Map<string, StaffAssignment>();
      result.assignments.forEach((assignment, slotId) => {
        newAssignments.set(slotId, {
          envelopeId: slotId,
          staffId: assignment.staffId,
          staffName: assignment.staffName,
          score: assignment.score,
          issues: assignment.issues,
        });
      });

      setAssignments(newAssignments);
      setAssignmentMetrics({ estimatedCost: result.estimatedCost, fairnessScore: result.fairnessScore });
      setIsAutoAssigning(false);

      const assignedCount = newAssignments.size;
      const unassigned = envelopes.length - assignedCount;
      if (assignedCount > 0) {
        toast.success(`Auto-assigned ${assignedCount} shifts to staff${unassigned > 0 ? ` (${unassigned} unassigned)` : ''}`);
      } else {
        toast.info('No eligible staff found for auto-assignment');
      }
    }, 600);
  }, [staff, existingShifts, assignWeights]);

  const handleApply = useCallback(() => {
    if (!result) return;
    const kept = result.shiftEnvelopes.filter(e => !removedIds.has(e.id));
    const rosterShifts = convertEnvelopesToRosterShifts(kept).map(shift => {
      const assignment = assignments.get(
        result.shiftEnvelopes.find(e =>
          e.roomId === shift.roomId && e.date === shift.date &&
          e.startTime === shift.startTime && e.endTime === shift.endTime
        )?.id || ''
      );

      if (assignment) {
        return {
          ...shift,
          staffId: assignment.staffId,
          isOpenShift: false,
          isAIGenerated: true,
          aiGeneratedAt: new Date().toISOString(),
          notes: `${shift.notes} | Auto-assigned to ${assignment.staffName} (score: ${assignment.score})`,
        };
      }
      return shift;
    });

    onApplyShifts(rosterShifts);
    const assignedCount = rosterShifts.filter(s => s.staffId).length;
    const openCount = rosterShifts.length - assignedCount;
    toast.success(
      assignedCount > 0
        ? `Added ${rosterShifts.length} shifts (${assignedCount} assigned, ${openCount} open)`
        : `Added ${rosterShifts.length} open shifts to roster`
    );
    onClose();
    setStep('configure');
    setResult(null);
    setRemovedIds(new Set());
    setAssignments(new Map());
  }, [result, removedIds, assignments, onApplyShifts, onClose]);

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
        {
          label: isLoading ? 'Generating...' : 'Generate Shifts',
          onClick: handleGenerate,
          variant: 'primary',
          icon: isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />,
          disabled: isLoading,
        },
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
  }, [step, handleGenerate, handleApply, result, removedIds, isLoading]);

  const keptCount = result ? result.shiftEnvelopes.length - removedIds.size : 0;
  const assignedCount = assignments.size;

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

          {/* Demand Overview (merged from Auto-Scheduler) */}
          <div className="grid grid-cols-4 gap-2">
            <Card className="bg-muted/30">
              <CardContent className="p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{demandSummary.totalRequired}</p>
                <p className="text-[10px] text-muted-foreground">Staff Required</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{demandSummary.totalScheduled}</p>
                <p className="text-[10px] text-muted-foreground">Already Scheduled</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-2.5 text-center">
                <p className={cn("text-lg font-bold", demandSummary.gap > 0 ? "text-destructive" : "text-primary")}>
                  {demandSummary.gap}
                </p>
                <p className="text-[10px] text-muted-foreground">Staffing Gap</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-2.5 text-center">
                <p className={cn("text-lg font-bold", demandSummary.nonCompliant > 0 ? "text-destructive" : "text-primary")}>
                  {demandSummary.nonCompliant}
                </p>
                <p className="text-[10px] text-muted-foreground">Non-Compliant</p>
              </CardContent>
            </Card>
          </div>


          <Card className="border border-border">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-primary" />
                  <Label className="text-xs font-medium">Configuration Presets</Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => setShowSavePreset(!showSavePreset)}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save Current
                </Button>
              </div>

              {/* Save new preset form */}
              {showSavePreset && (
                <div className="space-y-2 p-2 rounded-md bg-muted/50 border">
                  <Input
                    placeholder="Preset name (e.g., Monday Pattern)"
                    value={newPresetName}
                    onChange={e => setNewPresetName(e.target.value)}
                    className="h-7 text-xs"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newPresetDesc}
                    onChange={e => setNewPresetDesc(e.target.value)}
                    className="h-7 text-xs"
                  />
                  <div className="flex gap-1.5 justify-end">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setShowSavePreset(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-6 text-[10px]" onClick={handleSavePreset} disabled={!newPresetName.trim()}>
                      Save Preset
                    </Button>
                  </div>
                </div>
              )}

              {/* Preset list */}
              <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto">
                {allPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset)}
                    className={cn(
                      'relative group text-left rounded-md border p-2 transition-all text-xs',
                      activePresetId === preset.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-primary/30 hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <FolderOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{preset.name}</span>
                      {preset.isBuiltIn && (
                        <Badge variant="secondary" className="h-4 text-[8px] px-1 shrink-0">Built-in</Badge>
                      )}
                    </div>
                    {preset.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{preset.description}</p>
                    )}
                    {!preset.isBuiltIn && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDeletePreset(preset.id); }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>


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

          {/* Generation Period */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5" />
              Generation Period
            </Label>
            
            {/* Quick period buttons */}
            <div className="flex gap-1.5 flex-wrap">
              {[
                { key: 'this-week', label: 'This Week' },
                { key: 'next-week', label: 'Next Week' },
                { key: 'next-2-weeks', label: 'Next 2 Weeks' },
                { key: 'this-month', label: 'This Month' },
              ].map(p => (
                <Button
                  key={p.key}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setQuickPeriod(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* Date range pickers */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-8 text-xs justify-start font-normal">
                      <CalendarIcon className="h-3 w-3 mr-1.5" />
                      {format(dateFrom, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={d => d && setDateFrom(d)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-8 text-xs justify-start font-normal">
                      <CalendarIcon className="h-3 w-3 mr-1.5" />
                      {format(dateTo, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={d => d && setDateTo(d)}
                      disabled={d => d < dateFrom}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              {periodLabel}
            </p>
          </div>


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

          <Separator />

          {/* API Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-xs font-medium">Use API Endpoint</Label>
                <p className="text-[10px] text-muted-foreground">Route demand data through API layer</p>
              </div>
            </div>
            <Switch checked={useApi} onCheckedChange={setUseApi} />
          </div>

          {/* Auto-Assign Section */}
          <Card className={cn(
            "border transition-all",
            autoAssignEnabled ? "border-primary/40 bg-primary/5" : "border-border"
          )}>
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <div>
                    <Label className="text-xs font-medium">Auto-Assign Staff</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Automatically assign best-matching staff to generated shifts
                    </p>
                  </div>
                </div>
                <Switch
                  checked={autoAssignEnabled}
                  onCheckedChange={setAutoAssignEnabled}
                  disabled={staff.length === 0}
                />
              </div>

              {staff.length === 0 && (
                <p className="text-[10px] text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  No staff data available for auto-assignment
                </p>
              )}

              {autoAssignEnabled && staff.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Assignment Strategy</Label>
                    <Select
                      value={assignWeightPreset}
                      onValueChange={key => {
                        setAssignWeightPreset(key);
                        const preset = WEIGHT_PRESETS[key as keyof typeof WEIGHT_PRESETS];
                        if (preset) setAssignWeights(preset.weights);
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(WEIGHT_PRESETS).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-5 gap-1 text-center">
                    {Object.entries(assignWeights).map(([key, val]) => (
                      <div key={key} className="space-y-0.5">
                        <p className="text-[9px] text-muted-foreground capitalize">{key}</p>
                        <p className="text-[10px] font-semibold">{val}%</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    {staff.length} staff member{staff.length !== 1 ? 's' : ''} available for assignment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Constraints Summary */}
          <Card className="border border-border">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <Label className="text-xs font-medium">Active Constraints</Label>
              </div>
              <div className="space-y-1">
                {defaultConstraintConfig.employeeConstraints.contracts.enabled && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    <span>Work limits: max {Math.max(...defaultConstraintConfig.employeeConstraints.contracts.contracts.map(c => c.workLimits.minutesPerPeriod.maxMinutes || 2400)) / 60}h/week</span>
                  </div>
                )}
                {defaultConstraintConfig.employeeConstraints.contracts.enabled && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    <span>Min rest: {Math.max(...defaultConstraintConfig.employeeConstraints.contracts.contracts.map(c => c.timeOffRules.minTimeBetweenShiftsMinutes)) / 60}h between shifts</span>
                  </div>
                )}
                {defaultConstraintConfig.employeeConstraints.availability.enabled && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    <span>Respect availability & unavailability</span>
                  </div>
                )}
                {defaultConstraintConfig.employeeConstraints.fairness.enabled && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    <span>Balance workload across staff</span>
                  </div>
                )}
                {defaultConstraintConfig.shiftConstraints.skills.enabled && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    <span>Skills enforcement: {defaultConstraintConfig.shiftConstraints.skills.requiredSkillsEnforced ? 'Hard' : 'Soft'}</span>
                  </div>
                )}
                {defaultConstraintConfig.shiftConstraints.costManagement.enabled && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    <span>Cost optimization active</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>


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

          {/* Auto-assign summary */}
          {autoAssignEnabled && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-medium">
                        {isAutoAssigning ? 'Assigning staff...' : `${assignedCount} of ${result.shiftEnvelopes.length} shifts assigned`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {isAutoAssigning
                          ? 'Scoring staff against constraints...'
                          : `${result.shiftEnvelopes.length - assignedCount} shifts remain open`}
                      </p>
                    </div>
                  </div>
                  {!isAutoAssigning && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => runAutoAssignment(result.shiftEnvelopes)}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Re-assign
                    </Button>
                  )}
                  {isAutoAssigning && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment Metrics */}
          {autoAssignEnabled && assignmentMetrics && !isAutoAssigning && (
            <div className="grid grid-cols-2 gap-2">
              <Card className="bg-muted/30">
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-foreground">${assignmentMetrics.estimatedCost.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Estimated Cost</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{assignmentMetrics.fairnessScore}%</p>
                  <p className="text-[10px] text-muted-foreground">Fairness Score</p>
                </CardContent>
              </Card>
            </div>
          )}
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
                    assignments={assignments as any}
                    staff={staff}
                    onReassignShift={handleManualReassign}
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
              {assignedCount > 0 && (
                <span className="text-primary ml-1">({assignedCount} auto-assigned)</span>
              )}
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
              const assignment = assignments.get(env.id);
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
                      {assignment && (
                        <p className="text-[10px] text-primary flex items-center gap-1 mt-0.5">
                          <UserCheck className="h-2.5 w-2.5" />
                          {assignment.staffName}
                          <span className="text-muted-foreground">· score {assignment.score}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignment && (
                      <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-primary/40 text-primary">
                        assigned
                      </Badge>
                    )}
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
