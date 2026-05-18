import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Calculator, 
  Phone, 
  PhoneCall, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Layers,
  Link2Off,
  ArrowRight,
  DollarSign,
  Clock,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types matching OnCallAllowancePanel
interface OnCallAllowance {
  id: string;
  name: string;
  code: string;
  description: string;
  rateType: 'per_period' | 'per_hour' | 'daily';
  rate: number;
  weekendRate?: number;
  publicHolidayMultiplier?: number;
  applicableAwards: string[];
  isActive: boolean;
  stackable: boolean;
  excludesWith: string[];
  priority: number;
  triggerType: 'standby' | 'callback' | 'recall' | 'emergency';
  callbackMinimumHours?: number;
  callbackRateMultiplier?: number;
}

interface OnCallPayCalculationPreviewProps {
  allowances: OnCallAllowance[];
}

interface CalculationStep {
  allowanceId: string;
  allowanceName: string;
  amount: number;
  applied: boolean;
  reason: string;
  isExcluded: boolean;
  excludedBy?: string;
  priority: number;
}

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const;
type DayOfWeek = typeof DAYS[number];
type TriggerFilter = 'all' | 'standby' | 'callback' | 'recall' | 'emergency';

export function OnCallPayCalculationPreview({ allowances }: OnCallPayCalculationPreviewProps) {
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Wednesday');
  const [isPublicHoliday, setIsPublicHoliday] = useState(false);
  const [isStandbyActive, setIsStandbyActive] = useState(true);
  const [wasCalledBack, setWasCalledBack] = useState(true);
  const [actualHoursWorked, setActualHoursWorked] = useState(1.5);
  const [currentCallbackCount, setCurrentCallbackCount] = useState(1);
  const [baseHourlyRate, setBaseHourlyRate] = useState(35);
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<TriggerFilter>('all');
  const [awardFilter, setAwardFilter] = useState<string>('all');
  const [ruleFilter, setRuleFilter] = useState<string>('all');

  const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

  // Derive available awards from the allowance set
  const availableAwards = useMemo(() => {
    const set = new Set<string>();
    allowances.forEach(a => a.applicableAwards.forEach(aw => set.add(aw)));
    return Array.from(set);
  }, [allowances]);

  // Filter active allowances by selected award + trigger type + single rule
  const activeAllowances = useMemo(() => {
    return allowances
      .filter(a => a.isActive)
      .filter(a => awardFilter === 'all' || a.applicableAwards.includes(awardFilter as any))
      .filter(a => triggerTypeFilter === 'all' || a.triggerType === triggerTypeFilter)
      .filter(a => ruleFilter === 'all' || a.id === ruleFilter);
  }, [allowances, awardFilter, triggerTypeFilter, ruleFilter]);


  // Calculate pay with exclusion logic
  const calculation = useMemo(() => {
    const steps: CalculationStep[] = [];
    const appliedAllowanceIds = new Set<string>();
    const excludedAllowanceIds = new Map<string, string>(); // id -> excludedBy name

    // Sort by priority (higher priority first)
    const sortedAllowances = [...activeAllowances].sort((a, b) => b.priority - a.priority);

    // First pass: determine which allowances are excluded
    for (const allowance of sortedAllowances) {
      // Check if this allowance is already excluded by a higher priority one
      if (excludedAllowanceIds.has(allowance.id)) {
        continue;
      }

      // Check trigger type
      const isStandbyType = allowance.triggerType === 'standby';
      const isCallbackType = ['callback', 'recall', 'emergency'].includes(allowance.triggerType);

      // Standby gated by isStandbyActive; callback gated by wasCalledBack
      if ((isStandbyType && isStandbyActive) || (isCallbackType && wasCalledBack)) {
        // Check if non-stackable
        if (!allowance.stackable) {
          for (const other of sortedAllowances) {
            if (other.id !== allowance.id && other.priority < allowance.priority) {
              if (!other.stackable || other.excludesWith.includes(allowance.id)) {
                excludedAllowanceIds.set(other.id, allowance.name);
              }
            }
          }
        }

        for (const excludedId of allowance.excludesWith) {
          const excludedAllowance = activeAllowances.find(a => a.id === excludedId);
          if (excludedAllowance && excludedAllowance.priority < allowance.priority) {
            excludedAllowanceIds.set(excludedId, allowance.name);
          }
        }

        appliedAllowanceIds.add(allowance.id);
      }
    }

    let totalPay = 0;

    for (const allowance of sortedAllowances) {
      const isStandbyType = allowance.triggerType === 'standby';
      const isCallbackType = ['callback', 'recall', 'emergency'].includes(allowance.triggerType);
      const isExcluded = excludedAllowanceIds.has(allowance.id);

      let amount = 0;
      let reason = '';

      if (isStandbyType) {
        if (!isStandbyActive) {
          amount = 0;
          reason = 'Standby not active';
        } else if (isPublicHoliday && allowance.publicHolidayMultiplier) {
          amount = allowance.rate * allowance.publicHolidayMultiplier;
          reason = `$${allowance.rate.toFixed(2)} × ${allowance.publicHolidayMultiplier}x (public holiday)`;
        } else if (isWeekend && allowance.weekendRate) {
          amount = allowance.weekendRate;
          reason = `Weekend rate (${dayOfWeek}): $${allowance.weekendRate.toFixed(2)}`;
        } else {
          amount = allowance.rate;
          reason = `Base rate (${dayOfWeek}): $${allowance.rate.toFixed(2)}`;
        }
      } else if (isCallbackType) {
        if (!wasCalledBack) {
          amount = 0;
          reason = 'Not called back';
        } else {
          const minimumHours = allowance.callbackMinimumHours || 2;
          const paidHours = Math.max(actualHoursWorked, minimumHours);
          const multiplier = allowance.callbackRateMultiplier ?? 1;
          // Effective hourly rate = max(allowance.rate, baseHourlyRate × multiplier)
          const effectiveRate = Math.max(allowance.rate, baseHourlyRate * multiplier);
          // Tiered uplift: 3rd+ callback in period adds 25%
          const tierUplift = currentCallbackCount >= 3 ? 1.25 : 1;
          amount = paidHours * effectiveRate * tierUplift;
          const parts: string[] = [];
          parts.push(`${paidHours}h × $${effectiveRate.toFixed(2)}/h`);
          if (multiplier !== 1) parts.push(`(base $${baseHourlyRate.toFixed(2)} × ${multiplier}x)`);
          if (actualHoursWorked < minimumHours) parts.push(`min ${minimumHours}h`);
          if (tierUplift > 1) parts.push(`tier uplift ×${tierUplift} (callback #${currentCallbackCount})`);
          reason = parts.join(' · ');
        }
      }

      const applied = !isExcluded && ((isStandbyType && isStandbyActive) || (isCallbackType && wasCalledBack));

      steps.push({
        allowanceId: allowance.id,
        allowanceName: allowance.name,
        amount,
        applied,
        reason: isExcluded 
          ? `Excluded by "${excludedAllowanceIds.get(allowance.id)}" (mutual exclusion)`
          : reason,
        isExcluded,
        excludedBy: excludedAllowanceIds.get(allowance.id),
        priority: allowance.priority,
      });

      if (applied) {
        totalPay += amount;
      }
    }

    return { steps, totalPay };
  }, [activeAllowances, isWeekend, dayOfWeek, isPublicHoliday, isStandbyActive, wasCalledBack, actualHoursWorked, currentCallbackCount, baseHourlyRate]);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  // Calculate what pay would be without exclusions
  const payWithoutExclusions = useMemo(() => {
    return calculation.steps.reduce((sum, step) => {
      if (step.isExcluded) {
        return sum + step.amount;
      }
      return sum;
    }, calculation.totalPay);
  }, [calculation]);

  const exclusionSavings = payWithoutExclusions - calculation.totalPay;

  return (
    <Card className="card-material-elevated border-l-4 border-l-emerald-500">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Calculator className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Pay Calculation Preview</CardTitle>
            <CardDescription>
              See how stackable vs non-stackable allowances affect total pay
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Award + Rule scope */}
        <div className="p-4 rounded-lg bg-background border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Evaluation Scope
          </p>
          <div className={`grid grid-cols-1 ${awardFilter !== 'all' ? 'md:grid-cols-2' : ''} gap-3`}>
            <div>
              <Label className="text-xs text-muted-foreground">Applicable Award</Label>
              <select
                value={awardFilter}
                onChange={(e) => { setAwardFilter(e.target.value); setRuleFilter('all'); }}
                className="w-full mt-1 text-sm border rounded px-2 py-1.5 bg-background"
              >
                <option value="all">All awards</option>
                {availableAwards.map(a => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            {awardFilter !== 'all' && (
              <div>
                <Label className="text-xs text-muted-foreground">Rule</Label>
                <select
                  value={ruleFilter}
                  onChange={(e) => setRuleFilter(e.target.value)}
                  className="w-full mt-1 text-sm border rounded px-2 py-1.5 bg-background"
                >
                  <option value="all">All matching rules (aggregate)</option>
                  {allowances
                    .filter(a => a.isActive)
                    .filter(a => a.applicableAwards.includes(awardFilter as any))
                    .map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                </select>
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            {awardFilter === 'all'
              ? 'Pick a specific award to drill into individual rules.'
              : 'Filter to a single rule to see exactly what is being calculated.'}
          </p>
        </div>

        {/* Scenario Controls */}
        <div className="p-4 rounded-lg bg-muted/50 border space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Sample Shift Scenario
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Day of Week</Label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                className="w-full mt-1 text-sm border rounded px-2 py-1.5 bg-background"
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {isWeekend && (
                <p className="text-[10px] text-amber-600 mt-1">Weekend rate applies</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Base Hourly Rate ($)</Label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={baseHourlyRate}
                onChange={(e) => setBaseHourlyRate(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 text-sm border rounded px-2 py-1.5 bg-background"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Trigger Type</Label>
              <select
                value={triggerTypeFilter}
                onChange={(e) => setTriggerTypeFilter(e.target.value as TriggerFilter)}
                className="w-full mt-1 text-sm border rounded px-2 py-1.5 bg-background"
              >
                <option value="all">All triggers</option>
                <option value="standby">Standby</option>
                <option value="callback">Callback</option>
                <option value="recall">Emergency recall</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Callback # in period</Label>
              <input
                type="number"
                min={0}
                step={1}
                value={currentCallbackCount}
                onChange={(e) => setCurrentCallbackCount(parseInt(e.target.value) || 0)}
                className="w-full mt-1 text-sm border rounded px-2 py-1.5 bg-background"
              />
              {currentCallbackCount >= 3 && (
                <p className="text-[10px] text-amber-600 mt-1">Tier uplift ×1.25</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="standbyActive"
                checked={isStandbyActive}
                onCheckedChange={setIsStandbyActive}
              />
              <Label htmlFor="standbyActive" className="text-sm">Standby Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="publicHoliday"
                checked={isPublicHoliday}
                onCheckedChange={setIsPublicHoliday}
              />
              <Label htmlFor="publicHoliday" className="text-sm">Public Holiday</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="calledBack"
                checked={wasCalledBack}
                onCheckedChange={setWasCalledBack}
              />
              <Label htmlFor="calledBack" className="text-sm">Called Back</Label>
            </div>
            {wasCalledBack && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground">Actual hours worked</Label>
                  <input
                    type="number"
                    min={0}
                    step={0.25}
                    value={actualHoursWorked}
                    onChange={(e) => setActualHoursWorked(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm border rounded px-2 py-1 bg-background"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {activeAllowances.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active allowances to calculate</p>
          </div>
        ) : (
          <>
            {/* Calculation Steps */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Calculation Breakdown
              </p>
              {calculation.steps.map((step) => (
                <div 
                  key={step.allowanceId}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    step.applied 
                      ? "bg-background border-border" 
                      : step.isExcluded
                        ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50"
                        : "bg-muted/30 border-dashed border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {step.applied ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      ) : step.isExcluded ? (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm font-medium",
                            !step.applied && "text-muted-foreground"
                          )}>
                            {step.allowanceName}
                          </p>
                          <Badge variant="outline" className="text-[10px]">
                            Priority {step.priority}
                          </Badge>
                          {step.isExcluded && (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <Link2Off className="h-2.5 w-2.5" />
                              Excluded
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.reason}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-semibold",
                        step.applied ? "text-emerald-600" : step.isExcluded ? "text-red-400 line-through" : "text-muted-foreground"
                      )}>
                        {formatCurrency(step.amount)}
                      </p>
                      {step.applied && (
                        <p className="text-[10px] text-muted-foreground">Applied</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Exclusion Impact */}
            {exclusionSavings > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Exclusion Rules Applied
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      {formatCurrency(exclusionSavings)} prevented from stacking due to mutual exclusion rules.
                      Without exclusions, total would be {formatCurrency(payWithoutExclusions)}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Layers className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">If All Stacked</span>
                </div>
                <p className="text-xl font-bold text-muted-foreground">
                  {formatCurrency(payWithoutExclusions)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  No exclusion rules
                </p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">Actual Pay</span>
                </div>
                <p className="text-xl font-bold text-emerald-600">
                  {formatCurrency(calculation.totalPay)}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  With exclusions applied
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Applied to pay</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                <span>Excluded (mutual exclusion)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Not triggered</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
