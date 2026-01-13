import { useMemo } from 'react';
import { Shift, StaffMember } from '@/types/roster';
import { 
  OnCallConfiguration, 
  DEFAULT_ON_CALL_CONFIGS, 
  AwardType 
} from '@/types/allowances';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  PhoneCall, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnCallPayBreakdownProps {
  shift: Shift;
  staff?: StaffMember;
  awardType?: AwardType;
  customConfig?: Partial<OnCallConfiguration>;
  isPublicHoliday?: boolean;
  isWeekend?: boolean;
}

interface PayBreakdownItem {
  label: string;
  description: string;
  hours?: number;
  rate: number;
  multiplier?: number;
  total: number;
  type: 'standby' | 'callback' | 'penalty';
  applied: boolean;
}

export function OnCallPayBreakdown({ 
  shift, 
  staff,
  awardType = 'children_services',
  customConfig,
  isPublicHoliday = false,
  isWeekend = false,
}: OnCallPayBreakdownProps) {
  const config: OnCallConfiguration = useMemo(() => ({
    ...DEFAULT_ON_CALL_CONFIGS[awardType],
    ...customConfig,
  }), [awardType, customConfig]);

  const breakdown = useMemo((): PayBreakdownItem[] => {
    const items: PayBreakdownItem[] = [];
    const baseHourlyRate = staff?.hourlyRate || 35;
    
    // Calculate on-call period duration
    const startTime = shift.onCallDetails?.startTime || shift.startTime;
    const endTime = shift.onCallDetails?.endTime || shift.endTime;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let periodMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (periodMinutes < 0) periodMinutes += 24 * 60; // Overnight
    const periodHours = periodMinutes / 60;

    // 1. Standby Allowance (always paid for on-call shifts)
    let standbyRate = config.standbyRate;
    let standbyLabel = 'Standby Allowance';
    let standbyDescription = 'Paid for being available during on-call period';
    
    if (isPublicHoliday && config.publicHolidayStandbyMultiplier) {
      standbyRate = config.standbyRate * config.publicHolidayStandbyMultiplier;
      standbyLabel = 'Standby Allowance (Public Holiday)';
      standbyDescription = `${config.publicHolidayStandbyMultiplier}x rate for public holiday on-call`;
    } else if (isWeekend && config.weekendStandbyRate) {
      standbyRate = config.weekendStandbyRate;
      standbyLabel = 'Standby Allowance (Weekend)';
      standbyDescription = 'Higher rate for weekend on-call period';
    }

    let standbyTotal = standbyRate;
    if (config.standbyRateType === 'per_hour') {
      standbyTotal = standbyRate * periodHours;
    }

    items.push({
      label: standbyLabel,
      description: standbyDescription,
      rate: standbyRate,
      total: standbyTotal,
      type: 'standby',
      applied: shift.shiftType === 'on_call' || shift.shiftType === 'recall',
    });

    // 2. Callback Payment (only if called)
    const wasRecalled = shift.onCallDetails?.wasRecalled || shift.shiftType === 'recall';
    const recallDuration = shift.onCallDetails?.recallDuration || 0;
    const actualHours = recallDuration / 60;
    const paidHours = Math.max(actualHours, config.callbackMinimumHours);
    const callbackRate = baseHourlyRate * config.callbackRateMultiplier;
    const callbackTotal = paidHours * callbackRate;

    items.push({
      label: 'Callback Payment',
      description: wasRecalled 
        ? `${actualHours.toFixed(1)}h worked, minimum ${config.callbackMinimumHours}h applies`
        : `Minimum ${config.callbackMinimumHours}h at ${config.callbackRateMultiplier}x rate if called`,
      hours: wasRecalled ? paidHours : undefined,
      rate: callbackRate,
      multiplier: config.callbackRateMultiplier,
      total: wasRecalled ? callbackTotal : 0,
      type: 'callback',
      applied: wasRecalled,
    });

    return items;
  }, [shift, staff, config, isPublicHoliday, isWeekend]);

  const totalPay = useMemo(() => 
    breakdown.reduce((sum, item) => sum + (item.applied ? item.total : 0), 0),
    [breakdown]
  );

  const standbyTotal = useMemo(() => 
    breakdown.filter(i => i.type === 'standby' && i.applied).reduce((sum, i) => sum + i.total, 0),
    [breakdown]
  );

  const callbackTotal = useMemo(() => 
    breakdown.filter(i => i.type === 'callback' && i.applied).reduce((sum, i) => sum + i.total, 0),
    [breakdown]
  );

  const wasRecalled = shift.onCallDetails?.wasRecalled || shift.shiftType === 'recall';

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Phone className="h-4 w-4" />
            On-Call Pay Breakdown
          </div>
          <Badge 
            variant={wasRecalled ? "default" : "secondary"}
            className={cn(
              "text-xs",
              wasRecalled ? "bg-amber-500 hover:bg-amber-600" : ""
            )}
          >
            {wasRecalled ? 'Called Back' : 'Not Called'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-background rounded-lg border">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Phone className="h-3.5 w-3.5" />
              <span className="text-xs">Standby</span>
            </div>
            <p className="text-lg font-semibold text-emerald-600">
              ${standbyTotal.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">Paid regardless</p>
          </div>
          <div className="p-3 bg-background rounded-lg border">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <PhoneCall className="h-3.5 w-3.5" />
              <span className="text-xs">Callback</span>
            </div>
            <p className={cn(
              "text-lg font-semibold",
              wasRecalled ? "text-amber-600" : "text-muted-foreground"
            )}>
              ${callbackTotal.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {wasRecalled ? 'Work performed' : 'If called in'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Detailed Breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Detailed Breakdown
          </p>
          {breakdown.map((item, index) => (
            <div 
              key={index}
              className={cn(
                "p-2.5 rounded-lg border transition-colors",
                item.applied 
                  ? "bg-background border-border" 
                  : "bg-muted/30 border-dashed border-muted-foreground/30"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  {item.applied ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  )}
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      !item.applied && "text-muted-foreground"
                    )}>
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-semibold",
                    item.applied ? "text-foreground" : "text-muted-foreground"
                  )}>
                    ${item.total.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.hours ? `${item.hours}h × ` : ''}
                    ${item.rate.toFixed(2)}
                    {item.multiplier ? ` (${item.multiplier}x)` : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Total On-Call Pay</p>
              <p className="text-xs text-muted-foreground">
                Standby + {wasRecalled ? 'Callback' : '(no callback)'}
              </p>
            </div>
          </div>
          <p className="text-xl font-bold text-primary">
            ${totalPay.toFixed(2)}
          </p>
        </div>

        {/* Configuration Info */}
        <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span className="font-medium">Award Configuration:</span>
          </div>
          <ul className="pl-4 space-y-0.5">
            <li>• Standby: ${config.standbyRate.toFixed(2)} per {config.standbyRateType.replace('_', ' ')}</li>
            <li>• Callback minimum: {config.callbackMinimumHours} hours</li>
            <li>• Callback rate: {config.callbackRateMultiplier}x base hourly</li>
            {config.weekendStandbyRate && (
              <li>• Weekend standby: ${config.weekendStandbyRate.toFixed(2)}</li>
            )}
            {config.publicHolidayStandbyMultiplier && (
              <li>• Public holiday: {config.publicHolidayStandbyMultiplier}x standby</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}