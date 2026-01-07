import { useMemo, useState } from 'react';
import { Shift, OpenShift, Centre, StaffMember, qualificationLabels, roleLabels, ShiftTemplate } from '@/types/roster';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip as MuiTooltip } from '@mui/material';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Clock,
  GripVertical,
  Search,
  Coffee,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DayTimelineViewProps {
  centre: Centre;
  shifts: Shift[];
  openShifts: OpenShift[];
  staff: StaffMember[];
  date: Date;
  shiftTemplates: ShiftTemplate[];
  onShiftEdit: (shift: Shift) => void;
  onShiftDelete: (shiftId: string) => void;
  onAddShift: (staffId: string, date: string, roomId: string, template?: ShiftTemplate) => void;
  onDragStart: (e: React.DragEvent, staff: StaffMember) => void;
  onDropStaff: (staffId: string, roomId: string, date: string) => void;
  onStaffClick?: (staff: StaffMember) => void;
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
  onShiftEdit,
  onShiftDelete,
  onAddShift,
  onDragStart,
  onDropStaff,
  onStaffClick,
}: DayTimelineViewProps) {
  const [staffSearch, setStaffSearch] = useState('');
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');

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

  const handleDrop = (e: React.DragEvent, staffId: string, roomId: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    setIsDragging(false);
    onDropStaff(staffId, roomId, dateStr);
  };

  const totalWidth = TIME_SLOTS.length * SLOT_WIDTH;

  return (
    <div className="flex-1 overflow-hidden bg-background" onDragEnd={handleDragEnd}>
      <ScrollArea className="h-full">
        <div style={{ minWidth: totalWidth + 264 + 100 }}>
          {/* Time header */}
          <div className="flex sticky top-0 z-20 bg-card border-b border-border">
            {/* Staff column header */}
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

            {/* Time slots header */}
            <div className="flex-1 relative" style={{ width: totalWidth }}>
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

              {/* 15-minute tick marks */}
              <div className="flex h-3 bg-muted/30">
                {TIME_SLOTS.map((slot, idx) => {
                  const isHour = idx % 4 === 0;
                  const isHalfHour = idx % 2 === 0;
                  return (
                    <div
                      key={slot}
                      className={cn(
                        "border-r",
                        isHour ? "border-border" : isHalfHour ? "border-border/40" : "border-border/20"
                      )}
                      style={{ width: SLOT_WIDTH }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Spacer for scroll alignment */}
            <div className="w-24 shrink-0 bg-muted/50 border-r border-border" />
          </div>

          {/* Room sections */}
          {centre.rooms.map((room) => {
            const roomStaffIds = staffByRoom[room.id] || new Set();
            const roomStaff = filteredStaff.filter(s => roomStaffIds.has(s.id));
            const roomOpenShifts = getRoomOpenShifts(room.id);

            return (
              <div key={room.id}>
                {/* Room header */}
                <div className="flex bg-primary/10 border-b border-primary/20 sticky top-[52px] z-10">
                  <div className="px-4 py-2 flex items-center gap-3">
                    <Badge variant="secondary" className="font-semibold">{room.name}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(date, 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>
                </div>

                {/* Staff rows */}
                {roomStaff.map((member) => {
                  const memberShifts = getStaffShifts(member.id, room.id);

                  return (
                    <div key={`${room.id}-${member.id}`} className="flex border-b border-border hover:bg-muted/20 transition-colors">
                      {/* Staff info */}
                      <div 
                        className={cn(
                          "w-64 shrink-0 p-2 border-r border-border bg-card flex items-center gap-2 cursor-grab",
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
                          "relative h-16 bg-muted/5",
                          isDragging && "bg-primary/5"
                        )}
                        style={{ width: totalWidth }}
                        onDragOver={(e) => handleDragOver(e, `${member.id}-${room.id}`)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, member.id, room.id)}
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
                          />
                        ))}

                        {/* Add shift button (appears on hover when no shifts) */}
                        {memberShifts.length === 0 && !isDragging && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 text-xs text-muted-foreground/50 hover:text-muted-foreground opacity-0 hover:opacity-100 transition-opacity"
                            onClick={() => onAddShift(member.id, dateStr, room.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add shift
                          </Button>
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
                  <div className="flex border-b border-border bg-amber-500/5">
                    <div className="w-64 shrink-0 p-2 border-r border-border flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-amber-500/20 border-2 border-dashed border-amber-500/50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-700">Open Shifts</p>
                        <p className="text-[10px] text-amber-600">{roomOpenShifts.length} unfilled</p>
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
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

// Shift bar component for timeline
function ShiftBar({ shift, staff, onEdit }: { shift: Shift; staff: StaffMember; onEdit: () => void }) {
  const left = timeToPixels(shift.startTime);
  const width = getShiftWidth(shift.startTime, shift.endTime);
  
  const statusColors = {
    draft: { bg: 'bg-amber-100 dark:bg-amber-900/40', border: 'border-amber-400', text: 'text-amber-800 dark:text-amber-200' },
    published: { bg: 'bg-sky-100 dark:bg-sky-900/40', border: 'border-sky-400', text: 'text-sky-800 dark:text-sky-200' },
    confirmed: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-400', text: 'text-emerald-800 dark:text-emerald-200' },
    completed: { bg: 'bg-slate-100 dark:bg-slate-800/40', border: 'border-slate-400', text: 'text-slate-600 dark:text-slate-300' },
  };

  const colors = statusColors[shift.status];
  const duration = ((timeToSlotIndex(shift.endTime) - timeToSlotIndex(shift.startTime)) * 15 - shift.breakMinutes) / 60;

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
      <div className="mt-2 pt-2 border-t border-white/20">
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize",
          shift.status === 'draft' && "bg-amber-500/20 text-amber-200",
          shift.status === 'published' && "bg-blue-500/20 text-blue-200",
          shift.status === 'confirmed' && "bg-green-500/20 text-green-200",
          shift.status === 'completed' && "bg-gray-500/20 text-gray-200",
        )}>
          {shift.status}
        </span>
      </div>
    </div>
  );

  return (
    <MuiTooltip
      title={tooltipContent}
      placement="top"
      arrow
      enterDelay={200}
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
          "absolute top-2 bottom-2 rounded-lg border-2 cursor-pointer",
          "transition-all duration-200 hover:shadow-lg hover:scale-y-110 hover:z-10",
          "flex items-center gap-1.5 px-2 overflow-hidden",
          colors.bg,
          colors.border,
          shift.status === 'draft' && "border-dashed"
        )}
        style={{ 
          left, 
          width: Math.max(width, 40),
          backgroundColor: `${staff.color}20`,
          borderColor: staff.color,
        }}
        onClick={onEdit}
      >
        <div 
          className="w-1 h-6 rounded-full shrink-0" 
          style={{ backgroundColor: staff.color }} 
        />
        <div className="flex-1 min-w-0">
          <div className={cn("text-xs font-semibold truncate", colors.text)}>
            {shift.startTime} - {shift.endTime}
          </div>
          {width > 100 && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {duration.toFixed(1)}h
              {shift.breakMinutes > 0 && ` • ${shift.breakMinutes}m break`}
            </div>
          )}
        </div>
      </div>
    </MuiTooltip>
  );
}

// Open shift bar component
function OpenShiftBar({ openShift }: { openShift: OpenShift }) {
  const left = timeToPixels(openShift.startTime);
  const width = getShiftWidth(openShift.startTime, openShift.endTime);

  const urgencyColors = {
    low: 'border-slate-400 bg-slate-100/50 dark:bg-slate-800/30',
    medium: 'border-amber-500 bg-amber-100/50 dark:bg-amber-900/30',
    high: 'border-orange-500 bg-orange-100/50 dark:bg-orange-900/30',
    critical: 'border-red-500 bg-red-100/50 dark:bg-red-900/30 animate-pulse',
  };

  return (
    <div
      className={cn(
        "absolute top-2 bottom-2 rounded-lg border-2 border-dashed",
        "flex items-center justify-center gap-1 px-2",
        urgencyColors[openShift.urgency]
      )}
      style={{ left, width: Math.max(width, 60) }}
    >
      <AlertCircle className={cn(
        "h-4 w-4",
        openShift.urgency === 'critical' && "text-red-500",
        openShift.urgency === 'high' && "text-orange-500",
        openShift.urgency === 'medium' && "text-amber-500",
        openShift.urgency === 'low' && "text-muted-foreground",
      )} />
      <span className="text-xs font-medium text-foreground">
        {openShift.startTime}-{openShift.endTime}
      </span>
      <Badge 
        variant={openShift.urgency === 'critical' ? 'destructive' : 'outline'} 
        className="text-[8px] capitalize ml-1"
      >
        {openShift.urgency}
      </Badge>
    </div>
  );
}
