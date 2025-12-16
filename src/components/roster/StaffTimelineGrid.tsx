import { useState, useMemo } from 'react';
import { Shift, OpenShift, Centre, StaffMember, DemandData, RosterComplianceFlag, ageGroupLabels, qualificationLabels, roleLabels, Room } from '@/types/roster';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  AlertTriangle, 
  Clock,
  GripVertical,
  User,
  AlertCircle,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
  onDropStaff: (staffId: string, roomId: string, date: string) => void;
  onShiftEdit: (shift: Shift) => void;
  onShiftDelete: (shiftId: string) => void;
  onOpenShiftFill: (openShift: OpenShift) => void;
  onAddShift: (staffId: string, date: string, roomId: string) => void;
  onDragStart: (e: React.DragEvent, staff: StaffMember) => void;
  onOpenShiftDrop: (staffId: string, openShift: OpenShift) => void;
}

export function StaffTimelineGrid({
  centre,
  shifts,
  openShifts,
  staff,
  demandData,
  complianceFlags,
  dates,
  viewMode,
  showDemandOverlay,
  onDropStaff,
  onShiftEdit,
  onShiftDelete,
  onOpenShiftFill,
  onAddShift,
  onDragStart,
  onOpenShiftDrop,
}: StaffTimelineGridProps) {
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const isCompact = viewMode === 'fortnight' || viewMode === 'month';

  // Group shifts by room to determine which staff work in which areas
  const staffByRoom = useMemo(() => {
    const roomStaff: Record<string, Set<string>> = {};
    
    // Initialize all rooms
    centre.rooms.forEach(room => {
      roomStaff[room.id] = new Set();
    });
    
    // Add staff based on their shifts
    shifts.forEach(shift => {
      if (shift.centreId === centre.id && roomStaff[shift.roomId]) {
        roomStaff[shift.roomId].add(shift.staffId);
      }
    });
    
    // Also add staff based on preferences for rooms without shifts
    staff.forEach(s => {
      if (s.preferredCentres.includes(centre.id) || s.preferredCentres.length === 0) {
        // Add to first room if not assigned anywhere
        const hasRoom = Object.values(roomStaff).some(set => set.has(s.id));
        if (!hasRoom && centre.rooms.length > 0) {
          roomStaff[centre.rooms[0].id].add(s.id);
        }
      }
    });
    
    return roomStaff;
  }, [shifts, staff, centre]);

  // Group open shifts by room and date
  const openShiftsByRoomDate = useMemo(() => {
    const grouped: Record<string, OpenShift[]> = {};
    openShifts.forEach(os => {
      const key = `${os.roomId}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(os);
    });
    return grouped;
  }, [openShifts]);

  const getShiftsForStaffDay = (staffId: string, date: string, roomId: string) => {
    return shifts.filter(s => 
      s.staffId === staffId && 
      s.date === date && 
      s.centreId === centre.id &&
      s.roomId === roomId
    );
  };

  const getOpenShiftForDay = (roomId: string, date: string) => {
    return openShifts.find(os => os.roomId === roomId && os.date === date);
  };

  const calculateStaffWeeklyHours = (staffId: string) => {
    const staffShifts = shifts.filter(s => s.staffId === staffId && s.centreId === centre.id);
    let totalHours = 0;
    
    staffShifts.forEach(shift => {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const hours = ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
      totalHours += hours;
    });
    
    return Math.round(totalHours * 10) / 10;
  };

  const getOvertimeStatus = (member: StaffMember) => {
    const percentUsed = (member.currentWeeklyHours / member.maxHoursPerWeek) * 100;
    if (percentUsed >= 100) return 'overtime';
    if (percentUsed >= 90) return 'near-limit';
    return 'available';
  };

  const handleDragOver = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    setDragOverCell(cellId);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, staffId: string, date: string, roomId: string) => {
    e.preventDefault();
    setDragOverCell(null);
    onDropStaff(staffId, roomId, date);
  };

  const handleOpenShiftDrop = (e: React.DragEvent, openShift: OpenShift) => {
    e.preventDefault();
    setDragOverCell(null);
    const staffId = e.dataTransfer.getData('staffId');
    if (staffId) {
      onOpenShiftDrop(staffId, openShift);
    }
  };

  const handleShiftDragStart = (e: React.DragEvent, shift: Shift) => {
    e.dataTransfer.setData('staffId', shift.staffId);
    e.dataTransfer.setData('shiftId', shift.id);
    e.dataTransfer.setData('dragType', 'shift');
  };

  return (
    <div className="flex-1 overflow-hidden bg-background">
      <ScrollArea className="h-full">
        <div className="min-w-max">
          {/* Header row with dates */}
          <div className="flex sticky top-0 z-20 bg-card border-b border-border">
            <div className="w-64 shrink-0 p-3 font-medium text-sm text-muted-foreground border-r border-border bg-muted/50">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Employee</span>
              </div>
            </div>
            {dates.map((date) => (
              <div 
                key={date.toISOString()} 
                className={cn(
                  "flex-1 min-w-[130px] p-3 text-center border-r border-border bg-muted/50",
                  isCompact && "min-w-[90px] p-2"
                )}
              >
                <div className="text-sm font-medium text-foreground">
                  {format(date, 'EEE')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(date, 'd MMM')}
                </div>
              </div>
            ))}
            <div className="w-16 shrink-0 p-3 text-center font-medium text-sm text-muted-foreground bg-muted/50 border-r border-border">
              Total
            </div>
          </div>

          {/* Room sections */}
          {centre.rooms.map((room) => {
            const roomStaffIds = staffByRoom[room.id] || new Set();
            const roomStaff = staff.filter(s => roomStaffIds.has(s.id));
            const roomOpenShifts = openShiftsByRoomDate[room.id] || [];

            return (
              <div key={room.id}>
                {/* Room header */}
                <div className="flex bg-primary/10 border-b border-primary/20 sticky top-[52px] z-10">
                  <div className="px-4 py-2 flex items-center gap-3">
                    <Badge variant="secondary" className="font-semibold">
                      {room.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {ageGroupLabels[room.ageGroup]} • 1:{room.requiredRatio} ratio • Cap: {room.capacity}
                    </span>
                  </div>
                </div>

                {/* Staff rows for this room */}
                {roomStaff.map((member) => {
                  const overtimeStatus = getOvertimeStatus(member);
                  const weeklyHours = calculateStaffWeeklyHours(member.id);
                  const topQualifications = member.qualifications.slice(0, 2);

                  return (
                    <div 
                      key={`${room.id}-${member.id}`}
                      className="flex border-b border-border hover:bg-muted/20 transition-colors"
                    >
                      {/* Staff info cell */}
                      <div 
                        className="w-64 shrink-0 p-2 border-r border-border bg-card flex items-start gap-2 cursor-grab"
                        draggable
                        onDragStart={(e) => onDragStart(e, member)}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-1" />
                        <div 
                          className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            member.name.split(' ').map(n => n[0]).join('')
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {roleLabels[member.role]}
                          </p>
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {topQualifications.map((q, idx) => (
                              <TooltipProvider key={idx}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant={q.isExpired ? 'destructive' : q.isExpiringSoon ? 'outline' : 'secondary'}
                                      className={cn(
                                        "text-[8px] px-1 py-0 h-3.5",
                                        q.isExpiringSoon && "border-amber-500 text-amber-600"
                                      )}
                                    >
                                      {qualificationLabels[q.type].slice(0, 8)}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{qualificationLabels[q.type]}</p>
                                    {q.expiryDate && (
                                      <p className="text-xs text-muted-foreground">
                                        Expires: {q.expiryDate}
                                      </p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                            {member.qualifications.length > 2 && (
                              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">
                                +{member.qualifications.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {overtimeStatus === 'overtime' && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">OT</Badge>
                        )}
                      </div>

                      {/* Day cells */}
                      {dates.map((date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const cellKey = `${member.id}-${room.id}-${dateStr}`;
                        const cellShifts = getShiftsForStaffDay(member.id, dateStr, room.id);
                        const isDragOver = dragOverCell === cellKey;

                        return (
                          <div
                            key={cellKey}
                            className={cn(
                              "flex-1 min-w-[130px] p-1 border-r border-border relative",
                              "transition-colors duration-150",
                              isDragOver && "bg-primary/10",
                              isCompact && "min-w-[90px]"
                            )}
                            onDragOver={(e) => handleDragOver(e, cellKey)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, member.id, dateStr, room.id)}
                          >
                            <div className="space-y-1">
                              {cellShifts.map((shift) => (
                                <StaffShiftCard
                                  key={shift.id}
                                  shift={shift}
                                  onEdit={() => onShiftEdit(shift)}
                                  onDelete={() => onShiftDelete(shift.id)}
                                  onDragStart={handleShiftDragStart}
                                  isCompact={isCompact}
                                />
                              ))}
                            </div>

                            {cellShifts.length === 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "w-full h-8 text-xs text-muted-foreground/30 hover:text-muted-foreground",
                                  "border border-dashed border-transparent hover:border-muted-foreground/30",
                                  "opacity-0 hover:opacity-100 transition-opacity"
                                )}
                                onClick={() => onAddShift(member.id, dateStr, room.id)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        );
                      })}

                      {/* Total hours cell */}
                      <div className="w-16 shrink-0 p-2 text-center border-r border-border bg-card flex items-center justify-center">
                        <span className={cn(
                          "text-sm font-semibold",
                          weeklyHours > member.maxHoursPerWeek && "text-destructive",
                          weeklyHours > 0 && weeklyHours <= member.maxHoursPerWeek && "text-primary"
                        )}>
                          {weeklyHours}h
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Open Shifts row for this room */}
                {roomOpenShifts.length > 0 && (
                  <div className="flex border-b border-border bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                    {/* Empty employee cell for open shift */}
                    <div className="w-64 shrink-0 p-2 border-r border-border flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center bg-amber-500/20 border-2 border-dashed border-amber-500/50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-700">Open Shift</p>
                        <p className="text-[10px] text-amber-600">Drag staff to assign</p>
                      </div>
                    </div>

                    {/* Day cells with open shifts */}
                    {dates.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const openShift = getOpenShiftForDay(room.id, dateStr);
                      const cellKey = `open-${room.id}-${dateStr}`;
                      const isDragOver = dragOverCell === cellKey;

                      return (
                        <div
                          key={cellKey}
                          className={cn(
                            "flex-1 min-w-[130px] p-1 border-r border-border relative",
                            "transition-colors duration-150",
                            isDragOver && "bg-primary/10",
                            isCompact && "min-w-[90px]"
                          )}
                          onDragOver={(e) => openShift && handleDragOver(e, cellKey)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => openShift && handleOpenShiftDrop(e, openShift)}
                        >
                          {openShift && (
                            <OpenShiftCard
                              openShift={openShift}
                              isCompact={isCompact}
                              isDragOver={isDragOver}
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* Empty total cell */}
                    <div className="w-16 shrink-0 p-2 border-r border-border" />
                  </div>
                )}

                {/* Empty state for room with no staff */}
                {roomStaff.length === 0 && roomOpenShifts.length === 0 && (
                  <div className="flex border-b border-border">
                    <div className="w-64 shrink-0 p-4 border-r border-border text-center text-muted-foreground text-sm">
                      No staff assigned
                    </div>
                    {dates.map((date) => (
                      <div 
                        key={date.toISOString()}
                        className="flex-1 min-w-[130px] p-1 border-r border-border"
                      />
                    ))}
                    <div className="w-16 shrink-0 border-r border-border" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

// Shift card component
interface StaffShiftCardProps {
  shift: Shift;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent, shift: Shift) => void;
  isCompact?: boolean;
}

function StaffShiftCard({ 
  shift, 
  onEdit, 
  onDelete, 
  onDragStart,
  isCompact = false 
}: StaffShiftCardProps) {
  const statusColors = {
    draft: 'bg-amber-500/15 border-amber-500/50 text-amber-700',
    published: 'bg-primary/15 border-primary/50 text-primary',
    confirmed: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700',
    completed: 'bg-muted border-muted-foreground/30 text-muted-foreground',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={(e) => onDragStart(e, shift)}
            onClick={onEdit}
            className={cn(
              "rounded-md border px-2 py-1.5 cursor-pointer transition-all",
              "hover:shadow-sm hover:scale-[1.02] active:cursor-grabbing",
              statusColors[shift.status],
              shift.status === 'draft' && "border-dashed"
            )}
          >
            <div className="text-xs font-semibold">
              {shift.startTime}-{shift.endTime}
            </div>
            {!isCompact && (
              <div className="text-[10px] opacity-70 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {shift.breakMinutes}m
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-1">
            <p className="font-medium">{shift.startTime} - {shift.endTime}</p>
            <p className="text-xs text-muted-foreground">
              Break: {shift.breakMinutes}m
            </p>
            <p className="text-xs capitalize">{shift.status}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Open shift card for inline display
interface OpenShiftCardProps {
  openShift: OpenShift;
  isCompact?: boolean;
  isDragOver?: boolean;
}

function OpenShiftCard({ openShift, isCompact, isDragOver }: OpenShiftCardProps) {
  const urgencyColors = {
    low: 'border-muted-foreground/40 bg-muted/50',
    medium: 'border-amber-500/50 bg-amber-500/10',
    high: 'border-orange-500/50 bg-orange-500/15',
    critical: 'border-destructive/50 bg-destructive/10',
  };

  return (
    <div
      className={cn(
        "rounded-md border-2 border-dashed px-2 py-1.5 transition-all",
        urgencyColors[openShift.urgency],
        isDragOver && "border-primary bg-primary/10 scale-[1.02]",
        openShift.urgency === 'critical' && "animate-pulse"
      )}
    >
      <div className="text-xs font-semibold text-foreground">
        {openShift.startTime}-{openShift.endTime}
      </div>
      {!isCompact && (
        <>
          <div className="flex flex-wrap gap-0.5 mt-1">
            {openShift.requiredQualifications.slice(0, 2).map((qual) => (
              <Badge key={qual} variant="outline" className="text-[8px] px-1 py-0 h-3.5">
                {qualificationLabels[qual].slice(0, 6)}
              </Badge>
            ))}
          </div>
          <Badge 
            variant={openShift.urgency === 'critical' ? 'destructive' : 'outline'}
            className="text-[8px] mt-1 capitalize"
          >
            {openShift.urgency}
          </Badge>
        </>
      )}
    </div>
  );
}
