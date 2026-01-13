import { useMemo } from 'react';
import { Shift, StaffMember } from '@/types/roster';
import { detectAllowanceEligibility, validateShiftData, AllowanceEligibility } from '@/lib/shiftTypeDetection';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  DollarSign, CheckCircle2, XCircle, AlertTriangle, Info, 
  Zap, Phone, Moon, Clock, ArrowUpCircle, Car, Heart, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AllowanceEligibilityPanelProps {
  shift: Shift;
  staff?: StaffMember;
}

const ALLOWANCE_ICONS: Record<string, typeof DollarSign> = {
  ON_CALL: Phone,
  ON_CALL_RECALL: Phone,
  SLEEPOVER: Moon,
  SLEEPOVER_DISTURBED: Moon,
  BROKEN_SHIFT: Clock,
  FIRST_AID: Heart,
  HIGHER_DUTIES: ArrowUpCircle,
  VEHICLE: Car,
  NQA_LEADERSHIP: Award,
};

const ALLOWANCE_RATES: Record<string, { rate: number; unit: string }> = {
  ON_CALL: { rate: 15.42, unit: '/day' },
  ON_CALL_RECALL: { rate: 52.50, unit: '/hr (min 2hr)' },
  SLEEPOVER: { rate: 69.85, unit: '/occurrence' },
  SLEEPOVER_DISTURBED: { rate: 45.50, unit: '/hr (min 1hr)' },
  BROKEN_SHIFT: { rate: 18.46, unit: '/occurrence' },
  FIRST_AID: { rate: 3.32, unit: '/day' },
  HIGHER_DUTIES: { rate: 2.50, unit: '/hr' },
  VEHICLE: { rate: 0.96, unit: '/km' },
  NQA_LEADERSHIP: { rate: 7.23, unit: '/day' },
};

export function AllowanceEligibilityPanel({ shift, staff }: AllowanceEligibilityPanelProps) {
  const eligibility = useMemo(() => {
    if (!staff) return [];
    return detectAllowanceEligibility(shift, staff);
  }, [shift, staff]);

  const validation = useMemo(() => validateShiftData(shift), [shift]);

  const eligibleAllowances = eligibility.filter(e => e.isEligible);
  const ineligibleAllowances = eligibility.filter(e => !e.isEligible);

  // Calculate estimated total for eligible allowances
  const estimatedTotal = useMemo(() => {
    let total = 0;
    eligibleAllowances.forEach(allowance => {
      const rateInfo = ALLOWANCE_RATES[allowance.allowanceCode];
      if (!rateInfo) return;
      
      if (allowance.allowanceCode === 'VEHICLE' && shift.travelKilometres) {
        total += shift.travelKilometres * rateInfo.rate;
      } else if (allowance.allowanceCode === 'ON_CALL_RECALL' && shift.onCallDetails?.recallDuration) {
        const hours = Math.max(2, shift.onCallDetails.recallDuration / 60);
        total += hours * rateInfo.rate;
      } else if (allowance.allowanceCode === 'SLEEPOVER_DISTURBED' && shift.sleepoverDetails?.disturbanceMinutes) {
        const hours = Math.max(1, shift.sleepoverDetails.disturbanceMinutes / 60);
        total += hours * rateInfo.rate;
      } else {
        total += rateInfo.rate;
      }
    });
    return total;
  }, [eligibleAllowances, shift]);

  if (!staff) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Assign a staff member to see allowance eligibility</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Validation Warnings */}
      {(validation.warnings.length > 0 || validation.errors.length > 0 || validation.suggestions.length > 0) && (
        <Card className="border-amber-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Shift Validation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {validation.errors.map((error, idx) => (
              <div key={`err-${idx}`} className="flex items-start gap-2 text-xs text-destructive">
                <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
            {validation.warnings.map((warning, idx) => (
              <div key={`warn-${idx}`} className="flex items-start gap-2 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
            {validation.suggestions.map((suggestion, idx) => (
              <div key={`sug-${idx}`} className="flex items-start gap-2 text-xs text-blue-600">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{suggestion}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Eligible Allowances */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              Eligible Allowances
            </div>
            <Badge variant="secondary" className="font-mono">
              ${estimatedTotal.toFixed(2)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eligibleAllowances.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No allowances currently eligible</p>
          ) : (
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {eligibleAllowances.map((allowance) => (
                  <AllowanceRow key={allowance.allowanceCode} allowance={allowance} shift={shift} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Ineligible Allowances (Collapsed) */}
      {ineligibleAllowances.length > 0 && (
        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            {ineligibleAllowances.length} allowances not applicable
          </summary>
          <div className="mt-2 space-y-1 pl-3">
            {ineligibleAllowances.map((allowance) => (
              <div key={allowance.allowanceCode} className="flex items-center gap-2 text-xs text-muted-foreground">
                <XCircle className="h-3 w-3" />
                <span>{allowance.allowanceName}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{allowance.reason}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function AllowanceRow({ allowance, shift }: { allowance: AllowanceEligibility; shift: Shift }) {
  const Icon = ALLOWANCE_ICONS[allowance.allowanceCode] || DollarSign;
  const rateInfo = ALLOWANCE_RATES[allowance.allowanceCode];

  // Calculate specific amount
  let amount = rateInfo?.rate || 0;
  if (allowance.allowanceCode === 'VEHICLE' && shift.travelKilometres) {
    amount = shift.travelKilometres * (rateInfo?.rate || 0.96);
  } else if (allowance.allowanceCode === 'ON_CALL_RECALL' && shift.onCallDetails?.recallDuration) {
    const hours = Math.max(2, shift.onCallDetails.recallDuration / 60);
    amount = hours * (rateInfo?.rate || 52.50);
  } else if (allowance.allowanceCode === 'SLEEPOVER_DISTURBED' && shift.sleepoverDetails?.disturbanceMinutes) {
    const hours = Math.max(1, shift.sleepoverDetails.disturbanceMinutes / 60);
    amount = hours * (rateInfo?.rate || 45.50);
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg",
      allowance.autoDetected ? "bg-blue-500/10" : "bg-muted/50"
    )}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "p-1.5 rounded-md",
          allowance.autoDetected ? "bg-blue-500/20 text-blue-600" : "bg-primary/10 text-primary"
        )}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{allowance.allowanceName}</span>
            {allowance.autoDetected && (
              <Badge variant="outline" className="text-[10px] py-0 px-1">
                Auto
              </Badge>
            )}
            {allowance.requiresConfirmation && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Please confirm this allowance applies</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{allowance.reason}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-emerald-600">${amount.toFixed(2)}</p>
        {rateInfo && (
          <p className="text-[10px] text-muted-foreground">{rateInfo.rate}{rateInfo.unit}</p>
        )}
      </div>
    </div>
  );
}
