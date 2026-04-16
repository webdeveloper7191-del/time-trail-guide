import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, GitCompareArrows, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DeltaMetric {
  label: string;
  current: number;
  previous: number;
  delta: number;
  deltaPct: number;
  format?: 'number' | 'currency' | 'percent' | 'hours';
  invertColor?: boolean; // true = negative delta is good (e.g. costs down)
}

interface PeriodComparisonBarProps {
  enabled: boolean;
  onToggle: () => void;
  comparisonRange: DateRange | undefined;
  onComparisonRangeChange: (range: DateRange | undefined) => void;
  metrics?: DeltaMetric[];
}

function formatValue(value: number, fmt?: string): string {
  switch (fmt) {
    case 'currency': return `$${value.toLocaleString()}`;
    case 'percent': return `${value.toFixed(1)}%`;
    case 'hours': return `${value.toLocaleString()}h`;
    default: return value.toLocaleString();
  }
}

function DeltaBadge({ metric }: { metric: DeltaMetric }) {
  const isPositive = metric.delta > 0;
  const isNeutral = metric.delta === 0;
  const isGood = metric.invertColor ? !isPositive : isPositive;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="flex flex-col gap-0.5 px-3 py-1.5 rounded-md bg-muted/50 min-w-[120px]">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{formatValue(metric.current, metric.format)}</span>
        <div className={cn(
          'flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
          isNeutral && 'bg-muted text-muted-foreground',
          !isNeutral && isGood && 'bg-emerald-100 text-emerald-700',
          !isNeutral && !isGood && 'bg-red-100 text-destructive',
        )}>
          <Icon className="h-2.5 w-2.5" />
          {metric.deltaPct !== 0 ? `${Math.abs(metric.deltaPct).toFixed(1)}%` : '0%'}
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">
        prev: {formatValue(metric.previous, metric.format)}
      </span>
    </div>
  );
}

export function PeriodComparisonBar({
  enabled,
  onToggle,
  comparisonRange,
  onComparisonRangeChange,
  metrics = [],
}: PeriodComparisonBarProps) {
  const [calOpen, setCalOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant={enabled ? 'default' : 'outline'}
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={onToggle}
        >
          <GitCompareArrows className="h-3.5 w-3.5" />
          {enabled ? 'Comparison On' : 'Compare Periods'}
        </Button>

        {enabled && (
          <>
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn('h-8 gap-1.5 text-xs font-normal', comparisonRange?.from && 'text-foreground')}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {comparisonRange?.from ? (
                    comparisonRange.to
                      ? `${format(comparisonRange.from, 'dd MMM')} – ${format(comparisonRange.to, 'dd MMM')}`
                      : format(comparisonRange.from, 'dd MMM yyyy')
                  ) : 'Previous period'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={comparisonRange}
                  onSelect={(r) => {
                    onComparisonRangeChange(r);
                    if (r?.to) setCalOpen(false);
                  }}
                  numberOfMonths={2}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
                {comparisonRange?.from && (
                  <div className="border-t border-border/60 p-2 flex justify-end">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { onComparisonRangeChange(undefined); setCalOpen(false); }}>
                      <X className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {comparisonRange?.from && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                vs {format(comparisonRange.from, 'dd MMM')}
                {comparisonRange.to && ` – ${format(comparisonRange.to, 'dd MMM')}`}
              </Badge>
            )}
          </>
        )}
      </div>

      {enabled && metrics.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {metrics.map(m => (
            <DeltaBadge key={m.label} metric={m} />
          ))}
        </div>
      )}
    </div>
  );
}
