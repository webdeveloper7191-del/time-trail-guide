import { useState } from 'react';
import { Shift, OpenShift, Centre, Room, StaffMember, DemandData, RosterComplianceFlag, ageGroupLabels } from '@/types/roster';
import { ShiftCard, OpenShiftCard } from './ShiftCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

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
  onDropStaff: (staffId: string, roomId: string, date: string, timeSlot?: string) => void;
  onShiftEdit: (shift: Shift) => void;
  onShiftDelete: (shiftId: string) => void;
  onOpenShiftFill: (openShift: OpenShift) => void;
  onAddShift: (roomId: string, date: string) => void;
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
  onDropStaff,
  onShiftEdit,
  onShiftDelete,
  onOpenShiftFill,
  onAddShift,
}: TimelineGridProps) {
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const isCompact = viewMode === 'fortnight' || viewMode === 'month';

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
    
    // Simple calculation: count unique staff
    const staffCount = new Set(cellShifts.map(s => s.staffId)).size;
    
    // Get peak booked children
    const peakChildren = cellDemand.reduce((max, d) => Math.max(max, d.bookedChildren), 0);
    
    // Calculate required staff based on ratio
    const requiredStaff = Math.ceil(peakChildren / room.requiredRatio);
    
    // Average utilization
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

  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="min-w-max">
          {/* Header row with dates */}
          <div className="flex sticky top-0 z-20 bg-background border-b border-border">
            <div className="w-40 shrink-0 p-3 font-medium text-sm text-muted-foreground border-r border-border bg-muted/30">
              Room
            </div>
            {dates.map((date) => (
              <div 
                key={date.toISOString()} 
                className={cn(
                  "flex-1 min-w-[180px] p-3 text-center border-r border-border bg-muted/30",
                  isCompact && "min-w-[120px]"
                )}
              >
                <div className="text-sm font-medium text-foreground">
                  {format(date, isCompact ? 'EEE' : 'EEEE')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(date, isCompact ? 'MMM d' : 'MMMM d, yyyy')}
                </div>
              </div>
            ))}
          </div>

          {/* Room rows */}
          {centre.rooms.map((room) => (
            <div key={room.id} className="flex border-b border-border">
              {/* Room label */}
              <div className="w-40 shrink-0 p-3 border-r border-border bg-card">
                <div className="font-medium text-sm text-foreground">{room.name}</div>
                <div className="text-xs text-muted-foreground">
                  {ageGroupLabels[room.ageGroup]}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
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

                return (
                  <div
                    key={cellKey}
                    className={cn(
                      "flex-1 min-w-[180px] p-2 border-r border-border relative",
                      "transition-colors duration-150",
                      isDragOver && "bg-primary/10",
                      isCompact && "min-w-[120px] p-1"
                    )}
                    onDragOver={(e) => handleDragOver(e, room.id, dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, room.id, dateStr)}
                  >
                    {/* Demand overlay */}
                    {showDemandOverlay && (
                      <div className="absolute top-1 right-1 flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-[10px] px-1.5",
                                  metrics.avgUtilization >= 90 && "border-emerald-500 text-emerald-600 bg-emerald-500/10",
                                  metrics.avgUtilization >= 70 && metrics.avgUtilization < 90 && "border-amber-500 text-amber-600 bg-amber-500/10",
                                  metrics.avgUtilization < 70 && "border-muted-foreground"
                                )}
                              >
                                {metrics.avgUtilization}%
                                {metrics.avgUtilization >= 90 ? (
                                  <TrendingUp className="h-2.5 w-2.5 ml-0.5" />
                                ) : metrics.avgUtilization < 70 ? (
                                  <TrendingDown className="h-2.5 w-2.5 ml-0.5" />
                                ) : (
                                  <Minus className="h-2.5 w-2.5 ml-0.5" />
                                )}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <p>Avg. Utilisation: {metrics.avgUtilization}%</p>
                                <p>Peak Children: {metrics.peakChildren}</p>
                                <p>Staff Rostered: {metrics.staffCount}</p>
                                <p>Staff Required: {metrics.requiredStaff}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}

                    {/* Compliance flags indicator */}
                    {cellFlags.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute top-1 left-1">
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

                    {/* Shifts */}
                    <div className={cn(
                      "space-y-1.5 mt-6",
                      isCompact && "space-y-1 mt-4"
                    )}>
                      {cellShifts.map((shift) => (
                        <ShiftCard
                          key={shift.id}
                          shift={shift}
                          staff={staff.find(s => s.id === shift.staffId)}
                          onEdit={onShiftEdit}
                          onDelete={onShiftDelete}
                          isCompact={isCompact}
                        />
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full mt-2 h-7 text-xs text-muted-foreground hover:text-foreground",
                        "border border-dashed border-muted-foreground/30 hover:border-primary/50",
                        "opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                      )}
                      onClick={() => onAddShift(room.id, dateStr)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
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
