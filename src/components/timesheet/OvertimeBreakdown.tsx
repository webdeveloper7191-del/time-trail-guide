import { OvertimeCalculation } from '@/types/compliance';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Clock,
  TrendingUp,
  DollarSign,
  Zap,
} from 'lucide-react';

interface OvertimeBreakdownProps {
  calculation: OvertimeCalculation;
  hourlyRate: number;
}

export function OvertimeBreakdown({ calculation, hourlyRate }: OvertimeBreakdownProps) {
  const totalHours = calculation.regularHours + calculation.dailyOvertimeHours + calculation.weeklyOvertimeHours + calculation.doubleTimeHours;
  const regularPercent = (calculation.regularHours / totalHours) * 100;
  const overtimePercent = ((calculation.dailyOvertimeHours + calculation.weeklyOvertimeHours) / totalHours) * 100;
  const doubleTimePercent = (calculation.doubleTimeHours / totalHours) * 100;

  return (
    <div className="space-y-4">
      {/* Hours Visual Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Hours Distribution</span>
          <span className="text-muted-foreground">{totalHours.toFixed(1)}h total</span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden bg-muted">
          <div 
            className="bg-primary transition-all"
            style={{ width: `${regularPercent}%` }}
            title={`Regular: ${calculation.regularHours}h`}
          />
          <div 
            className="bg-status-pending transition-all"
            style={{ width: `${overtimePercent}%` }}
            title={`Overtime: ${calculation.dailyOvertimeHours + calculation.weeklyOvertimeHours}h`}
          />
          {calculation.doubleTimeHours > 0 && (
            <div 
              className="bg-status-rejected transition-all"
              style={{ width: `${doubleTimePercent}%` }}
              title={`Double Time: ${calculation.doubleTimeHours}h`}
            />
          )}
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>Regular</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-status-pending" />
            <span>Overtime (1.5x)</span>
          </div>
          {calculation.doubleTimeHours > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-status-rejected" />
              <span>Double Time (2x)</span>
            </div>
          )}
        </div>
      </div>

      {/* Hours Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <BreakdownCard
          icon={Clock}
          label="Regular Hours"
          hours={calculation.regularHours}
          rate={`$${hourlyRate}/hr`}
          pay={calculation.regularPay}
          color="text-primary"
        />
        <BreakdownCard
          icon={TrendingUp}
          label="Daily Overtime"
          hours={calculation.dailyOvertimeHours}
          rate={`$${(hourlyRate * 1.5).toFixed(2)}/hr`}
          pay={calculation.dailyOvertimeHours * hourlyRate * 1.5}
          color="text-status-pending"
          highlight={calculation.dailyOvertimeHours > 0}
        />
        <BreakdownCard
          icon={TrendingUp}
          label="Weekly Overtime"
          hours={calculation.weeklyOvertimeHours}
          rate={`$${(hourlyRate * 1.5).toFixed(2)}/hr`}
          pay={calculation.weeklyOvertimeHours * hourlyRate * 1.5}
          color="text-status-pending"
          highlight={calculation.weeklyOvertimeHours > 0}
        />
        {calculation.doubleTimeHours > 0 && (
          <BreakdownCard
            icon={Zap}
            label="Double Time"
            hours={calculation.doubleTimeHours}
            rate={`$${(hourlyRate * 2).toFixed(2)}/hr`}
            pay={calculation.doubleTimePay}
            color="text-status-rejected"
            highlight
          />
        )}
      </div>

      {/* Total Pay */}
      <div className="bg-accent/50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-status-approved" />
          <div>
            <p className="font-medium">Total Estimated Pay</p>
            <p className="text-xs text-muted-foreground">
              Before deductions and taxes
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-status-approved">
            ${calculation.totalPay.toFixed(2)}
          </p>
          {(calculation.overtimePay + calculation.doubleTimePay) > 0 && (
            <p className="text-xs text-muted-foreground">
              Includes ${(calculation.overtimePay + calculation.doubleTimePay).toFixed(2)} OT premium
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface BreakdownCardProps {
  icon: typeof Clock;
  label: string;
  hours: number;
  rate: string;
  pay: number;
  color: string;
  highlight?: boolean;
}

function BreakdownCard({ icon: Icon, label, hours, rate, pay, color, highlight }: BreakdownCardProps) {
  if (hours === 0 && !highlight) {
    return (
      <div className="p-3 rounded-lg bg-muted/50 opacity-50">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <p className="text-lg font-bold text-muted-foreground">0h</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'p-3 rounded-lg border',
      highlight ? 'bg-accent/50 border-accent' : 'bg-muted/30 border-border'
    )}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-baseline justify-between">
        <p className={cn('text-lg font-bold', color)}>{hours.toFixed(1)}h</p>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{rate}</p>
          <p className="text-sm font-medium">${pay.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
