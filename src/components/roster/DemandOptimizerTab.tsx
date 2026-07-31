import { useMemo, useState } from 'react';
import { Shift, StaffMember, Centre } from '@/types/roster';
import { DemandAnalyticsData } from '@/types/demandAnalytics';
import {
  runDemandOptimization,
  planItemsToShifts,
  DemandOptimizationResult,
  OptimizationPlanItem,
} from '@/lib/demandOptimizer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { formatTime12h } from '@/lib/timeFormat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Sparkles,
  Trash2,
  Gauge,
} from 'lucide-react';

interface DemandOptimizerTabProps {
  shifts: Shift[];
  staff: StaffMember[];
  centre: Centre;
  dates: Date[];
  analyticsData: DemandAnalyticsData[];
  onApplyPlan?: (newShifts: Omit<Shift, 'id'>[], releaseShiftIds: string[]) => void;
}

const dateKey = (d: Date) => d.toISOString().split('T')[0];

export function DemandOptimizerTab({
  shifts,
  staff,
  centre,
  dates,
  analyticsData,
  onApplyPlan,
}: DemandOptimizerTabProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DemandOptimizationResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [releaseSelected, setReleaseSelected] = useState<Set<string>>(new Set());

  // Solver / demand inputs
  const [goal, setGoal] = useState<'balanced' | 'cost_minimization' | 'compliance_first' | 'staff_satisfaction'>('balanced');
  const [minShiftHours, setMinShiftHours] = useState(4);
  const [maxShiftHours, setMaxShiftHours] = useState(10);
  const [rounding, setRounding] = useState<'ceiling' | 'predicted'>('ceiling');
  const [solveSeconds, setSolveSeconds] = useState(10);

  const dateStrings = useMemo(() => dates.map(dateKey), [dates]);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await runDemandOptimization({
        shifts,
        staff,
        rooms: centre.rooms,
        centreId: centre.id,
        dates: dateStrings,
        demandData: analyticsData,
        demandConfig: {
          minShiftMinutes: minShiftHours * 60,
          maxShiftMinutes: maxShiftHours * 60,
          roundingStrategy: rounding,
          optimizationGoal: goal === 'cost_minimization' ? 'cost' : goal === 'compliance_first' ? 'compliance' : 'balanced',
        },
        solverConfig: {
          optimizationGoal: goal,
          terminationTimeSeconds: solveSeconds,
        },
      });
      setResult(res);
      setSelected(new Set(res.planItems.filter(p => p.action !== 'keep').map(p => p.envelopeId)));
      setReleaseSelected(new Set());
      toast.success(
        `Optimisation complete — ${res.metrics.toAdd} shift${res.metrics.toAdd === 1 ? '' : 's'} to add, ${res.metrics.toRelease} surplus`,
      );
    } catch (e) {
      toast.error('Optimisation failed. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  const handleApply = () => {
    if (!result) return;
    const items = result.planItems.filter(p => selected.has(p.envelopeId));
    const newShifts = planItemsToShifts(items, centre.id);
    const releaseIds = Array.from(releaseSelected);
    onApplyPlan?.(newShifts, releaseIds);
    toast.success(`Applied ${newShifts.length} new shift${newShifts.length === 1 ? '' : 's'}${releaseIds.length ? ` and released ${releaseIds.length}` : ''}`);
    setResult(null);
  };

  const proposals = result?.planItems.filter(p => p.action !== 'keep') ?? [];

  return (
    <div className="space-y-4">
      <FormSection title="Optimisation inputs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Goal</Label>
            <Select value={goal} onValueChange={(v) => setGoal(v as typeof goal)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="cost_minimization">Lowest cost</SelectItem>
                <SelectItem value="compliance_first">Compliance first</SelectItem>
                <SelectItem value="staff_satisfaction">Staff satisfaction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Demand rounding</Label>
            <Select value={rounding} onValueChange={(v) => setRounding(v as 'ceiling' | 'predicted')}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ceiling">Booked (safest)</SelectItem>
                <SelectItem value="predicted">Predicted attendance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Min shift (hrs)</Label>
            <Input type="number" min={1} max={12} value={minShiftHours} className="h-9"
              onChange={(e) => setMinShiftHours(Number(e.target.value) || 1)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max shift (hrs)</Label>
            <Input type="number" min={2} max={14} value={maxShiftHours} className="h-9"
              onChange={(e) => setMaxShiftHours(Number(e.target.value) || 10)} />
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 mt-3">
          <div className="space-y-1.5 w-40">
            <Label className="text-xs">Solver time (s)</Label>
            <Input type="number" min={1} max={60} value={solveSeconds} className="h-9"
              onChange={(e) => setSolveSeconds(Number(e.target.value) || 10)} />
          </div>
          <Button onClick={handleRun} disabled={running} className="gap-2">
            {running ? <Gauge className="h-4 w-4 animate-pulse" /> : <Play className="h-4 w-4" />}
            {running ? 'Solving…' : 'Run demand optimisation'}
          </Button>
        </div>
      </FormSection>

      {running && (
        <div className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Interpolating demand, generating shift envelopes and solving assignments…
          </div>
          <Progress value={66} className="h-1.5" />
        </div>
      )}

      {result && (
        <>
          <FormSection title="Result">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile icon={<Users className="h-4 w-4" />} label="Demand-driven shifts" value={`${result.metrics.demandShiftsRequired}`} sub={`${result.metrics.currentShifts} currently rostered`} />
              <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Coverage" value={`${result.metrics.coveragePercent}%`} sub={`${result.metrics.toAdd} to add · ${result.metrics.toRelease} surplus`} />
              <StatTile icon={<Clock className="h-4 w-4" />} label="Hours" value={`${result.metrics.requiredHours}h`} sub={`vs ${result.metrics.currentHours}h scheduled`} />
              <StatTile
                icon={<DollarSign className="h-4 w-4" />}
                label="Cost impact"
                value={`${result.metrics.costDelta >= 0 ? '+' : '-'}$${Math.abs(result.metrics.costDelta).toLocaleString()}`}
                sub={`$${result.metrics.optimisedCost.toLocaleString()} optimised`}
                tone={result.metrics.costDelta <= 0 ? 'success' : 'warning'}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              <Badge variant={result.solution.score.isFeasible ? 'default' : 'destructive'}>
                {result.solution.score.isFeasible ? 'Feasible solution' : 'Infeasible — hard constraints broken'}
              </Badge>
              <Badge variant="secondary">
                Score {result.solution.score.hardScore}hard / {result.solution.score.mediumScore}med / {result.solution.score.softScore}soft
              </Badge>
              <Badge variant="outline">{result.solution.solverTimeMs}ms · {result.solution.movesEvaluated.toLocaleString()} moves</Badge>
              <Badge variant="outline">{result.solution.workSavedMetrics.timeSavedMinutes} min of manual rostering saved</Badge>
              {result.metrics.unassigned > 0 && (
                <Badge variant="destructive">{result.metrics.unassigned} requirement(s) unstaffed → open shifts</Badge>
              )}
            </div>
          </FormSection>

          <FormSection title={`Proposed shifts (${proposals.length})`}>
            {proposals.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2 py-4">
                <CheckCircle2 className="h-4 w-4 text-success" /> Roster already covers every demand-driven requirement.
              </div>
            ) : (
              <ScrollArea className="max-h-80">
                <div className="space-y-2 pr-2">
                  {proposals.map(item => (
                    <PlanRow
                      key={item.envelopeId}
                      item={item}
                      checked={selected.has(item.envelopeId)}
                      onToggle={() => toggle(selected, setSelected, item.envelopeId)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </FormSection>

          {result.releaseCandidates.length > 0 && (
            <FormSection title={`Surplus shifts (${result.releaseCandidates.length})`}>
              <ScrollArea className="max-h-64">
                <div className="space-y-2 pr-2">
                  {result.releaseCandidates.map(rc => (
                    <div key={rc.shiftId} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                      <Checkbox checked={releaseSelected.has(rc.shiftId)} onCheckedChange={() => toggle(releaseSelected, setReleaseSelected, rc.shiftId)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{rc.staffName} · {rc.roomName}</div>
                        <div className="text-xs text-muted-foreground">
                          {rc.date} · {formatTime12h(rc.startTime)} – {formatTime12h(rc.endTime)} · {rc.workedHours}h · {rc.reason}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Save ${rc.estimatedSaving}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </FormSection>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="text-xs text-muted-foreground">
              {selected.size} shift(s) to create · {releaseSelected.size} to release
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResult(null)}>Discard</Button>
              <Button onClick={handleApply} disabled={selected.size === 0 && releaseSelected.size === 0} className="gap-2">
                <Zap className="h-4 w-4" /> Apply to roster
              </Button>
            </div>
          </div>
        </>
      )}

      {!result && !running && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Run the optimiser to turn this week's demand into concrete shift requirements and staff assignments.
        </div>
      )}
    </div>
  );
}

function PlanRow({ item, checked, onToggle }: { item: OptimizationPlanItem; checked: boolean; onToggle: () => void }) {
  const priorityTone: Record<string, string> = {
    critical: 'bg-destructive/10 text-destructive border-destructive/30',
    high: 'bg-warning/10 text-warning border-warning/30',
    normal: 'bg-primary/10 text-primary border-primary/30',
    low: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-2.5">
      <Checkbox checked={checked} onCheckedChange={onToggle} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{item.roomName}</span>
          <span className="text-xs text-muted-foreground">
            {item.date} · {formatTime12h(item.startTime)} – {formatTime12h(item.endTime)}
          </span>
          <Badge variant="outline" className={cn('text-[10px] capitalize', priorityTone[item.priority])}>{item.priority}</Badge>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {item.workedHours}h · peak {item.peakDemand} · {item.assignedStaffName
            ? <>assign <span className="text-foreground font-medium">{item.assignedStaffName}</span></>
            : <span className="text-warning">no eligible staff — create as open shift</span>}
        </div>
        {item.violations.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-warning mt-1">
            <AlertTriangle className="h-3 w-3" />
            {item.violations.map(v => v.constraintName).join(', ')}
          </div>
        )}
      </div>
      <Badge variant="secondary" className="text-xs">${item.estimatedCost}</Badge>
    </div>
  );
}

function StatTile({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub?: string; tone?: 'success' | 'warning' }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">{icon}{label}</div>
      <div className={cn('text-lg font-semibold mt-1 tracking-tight', tone === 'success' && 'text-success', tone === 'warning' && 'text-warning')}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
