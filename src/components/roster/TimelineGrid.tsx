import { useState, useMemo } from 'react';
import { Shift, OpenShift, Centre, Room, StaffMember, DemandData, RosterComplianceFlag, ageGroupLabels, ShiftTemplate } from '@/types/roster';
import { ShiftCard, OpenShiftCard } from './ShiftCard';
import { MobileShiftCard } from './MobileShiftCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { DemandHistogram } from './DemandHistogram';
import { InlineDemandChart } from './InlineDemandChart';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  TrendingDown,
  Minus,
  EyeOff,
  ChevronDown,
  Settings,
  Flag,
  PartyPopper,
  GraduationCap,
  ClipboardCheck,
  MapPin,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import { 
  getHolidaysForDate, 
  getEventsForDate, 
  PublicHoliday, 
  RosterEvent, 
  eventTypeConfig 
} from '@/data/mockHolidaysEvents';

interface TimelineGridProps {
  centre: Centre;
  shifts: Shift[];
  openShifts: OpenShift[];
  staff: StaffMember[];
  demandData: DemandData[];
  complianceFlags: RosterComplianceFlag[];
  dates: Date[];
  viewMode: 'day' | 'week' | 'fortnight' | 'month';
  showDemandOverlay: boolean;
  showAnalyticsCharts?: boolean;
  lowDemandDays?: Set<string>;
  demandAnalytics?: DemandAnalyticsData[];
  staffAbsences?: StaffAbsence[];
  onDropStaff: (staffId: string, roomId: string, date: string, timeSlot?: string) => void;
  onShiftEdit: (shift: Shift) => void;
  onShiftDelete: (shiftId: string) => void;
  onShiftCopy?: (shift: Shift) => void;
  onShiftSwap?: (shift: Shift) => void;
  onOpenShiftFill: (openShift: OpenShift) => void;
  onAddShift: (roomId: string, date: string, template?: ShiftTemplate) => void;
  onUnassignStaff?: (shiftId: string) => void;
  onOpenShiftTemplateManager?: () => void;
}

export function TimelineGrid({
  centre,
  shifts,
  openShifts,
  staff,
  demandData,
  complianceFlags,
  dates,
  viewMode,
  showDemandOverlay,
  showAnalyticsCharts = false,
  lowDemandDays = new Set(),
  demandAnalytics = [],
  staffAbsences = [],
  onDropStaff,
  onShiftEdit,
  onShiftDelete,
  onShiftCopy,
  onShiftSwap,
  onOpenShiftFill,
  onAddShift,
  onUnassignStaff,
  onOpenShiftTemplateManager,
}: TimelineGridProps) {
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const isCompact = viewMode === 'fortnight' || viewMode === 'month';
  const isMobile = useIsMobile();

  const getShiftsForCell = (roomId: string, date: string) => {
    return shifts.filter(s => s.roomId === roomId && s.date === date);
  };

  const getOpenShiftsForCell = (roomId: string, date: string) => {
    return openShifts.filter(os => os.roomId === roomId && os.date === date);
  };

  const getFlagsForCell = (roomId: string, date: string) => {
    return complianceFlags.filter(f => 
      f.roomId === roomId && 
      f.date === date && 
      f.centreId === centre.id
    );
  };

  const getDemandForCell = (roomId: string, date: string) => {
    return demandData.filter(d => 
      d.roomId === roomId && 
      d.date === date && 
      d.centreId === centre.id
    );
  };

  const calculateRoomMetrics = (roomId: string, date: string, room: Room) => {
    const cellShifts = getShiftsForCell(roomId, date);
    const cellDemand = getDemandForCell(roomId, date);
    
    const staffCount = new Set(cellShifts.map(s => s.staffId)).size;
    const peakChildren = cellDemand.reduce((max, d) => Math.max(max, d.bookedChildren), 0);
    const requiredStaff = Math.ceil(peakChildren / room.requiredRatio);
    const avgUtilization = cellDemand.length > 0 
      ? Math.round(cellDemand.reduce((sum, d) => sum + d.utilisationPercent, 0) / cellDemand.length)
      : 0;

    return { staffCount, requiredStaff, peakChildren, avgUtilization };
  };

  const handleDragOver = (e: React.DragEvent, roomId: string, date: string) => {
    e.preventDefault();
    setDragOverCell(`${roomId}-${date}`);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, roomId: string, date: string) => {
    e.preventDefault();
    setDragOverCell(null);
    
    const staffId = e.dataTransfer.getData('staffId');
    if (staffId) {
      onDropStaff(staffId, roomId, date);
    }
  };

  const handleShiftDragStart = (e: React.DragEvent, shift: Shift) => {
    e.dataTransfer.setData('staffId', shift.staffId);
    e.dataTransfer.setData('shiftId', shift.id);
    e.dataTransfer.setData('dragType', 'shift');
  };

  return (
      <div className="flex-1 overflow-hidden w-full max-w-full">
      <ScrollArea className="h-full w-full">
        {/* Horizontal scroll on small screens; on desktop always stretch to available width */}
        <div className={cn("min-w-full w-max xl:w-full")}>
          {/* Header row with dates */}
          <div className="flex sticky top-0 z-20 bg-background border-b border-border">
            <div className="w-20 md:w-28 lg:w-36 shrink-0 p-2 lg:p-3 font-medium text-xs lg:text-sm text-muted-foreground border-r border-border bg-muted/30 sticky left-0 z-30">
              Room
            </div>
            {dates.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isLowDemand = lowDemandDays.has(dateStr);
              const holidays = getHolidaysForDate(dateStr);
              const events = getEventsForDate(dateStr);
              const hasPublicHoliday = holidays.some(h => h.type === 'public_holiday');
              const hasSchoolHoliday = holidays.some(h => h.type === 'school_holiday');
              const hasEvents = events.length > 0;
              
              return (
                <div 
                  key={date.toISOString()} 
                  className={cn(
                    "w-[80px] md:w-[100px] xl:flex-1 xl:min-w-[160px] xl:w-auto shrink-0 xl:shrink p-1 md:p-2 text-center border-r border-border bg-muted/30",
                    isCompact && (
                      viewMode === 'month'
                        ? "w-[60px] md:w-[70px] xl:flex-1 xl:min-w-[44px] xl:w-auto"
                        : "w-[60px] md:w-[70px] xl:flex-1 xl:min-w-[80px] xl:w-auto"
                    ),
                    isLowDemand && "bg-muted/60",
                    hasPublicHoliday && "bg-destructive/10 border-b-2 border-b-destructive/50"
                  )}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className={cn(
                      "text-sm font-medium",
                      hasPublicHoliday ? "text-destructive" : "text-foreground"
                    )}>
                      {format(date, isCompact ? 'EEE' : 'EEEE')}
                    </span>

                    {/* In month view the header cells are narrow; collapse all indicators into a single marker */}
                    {viewMode === 'month' ? (
                      (hasPublicHoliday || hasSchoolHoliday || hasEvents || isLowDemand) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "relative ml-0.5 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-semibold",
                                  hasPublicHoliday
                                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                                    : hasEvents
                                      ? "border-primary/40 bg-primary/10 text-primary"
                                      : isLowDemand
                                        ? "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
                                        : "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
                                )}
                                aria-label="Day indicators"
                              >
                                {(() => {
                                  const count = (hasPublicHoliday ? 1 : 0) + (hasSchoolHoliday ? 1 : 0) + (hasEvents ? events.length : 0) + (isLowDemand ? 1 : 0);
                                  return count > 1 ? String(Math.min(count, 9)) : '•';
                                })()}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1.5">
                                {hasPublicHoliday && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-destructive">Public Holiday</p>
                                    {holidays.filter(h => h.type === 'public_holiday').map(h => (
                                      <p key={h.id} className="text-xs">{h.name}</p>
                                    ))}
                                  </div>
                                )}
                                {hasSchoolHoliday && !hasPublicHoliday && (
                                  <p className="text-xs">School Holidays</p>
                                )}
                                {hasEvents && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium">Events</p>
                                    {events.map(ev => (
                                      <div key={ev.id} className="flex items-center gap-1.5">
                                        <div
                                          className="h-2 w-2 rounded-full"
                                          style={{ backgroundColor: eventTypeConfig[ev.type].color }}
                                        />
                                        <span className="text-xs">{ev.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {isLowDemand && (
                                  <p className="text-xs text-muted-foreground">Low demand day</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    ) : (
                      <>
                        {/* Public Holiday Indicator */}
                        {hasPublicHoliday && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Flag className="h-3.5 w-3.5 text-destructive fill-destructive/20" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-destructive">Public Holiday</p>
                                  {holidays.filter(h => h.type === 'public_holiday').map(h => (
                                    <p key={h.id} className="text-xs">{h.name}</p>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* School Holiday Indicator */}
                        {hasSchoolHoliday && !hasPublicHoliday && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <GraduationCap className="h-3.5 w-3.5 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">School Holidays</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Event Indicator */}
                        {hasEvents && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="relative">
                                  <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                                  {events.length > 1 && (
                                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center font-medium">
                                      {events.length}
                                    </span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1.5">
                                  <p className="text-xs font-medium">Events</p>
                                  {events.map(ev => (
                                    <div key={ev.id} className="flex items-center gap-1.5">
                                      <div 
                                        className="h-2 w-2 rounded-full" 
                                        style={{ backgroundColor: eventTypeConfig[ev.type].color }}
                                      />
                                      <span className="text-xs">{ev.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {isLowDemand && !hasPublicHoliday && !hasEvents && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <EyeOff className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Low demand day - reduced staffing recommended</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </>
                    )}
                  </div>
                  <div className={cn(
                    "text-xs",
                    hasPublicHoliday ? "text-destructive/80" : "text-muted-foreground"
                  )}>
                    {format(date, isCompact ? 'MMM d' : 'MMMM d, yyyy')}
                  </div>
                  
                  {/* Holiday/Event name badges below date */}
                  {(hasPublicHoliday || hasEvents) && !isCompact && (
                    <div className="flex flex-wrap gap-1 justify-center mt-1">
                      {holidays.filter(h => h.type === 'public_holiday').slice(0, 1).map(h => (
                        <Badge 
                          key={h.id} 
                          variant="destructive" 
                          className="text-[9px] px-1.5 py-0 h-4"
                        >
                          {h.name.length > 15 ? h.name.slice(0, 12) + '...' : h.name}
                        </Badge>
                      ))}
                      {events.slice(0, 1).map(ev => (
                        <Badge 
                          key={ev.id} 
                          variant="outline" 
                          className="text-[9px] px-1.5 py-0 h-4 border-primary/50 text-primary"
                        >
                          {ev.name.length > 15 ? ev.name.slice(0, 12) + '...' : ev.name}
                        </Badge>
                      ))}
                      {(holidays.filter(h => h.type === 'public_holiday').length + events.length) > 2 && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                          +{holidays.filter(h => h.type === 'public_holiday').length + events.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Room rows */}
          {centre.rooms.map((room) => (
            <div key={room.id} className="flex border-b border-border">
              {/* Room label */}
              <div className="w-20 md:w-28 lg:w-36 shrink-0 p-1 md:p-2 border-r border-border bg-card sticky left-0 z-20">
                <div className="font-medium text-xs lg:text-sm text-foreground truncate">{room.name}</div>
                <div className="text-[10px] lg:text-xs text-muted-foreground hidden md:block">
                  {ageGroupLabels[room.ageGroup]}
                </div>
                <div className="hidden lg:flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>1:{room.requiredRatio}</span>
                  <span>•</span>
                  <span>Cap: {room.capacity}</span>
                </div>
              </div>

              {/* Day cells */}
              {dates.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const cellKey = `${room.id}-${dateStr}`;
                const cellShifts = getShiftsForCell(room.id, dateStr);
                const cellOpenShifts = getOpenShiftsForCell(room.id, dateStr);
                const cellFlags = getFlagsForCell(room.id, dateStr);
                const metrics = calculateRoomMetrics(room.id, dateStr, room);
                const isDragOver = dragOverCell === cellKey;
                const isLowDemand = lowDemandDays.has(dateStr);

                return (
                   <div
                     key={cellKey}
                     className={cn(
                       "w-[80px] md:w-[100px] xl:flex-1 xl:min-w-[160px] xl:w-auto shrink-0 xl:shrink p-1 md:p-2 border-r border-border relative",
                       "transition-colors duration-150",
                       isDragOver && "bg-primary/10",
                       isCompact && (
                         viewMode === 'month'
                           ? "w-[60px] md:w-[70px] xl:flex-1 xl:min-w-[44px] xl:w-auto p-1"
                           : "w-[60px] md:w-[70px] xl:flex-1 xl:min-w-[80px] xl:w-auto p-1"
                       ),
                       isLowDemand && "bg-muted/30"
                     )}
                     onDragOver={(e) => handleDragOver(e, room.id, dateStr)}
                     onDragLeave={handleDragLeave}
                     onDrop={(e) => handleDrop(e, room.id, dateStr)}
                   >
                    {/* Demand analytics chart (new) */}
                    {showAnalyticsCharts && demandAnalytics.length > 0 && (
                      <div className="mb-2">
                        <InlineDemandChart
                          analyticsData={demandAnalytics}
                          absences={staffAbsences}
                          date={dateStr}
                          roomId={room.id}
                          isCompact={isCompact}
                        />
                      </div>
                    )}

                    {/* Demand histogram overlay (legacy) */}
                    {showDemandOverlay && !showAnalyticsCharts && (
                      <div className="absolute top-1 right-1 left-1">
                        <DemandHistogram
                          demandData={demandData}
                          room={room}
                          date={dateStr}
                          isCompact={isCompact}
                        />
                      </div>
                    )}

                    {/* Compliance flags indicator */}
                    {cellFlags.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute top-1 left-1 z-10">
                              <Badge 
                                variant={cellFlags.some(f => f.severity === 'critical') ? 'destructive' : 'outline'}
                                className="text-[10px] px-1 py-0"
                              >
                                <AlertTriangle className="h-3 w-3 mr-0.5" />
                                {cellFlags.length}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              {cellFlags.map(flag => (
                                <div key={flag.id} className="text-xs">
                                  <span className={cn(
                                    flag.severity === 'critical' && "text-destructive",
                                    flag.severity === 'warning' && "text-amber-500"
                                  )}>
                                    {flag.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {/* Staffing indicator */}
                    {!isCompact && metrics.staffCount > 0 && (
                      <div className="absolute bottom-1 right-1 z-10">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[9px] px-1 py-0",
                            metrics.staffCount < metrics.requiredStaff && "border-amber-500 text-amber-500",
                            metrics.staffCount >= metrics.requiredStaff && "border-emerald-500 text-emerald-500"
                          )}
                        >
                          {metrics.staffCount}/{metrics.requiredStaff} staff
                        </Badge>
                      </div>
                    )}

                    {/* Shifts */}
                    <div className={cn(
                      "space-y-1.5",
                      showDemandOverlay && !isCompact && "mt-12",
                      showDemandOverlay && isCompact && "mt-6",
                      !showDemandOverlay && "mt-1",
                      isCompact && "space-y-1"
                    )}>
                      {cellShifts.map((shift) => (
                        isMobile ? (
                          <MobileShiftCard
                            key={shift.id}
                            shift={shift}
                            staff={staff.find(s => s.id === shift.staffId)}
                            allStaff={staff}
                            onEdit={onShiftEdit}
                            onDelete={onShiftDelete}
                            onCopy={onShiftCopy}
                            onSwap={onShiftSwap}
                          />
                        ) : (
                          <ShiftCard
                            key={shift.id}
                            shift={shift}
                            staff={staff.find(s => s.id === shift.staffId)}
                            allStaff={staff}
                            onEdit={onShiftEdit}
                            onDelete={onShiftDelete}
                            onCopy={onShiftCopy}
                            onSwap={onShiftSwap}
                            onDragStart={handleShiftDragStart}
                            isCompact={isCompact}
                          />
                        )
                      ))}

                      {cellOpenShifts.map((openShift) => (
                        <OpenShiftCard
                          key={openShift.id}
                          openShift={openShift}
                          onAssign={onOpenShiftFill}
                          isCompact={isCompact}
                          onDrop={(e, os) => {
                            const staffId = e.dataTransfer.getData('staffId');
                            if (staffId) {
                              onDropStaff(staffId, os.roomId, os.date);
                            }
                          }}
                        />
                      ))}
                    </div>

                    {/* Add shift button */}
                    {!isCompact && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full mt-2 h-6 text-xs text-muted-foreground hover:text-foreground",
                              "border border-dashed border-muted-foreground/30 hover:border-primary/50",
                              "opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                            )}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                            <ChevronDown className="h-2.5 w-2.5 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {/* Quick Shift Types */}
                          <DropdownMenuItem 
                            onClick={() => onAddShift(room.id, dateStr, { id: 'morning', name: 'Morning', startTime: '06:30', endTime: '14:30', breakMinutes: 30, color: 'hsl(200, 70%, 50%)' })}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(200, 70%, 50%)' }} />
                              <span>Morning</span>
                              <span className="text-muted-foreground text-[10px]">06:30-14:30</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onAddShift(room.id, dateStr, { id: 'afternoon', name: 'Afternoon', startTime: '12:00', endTime: '18:30', breakMinutes: 30, color: 'hsl(280, 60%, 50%)' })}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(280, 60%, 50%)' }} />
                              <span>Afternoon</span>
                              <span className="text-muted-foreground text-[10px]">12:00-18:30</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onAddShift(room.id, dateStr, { id: 'fullday', name: 'Full Day', startTime: '07:00', endTime: '18:00', breakMinutes: 60, color: 'hsl(340, 65%, 50%)' })}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(340, 65%, 50%)' }} />
                              <span>Full Day</span>
                              <span className="text-muted-foreground text-[10px]">07:00-18:00</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onAddShift(room.id, dateStr)}>
                            Custom Shift
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onOpenShiftTemplateManager?.()}>
                            <div className="flex items-center gap-2">
                              <Settings className="h-3 w-3" />
                              <span>Create Shift Type...</span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
