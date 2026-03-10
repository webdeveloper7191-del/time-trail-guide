import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Centre, Shift, OpenShift, StaffMember, ViewMode, roleLabels } from '@/types/roster';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Users,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  MoreHorizontal,
  Edit,
  Copy,
  ArrowLeftRight,
  Trash2,
} from 'lucide-react';

interface CentreRosterPaneProps {
  centre: Centre;
  shifts: Shift[];
  openShifts: OpenShift[];
  staff: StaffMember[];
  dates: Date[];
  viewMode?: ViewMode;
  onRemovePane: () => void;
  onAssignStaff: (staffId: string, centreId: string, roomId: string, date: string) => void;
  onShiftClick?: (shift: Shift) => void;
  onShiftDelete?: (shiftId: string) => void;
  onShiftCopy?: (shift: Shift) => void;
  onShiftSwap?: (shift: Shift) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/** Generate 15-min time slots between start and end (HH:mm strings) */
function generateTimeSlots(start: string, end: string): string[] {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const slots: string[] = [];
  for (let m = startMin; m < endMin; m += 15) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

/** Check if a shift overlaps a given 15-min slot */
function shiftCoversSlot(shift: { startTime: string; endTime: string }, slotTime: string): boolean {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const slot = toMin(slotTime);
  return slot >= toMin(shift.startTime) && slot < toMin(shift.endTime);
}

/** Get how many consecutive 15-min slots a shift spans from a given start slot */
function getShiftSpan(shift: { startTime: string; endTime: string }, slots: string[]): { startIdx: number; span: number } {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const sMin = toMin(shift.startTime);
  const eMin = toMin(shift.endTime);
  const startIdx = slots.findIndex((s) => toMin(s) >= sMin);
  const endIdx = slots.findIndex((s) => toMin(s) >= eMin);
  return {
    startIdx: startIdx === -1 ? 0 : startIdx,
    span: (endIdx === -1 ? slots.length : endIdx) - (startIdx === -1 ? 0 : startIdx),
  };
}

export function CentreRosterPane({
  centre,
  shifts,
  openShifts,
  staff,
  dates,
  viewMode = 'workweek',
  onRemovePane,
  onAssignStaff,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  collapsed = false,
  onToggleCollapse,
}: CentreRosterPaneProps) {
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(
    new Set(centre.rooms.map((r) => r.id))
  );

  const centreShifts = useMemo(
    () => shifts.filter((s) => s.centreId === centre.id),
    [shifts, centre.id]
  );
  const centreOpenShifts = useMemo(
    () => openShifts.filter((os) => os.centreId === centre.id),
    [openShifts, centre.id]
  );

  const dateStrings = useMemo(() => dates.map((d) => format(d, 'yyyy-MM-dd')), [dates]);

  const isDayView = viewMode === 'day' && dates.length === 1;

  const timeSlots = useMemo(() => {
    if (!isDayView) return [];
    return generateTimeSlots(centre.operatingHours.start, centre.operatingHours.end);
  }, [isDayView, centre.operatingHours]);

  const stats = useMemo(() => {
    const assignedStaffIds = new Set(centreShifts.map((s) => s.staffId));
    const totalHours = centreShifts.reduce((sum, s) => {
      const start = parseInt(s.startTime.split(':')[0]) + parseInt(s.startTime.split(':')[1]) / 60;
      const end = parseInt(s.endTime.split(':')[0]) + parseInt(s.endTime.split(':')[1]) / 60;
      return sum + (end - start) - (s.breakMinutes || 0) / 60;
    }, 0);
    return {
      staffCount: assignedStaffIds.size,
      shiftCount: centreShifts.length,
      openCount: centreOpenShifts.length,
      totalHours: Math.round(totalHours * 10) / 10,
    };
  }, [centreShifts, centreOpenShifts]);

  const toggleRoom = (roomId: string) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      next.has(roomId) ? next.delete(roomId) : next.add(roomId);
      return next;
    });
  };

  return (
    <div
      className={cn(
        'flex flex-col border border-border rounded-lg overflow-hidden transition-all',
        isDragOver && 'border-primary border-2 shadow-lg shadow-primary/10 bg-primary/5'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer" onClick={onToggleCollapse}>
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-foreground truncate">{centre.name}</h4>
            <p className="text-[10px] text-muted-foreground">
              {centre.operatingHours.start} – {centre.operatingHours.end}
              {isDayView && ` · ${format(dates[0], 'EEE d MMM')}`}
            </p>
          </div>
          {collapsed && (
            <div className="flex items-center gap-2 ml-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {stats.staffCount}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {stats.totalHours}h
              </span>
              {stats.openCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <AlertTriangle className="h-3 w-3" /> {stats.openCount} open
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onRemovePane}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Stats bar */}
          <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/30 border-b border-border text-[11px]">
            <span className="flex items-center gap-1 text-foreground">
              <Users className="h-3 w-3 text-muted-foreground" />
              {stats.staffCount} staff
            </span>
            <span className="flex items-center gap-1 text-foreground">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {stats.totalHours}h
            </span>
            {stats.openCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <AlertTriangle className="h-3 w-3" />
                {stats.openCount} open
              </span>
            )}
          </div>

          {/* Drop zone hint */}
          {isDragOver && (
            <div className="px-3 py-2 bg-primary/10 text-center">
              <p className="text-xs font-medium text-primary">
                Drop to assign staff to {centre.name}
              </p>
            </div>
          )}

          {/* Roster Grid */}
          <div className="flex-1 overflow-auto">
            {centre.rooms.map((room) => {
              const roomShifts = centreShifts.filter((s) => s.roomId === room.id);
              const roomOpenShifts = centreOpenShifts.filter((os) => os.roomId === room.id);
              const expanded = expandedRooms.has(room.id);

              return (
                <div key={room.id} className="border-b border-border last:border-0">
                  {/* Room header */}
                  <button
                    onClick={() => toggleRoom(room.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 transition-colors"
                  >
                    {expanded ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: room.color || 'hsl(var(--primary))' }}
                    />
                    <span className="text-xs font-medium text-foreground">{room.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {roomShifts.length} shifts
                    </span>
                    {roomOpenShifts.length > 0 && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                        {roomOpenShifts.length} open
                      </Badge>
                    )}
                  </button>

                  {/* Content: Day timeline or multi-day grid */}
                  {expanded && isDayView ? (
                    <DayTimelineContent
                      room={room}
                      roomShifts={roomShifts.filter((s) => s.date === dateStrings[0])}
                      roomOpenShifts={roomOpenShifts.filter((os) => os.date === dateStrings[0])}
                      staff={staff}
                      timeSlots={timeSlots}
                      centreId={centre.id}
                      dateStr={dateStrings[0]}
                      onAssignStaff={onAssignStaff}
                    />
                  ) : expanded ? (
                    <MultiDayGridContent
                      room={room}
                      roomShifts={roomShifts}
                      roomOpenShifts={roomOpenShifts}
                      staff={staff}
                      dates={dates}
                      dateStrings={dateStrings}
                      centreId={centre.id}
                      onAssignStaff={onAssignStaff}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Day Timeline Sub-component ── */

interface DayTimelineContentProps {
  room: Centre['rooms'][0];
  roomShifts: Shift[];
  roomOpenShifts: OpenShift[];
  staff: StaffMember[];
  timeSlots: string[];
  centreId: string;
  dateStr: string;
  onAssignStaff: (staffId: string, centreId: string, roomId: string, date: string) => void;
}

function DayTimelineContent({
  room,
  roomShifts,
  roomOpenShifts,
  staff,
  timeSlots,
  centreId,
  dateStr,
  onAssignStaff,
}: DayTimelineContentProps) {
  // Build shift bars with position info
  const shiftBars = useMemo(() => {
    return roomShifts.map((shift) => {
      const { startIdx, span } = getShiftSpan(shift, timeSlots);
      const staffMember = staff.find((s) => s.id === shift.staffId);
      return { shift, startIdx, span, staffMember };
    });
  }, [roomShifts, timeSlots, staff]);

  const openBars = useMemo(() => {
    return roomOpenShifts.map((os) => {
      const { startIdx, span } = getShiftSpan(os, timeSlots);
      return { openShift: os, startIdx, span };
    });
  }, [roomOpenShifts, timeSlots]);

  return (
    <div className="px-2 pb-2 overflow-x-auto">
      {/* Time header */}
      <div className="flex border-b border-border/50">
        {timeSlots.map((slot, i) => {
          const isHour = slot.endsWith(':00');
          return (
            <div
              key={i}
              className={cn(
                'flex-shrink-0 text-center border-r border-border/20',
                isHour ? 'border-r-border/50' : ''
              )}
              style={{ width: 40, minWidth: 40 }}
            >
              {isHour && (
                <span className="text-[9px] text-muted-foreground font-medium">
                  {slot}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Shift bars - entire area is droppable */}
      <div
        className="relative"
        style={{ minHeight: Math.max(28, (shiftBars.length + openBars.length) * 24 + 4) }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const staffId = e.dataTransfer.getData('text/staff-id');
          if (staffId) onAssignStaff(staffId, centreId, room.id, dateStr);
        }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 flex pointer-events-none">
          {timeSlots.map((slot, i) => (
            <div
              key={i}
              className={cn(
                'flex-shrink-0 border-r',
                slot.endsWith(':00') ? 'border-border/30' : 'border-border/10'
              )}
              style={{ width: 40, minWidth: 40 }}
            />
          ))}
        </div>

        {/* Assigned shift bars */}
        {shiftBars.map(({ shift, startIdx, span, staffMember }, rowIdx) => {
          const initials = staffMember?.name
            .split(' ')
            .map((n) => n[0])
            .join('') || '?';
          return (
            <div
              key={shift.id}
              className="absolute flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-primary/15 text-primary border border-primary/20 truncate cursor-default pointer-events-none"
              style={{
                left: startIdx * 40,
                width: span * 40 - 2,
                top: rowIdx * 24 + 2,
                height: 20,
              }}
              title={`${staffMember?.name} · ${shift.startTime}–${shift.endTime}`}
            >
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0"
                style={{ backgroundColor: staffMember?.color || 'hsl(var(--primary))' }}
              >
                {initials}
              </div>
              <span className="truncate font-medium">{staffMember?.name}</span>
              <span className="text-muted-foreground ml-auto flex-shrink-0">
                {shift.startTime}–{shift.endTime}
              </span>
            </div>
          );
        })}

        {/* Open shift bars */}
        {openBars.map(({ openShift, startIdx, span }, idx) => (
          <div
            key={openShift.id}
            className="absolute flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/20 border-dashed truncate pointer-events-none"
            style={{
              left: startIdx * 40,
              width: span * 40 - 2,
              top: (shiftBars.length + idx) * 24 + 2,
              height: 20,
            }}
          >
            <Plus className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="truncate">Open {openShift.startTime}–{openShift.endTime}</span>
          </div>
        ))}

        {/* Empty state hint */}
        {shiftBars.length === 0 && openBars.length === 0 && (
          <div className="flex items-center justify-center h-7 text-muted-foreground/30">
            <Plus className="h-3 w-3 mr-1" />
            <span className="text-[9px]">Drop staff here</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Multi-Day Grid Sub-component ── */

interface MultiDayGridContentProps {
  room: Centre['rooms'][0];
  roomShifts: Shift[];
  roomOpenShifts: OpenShift[];
  staff: StaffMember[];
  dates: Date[];
  dateStrings: string[];
  centreId: string;
  onAssignStaff: (staffId: string, centreId: string, roomId: string, date: string) => void;
}

function MultiDayGridContent({
  room,
  roomShifts,
  roomOpenShifts,
  staff,
  dates,
  dateStrings,
  centreId,
  onAssignStaff,
}: MultiDayGridContentProps) {
  return (
    <div className="px-2 pb-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${dates.length}, 1fr)` }}>
        {/* Day headers */}
        {dates.map((date, i) => (
          <div key={i} className="text-center text-[9px] text-muted-foreground font-medium py-0.5">
            {format(date, 'EEE')}
            <br />
            {format(date, 'd')}
          </div>
        ))}

        {/* Shift cells */}
        {dateStrings.map((dateStr, i) => {
          const dayShifts = roomShifts.filter((s) => s.date === dateStr);
          const dayOpen = roomOpenShifts.filter((os) => os.date === dateStr);

          return (
            <div
              key={i}
              className={cn(
                'min-h-[36px] rounded border border-dashed border-border/50 p-0.5',
                'flex flex-col gap-0.5'
              )}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const staffId = e.dataTransfer.getData('text/staff-id');
                if (staffId) {
                  onAssignStaff(staffId, centreId, room.id, dateStr);
                }
              }}
            >
              {dayShifts.map((shift) => {
                const staffMember = staff.find((s) => s.id === shift.staffId);
                const initials = staffMember?.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('') || '?';
                return (
                  <div
                    key={shift.id}
                    className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] bg-primary/10 text-primary truncate"
                    title={`${staffMember?.name} · ${shift.startTime}-${shift.endTime}`}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0"
                      style={{ backgroundColor: staffMember?.color || 'hsl(var(--primary))' }}
                    >
                      {initials}
                    </div>
                    <span className="truncate">{shift.startTime}</span>
                  </div>
                );
              })}
              {dayOpen.map((os) => (
                <div
                  key={os.id}
                  className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-600 truncate"
                >
                  <Plus className="h-2.5 w-2.5" />
                  <span className="truncate">{os.startTime}</span>
                </div>
              ))}
              {dayShifts.length === 0 && dayOpen.length === 0 && (
                <div className="flex items-center justify-center h-full text-muted-foreground/30">
                  <Plus className="h-3 w-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
