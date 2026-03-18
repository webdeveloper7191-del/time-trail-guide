import { useMemo } from 'react';
import { Shift, StaffMember } from '@/types/roster';
import { CallbackEvent } from './CallbackEventLoggingPanel';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PhoneCall, Zap, Shield, AlertTriangle, DollarSign, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CallbackLaneCellProps {
  events: CallbackEvent[];
  isCompact?: boolean;
  columnWidthClass: string;
}

const typeConfig = {
  callback: { icon: PhoneCall, color: 'text-amber-700', bg: 'bg-amber-500/20', border: 'border-amber-400/40', bar: 'bg-amber-500' },
  recall: { icon: Zap, color: 'text-orange-700', bg: 'bg-orange-500/20', border: 'border-orange-400/40', bar: 'bg-orange-500' },
  emergency: { icon: Shield, color: 'text-red-700', bg: 'bg-red-500/20', border: 'border-red-400/40', bar: 'bg-red-500' },
};

const statusBadgeColors: Record<CallbackEvent['status'], string> = {
  logged: 'bg-blue-500/15 text-blue-700 border-blue-300',
  approved: 'bg-green-500/15 text-green-700 border-green-300',
  rejected: 'bg-red-500/15 text-red-700 border-red-300',
  paid: 'bg-emerald-500/15 text-emerald-700 border-emerald-300',
};

function CallbackEventBar({ event }: { event: CallbackEvent }) {
  const config = typeConfig[event.callbackType];
  const Icon = config.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative rounded-md border px-1.5 py-0.5 cursor-default",
              "transition-all hover:shadow-sm hover:scale-[1.02]",
              config.bg, config.border
            )}
          >
            {/* Left accent bar */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 rounded-l-md", config.bar)} />

            <div className="flex items-center gap-1 pl-1">
              <Icon className={cn("h-2.5 w-2.5 shrink-0", config.color)} />
              <span className={cn("text-[9px] font-semibold truncate", config.color)}>
                {event.staffName.split(' ')[0]}
              </span>
              {/* Pay badge */}
              <Badge
                variant="outline"
                className={cn(
                  "text-[8px] px-1 py-0 h-3.5 ml-auto shrink-0 font-bold",
                  "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-700"
                )}
              >
                <DollarSign className="h-2 w-2 mr-0.5" />
                {event.calculatedPay.toFixed(0)}
              </Badge>
            </div>

            {/* Rest violation indicator */}
            {(event as any).restViolation && (
              <div className="absolute -top-1 -right-1 z-10">
                <div className="bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm">
                  <Timer className="h-2 w-2" />
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <div className="space-y-1">
            <p className="font-semibold text-xs">{event.staffName} — {event.callbackType.charAt(0).toUpperCase() + event.callbackType.slice(1)}</p>
            <p className="text-[10px] text-muted-foreground">
              {event.workStartTime && format(new Date(event.workStartTime), 'HH:mm')} – {event.workEndTime && format(new Date(event.workEndTime), 'HH:mm')}
            </p>
            <div className="flex items-center gap-2 text-[10px]">
              <span>{event.rateMultiplier}x rate</span>
              <span>•</span>
              <span>{(event.paidMinutes / 60).toFixed(1)}h paid</span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{event.reason}</p>
            {event.minimumEngagementApplied && (
              <div className="flex items-center gap-1 text-[10px] text-amber-600">
                <AlertTriangle className="h-2.5 w-2.5" />
                Min {event.minimumEngagementHours}h engagement applied
              </div>
            )}
            {(event as any).restViolation && (
              <div className="flex items-center gap-1 text-[10px] text-destructive font-medium">
                <Timer className="h-2.5 w-2.5" />
                10h rest period violated — next shift too soon
              </div>
            )}
            <Badge variant="outline" className={cn("text-[9px]", statusBadgeColors[event.status])}>
              {event.status}
            </Badge>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CallbackLaneCell({ events, columnWidthClass }: CallbackLaneCellProps) {
  return (
    <div
      className={cn(
        "p-0.5 border-r border-amber-200/30 relative",
        columnWidthClass
      )}
    >
      <div className="flex flex-col gap-0.5 max-h-[44px] md:max-h-[52px] overflow-auto">
        {events.map((event) => (
          <CallbackEventBar key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

interface CallbackLaneProps {
  events: CallbackEvent[];
  dates: Date[];
  columnWidthClass: string;
  side: 'left' | 'right';
}

export function CallbackLane({ events, dates, columnWidthClass, side }: CallbackLaneProps) {
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CallbackEvent[]> = {};
    events.forEach(ev => {
      // Extract date from workStartTime
      const dateStr = ev.workStartTime?.split('T')[0];
      if (!dateStr) return;
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(ev);
    });
    return grouped;
  }, [events]);

  const hasAnyEvents = events.length > 0;
  if (!hasAnyEvents) return null;

  if (side === 'left') {
    return (
      <div className="h-[44px] md:h-[52px] border-b border-amber-200/50 bg-gradient-to-r from-amber-50/60 to-amber-50/30 dark:from-amber-950/20 dark:to-amber-950/10 flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2">
        <div className="h-7 w-7 md:h-9 md:w-9 rounded-full flex items-center justify-center bg-amber-500/20 border-2 border-dashed border-amber-500/50 shrink-0">
          <PhoneCall className="h-3 w-3 md:h-4 md:w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs md:text-sm font-medium text-amber-700 dark:text-amber-300 truncate">Callbacks</p>
          <p className="text-[9px] md:text-[10px] text-amber-600 dark:text-amber-400 hidden sm:block">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[44px] md:h-[52px] flex border-b border-amber-200/50 bg-gradient-to-r from-amber-50/60 to-amber-50/30 dark:from-amber-950/20 dark:to-amber-950/10">
      {dates.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayEvents = eventsByDate[dateStr] || [];

        return (
          <CallbackLaneCell
            key={`callback-${dateStr}`}
            events={dayEvents}
            columnWidthClass={columnWidthClass}
          />
        );
      })}
      <div className="w-16 md:w-20 lg:w-24 shrink-0 border-l border-amber-200/30 bg-amber-50/30 dark:bg-amber-950/10" />
    </div>
  );
}
