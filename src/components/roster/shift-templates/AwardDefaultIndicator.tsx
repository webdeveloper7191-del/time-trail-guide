/**
 * Award Default Indicator
 * Shows whether a field uses the award default or has a custom override
 * Displays the award default value as reference
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AwardDefaultIndicatorProps {
  awardValue: number | string | undefined;
  templateValue: number | string | undefined;
  label?: string;
  formatValue?: (val: number | string) => string;
  className?: string;
}

export function AwardDefaultIndicator({
  awardValue,
  templateValue,
  label = 'Award default',
  formatValue,
  className,
}: AwardDefaultIndicatorProps) {
  if (awardValue === undefined) return null;

  const awardNum = Number(awardValue);
  const templateNum = Number(templateValue);
  const isDefault = !isNaN(awardNum) && !isNaN(templateNum) && awardNum === templateNum;
  const isBelow = !isNaN(awardNum) && !isNaN(templateNum) && templateNum < awardNum;
  const isAbove = !isNaN(awardNum) && !isNaN(templateNum) && templateNum > awardNum;

  const formatted = formatValue
    ? formatValue(awardValue)
    : typeof awardValue === 'number'
    ? `$${awardValue.toFixed(2)}`
    : String(awardValue);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1 mt-0.5', className)}>
            {isBelow ? (
              <AlertTriangle size={10} className="text-destructive" />
            ) : isAbove ? (
              <Info size={10} className="text-primary" />
            ) : (
              <CheckCircle2 size={10} className="text-muted-foreground" />
            )}
            <span
              className={cn(
                'text-[10px] leading-none',
                isBelow && 'text-destructive font-medium',
                isAbove && 'text-primary',
                isDefault && 'text-muted-foreground'
              )}
            >
              {label}: {formatted}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[220px]">
          {isBelow ? (
            <p className="text-destructive">
              Below award minimum. Templates can only set values equal to or above the award default.
            </p>
          ) : isAbove ? (
            <p>Custom override above award default ({formatted}). This is allowed.</p>
          ) : (
            <p>Using the award default value.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact conflict summary badge for template cards
 */
export function ConflictBadge({
  aboveCount,
  belowCount,
}: {
  aboveCount: number;
  belowCount: number;
}) {
  if (aboveCount === 0 && belowCount === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">
            {belowCount > 0 ? (
              <Badge variant="destructive" className="text-[10px] gap-0.5 px-1.5 py-0">
                <AlertTriangle size={10} />
                {belowCount} below award
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0 border-primary/40 text-primary">
                <Info size={10} />
                {aboveCount} custom
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[240px]">
          <div className="space-y-1">
            {belowCount > 0 && (
              <p className="text-destructive">
                {belowCount} field{belowCount > 1 ? 's' : ''} below award minimum — must be corrected
              </p>
            )}
            {aboveCount > 0 && (
              <p>
                {aboveCount} field{aboveCount > 1 ? 's' : ''} customized above award defaults
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
