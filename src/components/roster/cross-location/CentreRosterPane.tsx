import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Centre, Shift, OpenShift, StaffMember, roleLabels } from '@/types/roster';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

interface CentreRosterPaneProps {
  centre: Centre;
  shifts: Shift[];
  openShifts: OpenShift[];
  staff: StaffMember[];
  dates: Date[];
  onRemovePane: () => void;
  onAssignStaff: (staffId: string, centreId: string, roomId: string, date: string) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function CentreRosterPane({
  centre,
  shifts,
  openShifts,
  staff,
  dates,
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
        'flex flex-col h-full border border-border rounded-lg overflow-hidden transition-all',
        isDragOver && 'border-primary border-2 shadow-lg shadow-primary/10 bg-primary/5'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-foreground truncate">{centre.name}</h4>
            <p className="text-[10px] text-muted-foreground">
              {centre.operatingHours.start} – {centre.operatingHours.end}
            </p>
          </div>
        </div>
        <button
          onClick={onRemovePane}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

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

      {/* Roster Grid - Rooms × Dates */}
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

              {/* Day columns */}
              {expanded && (
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
                              onAssignStaff(staffId, centre.id, room.id, dateStr);
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
