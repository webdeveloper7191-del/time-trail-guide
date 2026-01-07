import { useState } from 'react';
import { Shift, OpenShift, Centre, Room, StaffMember, DemandData, RosterComplianceFlag, ageGroupLabels, ShiftTemplate } from '@/types/roster';
import { ShiftCard, OpenShiftCard } from './ShiftCard';
import { DemandHistogram } from './DemandHistogram';
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
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
  lowDemandDays?: Set<string>;
  onDropStaff: (staffId: string, roomId: string, date: string, timeSlot?: string) => void;
  onShiftEdit: (shift: Shift) => void;
  onShiftDelete: (shiftId: string) => void;
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
  lowDemandDays = new Set(),
  onDropStaff,
  onShiftEdit,
  onShiftDelete,
  onOpenShiftFill,
  onAddShift,
  onUnassignStaff,
  onOpenShiftTemplateManager,
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
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="min-w-max">
          {/* Header row with dates */}
          <div className="flex sticky top-0 z-20 bg-background border-b border-border">
            <div className="w-36 shrink-0 p-3 font-medium text-sm text-muted-foreground border-r border-border bg-muted/30">
              Room
            </div>
            {dates.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isLowDemand = lowDemandDays.has(dateStr);
              
              return (
                <div 
                  key={date.toISOString()} 
                  className={cn(
                    "flex-1 min-w-[160px] p-2 text-center border-r border-border bg-muted/30",
                    isCompact && "min-w-[100px]",
                    isLowDemand && "bg-muted/60"
                  )}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-sm font-medium text-foreground">
                      {format(date, isCompact ? 'EEE' : 'EEEE')}
                    </span>
                    {isLowDemand && (
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
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(date, isCompact ? 'MMM d' : 'MMMM d, yyyy')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Room rows */}
          {centre.rooms.map((room) => (
            <div key={room.id} className="flex border-b border-border">
              {/* Room label */}
              <div className="w-36 shrink-0 p-2 border-r border-border bg-card">
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
                const isLowDemand = lowDemandDays.has(dateStr);

                return (
                  <div
                    key={cellKey}
                    className={cn(
                      "flex-1 min-w-[160px] p-2 border-r border-border relative",
                      "transition-colors duration-150",
                      isDragOver && "bg-primary/10",
                      isCompact && "min-w-[100px] p-1",
                      isLowDemand && "bg-muted/30"
                    )}
                    onDragOver={(e) => handleDragOver(e, room.id, dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, room.id, dateStr)}
                  >
                    {/* Demand histogram overlay */}
                    {showDemandOverlay && (
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
                        <ShiftCard
                          key={shift.id}
                          shift={shift}
                          staff={staff.find(s => s.id === shift.staffId)}
                          onEdit={onShiftEdit}
                          onDelete={onShiftDelete}
                          onDragStart={handleShiftDragStart}
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
