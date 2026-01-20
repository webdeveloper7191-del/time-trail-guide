import { useMemo } from 'react';
import { StaffMember, TimeOff } from '@/types/roster';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CalendarX, Clock, AlertTriangle } from 'lucide-react';
import { Tooltip as MuiTooltip } from '@mui/material';
import { format, parseISO, isWithinInterval, isSameDay } from 'date-fns';

interface StaffAvailabilityOverlayProps {
  staff: StaffMember;
  date: Date;
  showTimeSlots?: boolean;
  isCompact?: boolean;
}

export function StaffAvailabilityOverlay({
  staff,
  date,
  showTimeSlots = false,
  isCompact = false,
}: StaffAvailabilityOverlayProps) {
  const dayOfWeek = date.getDay();
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Check availability for this day
  const dayAvailability = staff.availability?.find(a => a.dayOfWeek === dayOfWeek);
  const isAvailable = dayAvailability?.available ?? true;
  const availableFrom = dayAvailability?.startTime;
  const availableTo = dayAvailability?.endTime;
  
  // Check if on leave
  const activeLeave = useMemo(() => {
    if (!staff.timeOff) return null;
    
    return staff.timeOff.find(leave => {
      if (leave.status !== 'approved') return false;
      const leaveStart = parseISO(leave.startDate);
      const leaveEnd = parseISO(leave.endDate);
      return isWithinInterval(date, { start: leaveStart, end: leaveEnd }) || 
             isSameDay(date, leaveStart) || 
             isSameDay(date, leaveEnd);
    });
  }, [staff.timeOff, date]);
  
  // Determine availability status
  const status = useMemo(() => {
    if (activeLeave) {
      return {
        type: 'leave' as const,
        label: getLeaveLabel(activeLeave.type),
        color: 'destructive' as const,
        icon: CalendarX,
      };
    }
    
    if (!isAvailable) {
      return {
        type: 'unavailable' as const,
        label: 'Unavailable',
        color: 'secondary' as const,
        icon: Clock,
      };
    }
    
    if (availableFrom && availableTo) {
      return {
        type: 'partial' as const,
        label: `${availableFrom} - ${availableTo}`,
        color: 'warning' as const,
        icon: Clock,
      };
    }
    
    return null;
  }, [activeLeave, isAvailable, availableFrom, availableTo]);
  
  if (!status) return null;
  
  if (status.type === 'leave') {
    return (
      <MuiTooltip
        title={
          <div>
            <p className="font-medium">{staff.name}</p>
            <p className="text-xs opacity-80">{status.label}</p>
            {activeLeave?.notes && (
              <p className="text-xs opacity-80 mt-1">{activeLeave.notes}</p>
            )}
          </div>
        }
        placement="top"
        arrow
      >
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          "bg-[repeating-linear-gradient(135deg,hsl(var(--muted)/0.3),hsl(var(--muted)/0.3)_8px,hsl(var(--muted)/0.5)_8px,hsl(var(--muted)/0.5)_16px)]",
          "border-2 border-dashed border-muted-foreground/30 rounded-md",
          "pointer-events-auto cursor-default"
        )}>
          <div className={cn(
            "flex flex-col items-center gap-1 text-center px-2",
            isCompact && "scale-90"
          )}>
            <CalendarX className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {status.label}
            </span>
          </div>
        </div>
      </MuiTooltip>
    );
  }
  
  if (status.type === 'unavailable') {
    return (
      <MuiTooltip
        title={
          <div>
            <p className="font-medium">{staff.name}</p>
            <p className="text-xs opacity-80">Not available on {format(date, 'EEEE')}s</p>
          </div>
        }
        placement="top"
        arrow
      >
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          "bg-[repeating-linear-gradient(135deg,hsl(var(--muted)/0.2),hsl(var(--muted)/0.2)_8px,hsl(var(--muted)/0.4)_8px,hsl(var(--muted)/0.4)_16px)]",
          "border-2 border-dashed border-muted-foreground/20 rounded-md",
          "pointer-events-auto cursor-default"
        )}>
          <div className={cn(
            "flex flex-col items-center gap-1 text-center px-2",
            isCompact && "scale-90"
          )}>
            <span className="text-sm font-semibold text-muted-foreground/70">
              Unavailable
            </span>
            <span className="text-xs text-muted-foreground/60">
              All Day
            </span>
          </div>
        </div>
      </MuiTooltip>
    );
  }
  
  // Partial availability
  return (
    <MuiTooltip
      title={
        <div>
          <p className="font-medium">{staff.name}</p>
          <p className="text-xs opacity-80">
            Available {availableFrom} - {availableTo} only
          </p>
        </div>
      }
      placement="top"
      arrow
    >
      <Badge 
        variant="outline"
        className={cn(
          "absolute top-1 left-1 text-[9px] px-1.5 py-0 h-4",
          "bg-amber-50 text-amber-700 border-amber-300",
          "dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-700"
        )}
      >
        <Clock className="h-2.5 w-2.5 mr-0.5" />
        {status.label}
      </Badge>
    </MuiTooltip>
  );
}

// Helper to get friendly leave type labels
function getLeaveLabel(type: TimeOff['type']): string {
  const labels: Record<TimeOff['type'], string> = {
    annual_leave: 'Annual Leave',
    sick_leave: 'Sick Leave',
    personal_leave: 'Personal Leave',
    unpaid_leave: 'Unpaid Leave',
  };
  return labels[type] || 'On Leave';
}

interface StaffGapIndicatorProps {
  staff: StaffMember;
  dates: Date[];
  requiredHoursPerDay?: number;
}

export function StaffGapIndicator({
  staff,
  dates,
  requiredHoursPerDay = 8,
}: StaffGapIndicatorProps) {
  const gaps = useMemo(() => {
    const issues: { date: Date; reason: string }[] = [];
    
    dates.forEach(date => {
      const dayOfWeek = date.getDay();
      const dayAvailability = staff.availability?.find(a => a.dayOfWeek === dayOfWeek);
      
      // Check leave
      const hasLeave = staff.timeOff?.some(leave => {
        if (leave.status !== 'approved') return false;
        const leaveStart = parseISO(leave.startDate);
        const leaveEnd = parseISO(leave.endDate);
        return isWithinInterval(date, { start: leaveStart, end: leaveEnd }) || 
               isSameDay(date, leaveStart) || 
               isSameDay(date, leaveEnd);
      });
      
      if (hasLeave) {
        issues.push({ date, reason: 'On leave' });
      } else if (!dayAvailability?.available) {
        issues.push({ date, reason: 'Unavailable' });
      }
    });
    
    return issues;
  }, [staff, dates]);
  
  if (gaps.length === 0) return null;
  
  return (
    <MuiTooltip
      title={
        <div>
          <p className="font-medium mb-1">{staff.name} - Availability Gaps</p>
          <div className="space-y-0.5">
            {gaps.slice(0, 5).map((gap, i) => (
              <p key={i} className="text-xs opacity-80">
                {format(gap.date, 'EEE, MMM d')}: {gap.reason}
              </p>
            ))}
            {gaps.length > 5 && (
              <p className="text-xs opacity-80">
                +{gaps.length - 5} more
              </p>
            )}
          </div>
        </div>
      }
      placement="top"
      arrow
    >
      <Badge 
        variant="outline"
        className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-700"
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        {gaps.length} gap{gaps.length !== 1 ? 's' : ''}
      </Badge>
    </MuiTooltip>
  );
}

export default StaffAvailabilityOverlay;
