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

export function OnCallPayCalculationPreview({ allowances }: OnCallPayCalculationPreviewProps) {
  const [isWeekend, setIsWeekend] = useState(false);
  const [isPublicHoliday, setIsPublicHoliday] = useState(false);
  const [wasCalledBack, setWasCalledBack] = useState(true);
  const [callbackHours, setCallbackHours] = useState(1.5);

  const activeAllowances = allowances.filter(a => a.isActive);

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

      // Standby always applies, callback only if called back
      if (isStandbyType || (isCallbackType && wasCalledBack)) {
        // Check if non-stackable
        if (!allowance.stackable) {
          // Non-stackable: mark conflicting lower-priority allowances as excluded
          for (const other of sortedAllowances) {
            if (other.id !== allowance.id && other.priority < allowance.priority) {
              if (!other.stackable || other.excludesWith.includes(allowance.id)) {
                excludedAllowanceIds.set(other.id, allowance.name);
              }
            }
          }
        }

        // Check mutual exclusions
        for (const excludedId of allowance.excludesWith) {
          const excludedAllowance = activeAllowances.find(a => a.id === excludedId);
          if (excludedAllowance && excludedAllowance.priority < allowance.priority) {
            excludedAllowanceIds.set(excludedId, allowance.name);
          }
        }

        appliedAllowanceIds.add(allowance.id);
      }
    }

    // Second pass: calculate amounts
    let totalPay = 0;

    for (const allowance of sortedAllowances) {
      const isStandbyType = allowance.triggerType === 'standby';
      const isCallbackType = ['callback', 'recall', 'emergency'].includes(allowance.triggerType);
      const isExcluded = excludedAllowanceIds.has(allowance.id);

      // Calculate base amount
      let amount = 0;
      let reason = '';

      if (isStandbyType) {
        // Standby calculation
        if (isPublicHoliday && allowance.publicHolidayMultiplier) {
          amount = allowance.rate * allowance.publicHolidayMultiplier;
          reason = `$${allowance.rate.toFixed(2)} × ${allowance.publicHolidayMultiplier}x (public holiday)`;
        } else if (isWeekend && allowance.weekendRate) {
          amount = allowance.weekendRate;
          reason = `Weekend rate: $${allowance.weekendRate.toFixed(2)}`;
        } else {
          amount = allowance.rate;
          reason = `Base rate: $${allowance.rate.toFixed(2)}`;
        }
      } else if (isCallbackType) {
        // Callback calculation
        if (!wasCalledBack) {
          amount = 0;
          reason = 'Not called back';
        } else {
          const minimumHours = allowance.callbackMinimumHours || 2;
          const paidHours = Math.max(callbackHours, minimumHours);
          const rate = allowance.rate;
          amount = paidHours * rate;
          reason = `${paidHours}h × $${rate.toFixed(2)}/h${callbackHours < minimumHours ? ` (min ${minimumHours}h applies)` : ''}`;
        }
      }

      const applied = !isExcluded && (isStandbyType || (isCallbackType && wasCalledBack));

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
  }, [activeAllowances, isWeekend, isPublicHoliday, wasCalledBack, callbackHours]);

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
        {/* Scenario Controls */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Sample Shift Scenario
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                id="weekend" 
                checked={isWeekend} 
                onCheckedChange={setIsWeekend}
              />
              <Label htmlFor="weekend" className="text-sm">Weekend</Label>
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
                <select
                  value={callbackHours}
                  onChange={(e) => setCallbackHours(parseFloat(e.target.value))}
                  className="text-sm border rounded px-2 py-1 bg-background"
                >
                  <option value={0.5}>0.5 hours</option>
                  <option value={1}>1 hour</option>
                  <option value={1.5}>1.5 hours</option>
                  <option value={2}>2 hours</option>
                  <option value={3}>3 hours</option>
                  <option value={4}>4 hours</option>
                </select>
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
