import { useState, useMemo } from 'react';
import { Shift, OpenShift, Centre, StaffMember, DemandData, RosterComplianceFlag, ageGroupLabels, qualificationLabels, roleLabels, ShiftTemplate, timeOffTypeLabels, defaultShiftTemplates } from '@/types/roster';
import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { InlineDemandChart } from './InlineDemandChart';
import {
  Plus,
  Clock,
  GripVertical,
  User,
  AlertCircle,
  DollarSign,
  Palmtree,
  ChevronDown,
  Search,
  Coffee,
  Settings,
  MoreHorizontal,
  Copy,
  ArrowLeftRight,
  Pencil,
  Trash2,
  Flag,
  GraduationCap,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { 
  getHolidaysForDate, 
  getEventsForDate, 
  eventTypeConfig 
} from '@/data/mockHolidaysEvents';

interface StaffTimelineGridProps {
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
  demandAnalytics?: DemandAnalyticsData[];
  staffAbsences?: StaffAbsence[];
  shiftTemplates: ShiftTemplate[];

  /** Creates a shift by dropping staff onto a specific day cell */
  onDropStaff: (staffId: string, roomId: string, date: string) => void;

  /** Assigns staff into a room section (no shift created) */
  staffRoomAssignments?: Record<string, string>; // staffId -> roomId
  onAssignStaffToRoom?: (staffId: string, roomId: string) => void;

  onShiftEdit: (shift: Shift) => void;
  onShiftDelete: (shiftId: string) => void;
  onShiftCopy?: (shift: Shift) => void;
  onShiftSwap?: (shift: Shift) => void;
  onOpenShiftFill: (openShift: OpenShift) => void;
  onAddShift: (staffId: string, date: string, roomId: string, template?: ShiftTemplate) => void;
  onDragStart: (e: React.DragEvent, staff: StaffMember) => void;
  onOpenShiftDrop: (staffId: string, openShift: OpenShift) => void;
  onShiftMove?: (shiftId: string, newDate: string, newRoomId: string) => void;
  onShiftReassign?: (shiftId: string, newStaffId: string, newDate: string, newRoomId: string) => void;
  onStaffClick?: (staff: StaffMember) => void;
  onOpenShiftTemplateManager?: () => void;
}

export function StaffTimelineGrid({
  centre,
  shifts,
  openShifts,
  staff,
  dates,
  viewMode,
  showAnalyticsCharts = false,
  demandAnalytics = [],
  staffAbsences = [],
  shiftTemplates,
  onDropStaff,
  staffRoomAssignments = {},
  onAssignStaffToRoom,
  onShiftEdit,
  onShiftDelete,
  onShiftCopy,
  onShiftSwap,
  onAddShift,
  onDragStart,
  onOpenShiftDrop,
  onShiftMove,
  onShiftReassign,
  onStaffClick,
  onOpenShiftTemplateManager,
}: StaffTimelineGridProps) {
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'staff' | 'shift' | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const isCompact = viewMode === 'fortnight' || viewMode === 'month';

  // Filter staff by search
  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return staff;
    const search = staffSearch.toLowerCase();
    return staff.filter(s => 
      s.name.toLowerCase().includes(search) ||
      s.role.toLowerCase().includes(search)
    );
  }, [staff, staffSearch]);

  // Group shifts + explicit room assignments by room
  const staffByRoom = useMemo(() => {
    const roomStaff: Record<string, Set<string>> = {};
    centre.rooms.forEach(room => {
      roomStaff[room.id] = new Set();
    });

    // 1) staff with shifts
    shifts.forEach(shift => {
      if (shift.centreId === centre.id && roomStaff[shift.roomId]) {
        roomStaff[shift.roomId].add(shift.staffId);
      }
    });

    // 2) staff explicitly assigned to a room (even with no shifts)
    Object.entries(staffRoomAssignments).forEach(([staffId, roomId]) => {
      if (roomStaff[roomId]) roomStaff[roomId].add(staffId);
    });

    return roomStaff;
  }, [shifts, centre, staffRoomAssignments]);

  const openShiftsByRoomDate = useMemo(() => {
    const grouped: Record<string, OpenShift[]> = {};
    openShifts.forEach(os => {
      if (!grouped[os.roomId]) grouped[os.roomId] = [];
      grouped[os.roomId].push(os);
    });
    return grouped;
  }, [openShifts]);

  const getShiftsForStaffDay = (staffId: string, date: string, roomId: string) => {
    return shifts.filter(s => 
      s.staffId === staffId && s.date === date && s.centreId === centre.id && s.roomId === roomId
    );
  };

  const getOpenShiftForDay = (roomId: string, date: string) => {
    return openShifts.find(os => os.roomId === roomId && os.date === date);
  };

  const isStaffOnTimeOff = (member: StaffMember, date: string) => {
    if (!member.timeOff) return null;
    const dateObj = parseISO(date);
    return member.timeOff.find(to => 
      to.status === 'approved' &&
      isWithinInterval(dateObj, { start: parseISO(to.startDate), end: parseISO(to.endDate) })
    );
  };

  // Calculate costs for a staff member
  const calculateStaffCosts = (staffId: string) => {
    const memberShifts = shifts.filter(s => s.staffId === staffId && s.centreId === centre.id);
    const member = staff.find(s => s.id === staffId);
    if (!member) return { regularCost: 0, overtimeCost: 0, totalCost: 0, totalHours: 0 };

    let totalHours = 0;
    memberShifts.forEach(shift => {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      totalHours += ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
    });

    const regularHours = Math.min(totalHours, member.maxHoursPerWeek);
    const overtimeHours = Math.max(0, totalHours - member.maxHoursPerWeek);
    const regularCost = regularHours * member.hourlyRate;
    const overtimeCost = overtimeHours * member.overtimeRate;

    return {
      regularCost: Math.round(regularCost * 100) / 100,
      overtimeCost: Math.round(overtimeCost * 100) / 100,
      totalCost: Math.round((regularCost + overtimeCost) * 100) / 100,
      totalHours: Math.round(totalHours * 10) / 10,
    };
  };

  const handleDragOver = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    setDragOverCell(cellId);

    // Some browsers don't expose custom setData keys in dataTransfer.types,
    // so we detect by reading the actual payloads.
    const shiftId = e.dataTransfer.getData('shiftId');
    const explicit = (e.dataTransfer.getData('dragType') as 'staff' | 'shift' | '') || '';
    const detectedType: 'staff' | 'shift' = explicit === 'shift' || !!shiftId ? 'shift' : 'staff';

    if (!isDragging) setIsDragging(true);
    if (dragType !== detectedType) setDragType(detectedType);
  };

  const handleDragLeave = (e: React.DragEvent) => { 
    // Only clear if leaving the grid entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest('[data-drop-zone]')) {
      setDragOverCell(null);
    }
  };

  const handleDragEnd = () => {
    setDragOverCell(null);
    setIsDragging(false);
    setDragType(null);
  };

  const handleDrop = (e: React.DragEvent, targetStaffId: string, date: string, roomId: string) => {
    e.preventDefault();
    setDragOverCell(null);
    setIsDragging(false);
    setDragType(null);
    
    // Check if this is a shift being moved
    const shiftId = e.dataTransfer.getData('shiftId');
    const draggedStaffId = e.dataTransfer.getData('staffId');
    
    if (shiftId) {
      // If dropping on a different staff member, reassign the shift
      if (draggedStaffId !== targetStaffId && onShiftReassign) {
        onShiftReassign(shiftId, targetStaffId, date, roomId);
        return;
      }
      // Same staff, just moving date/room
      if (onShiftMove) {
        onShiftMove(shiftId, date, roomId);
        return;
      }
    }
    
    // Otherwise, creating a new shift for this staff
    onDropStaff(targetStaffId, roomId, date);
  };

  const handleOpenShiftDrop = (e: React.DragEvent, openShift: OpenShift) => {
    e.preventDefault();
    setDragOverCell(null);
    setIsDragging(false);
    setDragType(null);
    const staffId = e.dataTransfer.getData('staffId');
    if (staffId) onOpenShiftDrop(staffId, openShift);
  };

  const handleShiftDragStart = (e: React.DragEvent, shift: Shift) => {
    e.dataTransfer.setData('staffId', shift.staffId);
    e.dataTransfer.setData('shiftId', shift.id);
    e.dataTransfer.setData('dragType', 'shift');
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    setDragType('shift');
  };

  const handleStaffDragStart = (e: React.DragEvent, member: StaffMember) => {
    onDragStart(e, member);
    setIsDragging(true);
    setDragType('staff');
  };

  const handleGridDragEnter = (e: React.DragEvent) => {
    // When dragging from outside the grid (e.g. left StaffPanel), we won't have set local state yet.
    // As soon as the cursor enters the grid, mark the drag as active and infer what is being dragged.
    e.preventDefault();

    const types = Array.from(e.dataTransfer.types || []).map(t => t.toLowerCase());
    const hasShiftId = types.includes('shiftid') || !!e.dataTransfer.getData('shiftId');
    const explicit = (e.dataTransfer.getData('dragType') as 'staff' | 'shift' | '') || '';
    const detectedType: 'staff' | 'shift' = explicit === 'shift' || hasShiftId ? 'shift' : 'staff';

    if (!isDragging) setIsDragging(true);
    if (dragType !== detectedType) setDragType(detectedType);
  };

  return (
    <div
      className="flex-1 overflow-hidden bg-background"
      onDragEnd={handleDragEnd}
      onDragEnter={handleGridDragEnter}
    >
      <ScrollArea className="h-full">
        <div className="min-w-max">
          {/* Header */}
          <div className="flex sticky top-0 z-20 bg-card border-b border-border">
            <div className="w-64 shrink-0 p-2 font-medium text-sm text-muted-foreground border-r border-border bg-muted/50">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search staff..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="h-8 pl-7 pr-2 text-xs bg-background border-border"
                />
              </div>
            </div>
            {dates.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const holidays = getHolidaysForDate(dateStr);
              const events = getEventsForDate(dateStr);
              const hasPublicHoliday = holidays.some(h => h.type === 'public_holiday');
              const hasSchoolHoliday = holidays.some(h => h.type === 'school_holiday');
              const hasEvents = events.length > 0;

              return (
                <div 
                  key={date.toISOString()} 
                  className={cn(
                    "flex-1 p-2 text-center border-r border-border bg-muted/50",
                    viewMode === 'month' ? "min-w-[50px]" : isCompact ? "min-w-[80px]" : "min-w-[120px]",
                    hasPublicHoliday && "bg-destructive/10 border-b-2 border-b-destructive/50"
                  )}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className={cn(
                      "font-medium",
                      viewMode === 'month' ? "text-xs" : "text-sm",
                      hasPublicHoliday ? "text-destructive" : "text-foreground"
                    )}>
                      {format(date, viewMode === 'month' ? 'EEE' : 'EEE')}
                    </span>

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
                  </div>

                  <div className={cn(
                    "text-muted-foreground",
                    viewMode === 'month' ? "text-[10px]" : "text-xs",
                    hasPublicHoliday && "text-destructive/80"
                  )}>
                    {format(date, viewMode === 'month' ? 'd' : 'd MMM')}
                  </div>

                  {/* Holiday/Event badges below date - non-compact only */}
                  {!isCompact && (hasPublicHoliday || hasEvents) && (
                    <div className="flex flex-wrap gap-1 justify-center mt-1">
                      {holidays.filter(h => h.type === 'public_holiday').slice(0, 1).map(h => (
                        <Badge 
                          key={h.id} 
                          variant="destructive" 
                          className="text-[9px] px-1.5 py-0 h-4"
                        >
                          {h.name.length > 12 ? h.name.slice(0, 10) + '...' : h.name}
                        </Badge>
                      ))}
                      {events.slice(0, 1).map(ev => (
                        <Badge 
                          key={ev.id} 
                          variant="outline" 
                          className="text-[9px] px-1.5 py-0 h-4 border-primary/50 text-primary"
                        >
                          {ev.name.length > 12 ? ev.name.slice(0, 10) + '...' : ev.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="w-24 shrink-0 p-2 text-center font-medium text-sm text-muted-foreground bg-muted/50 border-r border-border">
              <div className="flex items-center justify-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Cost</span>
              </div>
            </div>
          </div>

          {/* Room sections */}
          {centre.rooms.map((room) => {
            const roomStaffIds = staffByRoom[room.id] || new Set();
            const roomStaff = filteredStaff.filter(s => roomStaffIds.has(s.id));
            const roomOpenShifts = openShiftsByRoomDate[room.id] || [];

            return (
              <div key={room.id}>
                {/* Room header */}
                <div className="flex bg-primary/10 border-b border-primary/20 sticky top-[52px] z-10">
                  <div
                    data-drop-zone
                    className="w-64 shrink-0 px-4 py-2 flex items-center gap-3 border-r border-primary/20"
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOver(e, `room-header-${room.id}`);
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      e.preventDefault();
                      const staffId = e.dataTransfer.getData('staffId');
                      const draggedType = e.dataTransfer.getData('dragType');
                      if (!staffId || draggedType === 'shift') return;

                      setDragOverCell(null);
                      setIsDragging(false);
                      setDragType(null);
                      onAssignStaffToRoom?.(staffId, room.id);
                    }}
                  >
                    <Badge variant="secondary" className="font-semibold">{room.name}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {ageGroupLabels[room.ageGroup]} • 1:{room.requiredRatio} • Cap: {room.capacity}
                    </span>
                  </div>
                  
                  {/* Analytics charts in header row when enabled */}
                  {showAnalyticsCharts && demandAnalytics.length > 0 && dates.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return (
                      <div 
                        key={dateStr} 
                        className={cn(
                          "flex-1 p-1 border-r border-primary/20",
                          viewMode === 'month' ? "min-w-[50px]" : isCompact ? "min-w-[80px]" : "min-w-[120px]"
                        )}
                      >
                        <InlineDemandChart
                          analyticsData={demandAnalytics}
                          absences={staffAbsences}
                          date={dateStr}
                          roomId={room.id}
                          isCompact={isCompact}
                        />
                      </div>
                    );
                  })}
                  
                  {showAnalyticsCharts && <div className="w-24 shrink-0 border-r border-primary/20" />}
                </div>

                {/* Staff rows */}
                {roomStaff.map((member) => {
                  const costs = calculateStaffCosts(member.id);
                  const topQualifications = member.qualifications.slice(0, 2);

                  return (
                    <div key={`${room.id}-${member.id}`} className="flex border-b border-border hover:bg-muted/20 transition-colors">
                      {/* Staff info cell */}
                      <div 
                        className={cn(
                          "w-64 shrink-0 p-2 border-r border-border bg-card flex items-start gap-2 cursor-grab group transition-opacity duration-200",
                          isDragging && "opacity-60"
                        )}
                        draggable
                        onDragStart={(e) => handleStaffDragStart(e, member)}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-1" />
                        <div 
                          className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all"
                          style={{ backgroundColor: member.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStaffClick?.(member);
                          }}
                        >
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p 
                            className="text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary hover:underline transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStaffClick?.(member);
                            }}
                          >
                            {member.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{roleLabels[member.role]}</p>
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {topQualifications.map((q, idx) => (
                              <TooltipProvider key={idx}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant={q.isExpired ? 'destructive' : q.isExpiringSoon ? 'outline' : 'secondary'}
                                      className={cn("text-[8px] px-1 py-0 h-3.5", q.isExpiringSoon && "border-amber-500 text-amber-600")}
                                    >
                                      {qualificationLabels[q.type].slice(0, 8)}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{qualificationLabels[q.type]}</p>
                                    {q.expiryDate && <p className="text-xs text-muted-foreground">Expires: {q.expiryDate}</p>}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                            {member.qualifications.length > 2 && (
                              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">+{member.qualifications.length - 2}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Day cells */}
                      {dates.map((date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const cellKey = `${member.id}-${room.id}-${dateStr}`;
                        const cellShifts = getShiftsForStaffDay(member.id, dateStr, room.id);
                        const isDragOver = dragOverCell === cellKey;
                        const timeOff = isStaffOnTimeOff(member, dateStr);

                        return (
                          <div
                            key={cellKey}
                            data-drop-zone
                            className={cn(
                              "flex-1 p-1 border-r border-border relative group/cell",
                              "transition-all duration-200 ease-out",
                              viewMode === 'month' ? "min-w-[50px]" : isCompact ? "min-w-[80px]" : "min-w-[120px]",
                              timeOff && "bg-amber-500/10",
                              // Drop zone highlight states
                              isDragging && !timeOff && "bg-primary/5",
                              isDragOver && !timeOff && "bg-primary/20 ring-2 ring-inset ring-primary/50 scale-[1.02]",
                              // Pulsing effect for valid drop targets during drag
                              isDragging && !timeOff && !isDragOver && "animate-pulse"
                            )}
                            onDragOver={(e) => !timeOff && handleDragOver(e, cellKey)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => !timeOff && handleDrop(e, member.id, dateStr, room.id)}
                          >
                            {/* Drop zone indicator overlay */}
                            {isDragging && !timeOff && !isDragOver && (
                              <div className="absolute inset-1 border-2 border-dashed border-primary/30 rounded-md pointer-events-none flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Plus className="h-3 w-3 text-primary/50" />
                                </div>
                              </div>
                            )}
                            
                            {/* Active drop indicator */}
                            {isDragOver && !timeOff && (
                              <div className="absolute inset-0 border-2 border-primary rounded-md pointer-events-none animate-scale-in">
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                  <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium shadow-lg">
                                    Drop here
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Time off indicator */}
                            {timeOff && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex items-center gap-1 text-amber-600 bg-amber-500/20 px-2 py-1 rounded text-[10px]">
                                  <Palmtree className="h-3 w-3" />
                                  <span>{timeOffTypeLabels[timeOff.type].split(' ')[0]}</span>
                                </div>
                              </div>
                            )}

                            {!timeOff && (
                              <>
                                <div className="space-y-1">
                                {cellShifts.map((shift) => (
                                    <StaffShiftCard
                                      key={shift.id}
                                      shift={shift}
                                      staff={member}
                                      onEdit={() => onShiftEdit(shift)}
                                      onDelete={() => onShiftDelete(shift.id)}
                                      onCopy={onShiftCopy ? () => onShiftCopy(shift) : undefined}
                                      onSwap={onShiftSwap ? () => onShiftSwap(shift) : undefined}
                                      onDragStart={handleShiftDragStart}
                                      isCompact={isCompact}
                                    />
                                  ))}
                                </div>

                                {cellShifts.length === 0 && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                          "w-full h-8 text-xs text-muted-foreground/30 hover:text-muted-foreground",
                                          "border border-dashed border-transparent hover:border-muted-foreground/30",
                                          "opacity-0 hover:opacity-100 transition-opacity"
                                        )}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        <ChevronDown className="h-2.5 w-2.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      {/* Quick Shift Types */}
                                      <DropdownMenuItem 
                                        onClick={() => onAddShift(member.id, dateStr, room.id, { id: 'morning', name: 'Morning', startTime: '06:30', endTime: '14:30', breakMinutes: 30, color: 'hsl(200, 70%, 50%)' })}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(200, 70%, 50%)' }} />
                                          <span>Morning</span>
                                          <span className="text-muted-foreground text-[10px]">06:30-14:30</span>
                                        </div>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => onAddShift(member.id, dateStr, room.id, { id: 'afternoon', name: 'Afternoon', startTime: '12:00', endTime: '18:30', breakMinutes: 30, color: 'hsl(280, 60%, 50%)' })}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(280, 60%, 50%)' }} />
                                          <span>Afternoon</span>
                                          <span className="text-muted-foreground text-[10px]">12:00-18:30</span>
                                        </div>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => onAddShift(member.id, dateStr, room.id, { id: 'fullday', name: 'Full Day', startTime: '07:00', endTime: '18:00', breakMinutes: 60, color: 'hsl(340, 65%, 50%)' })}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'hsl(340, 65%, 50%)' }} />
                                          <span>Full Day</span>
                                          <span className="text-muted-foreground text-[10px]">07:00-18:00</span>
                                        </div>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => onAddShift(member.id, dateStr, room.id)}>
                                        Custom Shift
                                      </DropdownMenuItem>
                                      {shiftTemplates.length > 0 && (
                                        <>
                                          <DropdownMenuSeparator />
                                          {shiftTemplates.map(template => (
                                            <DropdownMenuItem 
                                              key={template.id}
                                              onClick={() => onAddShift(member.id, dateStr, room.id, template)}
                                            >
                                              <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: template.color }} />
                                                <span>{template.name}</span>
                                                <span className="text-muted-foreground text-[10px]">
                                                  {template.startTime}-{template.endTime}
                                                </span>
                                              </div>
                                            </DropdownMenuItem>
                                          ))}
                                        </>
                                      )}
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
                              </>
                            )}
                          </div>
                        );
                      })}

                      {/* Cost cell */}
                      <div className="w-24 shrink-0 p-1.5 border-r border-border bg-card">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-center">
                                <div className={cn(
                                  "text-sm font-semibold",
                                  costs.overtimeCost > 0 && "text-amber-600",
                                  costs.totalCost === 0 && "text-muted-foreground"
                                )}>
                                  ${costs.totalCost}
                                </div>
                                <div className="text-[10px] text-muted-foreground">{costs.totalHours}h</div>
                                {costs.overtimeCost > 0 && (
                                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-amber-500 text-amber-600 mt-0.5">
                                    +${costs.overtimeCost} OT
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">Regular:</span>
                                  <span>${costs.regularCost}</span>
                                </div>
                                {costs.overtimeCost > 0 && (
                                  <div className="flex justify-between gap-4 text-amber-600">
                                    <span>Overtime:</span>
                                    <span>${costs.overtimeCost}</span>
                                  </div>
                                )}
                                <div className="flex justify-between gap-4 font-medium border-t border-border pt-1">
                                  <span>Total:</span>
                                  <span>${costs.totalCost}</span>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  );
                })}

                {/* Open Shifts row */}
                {roomOpenShifts.length > 0 && (
                  <div className="flex border-b border-border bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                    <div className="w-64 shrink-0 p-2 border-r border-border flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center bg-amber-500/20 border-2 border-dashed border-amber-500/50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-700">Open Shift</p>
                        <p className="text-[10px] text-amber-600">Drag staff to assign</p>
                      </div>
                    </div>

                    {dates.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const openShift = getOpenShiftForDay(room.id, dateStr);
                      const cellKey = `open-${room.id}-${dateStr}`;
                      const isDragOver = dragOverCell === cellKey;

                      return (
                        <div
                          key={cellKey}
                          data-drop-zone
                          className={cn(
                            "flex-1 min-w-[120px] p-1 border-r border-border relative",
                            "transition-all duration-200 ease-out",
                            isCompact && "min-w-[80px]",
                            // Drop zone highlight states for open shifts
                            isDragging && openShift && "bg-green-500/5",
                            isDragOver && openShift && "bg-green-500/20 ring-2 ring-inset ring-green-500/50 scale-[1.02]"
                          )}
                          onDragOver={(e) => openShift && handleDragOver(e, cellKey)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => openShift && handleOpenShiftDrop(e, openShift)}
                        >
                          {/* Drop overlay for filling open shift */}
                          {isDragging && openShift && !isDragOver && (
                            <div className="absolute inset-1 border-2 border-dashed border-green-500/40 rounded-md pointer-events-none" />
                          )}
                          {isDragOver && openShift && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                              <div className="bg-green-600 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg animate-scale-in">
                                Fill shift
                              </div>
                            </div>
                          )}
                          {openShift && <OpenShiftCard openShift={openShift} isCompact={isCompact} isDragOver={isDragOver} />}
                        </div>
                      );
                    })}

                    <div className="w-24 shrink-0 border-r border-border" />
                  </div>
                )}

                {/* Drop zone row for adding new staff to this room - ALWAYS visible */}
                <div 
                  className={cn(
                    "flex border-b border-border transition-colors",
                    isDragging && dragType === 'staff' 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <div 
                    data-drop-zone
                    className={cn(
                      "w-64 shrink-0 p-2 border-r flex items-center gap-2 transition-colors",
                      isDragging && dragType === 'staff' 
                        ? "border-primary/30 bg-primary/5" 
                        : "border-border"
                    )}
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOver(e, `assign-staff-${room.id}`);
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      e.preventDefault();
                      const staffId = e.dataTransfer.getData('staffId');
                      const draggedType = e.dataTransfer.getData('dragType');
                      if (!staffId || draggedType === 'shift') return;

                      setDragOverCell(null);
                      setIsDragging(false);
                      setDragType(null);
                      onAssignStaffToRoom?.(staffId, room.id);
                    }}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center border-2 border-dashed transition-colors",
                      isDragging && dragType === 'staff'
                        ? "bg-primary/20 border-primary/50"
                        : "bg-primary/10 border-primary/30"
                    )}>
                      <User className={cn(
                        "h-4 w-4 transition-colors",
                        isDragging && dragType === 'staff' ? "text-primary" : "text-primary/50"
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm font-medium transition-colors",
                        isDragging && dragType === 'staff' ? "text-primary" : "text-muted-foreground"
                      )}>
                        {isDragging && dragType === 'staff' ? "Drop staff here" : "Drop to Add Staff"}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70">
                        {isDragging && dragType === 'staff' 
                          ? `Assign to ${room.name}` 
                          : `Drag staff here to assign to ${room.name}`}
                      </p>
                    </div>
                  </div>

                  {dates.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const cellKey = `add-staff-${room.id}-${dateStr}`;
                    const isDragOver = dragOverCell === cellKey;
                    // Show drop zone when dragging staff (not shifts)
                    const showDropZone = isDragging && dragType === 'staff';

                    return (
                      <div
                        key={cellKey}
                        data-drop-zone
                        className={cn(
                          "flex-1 p-1 border-r relative",
                          "transition-all duration-200 ease-out",
                          viewMode === 'month' ? "min-w-[50px]" : isCompact ? "min-w-[80px]" : "min-w-[120px]",
                          showDropZone && !isDragOver && "border-primary/20 bg-primary/5",
                          isDragOver && "bg-primary/20 ring-2 ring-inset ring-primary/50 scale-[1.02]",
                          !showDropZone && "border-border"
                        )}
                        onDragOver={(e) => {
                          e.preventDefault();
                          // Accept any drag - we'll filter on drop
                          handleDragOver(e, cellKey);
                        }}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => {
                          e.preventDefault();
                          const staffId = e.dataTransfer.getData('staffId');
                          const draggedType = e.dataTransfer.getData('dragType');
                          // Only handle staff drops (assign to room), not shift moves
                          if (staffId && draggedType !== 'shift') {
                            setDragOverCell(null);
                            setIsDragging(false);
                            setDragType(null);
                            onAssignStaffToRoom?.(staffId, room.id);
                          }
                        }}
                      >
                        {/* Drop zone indicator - show when dragging staff */}
                        {showDropZone && !isDragOver && (
                          <div className="absolute inset-1 border-2 border-dashed border-primary/40 rounded-md pointer-events-none flex items-center justify-center bg-primary/5">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                              <Plus className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                        )}
                        
                        {/* Active drop indicator */}
                        {isDragOver && (
                          <div className="absolute inset-0 border-2 border-primary rounded-md pointer-events-none animate-scale-in">
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium shadow-lg">
                                Add staff
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="w-24 shrink-0 border-r border-border" />
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function StaffShiftCard({ shift, staff, onEdit, onDelete, onCopy, onSwap, onDragStart, isCompact = false }: {
  shift: Shift;
  staff?: StaffMember;
  onEdit: () => void;
  onDelete: () => void;
  onCopy?: () => void;
  onSwap?: () => void;
  onDragStart: (e: React.DragEvent, shift: Shift) => void;
  isCompact?: boolean;
}) {
  // Material-style soft color palettes
  const statusStyles = {
    draft: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      accent: 'bg-amber-400',
    },
    published: {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      border: 'border-sky-200 dark:border-sky-800',
      text: 'text-sky-800 dark:text-sky-200',
      accent: 'bg-sky-500',
    },
    confirmed: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-200',
      accent: 'bg-emerald-500',
    },
    completed: {
      bg: 'bg-slate-50 dark:bg-slate-900/40',
      border: 'border-slate-200 dark:border-slate-700',
      text: 'text-slate-600 dark:text-slate-300',
      accent: 'bg-slate-400',
    },
  };

  const style = statusStyles[shift.status];

  // Calculate duration
  const [sh, sm] = shift.startTime.split(':').map(Number);
  const [eh, em] = shift.endTime.split(':').map(Number);
  const duration = ((eh * 60 + em) - (sh * 60 + sm) - shift.breakMinutes) / 60;

  const tooltipContent = (
    <div className="p-3 min-w-[200px]">
      {/* Header with staff info */}
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/20">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
          style={{ backgroundColor: staff?.color || 'hsl(var(--muted-foreground))' }}
        >
          {staff?.name ? staff.name.split(' ').map(n => n[0]).join('') : '?'}
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{staff?.name || 'Unassigned'}</p>
          <p className="text-xs text-white/70">{staff?.role ? roleLabels[staff.role] : 'No role'}</p>
        </div>
      </div>

      {/* Time details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-white/90">
          <Clock className="h-4 w-4 text-white/60" />
          <span className="text-sm font-medium">{shift.startTime} - {shift.endTime}</span>
          <span className="text-xs text-white/60 ml-auto">{duration.toFixed(1)}h</span>
        </div>

        {shift.breakMinutes > 0 && (
          <div className="flex items-center gap-2 text-white/90">
            <Coffee className="h-4 w-4 text-white/60" />
            <span className="text-sm">{shift.breakMinutes} min break</span>
          </div>
        )}
      </div>

      {/* Status badge */}
      <div className="mt-3 pt-2 border-t border-white/20">
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
          shift.status === 'draft' && "bg-amber-500/20 text-amber-200",
          shift.status === 'published' && "bg-blue-500/20 text-blue-200",
          shift.status === 'confirmed' && "bg-green-500/20 text-green-200",
          shift.status === 'completed' && "bg-gray-500/20 text-gray-200",
        )}>
          {shift.status === 'draft' && 'Draft - Not Published'}
          {shift.status === 'published' && 'Published'}
          {shift.status === 'confirmed' && 'Confirmed by Staff'}
          {shift.status === 'completed' && 'Completed'}
        </span>
      </div>
    </div>
  );

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, shift)}
      className={cn(
        "group relative rounded-lg border overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5 active:cursor-grabbing",
        style.bg,
        style.border,
        shift.status === 'draft' && "border-dashed"
      )}
    >
      {/* Left accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.accent)} />

      {/* Three-dot actions */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Shift
            </DropdownMenuItem>
            {onCopy && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCopy(); }}>
                <Copy className="h-4 w-4 mr-2" />
                Copy to Dates...
              </DropdownMenuItem>
            )}
            {onSwap && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSwap(); }}>
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Swap Staff
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Shift
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="pl-3 pr-8 py-1.5" onClick={onEdit}>
        <div className={cn("text-xs font-semibold", style.text)}>
          {shift.startTime}-{shift.endTime}
        </div>
        {!isCompact && (
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-2.5 w-2.5" />
            <span>{shift.breakMinutes}m break</span>
          </div>
        )}
      </div>
    </div>
  );
}

function OpenShiftCard({ openShift, isCompact, isDragOver }: { openShift: OpenShift; isCompact?: boolean; isDragOver?: boolean; }) {
  const urgencyStyles = {
    low: {
      bg: 'bg-slate-50 dark:bg-slate-900/50',
      border: 'border-slate-300 dark:border-slate-700',
      accent: 'bg-slate-400',
    },
    medium: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-300 dark:border-amber-800',
      accent: 'bg-amber-500',
    },
    high: {
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      border: 'border-orange-300 dark:border-orange-800',
      accent: 'bg-orange-500',
    },
    critical: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-300 dark:border-red-800',
      accent: 'bg-red-500',
    },
  };

  const style = urgencyStyles[openShift.urgency];

  return (
    <div className={cn(
      "relative rounded-lg border-2 border-dashed overflow-hidden transition-all duration-200",
      style.bg,
      style.border,
      isDragOver && "border-primary bg-primary/10 scale-[1.02]",
      openShift.urgency === 'critical' && "animate-pulse"
    )}>
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.accent)} />
      <div className="pl-3 pr-2 py-1.5">
        <div className="text-xs font-semibold text-foreground">{openShift.startTime}-{openShift.endTime}</div>
        {!isCompact && (
          <>
            <div className="flex flex-wrap gap-0.5 mt-1">
              {openShift.requiredQualifications.slice(0, 2).map((qual) => (
                <Badge key={qual} variant="outline" className="text-[8px] px-1 py-0 h-3.5">{qualificationLabels[qual].slice(0, 6)}</Badge>
              ))}
            </div>
            <Badge variant={openShift.urgency === 'critical' ? 'destructive' : 'outline'} className="text-[8px] mt-1 capitalize">{openShift.urgency}</Badge>
          </>
        )}
      </div>
    </div>
  );
}
