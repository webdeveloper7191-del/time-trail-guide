import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Shift, OpenShift, Centre, StaffMember, qualificationLabels, roleLabels, ShiftTemplate } from '@/types/roster';
import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip as MuiTooltip } from '@mui/material';
import { Input } from '@/components/ui/input';
import { StaffingInsightsBar } from './StaffingInsightsBar';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { 
  Plus, 
  Clock,
  GripVertical,
  Search,
  Coffee,
  AlertCircle,
  UserX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { shiftStatusColors, openShiftColors } from '@/lib/rosterColors';

interface DayTimelineViewProps {
  centre: Centre;
  shifts: Shift[];
  openShifts: OpenShift[];
  staff: StaffMember[];
  date: Date;
  shiftTemplates: ShiftTemplate[];
  showAnalyticsCharts?: boolean;
  demandAnalytics?: DemandAnalyticsData[];
  staffAbsences?: StaffAbsence[];
  onShiftEdit: (shift: Shift) => void;
  onShiftDelete: (shiftId: string) => void;
  onShiftResize?: (shiftId: string, newStartTime: string, newEndTime: string) => void;
  onAddShift: (staffId: string, date: string, roomId: string, template?: ShiftTemplate) => void;
  onAddShiftAtTime?: (staffId: string, date: string, roomId: string, startTime: string) => void;
  onDragStart: (e: React.DragEvent, staff: StaffMember) => void;
  onDropStaff: (staffId: string, roomId: string, date: string) => void;
  onStaffClick?: (staff: StaffMember) => void;
  onOpenShiftTemplateManager?: () => void;
}

// Generate time slots from 5:00 AM to 9:00 PM with 15-minute intervals
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 5; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();
const SLOT_WIDTH = 30; // pixels per 15-minute slot
const HOUR_WIDTH = SLOT_WIDTH * 4; // 120px per hour

// Convert pixel position to time string (must be after SLOT_WIDTH is defined)
const pixelsToTime = (pixels: number) => {
  const totalMinutes = Math.floor(pixels / SLOT_WIDTH) * 15;
  const hours = Math.floor(totalMinutes / 60) + 5; // Start at 5 AM
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Snap pixel position to nearest 15-minute grid boundary
const snapToGrid = (pixels: number) => {
  return Math.round(pixels / SLOT_WIDTH) * SLOT_WIDTH;
};

// Convert pixel position to snapped time string
const pixelsToSnappedTime = (pixels: number) => {
  return pixelsToTime(snapToGrid(pixels));
};

// Convert time string to slot index
const timeToSlotIndex = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const startHour = 5; // Start at 5 AM
  return (hours - startHour) * 4 + Math.floor(minutes / 15);
};

// Convert time to pixel position
const timeToPixels = (time: string) => {
  return timeToSlotIndex(time) * SLOT_WIDTH;
};

// Convert current time to pixel position (more precise, includes seconds)
const currentTimeToPixels = (now: Date) => {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const startHour = 5;
  
  // If outside timeline range, return null
  if (hours < startHour || hours > 21) return null;
  
  const totalMinutes = (hours - startHour) * 60 + minutes;
  return (totalMinutes / 15) * SLOT_WIDTH;
};

// Calculate shift width in pixels
const getShiftWidth = (startTime: string, endTime: string) => {
  const startSlot = timeToSlotIndex(startTime);
  const endSlot = timeToSlotIndex(endTime);
  return (endSlot - startSlot) * SLOT_WIDTH;
};

export function DayTimelineView({
  centre,
  shifts,
  openShifts,
  staff,
  date,
  shiftTemplates,
  showAnalyticsCharts = false,
  demandAnalytics = [],
  staffAbsences = [],
  onShiftEdit,
  onShiftDelete,
  onShiftResize,
  onAddShift,
  onAddShiftAtTime,
  onDragStart,
  onDropStaff,
  onStaffClick,
  onOpenShiftTemplateManager,
}: DayTimelineViewProps) {
  // keep hooks to ensure consistent behavior across breakpoints (and future tweaks)
  useIsMobile();
  useIsTablet();

  const [staffSearch, setStaffSearch] = useState('');
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoverTime, setHoverTime] = useState<{ staffId: string; roomId: string; time: string; x: number } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const [scrollInfo, setScrollInfo] = useState({ scrollLeft: 0, scrollWidth: 0, clientWidth: 0 });
  const [isScrollDragging, setIsScrollDragging] = useState(false);
  // Day view: always show the blue scroll bar (desktop + mobile/tablet), but only render it when scrollable
  const showScrollIndicator = true;

  const dateStr = format(date, 'yyyy-MM-dd');
  const showCurrentTime = isToday(date);

  // Update current time every minute
  useEffect(() => {
    if (!showCurrentTime) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [showCurrentTime]);

  const currentTimePosition = showCurrentTime ? currentTimeToPixels(currentTime) : null;

  // Track horizontal scroll for custom blue scrollbar + hide native scrollbar
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      setScrollInfo({
        scrollLeft: el.scrollLeft,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      });
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update as any);
      window.removeEventListener('resize', update);
    };
  }, []);

  // Draggable scroll thumb handlers
  const handleScrollThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsScrollDragging(true);
  }, []);

  useEffect(() => {
    if (!isScrollDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!scrollTrackRef.current || !scrollRef.current) return;
      const rect = scrollTrackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percent = x / rect.width;
      const maxScroll = scrollInfo.scrollWidth - scrollInfo.clientWidth;
      scrollRef.current.scrollLeft = percent * maxScroll;
    };

    const handleMouseUp = () => {
      setIsScrollDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrollDragging, scrollInfo.scrollWidth, scrollInfo.clientWidth]);

  // Filter staff by search
  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return staff;
    const search = staffSearch.toLowerCase();
    return staff.filter(s => 
      s.name.toLowerCase().includes(search) ||
      s.role.toLowerCase().includes(search)
    );
  }, [staff, staffSearch]);

  // Get shifts for a specific staff member on this day
  const getStaffShifts = (staffId: string, roomId: string) => {
    return shifts.filter(s => 
      s.staffId === staffId && 
      s.date === dateStr && 
      s.centreId === centre.id &&
      s.roomId === roomId
    );
  };

  // Get open shifts for a room on this day
  const getRoomOpenShifts = (roomId: string) => {
    return openShifts.filter(os => os.roomId === roomId && os.date === dateStr);
  };

  // Group staff by room
  const staffByRoom = useMemo(() => {
    const roomStaff: Record<string, Set<string>> = {};
    centre.rooms.forEach(room => { roomStaff[room.id] = new Set(); });
    shifts.forEach(shift => {
      if (shift.centreId === centre.id && shift.date === dateStr && roomStaff[shift.roomId]) {
        roomStaff[shift.roomId].add(shift.staffId);
      }
    });
    staff.forEach(s => {
      if (s.preferredCentres.includes(centre.id) || s.preferredCentres.length === 0) {
        const hasRoom = Object.values(roomStaff).some(set => set.has(s.id));
        if (!hasRoom && centre.rooms.length > 0) {
          roomStaff[centre.rooms[0].id].add(s.id);
        }
      }
    });
    return roomStaff;
  }, [shifts, staff, centre, dateStr]);

  const handleDragOver = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    setDragOverSlot(cellId);
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDragEnd = () => {
    setDragOverSlot(null);
    setIsDragging(false);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>, staffId: string, roomId: string) => {
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // Snap to 15-minute grid
    const snappedX = snapToGrid(x);
    const time = pixelsToTime(snappedX);
    setHoverTime({ staffId, roomId, time, x: snappedX });
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>, staffId: string, roomId: string) => {
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    // Snap to 15-minute grid
    const snappedTime = pixelsToSnappedTime(x);
    
    if (onAddShiftAtTime) {
      onAddShiftAtTime(staffId, dateStr, roomId, snappedTime);
    } else {
      // Fallback to regular add shift
      onAddShift(staffId, dateStr, roomId);
    }
  };

  const handleDrop = (e: React.DragEvent, staffId: string, roomId: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    setIsDragging(false);
    onDropStaff(staffId, roomId, dateStr);
  };

  const totalWidth = TIME_SLOTS.length * SLOT_WIDTH;

  const getVisibleTimeRangeLabel = () => {
    if (scrollInfo.scrollWidth <= 0) return '';
    const maxScroll = Math.max(scrollInfo.scrollWidth - scrollInfo.clientWidth, 1);
    const startPercent = Math.max(0, Math.min(scrollInfo.scrollLeft / maxScroll, 1));
    const endPercent = Math.max(0, Math.min((scrollInfo.scrollLeft + scrollInfo.clientWidth) / Math.max(scrollInfo.scrollWidth, 1), 1));

    const startIdx = Math.floor(startPercent * (TIME_SLOTS.length - 1));
    const endIdx = Math.min(Math.floor(endPercent * (TIME_SLOTS.length - 1)), TIME_SLOTS.length - 1);
    const start = TIME_SLOTS[startIdx] || TIME_SLOTS[0];
    const end = TIME_SLOTS[endIdx] || TIME_SLOTS[TIME_SLOTS.length - 1];
    return `${start} – ${end}`;
  };

  return (
    <div className="flex-1 overflow-hidden bg-background w-full max-w-full relative" onDragEnd={handleDragEnd}>
      <ScrollArea
        ref={scrollRef}
        className={cn(
          // Leave space so the always-visible blue scrollbar doesn't get covered by the footer legend
          "h-full w-full pb-8",
          // Hide native scrollbars everywhere for day view; we show a custom blue scrollbar instead
          showScrollIndicator && "scrollbar-hide"
        )}
        style={showScrollIndicator ? { scrollbarWidth: 'none', msOverflowStyle: 'none' } : undefined}
      >
        <div style={{ minWidth: totalWidth + 264 + 100 }} className="w-full">
          {/* Time header */}
          <div className="flex sticky top-0 z-20 bg-card border-b border-border">
            {/* Staff column header */}
            <div className="w-32 md:w-48 lg:w-64 shrink-0 p-1 md:p-2 font-medium text-xs lg:text-sm text-muted-foreground border-r border-border bg-muted/50 sticky left-0 z-30">
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

            {/* Time slots header */}
            <div className="flex-1 relative" style={{ width: totalWidth }}>
              {/* Current time indicator in header */}
              {currentTimePosition !== null && (
                <div 
                  className="absolute top-0 bottom-0 z-30 pointer-events-none"
                  style={{ left: currentTimePosition }}
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 shadow-md" />
                </div>
              )}
              {/* Hour labels */}
              <div className="flex h-10 border-b border-border/50">
                {Array.from({ length: 17 }, (_, i) => i + 5).map((hour) => (
                  <div
                    key={hour}
                    className="border-r border-border/30 flex items-end pb-1 relative"
                    style={{ width: HOUR_WIDTH }}
                  >
                    <span className="text-xs font-medium text-foreground pl-1">
                      {hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`}
                    </span>
                  </div>
                ))}
              </div>

              {/* 15-minute tick marks with labels */}
              <div className="flex h-5 bg-muted/30 relative">
                {TIME_SLOTS.map((slot, idx) => {
                  const isHour = idx % 4 === 0;
                  const isHalfHour = idx % 4 === 2;
                  const isQuarter = idx % 4 === 1 || idx % 4 === 3;
                  const minutes = (idx % 4) * 15;
                  
                  return (
                    <div
                      key={slot}
                      className={cn(
                        "border-r relative flex items-end justify-center",
                        isHour ? "border-border" : isHalfHour ? "border-border/50" : "border-border/25"
                      )}
                      style={{ width: SLOT_WIDTH }}
                    >
                      {/* Tick mark */}
                      <div 
                        className={cn(
                          "absolute bottom-0 left-0 w-px -translate-x-1/2",
                          isHour ? "h-full bg-border" : isHalfHour ? "h-3 bg-border/60" : "h-2 bg-border/40"
                        )}
                      />
                      {/* Minute label for non-hour slots */}
                      {!isHour && (
                        <span className={cn(
                          "text-[9px] text-muted-foreground/70 mb-0.5",
                          isHalfHour ? "font-medium" : "font-normal"
                        )}>
                          :{minutes.toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cost column header */}
            <div className="w-24 shrink-0 bg-muted/50 border-r border-border flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">Hours</span>
            </div>
          </div>

          {/* Room sections */}
          {centre.rooms.map((room) => {
            const roomStaffIds = staffByRoom[room.id] || new Set();
            const roomStaff = filteredStaff.filter(s => roomStaffIds.has(s.id));
            const roomOpenShifts = getRoomOpenShifts(room.id);

            return (
              <div key={room.id}>
                {/* Room header with analytics */}
                <div className="flex flex-col bg-primary/10 border-b border-primary/20 sticky top-[52px] z-10">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-semibold">{room.name}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(date, 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    {/* Inline staffing insights */}
                    {showAnalyticsCharts && demandAnalytics.length > 0 && (
                      <StaffingInsightsBar
                        analyticsData={demandAnalytics}
                        absences={staffAbsences}
                        date={dateStr}
                        roomId={room.id}
                        centreId={centre.id}
                        isCompact={true}
                      />
                    )}
                  </div>
                  {/* Expanded analytics panel when enabled */}
                  {showAnalyticsCharts && demandAnalytics.length > 0 && (
                    <div className="px-4 pb-2">
                      <StaffingInsightsBar
                        analyticsData={demandAnalytics}
                        absences={staffAbsences}
                        date={dateStr}
                        roomId={room.id}
                        centreId={centre.id}
                        isCompact={false}
                      />
                    </div>
                  )}
                </div>

                {/* Staff rows */}
                {roomStaff.map((member) => {
                  const memberShifts = getStaffShifts(member.id, room.id);

                  return (
                    <div key={`${room.id}-${member.id}`} className="flex border-b border-border hover:bg-muted/20 transition-colors">
                      {/* Staff info */}
                      <div 
                        className={cn(
                          "w-32 md:w-48 lg:w-64 shrink-0 p-1 md:p-2 border-r border-border bg-card flex items-center gap-1 md:gap-2 cursor-grab sticky left-0 z-20",
                          isDragging && "opacity-60"
                        )}
                        draggable
                        onDragStart={(e) => {
                          onDragStart(e, member);
                          setIsDragging(true);
                        }}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                        <div 
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          style={{ backgroundColor: member.color }}
                          onClick={() => onStaffClick?.(member)}
                        >
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p 
                            className="text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary hover:underline"
                            onClick={() => onStaffClick?.(member)}
                          >
                            {member.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{roleLabels[member.role]}</p>
                        </div>
                      </div>

                      {/* Timeline area */}
                      <div 
                        className={cn(
                          "relative h-16 bg-muted/5 cursor-crosshair group/timeline",
                          isDragging && "bg-primary/5 cursor-default"
                        )}
                        style={{ width: totalWidth }}
                        onDragOver={(e) => handleDragOver(e, `${member.id}-${room.id}`)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, member.id, room.id)}
                        onMouseMove={(e) => handleTimelineMouseMove(e, member.id, room.id)}
                        onMouseLeave={handleTimelineMouseLeave}
                        onClick={(e) => handleTimelineClick(e, member.id, room.id)}
                      >
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {TIME_SLOTS.map((slot, idx) => {
                            const isHour = idx % 4 === 0;
                            return (
                              <div
                                key={slot}
                                className={cn(
                                  "h-full border-r",
                                  isHour ? "border-border/40" : "border-border/10"
                                )}
                                style={{ width: SLOT_WIDTH }}
                              />
                            );
                          })}
                        </div>

                        {/* Hover time indicator */}
                        {hoverTime && hoverTime.staffId === member.id && hoverTime.roomId === room.id && !isDragging && memberShifts.length === 0 && (
                          <div 
                            className="absolute top-0 bottom-0 pointer-events-none z-10 transition-all duration-75"
                            style={{ left: hoverTime.x }}
                          >
                            {/* Vertical line */}
                            <div className="absolute top-0 bottom-0 w-0.5 bg-primary/60 -translate-x-1/2" />
                            {/* Time label */}
                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium shadow-lg whitespace-nowrap">
                              <Plus className="h-3 w-3 inline mr-1" />
                              {hoverTime.time}
                            </div>
                          </div>
                        )}

                        {/* Current time indicator line */}
                        {currentTimePosition !== null && (
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                            style={{ left: currentTimePosition }}
                          >
                            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                          </div>
                        )}

                        {/* Drop zone indicator */}
                        {isDragging && dragOverSlot === `${member.id}-${room.id}` && (
                          <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded flex items-center justify-center pointer-events-none z-10">
                            <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium shadow-lg">
                              Drop to assign shift
                            </div>
                          </div>
                        )}

                        {/* Shift bars */}
                        {memberShifts.map((shift) => (
                          <ShiftBar 
                            key={shift.id} 
                            shift={shift} 
                            staff={member}
                            onEdit={() => onShiftEdit(shift)}
                            onResize={onShiftResize}
                          />
                        ))}

                        {/* Click hint for empty rows */}
                        {memberShifts.length === 0 && !isDragging && !hoverTime && (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-xs pointer-events-none opacity-0 group-hover/timeline:opacity-100 transition-opacity">
                            Click to add shift
                          </div>
                        )}
                      </div>

                      {/* Hours summary */}
                      <div className="w-24 shrink-0 p-2 border-r border-border bg-card flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-sm font-medium text-foreground">
                            {memberShifts.reduce((acc, shift) => {
                              const [sh, sm] = shift.startTime.split(':').map(Number);
                              const [eh, em] = shift.endTime.split(':').map(Number);
                              return acc + ((eh * 60 + em) - (sh * 60 + sm) - shift.breakMinutes) / 60;
                            }, 0).toFixed(1)}h
                          </div>
                          <div className="text-[10px] text-muted-foreground">Today</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Open shifts row */}
                {roomOpenShifts.length > 0 && (
                  <div className={cn("flex border-b border-border", openShiftColors.bg)}>
                    <div className={cn("w-32 md:w-48 lg:w-64 shrink-0 p-2 border-r border-border flex items-center gap-2 sticky left-0 z-20", openShiftColors.bg)}>
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border-2 border-dashed", openShiftColors.bg, openShiftColors.border)}>
                        <AlertCircle className={cn("h-4 w-4", openShiftColors.icon)} />
                      </div>
                      <div>
                        <p className={cn("text-sm font-medium", openShiftColors.text)}>Open Shifts</p>
                        <p className={cn("text-[10px]", openShiftColors.text, "opacity-80")}>{roomOpenShifts.length} unfilled</p>
                      </div>
                    </div>

                    <div className="relative h-16" style={{ width: totalWidth }}>
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {TIME_SLOTS.map((slot, idx) => {
                          const isHour = idx % 4 === 0;
                          return (
                            <div
                              key={slot}
                              className={cn(
                                "h-full border-r",
                                isHour ? "border-border/40" : "border-border/10"
                              )}
                              style={{ width: SLOT_WIDTH }}
                            />
                          );
                        })}
                      </div>

                      {/* Current time indicator line */}
                      {currentTimePosition !== null && (
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                          style={{ left: currentTimePosition }}
                        />
                      )}

                      {/* Open shift bars */}
                      {roomOpenShifts.map((openShift) => (
                        <OpenShiftBar key={openShift.id} openShift={openShift} />
                      ))}
                    </div>

                    <div className="w-24 shrink-0 border-r border-border" />
                  </div>
                )}

                {roomStaff.length === 0 && roomOpenShifts.length === 0 && (
                  <div className="flex border-b border-border h-16">
                    <div className="w-64 shrink-0 p-4 border-r border-border text-center text-muted-foreground text-sm flex items-center justify-center">
                      No staff assigned
                    </div>
                    <div style={{ width: totalWidth }} />
                    <div className="w-24 shrink-0 border-r border-border" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Blue Scroll Indicator (Day view) */}
      {showScrollIndicator && (
        (() => {
          const isScrollable = scrollInfo.scrollWidth > scrollInfo.clientWidth;
          const safeScrollWidth = Math.max(scrollInfo.scrollWidth, 1);
          const safeClientWidth = Math.max(scrollInfo.clientWidth, 1);
          const leftPct = isScrollable ? (scrollInfo.scrollLeft / safeScrollWidth) * 100 : 0;
          const widthPct = isScrollable ? Math.max((safeClientWidth / safeScrollWidth) * 100, 8) : 100;

          return (
        <div className="h-8 bg-muted/50 border-t border-border flex items-center px-3 md:px-4 gap-3 sticky bottom-0 z-40">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            disabled={!isScrollable || scrollInfo.scrollLeft <= 0}
            onClick={() => {
              if (scrollRef.current) scrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div 
            ref={scrollTrackRef}
            className={cn(
              "flex-1 relative h-3 bg-border/50 rounded-full overflow-hidden",
              isScrollable ? "cursor-pointer" : "cursor-default"
            )}
            onClick={(e) => {
              if (!isScrollable || !scrollRef.current || isScrollDragging) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percent = clickX / rect.width;
              const scrollTarget = percent * (scrollInfo.scrollWidth - scrollInfo.clientWidth);
              scrollRef.current.scrollTo({ left: scrollTarget, behavior: 'smooth' });
            }}
          >
            {/* Visible window indicator (draggable) */}
            <div
              className={cn(
                "absolute top-0 bottom-0 bg-primary/60 rounded-full",
                isScrollable ? "cursor-grab active:cursor-grabbing hover:bg-primary/80" : "cursor-default",
                isScrollDragging ? "bg-primary/80" : "transition-all duration-75"
              )}
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
              }}
              onMouseDown={(e) => {
                if (!isScrollable) return;
                handleScrollThumbMouseDown(e);
              }}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            disabled={!isScrollable || scrollInfo.scrollLeft >= scrollInfo.scrollWidth - scrollInfo.clientWidth - 1}
            onClick={() => {
              if (scrollRef.current) scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="text-xs text-muted-foreground shrink-0 min-w-[96px] text-right hidden sm:block">
            {getVisibleTimeRangeLabel()}
          </div>
        </div>
          );
        })()
      )}
    </div>
  );
}

// Shift bar component for timeline with resize handles
function ShiftBar({ 
  shift, 
  staff, 
  onEdit,
  onResize 
}: { 
  shift: Shift; 
  staff: StaffMember; 
  onEdit: () => void;
  onResize?: (shiftId: string, newStartTime: string, newEndTime: string) => void;
}) {
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [originalLeft, setOriginalLeft] = useState(0);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [currentLeft, setCurrentLeft] = useState(timeToPixels(shift.startTime));
  const [currentWidth, setCurrentWidth] = useState(getShiftWidth(shift.startTime, shift.endTime));

  const left = isResizing ? currentLeft : timeToPixels(shift.startTime);
  const width = isResizing ? currentWidth : getShiftWidth(shift.startTime, shift.endTime);
  
  // Use centralized color system
  const colors = shiftStatusColors[shift.status] || shiftStatusColors.draft;
  const duration = ((timeToSlotIndex(shift.endTime) - timeToSlotIndex(shift.startTime)) * 15 - shift.breakMinutes) / 60;

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(side);
    setResizeStartX(e.clientX);
    setOriginalLeft(timeToPixels(shift.startTime));
    setOriginalWidth(getShiftWidth(shift.startTime, shift.endTime));
    setCurrentLeft(timeToPixels(shift.startTime));
    setCurrentWidth(getShiftWidth(shift.startTime, shift.endTime));
  };

  // Handle resize move with live snapping
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX;
      
      if (isResizing === 'left') {
        // Resize from left - changes start time
        const rawLeft = originalLeft + deltaX;
        const rawWidth = originalWidth - deltaX;
        // Snap to grid during resize for visual feedback
        const snappedLeft = Math.max(0, snapToGrid(rawLeft));
        const snappedWidth = Math.max(SLOT_WIDTH * 2, snapToGrid(rawWidth)); // Min 30 minutes
        setCurrentLeft(snappedLeft);
        setCurrentWidth(snappedWidth);
      } else {
        // Resize from right - changes end time
        const rawWidth = originalWidth + deltaX;
        // Snap to grid during resize for visual feedback
        const snappedWidth = Math.max(SLOT_WIDTH * 2, snapToGrid(rawWidth)); // Min 30 minutes
        setCurrentWidth(snappedWidth);
      }
    };

    const handleMouseUp = () => {
      if (onResize && isResizing) {
        // Values are already snapped during resize, use directly
        const newStartTime = pixelsToTime(currentLeft);
        const newEndTime = pixelsToTime(currentLeft + currentWidth);
        
        // Validate times are within bounds (5 AM - 9 PM)
        const [startHour] = newStartTime.split(':').map(Number);
        const [endHour] = newEndTime.split(':').map(Number);
        
        if (startHour >= 5 && endHour <= 21 && newStartTime < newEndTime) {
          onResize(shift.id, newStartTime, newEndTime);
        }
      }
      setIsResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStartX, originalLeft, originalWidth, currentLeft, currentWidth, onResize, shift.id]);

  // Display times are already snapped during resize
  const displayStartTime = isResizing 
    ? pixelsToTime(currentLeft)
    : shift.startTime;
  const displayEndTime = isResizing 
    ? pixelsToTime(currentLeft + currentWidth)
    : shift.endTime;

  const tooltipContent = (
    <div className="p-3 min-w-[180px]">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
          style={{ backgroundColor: staff.color }}
        >
          {staff.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{staff.name}</p>
          <p className="text-xs text-white/70">{roleLabels[staff.role]}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-white/90">
          <Clock className="h-3.5 w-3.5 text-white/60" />
          <span className="text-sm">{shift.startTime} - {shift.endTime}</span>
          <span className="text-xs text-white/60 ml-auto">{duration.toFixed(1)}h</span>
        </div>
        {shift.breakMinutes > 0 && (
          <div className="flex items-center gap-2 text-white/90">
            <Coffee className="h-3.5 w-3.5 text-white/60" />
            <span className="text-sm">{shift.breakMinutes} min break</span>
          </div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-white/20 space-y-1">
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize",
          shift.status === 'draft' && "bg-amber-500/20 text-amber-200",
          shift.status === 'published' && "bg-[hsl(var(--info)/0.2)] text-[hsl(var(--info))]",
          shift.status === 'confirmed' && "bg-emerald-500/20 text-emerald-200",
          shift.status === 'completed' && "bg-slate-500/20 text-slate-300",
        )}>
          {shift.status}
        </span>
        <p className="text-[10px] text-white/50">Drag edges to resize</p>
      </div>
    </div>
  );

  return (
    <MuiTooltip
      title={isResizing ? null : tooltipContent}
      placement="top"
      arrow
      enterDelay={200}
      followCursor
      PopperProps={{
        disablePortal: false,
        modifiers: [
          {
            name: 'preventOverflow',
            enabled: true,
            options: {
              altAxis: true,
              altBoundary: true,
              tether: true,
              rootBoundary: 'viewport',
              padding: 8,
            },
          },
          {
            name: 'flip',
            enabled: true,
            options: {
              fallbackPlacements: ['bottom', 'left', 'right'],
            },
          },
        ],
      }}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: 'hsl(220, 20%, 20%)',
            borderRadius: '10px',
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.3)',
            padding: 0,
            maxWidth: 260,
            '& .MuiTooltip-arrow': { color: 'hsl(220, 20%, 20%)' },
          },
        },
      }}
    >
      <div
        className={cn(
          "absolute top-2 bottom-2 rounded-lg border-2 cursor-pointer group/shiftbar",
          "transition-all duration-200",
          !isResizing && "hover:shadow-lg hover:scale-y-110 hover:z-10",
          isResizing && "z-30 shadow-xl",
          colors.bg,
          colors.border,
          shift.status === 'draft' && "border-dashed",
          shift.isAbsent && "border-destructive/70"
        )}
        style={{ 
          left, 
          width: Math.max(width, 40),
          backgroundColor: shift.isAbsent ? undefined : `${staff.color}20`,
          borderColor: shift.isAbsent ? 'hsl(var(--destructive) / 0.7)' : staff.color,
          backgroundImage: shift.isAbsent
            ? 'repeating-linear-gradient(135deg, hsl(var(--destructive) / 0.10), hsl(var(--destructive) / 0.10) 10px, hsl(var(--destructive) / 0.18) 10px, hsl(var(--destructive) / 0.18) 20px)'
            : undefined,
        }}
        onClick={(e) => {
          if (!isResizing) onEdit();
        }}
      >
        {shift.isAbsent && (
          <div className="absolute top-1 right-1 z-20 rounded-full bg-destructive text-destructive-foreground p-1 shadow">
            <UserX className="h-3 w-3" />
          </div>
        )}
        {/* Left resize handle */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10",
            "opacity-0 group-hover/shiftbar:opacity-100 transition-opacity",
            "hover:bg-primary/30 rounded-l-lg",
            isResizing === 'left' && "opacity-100 bg-primary/40"
          )}
          onMouseDown={(e) => handleResizeStart(e, 'left')}
        >
          <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-current opacity-50 rounded-full" />
        </div>

        {/* Right resize handle */}
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10",
            "opacity-0 group-hover/shiftbar:opacity-100 transition-opacity",
            "hover:bg-primary/30 rounded-r-lg",
            isResizing === 'right' && "opacity-100 bg-primary/40"
          )}
          onMouseDown={(e) => handleResizeStart(e, 'right')}
        >
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-current opacity-50 rounded-full" />
        </div>

        {/* Shift content */}
        <div className="flex items-center gap-1.5 px-2 overflow-hidden h-full">
          <div 
            className="w-1 h-6 rounded-full shrink-0" 
            style={{ backgroundColor: shift.isAbsent ? 'hsl(var(--destructive))' : staff.color }} 
          />
          <div className="flex-1 min-w-0">
            <div className={cn("text-xs font-semibold truncate", colors.text)}>
              {displayStartTime} - {displayEndTime}
            </div>
            {width > 100 && !isResizing && (
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {duration.toFixed(1)}h
                {shift.breakMinutes > 0 && ` • ${shift.breakMinutes}m break`}
              </div>
            )}
          </div>
        </div>
      </div>
    </MuiTooltip>
  );
}

// Open shift bar component using centralized color system
function OpenShiftBar({ openShift }: { openShift: OpenShift }) {
  const left = timeToPixels(openShift.startTime);
  const width = getShiftWidth(openShift.startTime, openShift.endTime);

  return (
    <div
      className={cn(
        "absolute top-2 bottom-2 rounded-lg border-2 border-dashed",
        "flex items-center justify-center gap-1 px-2",
        openShiftColors.bgGradient,
        openShiftColors.border,
        openShift.urgency === 'critical' && "animate-pulse"
      )}
      style={{ left, width: Math.max(width, 60) }}
    >
      <AlertCircle className={cn("h-4 w-4", openShiftColors.icon)} />
      <span className={cn("text-xs font-medium", openShiftColors.text)}>
        {openShift.startTime}-{openShift.endTime}
      </span>
      <Badge 
        variant={openShift.urgency === 'critical' ? 'destructive' : 'outline'} 
        className={cn("text-[8px] capitalize ml-1", openShiftColors.text)}
      >
        {openShift.urgency}
      </Badge>
    </div>
  );
}
