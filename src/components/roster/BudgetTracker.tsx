import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shift, StaffMember } from '@/types/roster';

interface BudgetTrackerProps {
  shifts: Shift[];
  staff: StaffMember[];
  centreId: string;
  weeklyBudget: number;
}

export function BudgetTracker({ shifts, staff, centreId, weeklyBudget }: BudgetTrackerProps) {
  const budgetData = useMemo(() => {
    const centreShifts = shifts.filter(s => s.centreId === centreId);
    
    let regularCost = 0;
    let overtimeCost = 0;
    let totalHours = 0;
    let uniqueStaff = new Set<string>();
    
    // Group by staff to calculate overtime
    const staffHours: Record<string, number> = {};
    centreShifts.forEach(shift => {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const hours = ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
      staffHours[shift.staffId] = (staffHours[shift.staffId] || 0) + hours;
      totalHours += hours;
      uniqueStaff.add(shift.staffId);
    });

    Object.entries(staffHours).forEach(([staffId, hours]) => {
      const member = staff.find(s => s.id === staffId);
      if (member) {
        const regularHours = Math.min(hours, member.maxHoursPerWeek);
        const overtimeHours = Math.max(0, hours - member.maxHoursPerWeek);
        regularCost += regularHours * member.hourlyRate;
        overtimeCost += overtimeHours * member.overtimeRate;
      }
    });

    const totalCost = regularCost + overtimeCost;
    const variance = totalCost - weeklyBudget;
    const percentUsed = (totalCost / weeklyBudget) * 100;
    const agencyCost = centreShifts
      .filter(s => staff.find(st => st.id === s.staffId)?.agency)
      .reduce((sum, shift) => {
        const member = staff.find(st => st.id === shift.staffId);
        if (!member) return sum;
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        const hours = ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
        return sum + hours * member.hourlyRate;
      }, 0);

    return {
      regularCost: Math.round(regularCost),
      overtimeCost: Math.round(overtimeCost),
      totalCost: Math.round(totalCost),
      agencyCost: Math.round(agencyCost),
      variance: Math.round(variance),
      percentUsed: Math.min(150, percentUsed),
      totalHours: Math.round(totalHours * 10) / 10,
      staffCount: uniqueStaff.size,
      isOverBudget: totalCost > weeklyBudget,
      isNearBudget: percentUsed >= 90 && percentUsed < 100,
    };
  }, [shifts, staff, centreId, weeklyBudget]);

  const getProgressColor = () => {
    if (budgetData.percentUsed >= 100) return 'bg-destructive';
    if (budgetData.percentUsed >= 90) return 'bg-amber-500';
    return 'bg-primary';
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Budget Tracker
        </h3>
        <Badge 
          variant={budgetData.isOverBudget ? 'destructive' : budgetData.isNearBudget ? 'outline' : 'secondary'}
          className={cn(budgetData.isNearBudget && "border-amber-500 text-amber-600")}
        >
          {budgetData.isOverBudget ? 'Over Budget' : budgetData.isNearBudget ? 'Near Budget' : 'On Track'}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Spent: ${budgetData.totalCost.toLocaleString()}</span>
          <span>Budget: ${weeklyBudget.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-300", getProgressColor())}
            style={{ width: `${Math.min(100, budgetData.percentUsed)}%` }}
          />
        </div>
        {budgetData.percentUsed > 100 && (
          <div className="h-1 bg-destructive/30 mt-0.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-destructive"
              style={{ width: `${budgetData.percentUsed - 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-2 rounded-md bg-muted/50">
                <div className="text-xs text-muted-foreground">Regular</div>
                <div className="text-sm font-semibold">${budgetData.regularCost.toLocaleString()}</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>Regular hours cost at standard rates</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("p-2 rounded-md", budgetData.overtimeCost > 0 ? "bg-amber-500/10" : "bg-muted/50")}>
                <div className="text-xs text-muted-foreground">Overtime</div>
                <div className={cn("text-sm font-semibold", budgetData.overtimeCost > 0 && "text-amber-600")}>
                  ${budgetData.overtimeCost.toLocaleString()}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>Overtime hours at 1.5x rate</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("p-2 rounded-md", budgetData.agencyCost > 0 ? "bg-primary/10" : "bg-muted/50")}>
                <div className="text-xs text-muted-foreground">Agency</div>
                <div className={cn("text-sm font-semibold", budgetData.agencyCost > 0 && "text-primary")}>
                  ${budgetData.agencyCost.toLocaleString()}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>Cost from recruitment agency staff</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "p-2 rounded-md",
                budgetData.isOverBudget ? "bg-destructive/10" : "bg-muted/50"
              )}>
                <div className="text-xs text-muted-foreground">Variance</div>
                <div className={cn(
                  "text-sm font-semibold flex items-center gap-1",
                  budgetData.variance > 0 ? "text-destructive" : "text-emerald-600"
                )}>
                  {budgetData.variance > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3" />
                      +${budgetData.variance.toLocaleString()}
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3" />
                      ${Math.abs(budgetData.variance).toLocaleString()}
                    </>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {budgetData.variance > 0 ? 'Over budget by' : 'Under budget by'} ${Math.abs(budgetData.variance)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {budgetData.totalHours}h scheduled
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {budgetData.staffCount} staff
        </div>
      </div>

      {/* Warning */}
      {budgetData.isOverBudget && (
        <div className="mt-3 p-2 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-destructive">
            Budget exceeded by ${budgetData.variance.toLocaleString()}. Consider reviewing shifts or using internal staff.
          </div>
        </div>
      )}
    </Card>
  );
}
