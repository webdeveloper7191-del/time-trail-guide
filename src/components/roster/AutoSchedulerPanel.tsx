import { useState, useMemo } from 'react';
import {
  Wand2, Play, Settings2, BarChart3, AlertTriangle, Check,
  Users, Clock, DollarSign, Scale, Star, ChevronDown,
  Zap, RefreshCw, Download, Eye, CheckCircle2, XCircle,
  Building2, CalendarDays, Info, Sparkles,
} from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Shift, StaffMember, Room, Centre, ShiftTemplate } from '@/types/roster';
import { DemandAnalyticsData } from '@/types/demandAnalytics';
import { defaultConstraintConfig, TimefoldConstraintConfiguration } from '@/types/timefoldConstraintConfig';
import {
  runAutoScheduler,
  convertToRosterShifts,
  AutoSchedulerConfig,
  SchedulerWeights,
  SchedulerResult,
  GeneratedShiftSlot,
  DEFAULT_WEIGHTS,
} from '@/lib/autoScheduler';
import { format, parseISO } from 'date-fns';

interface AutoSchedulerPanelProps {
  open: boolean;
  onClose: () => void;
  centreId: string;
  centre: Centre;
  staff: StaffMember[];
  rooms: Room[];
  existingShifts: Shift[];
  demandData: DemandAnalyticsData[];
  shiftTemplates: ShiftTemplate[];
  dates: string[];
  onApplyShifts: (shifts: Omit<Shift, 'id'>[]) => void;
}

const WEIGHT_PRESETS = {
  balanced: { label: 'Balanced', weights: { availability: 30, qualifications: 25, cost: 15, fairness: 20, preference: 10 } },
  costOptimized: { label: 'Cost Optimized', weights: { availability: 25, qualifications: 15, cost: 40, fairness: 10, preference: 10 } },
  qualityFirst: { label: 'Quality First', weights: { availability: 20, qualifications: 40, cost: 10, fairness: 15, preference: 15 } },
  fairDistribution: { label: 'Fair Distribution', weights: { availability: 20, qualifications: 15, cost: 10, fairness: 45, preference: 10 } },
};

export function AutoSchedulerPanel({
  open,
  onClose,
  centreId,
  centre,
  staff,
  rooms,
  existingShifts,
  demandData,
  shiftTemplates,
  dates,
  onApplyShifts,
}: AutoSchedulerPanelProps) {
  const [activeTab, setActiveTab] = useState('configure');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SchedulerResult | null>(null);
  const [selectedPreset, setSelectedPreset] = useState('balanced');
  
  // Config state
  const [assignStaff, setAssignStaff] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [weights, setWeights] = useState<SchedulerWeights>(DEFAULT_WEIGHTS);
  const [constraints] = useState<TimefoldConstraintConfiguration>(defaultConstraintConfig);
  
  const dateRange = useMemo(() => {
    if (dates.length === 0) return { start: '', end: '' };
    const sorted = [...dates].sort();
    return { start: sorted[0], end: sorted[sorted.length - 1] };
  }, [dates]);
  
  const filteredDemand = useMemo(() => 
    demandData.filter(d => d.centreId === centreId),
    [demandData, centreId]
  );
  
  const demandSummary = useMemo(() => {
    const totalRequired = filteredDemand.reduce((sum, d) => sum + d.requiredStaff, 0);
    const totalScheduled = filteredDemand.reduce((sum, d) => sum + d.scheduledStaff, 0);
    const nonCompliant = filteredDemand.filter(d => !d.staffRatioCompliant).length;
    return { totalRequired, totalScheduled, gap: totalRequired - totalScheduled, nonCompliant };
  }, [filteredDemand]);

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = WEIGHT_PRESETS[presetKey as keyof typeof WEIGHT_PRESETS];
    if (preset) setWeights(preset.weights);
  };

  const handleRun = () => {
    setIsRunning(true);
    
    // Simulate processing time for UX
    setTimeout(() => {
      try {
        const config: AutoSchedulerConfig = {
          dateRange,
          centreId,
          roomIds: selectedRooms,
          assignStaff,
          constraints,
          weights,
          shiftTemplates,
          operatingHours: centre.operatingHours,
          minShiftDurationMinutes: 180,
        };
        
        const schedulerResult = runAutoScheduler(
          filteredDemand,
          staff,
          rooms,
          existingShifts,
          config,
        );
        
        setResult(schedulerResult);
        setActiveTab('results');
        toast.success(`Generated ${schedulerResult.summary.totalShiftsGenerated} shift slots`);
      } catch (err) {
        toast.error('Auto-scheduler failed. Check demand data.');
        console.error(err);
      } finally {
        setIsRunning(false);
      }
    }, 800);
  };

  const handleApply = () => {
    if (!result) return;
    const rosterShifts = convertToRosterShifts(result.generatedShifts);
    onApplyShifts(rosterShifts);
    toast.success(`Applied ${rosterShifts.length} shifts to roster`);
    onClose();
  };

  const actions: OffCanvasAction[] = [];
  
  if (activeTab === 'configure') {
    actions.push({
      label: isRunning ? 'Running...' : 'Generate Shifts',
      onClick: handleRun,
      variant: 'default' as const,
      icon: isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />,
      disabled: isRunning || dates.length === 0,
    });
  }
  
  if (activeTab === 'results' && result) {
    actions.push({
      label: `Apply ${result.summary.totalShiftsGenerated} Shifts to Roster`,
      onClick: handleApply,
      variant: 'default' as const,
      icon: <Check className="h-4 w-4" />,
    });
  }

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Auto-Scheduler"
      subtitle="Generate shifts from demand data using constraint-aware scheduling"
      icon={<Sparkles className="h-5 w-5" />}
      width="xl"
      actions={actions}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="configure" className="text-xs">
            <Settings2 className="h-3.5 w-3.5 mr-1" /> Configure
          </TabsTrigger>
          <TabsTrigger value="results" className="text-xs" disabled={!result}>
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Results
            {result && <Badge variant="secondary" className="ml-1 text-[10px] px-1">{result.summary.totalShiftsGenerated}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs" disabled={!result}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Shift Details
          </TabsTrigger>
        </TabsList>

        {/* ==================== CONFIGURE TAB ==================== */}
        <TabsContent value="configure" className="space-y-4">
          {/* Demand Summary */}
          <FormSection title="Demand Overview" icon={<BarChart3 className="h-4 w-4" />} defaultOpen>
            <div className="grid grid-cols-4 gap-2">
              <Card className="bg-muted/30">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-foreground">{demandSummary.totalRequired}</div>
                  <div className="text-[10px] text-muted-foreground">Staff Required</div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-foreground">{demandSummary.totalScheduled}</div>
                  <div className="text-[10px] text-muted-foreground">Already Scheduled</div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-3 text-center">
                  <div className={cn("text-lg font-bold", demandSummary.gap > 0 ? "text-destructive" : "text-green-600")}>
                    {demandSummary.gap}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Staffing Gap</div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-3 text-center">
                  <div className={cn("text-lg font-bold", demandSummary.nonCompliant > 0 ? "text-amber-500" : "text-green-600")}>
                    {demandSummary.nonCompliant}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Non-Compliant</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/10 mt-2">
              <Info className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                Scheduling {dates.length} days for {centre.name} ({rooms.length} areas) • {dateRange.start && format(parseISO(dateRange.start), 'dd MMM')} – {dateRange.end && format(parseISO(dateRange.end), 'dd MMM')}
              </span>
            </div>
          </FormSection>

          {/* Room Selection */}
          <FormSection title="Area Selection" icon={<Building2 className="h-4 w-4" />} defaultOpen>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Select areas to schedule</Label>
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2"
                  onClick={() => setSelectedRooms(selectedRooms.length === rooms.length ? [] : rooms.map(r => r.id))}>
                  {selectedRooms.length === rooms.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRooms(prev => 
                      prev.includes(room.id) ? prev.filter(r => r !== room.id) : [...prev, room.id]
                    )}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border text-left text-xs transition-all",
                      selectedRooms.includes(room.id)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {selectedRooms.includes(room.id) ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    <div>
                      <div className="font-medium">{room.name}</div>
                      <div className="text-[10px]">Cap: {room.capacity} • Ratio 1:{room.requiredRatio}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </FormSection>

          {/* Assignment Options */}
          <FormSection title="Scheduling Options" icon={<Users className="h-4 w-4" />} defaultOpen>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Auto-assign staff</Label>
                  <p className="text-[10px] text-muted-foreground">Automatically assign best-fit staff to generated shifts</p>
                </div>
                <Switch checked={assignStaff} onCheckedChange={setAssignStaff} />
              </div>
            </div>
          </FormSection>

          {/* Optimization Weights */}
          {assignStaff && (
            <FormSection title="Optimization Weights" icon={<Scale className="h-4 w-4" />} defaultOpen>
              <div className="space-y-3">
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(WEIGHT_PRESETS).map(([key, preset]) => (
                    <Badge
                      key={key}
                      variant={selectedPreset === key ? 'default' : 'outline'}
                      className="cursor-pointer text-[10px] px-2 py-0.5"
                      onClick={() => handleApplyPreset(key)}
                    >
                      {preset.label}
                    </Badge>
                  ))}
                </div>
                
                <Separator />
                
                {Object.entries(weights).map(([key, value]) => {
                  const icons: Record<string, React.ReactNode> = {
                    availability: <Clock className="h-3 w-3" />,
                    qualifications: <Star className="h-3 w-3" />,
                    cost: <DollarSign className="h-3 w-3" />,
                    fairness: <Scale className="h-3 w-3" />,
                    preference: <Users className="h-3 w-3" />,
                  };
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {icons[key]}
                          <Label className="text-xs capitalize">{key}</Label>
                        </div>
                        <span className="text-xs font-medium tabular-nums">{value}%</span>
                      </div>
                      <Slider
                        value={[value]}
                        onValueChange={([v]) => {
                          setWeights(prev => ({ ...prev, [key]: v }));
                          setSelectedPreset('');
                        }}
                        min={0} max={100} step={5}
                      />
                    </div>
                  );
                })}
              </div>
            </FormSection>
          )}

          {/* Constraint Summary */}
          <FormSection title="Active Constraints" icon={<AlertTriangle className="h-4 w-4" />}>
            <div className="space-y-1.5">
              {constraints.employeeConstraints.contracts.enabled && (
                <div className="flex items-center gap-2 text-xs">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Work limits: max {Math.max(...constraints.employeeConstraints.contracts.contracts.map(c => c.workLimits.minutesPerPeriod.maxMinutes || 2400)) / 60}h/week</span>
                </div>
              )}
              {constraints.employeeConstraints.contracts.enabled && (
                <div className="flex items-center gap-2 text-xs">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Min rest: {Math.max(...constraints.employeeConstraints.contracts.contracts.map(c => c.timeOffRules.minTimeBetweenShiftsMinutes)) / 60}h between shifts</span>
                </div>
              )}
              {constraints.employeeConstraints.availability.enabled && (
                <div className="flex items-center gap-2 text-xs">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Respect availability & unavailability</span>
                </div>
              )}
              {constraints.employeeConstraints.fairness.enabled && (
                <div className="flex items-center gap-2 text-xs">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Balance workload across staff</span>
                </div>
              )}
              {constraints.shiftConstraints.skills.enabled && (
                <div className="flex items-center gap-2 text-xs">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Skills enforcement: {constraints.shiftConstraints.skills.requiredSkillsEnforced ? 'Hard' : 'Soft'}</span>
                </div>
              )}
              {constraints.shiftConstraints.costManagement.enabled && (
                <div className="flex items-center gap-2 text-xs">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Cost optimization active</span>
                </div>
              )}
            </div>
          </FormSection>
        </TabsContent>

        {/* ==================== RESULTS TAB ==================== */}
        <TabsContent value="results" className="space-y-4">
          {result && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{result.summary.totalShiftsGenerated}</div>
                    <div className="text-[10px] text-muted-foreground">Shifts Generated</div>
                  </CardContent>
                </Card>
                <Card className={cn("border", result.summary.unfilledShifts > 0 ? "bg-amber-500/5 border-amber-500/20" : "bg-green-500/5 border-green-500/20")}>
                  <CardContent className="p-3 text-center">
                    <div className={cn("text-2xl font-bold", result.summary.unfilledShifts > 0 ? "text-amber-500" : "text-green-600")}>
                      {assignStaff ? result.summary.totalStaffAssigned : '—'}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{assignStaff ? 'Staff Assigned' : 'Empty Shifts'}</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-foreground">{result.summary.totalHoursScheduled}h</div>
                    <div className="text-[10px] text-muted-foreground">Total Hours</div>
                  </CardContent>
                </Card>
              </div>
              
              {assignStaff && (
                <div className="grid grid-cols-2 gap-2">
                  <Card className="bg-muted/30">
                    <CardContent className="p-3 text-center">
                      <div className="text-lg font-bold text-foreground">${result.summary.estimatedCost.toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">Estimated Cost</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardContent className="p-3 text-center">
                      <div className="text-lg font-bold text-foreground">{result.summary.averageFairnessScore}%</div>
                      <div className="text-[10px] text-muted-foreground">Fairness Score</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Room Coverage */}
              <FormSection title="Area Coverage" icon={<Building2 className="h-4 w-4" />} defaultOpen>
                <div className="space-y-2">
                  {result.summary.roomCoverage.map(rc => (
                    <div key={rc.roomId} className="flex items-center gap-3">
                      <span className="text-xs min-w-[100px] truncate">{rc.roomName}</span>
                      <Progress value={rc.required > 0 ? (rc.covered / rc.required) * 100 : 0} className="flex-1 h-2" />
                      <span className="text-xs tabular-nums text-muted-foreground min-w-[50px] text-right">
                        {rc.covered}/{rc.required}
                      </span>
                    </div>
                  ))}
                </div>
              </FormSection>

              {/* Date Breakdown */}
              <FormSection title="Daily Breakdown" icon={<CalendarDays className="h-4 w-4" />} defaultOpen>
                <div className="space-y-1">
                  {result.summary.dateBreakdown.map(db => (
                    <div key={db.date} className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/50">
                      <span className="text-xs font-medium">{format(parseISO(db.date), 'EEE dd MMM')}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{db.shifts} shifts</Badge>
                        {assignStaff && (
                          <Badge variant={db.assigned === db.shifts ? 'default' : 'outline'} className="text-[10px]">
                            {db.assigned}/{db.shifts} assigned
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </FormSection>

              {/* Constraint Violations */}
              {result.constraintViolations.length > 0 && (
                <FormSection title="Constraint Violations" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} defaultOpen>
                  <div className="space-y-1.5">
                    {result.constraintViolations.map((v, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-amber-500/5 border border-amber-500/10">
                        <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-medium">{v.constraint}</div>
                          <div className="text-[10px] text-muted-foreground">{v.message}</div>
                        </div>
                        <Badge variant={v.type === 'hard' ? 'destructive' : 'outline'} className="text-[10px] ml-auto shrink-0">
                          {v.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </FormSection>
              )}
            </>
          )}
        </TabsContent>

        {/* ==================== DETAILS TAB ==================== */}
        <TabsContent value="details" className="space-y-2">
          {result && (
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {result.generatedShifts.length} shift slots
                </span>
                <div className="flex gap-1">
                  <Badge variant="destructive" className="text-[10px]">Critical</Badge>
                  <Badge variant="default" className="text-[10px]">High</Badge>
                  <Badge variant="secondary" className="text-[10px]">Normal</Badge>
                  <Badge variant="outline" className="text-[10px]">Low</Badge>
                </div>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto space-y-1">
                {result.generatedShifts.map(shift => (
                  <div
                    key={shift.id}
                    className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <Badge
                      variant={
                        shift.priority === 'critical' ? 'destructive' :
                        shift.priority === 'high' ? 'default' :
                        shift.priority === 'low' ? 'outline' : 'secondary'
                      }
                      className="text-[10px] px-1.5 shrink-0"
                    >
                      {shift.priority[0].toUpperCase()}
                    </Badge>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{shift.roomName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(parseISO(shift.date), 'EEE dd')}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {shift.startTime} – {shift.endTime}
                      </div>
                    </div>
                    
                    {shift.assignedStaffName ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span className="text-[10px] font-medium">{shift.assignedStaffName}</span>
                        {shift.assignmentScore !== undefined && (
                          <Badge variant="outline" className="text-[10px] px-1">{shift.assignmentScore}%</Badge>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {assignStaff ? 'Unfilled' : 'Empty'}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PrimaryOffCanvas>
  );
}
