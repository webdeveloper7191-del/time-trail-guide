import { useMemo, useState } from 'react';
import { Timesheet } from '@/types/timesheet';
import { validateCompliance } from '@/lib/complianceEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
  getDay,
  startOfWeek,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface TimesheetCalendarViewProps {
  timesheets: Timesheet[];
  onTimesheetClick?: (timesheet: Timesheet) => void;
}

export function TimesheetCalendarView({ timesheets, onTimesheetClick }: TimesheetCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get starting day offset (0 = Sunday)
    const startingDayIndex = getDay(monthStart);

    // Map timesheets to dates
    const timesheetsByDate: Record<string, Timesheet[]> = {};
    const overtimeByDate: Record<string, number> = {};

    timesheets.forEach(ts => {
      const weekStart = parseISO(ts.weekStartDate);
      const weekEnd = parseISO(ts.weekEndDate);
      
      ts.entries.forEach(entry => {
        const date = entry.date;
        if (!timesheetsByDate[date]) {
          timesheetsByDate[date] = [];
          overtimeByDate[date] = 0;
        }
        timesheetsByDate[date].push(ts);
        overtimeByDate[date] += entry.overtime || 0;
      });
    });

    return {
      days,
      startingDayIndex,
      timesheetsByDate,
      overtimeByDate,
    };
  }, [timesheets, currentMonth]);

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dateTimesheets = calendarData.timesheetsByDate[dateStr] || [];
    
    if (dateTimesheets.length === 0) return null;

    const hasRejected = dateTimesheets.some(t => t.status === 'rejected');
    const hasPending = dateTimesheets.some(t => t.status === 'pending');
    const allApproved = dateTimesheets.every(t => t.status === 'approved');

    if (hasRejected) return 'rejected';
    if (hasPending) return 'pending';
    if (allApproved) return 'approved';
    return 'mixed';
  };

  const getOvertimeIntensity = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const overtime = calendarData.overtimeByDate[dateStr] || 0;
    if (overtime === 0) return 0;
    if (overtime <= 2) return 1;
    if (overtime <= 4) return 2;
    return 3;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Calendar View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-status-approved" />
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-status-pending" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-status-rejected" />
            <span>Rejected</span>
          </div>
          <div className="flex items-center gap-1.5 ml-4 border-l pl-4">
            <div className="w-3 h-3 rounded bg-amber-200" />
            <span>Low OT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-400" />
            <span>Med OT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-600" />
            <span>High OT</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for offset */}
          {Array.from({ length: calendarData.startingDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 min-h-[80px]" />
          ))}

          {/* Calendar days */}
          {calendarData.days.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const status = getDateStatus(date);
            const overtimeIntensity = getOvertimeIntensity(date);
            const dateTimesheets = calendarData.timesheetsByDate[dateStr] || [];

            return (
              <Tooltip key={dateStr}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "p-2 min-h-[80px] rounded-lg border border-border/50 transition-all cursor-pointer hover:border-primary/50",
                      isToday(date) && "ring-2 ring-primary/30",
                      dateTimesheets.length > 0 && "bg-muted/30"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          isToday(date) && "text-primary"
                        )}
                      >
                        {format(date, 'd')}
                      </span>
                      {overtimeIntensity > 0 && (
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            overtimeIntensity === 1 && "bg-amber-200",
                            overtimeIntensity === 2 && "bg-amber-400",
                            overtimeIntensity === 3 && "bg-amber-600"
                          )}
                        />
                      )}
                    </div>

                    {dateTimesheets.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {dateTimesheets.slice(0, 2).map((ts, i) => (
                          <div
                            key={`${ts.id}-${i}`}
                            onClick={() => onTimesheetClick?.(ts)}
                            className={cn(
                              "text-[10px] px-1 py-0.5 rounded truncate",
                              ts.status === 'approved' && "bg-status-approved/20 text-status-approved",
                              ts.status === 'pending' && "bg-status-pending/20 text-status-pending",
                              ts.status === 'rejected' && "bg-status-rejected/20 text-status-rejected"
                            )}
                          >
                            {ts.employee.name.split(' ')[0]}
                          </div>
                        ))}
                        {dateTimesheets.length > 2 && (
                          <div className="text-[10px] text-muted-foreground px-1">
                            +{dateTimesheets.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <p className="font-medium">{format(date, 'EEEE, MMM d')}</p>
                  {dateTimesheets.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {dateTimesheets.map((ts, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span>{ts.employee.name}</span>
                          <Badge variant="outline" className="text-[10px] h-4">
                            {ts.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No timesheets</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Heatmap Component
interface OvertimeHeatmapProps {
  timesheets: Timesheet[];
}

export function OvertimeHeatmap({ timesheets }: OvertimeHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Create a map of employee -> day -> overtime hours
    const data: Record<string, Record<string, number>> = {};
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    timesheets.forEach(ts => {
      if (!data[ts.employee.name]) {
        data[ts.employee.name] = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      }
      
      ts.entries.forEach(entry => {
        const date = parseISO(entry.date);
        const dayName = format(date, 'EEE');
        if (weekDays.includes(dayName)) {
          data[ts.employee.name][dayName] += entry.overtime || 0;
        }
      });
    });

    return Object.entries(data).map(([name, days]) => ({
      name,
      ...days,
    }));
  }, [timesheets]);

  const getColor = (value: number) => {
    if (value === 0) return 'bg-muted/30';
    if (value <= 1) return 'bg-amber-100 dark:bg-amber-900/30';
    if (value <= 2) return 'bg-amber-200 dark:bg-amber-800/40';
    if (value <= 3) return 'bg-amber-300 dark:bg-amber-700/50';
    if (value <= 4) return 'bg-amber-400 dark:bg-amber-600/60';
    return 'bg-amber-500 dark:bg-amber-500/70';
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Overtime Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-2 mb-4 text-xs">
          <span className="text-muted-foreground">Less</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded bg-muted/30" />
            <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30" />
            <div className="w-4 h-4 rounded bg-amber-200 dark:bg-amber-800/40" />
            <div className="w-4 h-4 rounded bg-amber-300 dark:bg-amber-700/50" />
            <div className="w-4 h-4 rounded bg-amber-400 dark:bg-amber-600/60" />
            <div className="w-4 h-4 rounded bg-amber-500 dark:bg-amber-500/70" />
          </div>
          <span className="text-muted-foreground">More</span>
        </div>

        {/* Heatmap Grid */}
        <div className="space-y-1">
          {/* Header */}
          <div className="flex">
            <div className="w-28 shrink-0" />
            {weekDays.map(day => (
              <div key={day} className="flex-1 text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Rows */}
          {heatmapData.map((row) => (
            <div key={row.name} className="flex items-center">
              <div className="w-28 shrink-0 text-xs font-medium truncate pr-2">
                {row.name}
              </div>
              {weekDays.map(day => {
                const value = Number(row[day as keyof typeof row]) || 0;
                return (
                  <Tooltip key={day}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 p-0.5">
                        <div
                          className={cn(
                            "h-8 rounded transition-all hover:ring-2 hover:ring-primary/30",
                            getColor(value)
                          )}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs">{day}: {value}h overtime</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
