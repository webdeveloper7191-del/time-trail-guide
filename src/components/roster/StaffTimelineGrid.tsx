import { useState } from 'react';
import { Shift, OpenShift, Centre, StaffMember, DemandData, RosterComplianceFlag, roleLabels } from '@/types/roster';
import { ShiftCard, OpenShiftCard } from './ShiftCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  AlertTriangle, 
  Clock,
  GripVertical,
  User
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
  onAddShift: (staffId: string, date: string) => void;
  onDragStart: (e: React.DragEvent, staff: StaffMember) => void;
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
}: StaffTimelineGridProps) {
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const isCompact = viewMode === 'fortnight' || viewMode === 'month';

  // Get scheduled staff (those with shifts in this centre)
  const scheduledStaffIds = new Set(
    shifts.filter(s => s.centreId === centre.id).map(s => s.staffId)
  );
  
  // Staff to display in grid - all staff that prefer this centre or have shifts here
  const displayStaff = staff.filter(s => 
    scheduledStaffIds.has(s.id) || 
    s.preferredCentres.includes(centre.id) ||
    s.preferredCentres.length === 0
  );

  const getShiftsForStaffDay = (staffId: string, date: string) => {
    return shifts.filter(s => s.staffId === staffId && s.date === date && s.centreId === centre.id);
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

  const handleDragOver = (e: React.DragEvent, staffId: string, date: string) => {
    e.preventDefault();
    setDragOverCell(`${staffId}-${date}`);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, staffId: string, date: string) => {
    e.preventDefault();
    setDragOverCell(null);
    
    // For now, use first room as default - could add room selector
    const defaultRoomId = centre.rooms[0]?.id;
    if (defaultRoomId) {
      onDropStaff(staffId, defaultRoomId, date);
    }
  };

  const handleShiftDragStart = (e: React.DragEvent, shift: Shift) => {
    e.dataTransfer.setData('staffId', shift.staffId);
    e.dataTransfer.setData('shiftId', shift.id);
    e.dataTransfer.setData('dragType', 'shift');
  };

  // Group staff by role for display
  const groupedStaff = displayStaff.reduce((acc, member) => {
    if (!acc[member.role]) acc[member.role] = [];
    acc[member.role].push(member);
    return acc;
  }, {} as Record<string, StaffMember[]>);

  // Flatten for display but keep role context
  const orderedStaff = Object.entries(groupedStaff).flatMap(([role, members]) => 
    members.map(m => ({ ...m, roleGroup: role }))
  );

  return (
    <div className="flex-1 overflow-hidden bg-background">
      <ScrollArea className="h-full">
        <div className="min-w-max">
          {/* Header row with dates */}
          <div className="flex sticky top-0 z-20 bg-card border-b border-border">
            <div className="w-52 shrink-0 p-3 font-medium text-sm text-muted-foreground border-r border-border bg-muted/50">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Employee</span>
              </div>
            </div>
            {dates.map((date) => (
              <div 
                key={date.toISOString()} 
                className={cn(
                  "flex-1 min-w-[140px] p-3 text-center border-r border-border bg-muted/50",
                  isCompact && "min-w-[100px] p-2"
                )}
              >
                <div className="text-sm font-medium text-foreground">
                  {format(date, isCompact ? 'EEE' : 'EEE')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(date, 'd MMM')}
                </div>
              </div>
            ))}
            <div className="w-20 shrink-0 p-3 text-center font-medium text-sm text-muted-foreground bg-muted/50 border-r border-border">
              Total
            </div>
          </div>

          {/* Staff rows */}
          {orderedStaff.map((member, idx) => {
            const overtimeStatus = getOvertimeStatus(member);
            const weeklyHours = calculateStaffWeeklyHours(member.id);
            const prevMember = orderedStaff[idx - 1];
            const showRoleDivider = !prevMember || prevMember.role !== member.role;

            return (
              <div key={member.id}>
                {/* Role group divider */}
                {showRoleDivider && (
                  <div className="flex bg-muted/30 border-b border-border">
                    <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {roleLabels[member.role as keyof typeof roleLabels]}
                    </div>
                  </div>
                )}
                
                <div className="flex border-b border-border hover:bg-muted/20 transition-colors">
                  {/* Staff info cell */}
                  <div 
                    className="w-52 shrink-0 p-2 border-r border-border bg-card flex items-center gap-2 cursor-grab"
                    draggable
                    onDragStart={(e) => onDragStart(e, member)}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                    <div 
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
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
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className={cn(
                          overtimeStatus === 'overtime' && "text-destructive font-medium",
                          overtimeStatus === 'near-limit' && "text-amber-500"
                        )}>
                          {member.currentWeeklyHours}h
                        </span>
                        {overtimeStatus === 'overtime' && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 ml-1">OT</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Day cells */}
                  {dates.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const cellKey = `${member.id}-${dateStr}`;
                    const cellShifts = getShiftsForStaffDay(member.id, dateStr);
                    const isDragOver = dragOverCell === cellKey;

                    return (
                      <div
                        key={cellKey}
                        className={cn(
                          "flex-1 min-w-[140px] p-1.5 border-r border-border relative",
                          "transition-colors duration-150",
                          isDragOver && "bg-primary/10",
                          isCompact && "min-w-[100px] p-1"
                        )}
                        onDragOver={(e) => handleDragOver(e, member.id, dateStr)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, member.id, dateStr)}
                      >
                        <div className="space-y-1">
                          {cellShifts.map((shift) => (
                            <StaffShiftCard
                              key={shift.id}
                              shift={shift}
                              room={centre.rooms.find(r => r.id === shift.roomId)}
                              onEdit={() => onShiftEdit(shift)}
                              onDelete={() => onShiftDelete(shift.id)}
                              onDragStart={handleShiftDragStart}
                              isCompact={isCompact}
                            />
                          ))}
                        </div>

                        {/* Add shift button - shows on hover */}
                        {cellShifts.length === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full h-8 text-xs text-muted-foreground/50 hover:text-muted-foreground",
                              "border border-dashed border-transparent hover:border-muted-foreground/30",
                              "opacity-0 hover:opacity-100 transition-opacity"
                            )}
                            onClick={() => onAddShift(member.id, dateStr)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {/* Total hours cell */}
                  <div className="w-20 shrink-0 p-2 text-center border-r border-border bg-card flex items-center justify-center">
                    <span className={cn(
                      "text-sm font-semibold",
                      weeklyHours > member.maxHoursPerWeek && "text-destructive",
                      weeklyHours > 0 && weeklyHours <= member.maxHoursPerWeek && "text-primary"
                    )}>
                      {weeklyHours}h
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {orderedStaff.length === 0 && (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No staff available for this centre</p>
                <p className="text-xs mt-1">Add staff members or adjust filters</p>
              </div>
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

// Simplified shift card for staff-based view
interface StaffShiftCardProps {
  shift: Shift;
  room?: { name: string; id: string };
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent, shift: Shift) => void;
  isCompact?: boolean;
}

function StaffShiftCard({ 
  shift, 
  room, 
  onEdit, 
  onDelete, 
  onDragStart,
  isCompact = false 
}: StaffShiftCardProps) {
  const duration = calculateDuration(shift.startTime, shift.endTime, shift.breakMinutes);
  
  const statusColors = {
    draft: 'bg-amber-500/10 border-amber-500/50 text-amber-700',
    published: 'bg-primary/10 border-primary/50 text-primary',
    confirmed: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700',
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
              <>
                <div className="text-[10px] opacity-80 truncate">
                  {room?.name || 'Unassigned'}
                </div>
                <div className="text-[10px] opacity-60 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {shift.breakMinutes}m break
                </div>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-1">
            <p className="font-medium">{shift.startTime} - {shift.endTime}</p>
            <p className="text-xs text-muted-foreground">{room?.name}</p>
            <p className="text-xs text-muted-foreground">
              Duration: {duration}h • Break: {shift.breakMinutes}m
            </p>
            <p className="text-xs capitalize">{shift.status}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function calculateDuration(start: string, end: string, breakMinutes: number): number {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM) - breakMinutes;
  return Math.round(totalMinutes / 60 * 10) / 10;
}
