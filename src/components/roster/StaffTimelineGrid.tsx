import { useState, useMemo, useCallback } from 'react';
import { Shift, OpenShift, Centre, StaffMember, DemandData, RosterComplianceFlag, ageGroupLabels, qualificationLabels, roleLabels, ShiftTemplate, timeOffTypeLabels, defaultShiftTemplates, ShiftSpecialType } from '@/types/roster';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { InlineDemandChart } from './InlineDemandChart';
import { RoomColorPaletteSelector, colorPalettes, ColorPalette } from './RoomColorPaletteSelector';
import { useShiftCost } from '@/hooks/useShiftCost';
import {
  Plus,
  Clock,
  GripVertical,
  User,
  AlertCircle,
  AlertTriangle,
  DollarSign,
  Pin,
  PinOff,
  Palmtree,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  ChevronsDownUp,
  ChevronsUpDown,
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
  Phone,
  Moon,
  Zap,
  PhoneCall,
  Building2,
  Send,
  UserX,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { 
  getHolidaysForDate, 
  getEventsForDate, 
  eventTypeConfig 
} from '@/data/mockHolidaysEvents';
import { StaffAvailabilityOverlay } from './StaffAvailabilityOverlay';

// Empty shift type for unassigned shifts
interface EmptyShift {
  id: string;
  centreId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  template?: ShiftTemplate;
  requiredQualifications?: any[];
  minimumClassification?: string;
  preferredRole?: any;
}

interface StaffTimelineGridProps {
  centre: Centre;
  shifts: Shift[];
  openShifts: OpenShift[];
  staff: StaffMember[];
  demandData: DemandData[];
  complianceFlags: RosterComplianceFlag[];
  dates: Date[];
  viewMode: 'day' | 'week' | 'workweek' | 'fortnight' | 'month';
  showDemandOverlay: boolean;
  showAnalyticsCharts?: boolean;
  demandAnalytics?: DemandAnalyticsData[];
  staffAbsences?: StaffAbsence[];
  shiftTemplates: ShiftTemplate[];
  emptyShifts?: EmptyShift[];

  /** When set, highlight all shifts in the matching recurring series */
  highlightedRecurrenceGroupId?: string | null;
  /** Called when user clicks "View Series" on a recurring shift */
  onViewSeries?: (groupId: string) => void;

  /** Creates a shift by dropping staff onto a specific day cell */
  onDropStaff: (staffId: string, roomId: string, date: string) => void;

  /** Assigns staff into a room section (no shift created) */
  staffRoomAssignments?: Record<string, string>; // staffId -> roomId
  onAssignStaffToRoom?: (staffId: string, roomId: string) => void;
  onRemoveStaffFromRoom?: (staffId: string, roomId: string) => void;

  onShiftEdit: (shift: Shift) => void;
  onShiftDelete: (shiftId: string) => void;
  onShiftCopy?: (shift: Shift) => void;
  onShiftSwap?: (shift: Shift) => void;
  onShiftTypeChange?: (shiftId: string, shiftType: ShiftSpecialType | undefined) => void;
  onOpenShiftFill: (openShift: OpenShift) => void;
  onOpenShiftDelete?: (openShiftId: string) => void;
  onAddOpenShift?: (roomId: string, date: string) => void;
  onAddShift: (staffId: string, date: string, roomId: string, template?: ShiftTemplate) => void;
  onDragStart: (e: React.DragEvent, staff: StaffMember) => void;
  onOpenShiftDrop: (staffId: string, openShift: OpenShift) => void;
  onShiftMove?: (shiftId: string, newDate: string, newRoomId: string) => void;
  onShiftReassign?: (shiftId: string, newStaffId: string, newDate: string, newRoomId: string) => void;
  onStaffClick?: (staff: StaffMember) => void;
  onOpenShiftTemplateManager?: () => void;
  onEmptyShiftClick?: (emptyShift: EmptyShift) => void;
  onDeleteEmptyShift?: (emptyShiftId: string) => void;
  onSendToAgency?: (openShift: OpenShift) => void;
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
  emptyShifts = [],
  highlightedRecurrenceGroupId = null,
  onViewSeries,
  onDropStaff,
  staffRoomAssignments = {},
  onAssignStaffToRoom,
  onRemoveStaffFromRoom,
  onShiftEdit,
  onShiftDelete,
  onShiftCopy,
  onShiftSwap,
  onShiftTypeChange,
  onOpenShiftDelete,
  onAddOpenShift,
  onAddShift,
  onDragStart,
  onOpenShiftDrop,
  onShiftMove,
  onShiftReassign,
  onStaffClick,
  onOpenShiftTemplateManager,
  onEmptyShiftClick,
  onDeleteEmptyShift,
  onSendToAgency,
}: StaffTimelineGridProps) {
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'staff' | 'shift' | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set());
  const [colorPalette, setColorPalette] = useState<ColorPalette>('ocean');
  const [isCostSticky, setIsCostSticky] = useState(true);
  const isCompact = viewMode === 'fortnight' || viewMode === 'month';
  const isMonthView = viewMode === 'month';

  // Use context-aware shift cost calculator
  const { calculateStaffCosts: calculateContextAwareCosts } = useShiftCost();

  // Get dynamic room color based on selected palette
  const getRoomColor = (roomIndex: number): string => {
    const colors = colorPalettes[colorPalette].colors;
    return colors[roomIndex % colors.length];
  };

  const toggleRoomCollapse = (roomId: string) => {
    setCollapsedRooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const allRoomsCollapsed = centre.rooms.length > 0 && centre.rooms.every(room => collapsedRooms.has(room.id));

  const toggleAllRooms = () => {
    if (allRoomsCollapsed) {
      setCollapsedRooms(new Set());
    } else {
      setCollapsedRooms(new Set(centre.rooms.map(room => room.id)));
    }
  };

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'shift' | 'openShift' | 'staffFromRoom';
    id: string;
    staffId?: string;
    roomId?: string;
    staffName?: string;
    roomName?: string;
    shiftInfo?: string;
  } | null>(null);

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

  // Filter open shifts to only those within the visible date range
  const visibleDateStrings = useMemo(() => dates.map(d => format(d, 'yyyy-MM-dd')), [dates]);

  const openShiftsByRoomDate = useMemo(() => {
    const grouped: Record<string, OpenShift[]> = {};
    openShifts.forEach(os => {
      // Only include open shifts that are within the visible date range
      if (!visibleDateStrings.includes(os.date)) return;
      if (!grouped[os.roomId]) grouped[os.roomId] = [];
      grouped[os.roomId].push(os);
    });
    return grouped;
  }, [openShifts, visibleDateStrings]);

  // Group empty shifts by room and date
  const emptyShiftsByRoomDate = useMemo(() => {
    const grouped: Record<string, Record<string, EmptyShift[]>> = {};
    emptyShifts.forEach(es => {
      if (es.centreId !== centre.id) return;
      if (!grouped[es.roomId]) grouped[es.roomId] = {};
      if (!grouped[es.roomId][es.date]) grouped[es.roomId][es.date] = [];
      grouped[es.roomId][es.date].push(es);
    });
    return grouped;
  }, [emptyShifts, centre.id]);

  const getEmptyShiftsForRoomDay = (roomId: string, date: string) => {
    return emptyShiftsByRoomDate[roomId]?.[date] || [];
  };

  const getShiftsForStaffDay = (staffId: string, date: string, roomId: string) => {
    return shifts.filter(s => 
      s.staffId === staffId && s.date === date && s.centreId === centre.id && s.roomId === roomId
    );
  };

  const getOpenShiftsForDay = (roomId: string, date: string) => {
    return openShifts.filter(os => os.roomId === roomId && os.date === date);
  };

  const isStaffOnTimeOff = (member: StaffMember, date: string) => {
    if (!member.timeOff) return null;
    const dateObj = parseISO(date);
    return member.timeOff.find(to => 
      to.status === 'approved' &&
      isWithinInterval(dateObj, { start: parseISO(to.startDate), end: parseISO(to.endDate) })
    );
  };

  // Calculate costs for a staff member using context-aware calculator
  const calculateStaffCosts = useCallback((staffId: string) => {
    const member = staff.find(s => s.id === staffId);
    if (!member) return { regularCost: 0, overtimeCost: 0, penaltyCost: 0, totalCost: 0, totalHours: 0 };

    // Use the context-aware cost calculator with custom rules and rate overrides
    return calculateContextAwareCosts(shifts, member, centre.id);
  }, [shifts, staff, centre.id, calculateContextAwareCosts]);

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

  // Delete confirmation handlers
  const handleRequestDeleteShift = useCallback((shift: Shift, staffMember?: StaffMember) => {
    setDeleteConfirmation({
      type: 'shift',
      id: shift.id,
      shiftInfo: `${shift.startTime}-${shift.endTime} on ${shift.date}`,
      staffName: staffMember?.name,
    });
  }, []);

  const handleRequestDeleteOpenShift = useCallback((openShift: OpenShift, roomName?: string) => {
    setDeleteConfirmation({
      type: 'openShift',
      id: openShift.id,
      shiftInfo: `${openShift.startTime}-${openShift.endTime} on ${openShift.date}`,
      roomName,
    });
  }, []);

  const handleRequestRemoveStaffFromRoom = useCallback((staffId: string, roomId: string, staffMember: StaffMember, roomName: string) => {
    setDeleteConfirmation({
      type: 'staffFromRoom',
      id: staffId,
      staffId,
      roomId,
      staffName: staffMember.name,
      roomName,
    });
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirmation) return;
    
    switch (deleteConfirmation.type) {
      case 'shift':
        onShiftDelete(deleteConfirmation.id);
        break;
      case 'openShift':
        onOpenShiftDelete?.(deleteConfirmation.id);
        break;
      case 'staffFromRoom':
        if (deleteConfirmation.staffId && deleteConfirmation.roomId) {
          onRemoveStaffFromRoom?.(deleteConfirmation.staffId, deleteConfirmation.roomId);
        }
        break;
    }
    setDeleteConfirmation(null);
  }, [deleteConfirmation, onShiftDelete, onOpenShiftDelete, onRemoveStaffFromRoom]);

  const getDeleteConfirmationDetails = () => {
    if (!deleteConfirmation) return { title: '', description: '' };
    
    switch (deleteConfirmation.type) {
      case 'shift':
        return {
          title: 'Delete Shift',
          description: `Are you sure you want to delete the shift ${deleteConfirmation.shiftInfo}${deleteConfirmation.staffName ? ` for ${deleteConfirmation.staffName}` : ''}? This action cannot be undone.`,
        };
      case 'openShift':
        return {
          title: 'Delete Open Shift',
          description: `Are you sure you want to delete the open shift ${deleteConfirmation.shiftInfo}${deleteConfirmation.roomName ? ` in ${deleteConfirmation.roomName}` : ''}? This action cannot be undone.`,
        };
      case 'staffFromRoom':
        return {
          title: 'Remove Staff from Room',
          description: `Are you sure you want to remove ${deleteConfirmation.staffName} from ${deleteConfirmation.roomName}? Their shifts in this room will remain.`,
        };
      default:
        return { title: '', description: '' };
    }
  };

  const confirmationDetails = getDeleteConfirmationDetails();

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden bg-background w-full max-w-full"
      onDragEnd={handleDragEnd}
      onDragEnter={handleGridDragEnter}
    >
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteConfirmation}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
        title={confirmationDetails.title}
        description={confirmationDetails.description}
        onConfirm={handleConfirmDelete}
        confirmLabel={deleteConfirmation?.type === 'staffFromRoom' ? 'Remove' : 'Delete'}
      />

      {/* Scrollable content with sticky header */}
      <div className="flex-1 overflow-y-auto w-full">
        {/* Horizontal scroll lives in its own container so sticky left/right works reliably */}
        <div className="overflow-x-auto w-full relative isolate">
          <div className="min-w-max">
          {/* Header */}
          <div className="flex sticky top-0 z-30 bg-card border-b border-border shadow-md">
            <div className="w-64 shrink-0 p-1 md:p-2 font-medium text-xs lg:text-sm text-muted-foreground border-r border-border bg-muted/50 sticky left-0 z-40 bg-card">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search staff..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    className="h-8 pl-7 pr-2 text-xs bg-background border-border"
                  />
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleAllRooms}
                        className="h-8 w-8 p-0 shrink-0"
                      >
                        {allRoomsCollapsed ? (
                          <ChevronsUpDown className="h-4 w-4" />
                        ) : (
                          <ChevronsDownUp className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{allRoomsCollapsed ? 'Expand All Rooms' : 'Collapse All Rooms'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <RoomColorPaletteSelector 
                  selectedPalette={colorPalette} 
                  onPaletteChange={setColorPalette} 
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
                    "shrink-0 p-1 md:p-2 text-center border-r border-border bg-muted/50",
                    isMonthView
                      ? "w-[60px] md:w-[70px]"
                      : isCompact
                        ? (viewMode === 'fortnight'
                            ? "w-[60px] md:w-[70px] xl:flex-1 xl:min-w-[80px] xl:w-auto"
                            : "w-[60px] md:w-[70px]")
                        : "w-[80px] md:w-[100px] xl:flex-1 xl:min-w-[120px] xl:w-auto",
                    hasPublicHoliday && "bg-destructive/10 border-b-2 border-b-destructive/50"
                  )}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className={cn(
                      "font-medium",
                      viewMode === 'month' ? "text-xs" : "text-sm",
                      hasPublicHoliday ? "text-destructive" : "text-foreground"
                    )}>
                      {format(date, 'EEE')}
                    </span>

                    {/* In month view the header cells are very narrow; collapse all indicators into a single compact marker */}
                    {viewMode === 'month' ? (
                      (hasPublicHoliday || hasSchoolHoliday || hasEvents) && (
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
                                      : "border-muted-foreground/30 bg-muted/30 text-muted-foreground"
                                )}
                                aria-label="Day indicators"
                              >
                                {(() => {
                                  const count = (hasPublicHoliday ? 1 : 0) + (hasSchoolHoliday ? 1 : 0) + (hasEvents ? events.length : 0);
                                  return count > 1 ? String(Math.min(count, 9)) : '•';
                                })()}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1.5">
                                {hasPublicHoliday && (
                                  <div className="text-xs">
                                    <p className="font-medium text-destructive">Public Holiday</p>
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
                      </>
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
            <div
              className={cn(
                "w-24 shrink-0 p-2 text-center font-medium text-sm text-muted-foreground bg-muted/50 border-l border-border",
                isCostSticky && !isMonthView && "sticky right-0 z-40"
              )}
            >
              <div className="flex items-center justify-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Cost</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-1"
                  onClick={() => setIsCostSticky(v => !v)}
                  aria-label={isCostSticky ? 'Unpin Cost column' : 'Pin Cost column'}
                >
                  {isCostSticky ? (
                    <PinOff className="h-3.5 w-3.5" />
                  ) : (
                    <Pin className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Room sections */}
          {centre.rooms.map((room, roomIndex) => {
            const roomStaffIds = staffByRoom[room.id] || new Set();
            const roomStaff = filteredStaff.filter(s => roomStaffIds.has(s.id));
            const roomOpenShifts = openShiftsByRoomDate[room.id] || [];
            const isCollapsed = collapsedRooms.has(room.id);
            const roomColor = getRoomColor(roomIndex);

            // Calculate shifts per day for collapsed view
            const getRoomShiftsForDay = (dateStr: string) => {
              return shifts.filter(s => 
                s.centreId === centre.id && 
                s.roomId === room.id && 
                s.date === dateStr
              );
            };

            const getRoomOpenShiftsForDay = (dateStr: string) => {
              return openShifts.filter(os => 
                os.roomId === room.id && 
                os.date === dateStr
              );
            };

            return (
              <div 
                key={room.id}
                className="animate-fade-in"
                style={{ 
                  borderLeft: `4px solid ${roomColor}`,
                }}
              >
                {/* Room header */}
                <div 
                  className={cn(
                    "flex border-b sticky top-[53px] z-20 shadow-sm cursor-pointer transition-colors",
                    !isCollapsed && "hover:brightness-95"
                  )}
                  style={{ 
                    backgroundColor: `color-mix(in srgb, ${roomColor} 12%, hsl(var(--background)))`,
                    borderBottomColor: `color-mix(in srgb, ${roomColor} 25%, transparent)`,
                  }}
                  onClick={() => toggleRoomCollapse(room.id)}
                >
                  <div
                    data-drop-zone
                    className="w-64 shrink-0 px-3 py-2 flex items-center gap-2 border-r sticky left-0 z-30"
                    style={{ 
                      borderRightColor: `color-mix(in srgb, ${roomColor} 25%, transparent)`,
                      backgroundColor: `color-mix(in srgb, ${roomColor} 12%, hsl(var(--background)))`
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDragOver(e, `room-header-${room.id}`);
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const staffId = e.dataTransfer.getData('staffId');
                      const draggedType = e.dataTransfer.getData('dragType');
                      if (!staffId || draggedType === 'shift') return;

                      setDragOverCell(null);
                      setIsDragging(false);
                      setDragType(null);
                      onAssignStaffToRoom?.(staffId, room.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRoomCollapse(room.id);
                      }}
                      className="p-0.5 rounded hover:bg-black/10 transition-all"
                    >
                      {isCollapsed ? (
                        <ChevronRightIcon className="h-4 w-4 transition-transform" />
                      ) : (
                        <ChevronDown className="h-4 w-4 transition-transform" />
                      )}
                    </button>
                    <Badge 
                      variant="secondary" 
                      className="font-semibold text-xs px-2 py-0.5"
                      style={{ 
                        backgroundColor: roomColor,
                        color: 'white',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                      }}
                    >
                      {room.name}
                    </Badge>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {ageGroupLabels[room.ageGroup]} • 1:{room.requiredRatio} • Cap: {room.capacity}
                      </span>
                    </div>
                  </div>
                  
                  {/* Analytics charts in header row when enabled - only when expanded and not in month view */}
                  {!isCollapsed && showAnalyticsCharts && viewMode !== 'month' && demandAnalytics.length > 0 && dates.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return (
                      <div 
                        key={dateStr} 
                        className={cn(
                          "shrink-0 xl:shrink p-1 border-r",
                          viewMode === 'day'
                            ? "w-[100px] xl:flex-1 xl:min-w-[120px] xl:w-auto"
                            : isCompact
                              ? (viewMode === 'fortnight'
                                  ? "w-[70px] xl:flex-1 xl:min-w-[80px] xl:w-auto"
                                  : "w-[70px]")
                              : "w-[100px] xl:flex-1 xl:min-w-[120px] xl:w-auto"
                        )}
                        style={{ borderRightColor: `color-mix(in srgb, ${roomColor} 25%, transparent)` }}
                        onClick={(e) => e.stopPropagation()}
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
                  
                  {!isCollapsed && showAnalyticsCharts && viewMode !== 'month' && (
                    <div 
                      className="w-24 shrink-0 border-r"
                      style={{ borderRightColor: `color-mix(in srgb, ${roomColor} 25%, transparent)` }}
                    />
                  )}
                  
                  {/* Collapsed day summaries */}
                  {isCollapsed && dates.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayShifts = getRoomShiftsForDay(dateStr);
                    const dayOpenShifts = getRoomOpenShiftsForDay(dateStr);
                    const uniqueStaff = new Set(dayShifts.map(s => s.staffId)).size;
                    const hasOpenShifts = dayOpenShifts.length > 0;
                    
                    // Calculate if understaffed based on room ratio and capacity
                    const requiredStaff = Math.ceil(room.capacity / room.requiredRatio);
                    const isUnderstaffed = uniqueStaff < requiredStaff && uniqueStaff > 0;
                    
                    return (
                      <div 
                        key={dateStr} 
                        className={cn(
                          "shrink-0 xl:shrink border-r flex items-center justify-center",
                          isMonthView
                            ? "w-[60px] md:w-[70px]"
                            : isCompact
                              ? (viewMode === 'fortnight'
                                  ? "w-[70px] xl:flex-1 xl:min-w-[80px] xl:w-auto"
                                  : "w-[70px]")
                              : "w-[100px] xl:flex-1 xl:min-w-[120px] xl:w-auto",
                          isUnderstaffed && "bg-destructive/5"
                        )}
                        style={{ borderRightColor: `color-mix(in srgb, ${roomColor} 25%, transparent)` }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {dayShifts.length > 0 ? (
                          <div className="flex items-center gap-2 py-2 px-1">
                            {/* Warning icon for understaffed */}
                            {isUnderstaffed && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs font-medium text-destructive">Understaffed</p>
                                    <p className="text-xs text-muted-foreground">
                                      {uniqueStaff} of {requiredStaff} required
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            
                            {/* Shift and staff info */}
                            <div className="flex flex-col items-center min-w-0">
                              <div className="flex items-baseline gap-0.5">
                                <span className={cn(
                                  "text-sm font-semibold leading-none",
                                  isUnderstaffed && "text-destructive"
                                )}>
                                  {dayShifts.length}
                                </span>
                                <span className="text-[10px] text-muted-foreground leading-none">shifts</span>
                              </div>
                              <span className={cn(
                                "text-[10px] leading-tight mt-0.5",
                                isUnderstaffed ? "text-destructive font-medium" : "text-muted-foreground"
                              )}>
                                {uniqueStaff}/{requiredStaff} staff
                              </span>
                              {hasOpenShifts && (
                                <Badge 
                                  variant="outline" 
                                  className="text-[9px] px-1.5 py-0 h-4 mt-1 border-amber-400 text-amber-600 bg-amber-50"
                                >
                                  {dayOpenShifts.length} open
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    );
                  })}
                  {isCollapsed && (
                    <div 
                      className={cn(
                        "w-24 shrink-0 flex items-center justify-center border-l bg-card",
                        isCostSticky && !isMonthView && "sticky right-0 z-30"
                      )}
                      style={{ borderLeftColor: `color-mix(in srgb, ${roomColor} 25%, transparent)` }}
                    >
                      <Badge variant="secondary" className="text-xs font-medium">
                        {roomStaff.length} staff
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Collapsible content with animation */}
                <div 
                  className={cn(
                    "overflow-y-hidden overflow-x-visible transition-all duration-300 ease-in-out",
                    isCollapsed ? "max-h-0 opacity-0" : "max-h-[5000px] opacity-100"
                  )}
                >
                  {!isCollapsed && (
                    <>
                {roomStaff.map((member) => {
                  const costs = calculateStaffCosts(member.id);
                  const topQualifications = member.qualifications.slice(0, 2);

                  return (
                    <div key={`${room.id}-${member.id}`} className="flex border-b border-border hover:bg-muted/20 transition-colors">
                      {/* Staff info cell */}
                      <div 
                        className={cn(
                          "w-64 shrink-0 p-2 border-r border-border bg-card flex items-start gap-2 cursor-grab group/staff transition-opacity duration-200 sticky left-0 z-20",
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
                          <div className="flex items-center justify-between">
                            <p 
                              className="text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary hover:underline transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStaffClick?.(member);
                              }}
                            >
                              {member.name}
                            </p>
                            {/* Remove from room menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 opacity-0 group-hover/staff:opacity-100 transition-opacity -mr-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => onStaffClick?.(member)}>
                                  <User className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleRequestRemoveStaffFromRoom(member.id, room.id, member, room.name)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove from Room
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
                              "shrink-0 p-1 border-r border-border relative group/cell",
                              "transition-all duration-200 ease-out",
                              isMonthView
                                ? "w-[60px] md:w-[70px]"
                                : isCompact
                                  ? (viewMode === 'fortnight'
                                      ? "w-[70px] xl:flex-1 xl:min-w-[80px] xl:w-auto"
                                      : "w-[70px]")
                                  : "w-[100px] xl:flex-1 xl:min-w-[120px] xl:w-auto",
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
                                {/* Staff Availability Overlay - shows when no shifts */}
                                {cellShifts.length === 0 && (
                                  <StaffAvailabilityOverlay 
                                    staff={member} 
                                    date={date}
                                    isCompact={isCompact}
                                  />
                                )}
                                
                                <div className="space-y-1 relative z-10">
                                {cellShifts.map((shift) => (
                                    <StaffShiftCard
                                      key={shift.id}
                                      shift={shift}
                                      staff={member}
                                      allStaff={staff}
                                      highlightedRecurrenceGroupId={highlightedRecurrenceGroupId}
                                      onViewSeries={onViewSeries}
                                      onEdit={() => onShiftEdit(shift)}
                                      onDelete={() => handleRequestDeleteShift(shift, member)}
                                      onCopy={onShiftCopy ? () => onShiftCopy(shift) : undefined}
                                      onSwap={onShiftSwap ? () => onShiftSwap(shift) : undefined}
                                      onShiftTypeChange={onShiftTypeChange}
                                      onDragStart={handleShiftDragStart}
                                      isCompact={isCompact}
                                      isMonthView={isMonthView}
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
                      <div
                        className={cn(
                          "w-24 shrink-0 p-1.5 border-l border-border bg-card",
                          isCostSticky && !isMonthView && "sticky right-0 z-30"
                        )}
                      >
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
                  <div className="flex border-b border-amber-200/50 bg-gradient-to-r from-amber-50/80 to-amber-50/40 dark:from-amber-950/30 dark:to-amber-950/10">
                    <div className="w-64 shrink-0 p-3 border-r border-amber-200/50 flex items-center gap-3 sticky left-0 z-20 bg-amber-50/80 dark:bg-amber-950/30">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-amber-100 dark:bg-amber-900/50 shadow-sm">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Open Shifts</p>
                        <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80">Drag staff to fill</p>
                      </div>
                    </div>

                    {dates.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const dayOpenShifts = getOpenShiftsForDay(room.id, dateStr);
                      const cellKey = `open-${room.id}-${dateStr}`;
                      const isDragOver = dragOverCell === cellKey;
                      const hasOpenShifts = dayOpenShifts.length > 0;

                      return (
                        <div
                          key={cellKey}
                          data-drop-zone
                          className={cn(
                            "shrink-0 xl:shrink p-1.5 border-r border-amber-200/30 relative group/open-cell",
                            "transition-all duration-200 ease-out",
                            isMonthView ? "w-[60px] md:w-[70px]" : isCompact ? "min-w-[80px] flex-1" : "min-w-[120px] flex-1",
                            isDragging && hasOpenShifts && "bg-emerald-50/50 dark:bg-emerald-950/20",
                            isDragOver && hasOpenShifts && "bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-inset ring-emerald-500/50"
                          )}
                          onDragOver={(e) => hasOpenShifts && handleDragOver(e, cellKey)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => hasOpenShifts && dayOpenShifts[0] && handleOpenShiftDrop(e, dayOpenShifts[0])}
                        >
                          {isDragOver && hasOpenShifts && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                              <div className="bg-emerald-600 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg animate-scale-in">
                                Fill shift
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            {dayOpenShifts.map((openShift) => (
                              <OpenShiftCard 
                                key={openShift.id} 
                                openShift={openShift} 
                                isCompact={isCompact} 
                                isDragOver={isDragOver} 
                                onDelete={onOpenShiftDelete ? () => handleRequestDeleteOpenShift(openShift, room.name) : undefined}
                                onSendToAgency={onSendToAgency ? () => onSendToAgency(openShift) : undefined}
                              />
                            ))}
                          </div>
                          
                          {/* Quick-add button */}
                          {onAddOpenShift && !isDragging && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => onAddOpenShift(room.id, dateStr)}
                                    className={cn(
                                      "absolute bottom-1 right-1 h-5 w-5 rounded flex items-center justify-center",
                                      "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-800/70",
                                      "text-amber-600 dark:text-amber-400 transition-all duration-200",
                                      "opacity-0 group-hover/open-cell:opacity-100 focus:opacity-100",
                                      "shadow-sm hover:shadow"
                                    )}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="text-xs">Add open shift</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      );
                    })}

                    <div
                      className={cn(
                        "w-24 shrink-0 border-l border-amber-200/30 bg-amber-50/40 dark:bg-amber-950/10",
                        isCostSticky && !isMonthView && "sticky right-0 z-20"
                      )}
                    />
                  </div>
                )}

                {/* Empty Shifts row - shifts without staff assigned */}
                {(() => {
                  const roomEmptyShifts = emptyShifts.filter(es => es.roomId === room.id && es.centreId === centre.id);
                  if (roomEmptyShifts.length === 0) return null;
                  
                  return (
                    <div className="flex border-b border-border bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
                      <div className="w-64 shrink-0 p-2 border-r border-border flex items-center gap-2 sticky left-0 z-20 bg-purple-500/5">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center bg-purple-500/20 border-2 border-dashed border-purple-500/50">
                          <Zap className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Empty Shifts</p>
                          <p className="text-[10px] text-purple-600 dark:text-purple-400">Auto-assign or drop staff</p>
                        </div>
                      </div>

                      {dates.map((date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const dayEmptyShifts = getEmptyShiftsForRoomDay(room.id, dateStr);
                        const cellKey = `empty-${room.id}-${dateStr}`;
                        const isDragOver = dragOverCell === cellKey;

                        return (
                          <div
                            key={cellKey}
                            data-drop-zone
                            className={cn(
                              "shrink-0 xl:shrink p-1 border-r border-border relative",
                              "transition-all duration-200 ease-out",
                              isMonthView
                                ? "w-[60px] md:w-[70px]"
                                : isCompact
                                  ? "min-w-[80px] flex-1"
                                  : "min-w-[120px] flex-1",
                              isDragging && dayEmptyShifts.length > 0 && "bg-purple-500/5",
                              isDragOver && dayEmptyShifts.length > 0 && "bg-purple-500/20 ring-2 ring-inset ring-purple-500/50"
                            )}
                            onDragOver={(e) => dayEmptyShifts.length > 0 && handleDragOver(e, cellKey)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => {
                              if (dayEmptyShifts.length > 0) {
                                e.preventDefault();
                                const staffId = e.dataTransfer.getData('staffId');
                                if (staffId && onEmptyShiftClick) {
                                  // Clicking empty shift will open auto-assign
                                  onEmptyShiftClick(dayEmptyShifts[0]);
                                }
                              }
                            }}
                          >
                            {dayEmptyShifts.map((emptyShift) => (
                              <EmptyShiftCard 
                                key={emptyShift.id} 
                                emptyShift={emptyShift} 
                                isCompact={isCompact}
                                onClick={() => onEmptyShiftClick?.(emptyShift)}
                                onDelete={onDeleteEmptyShift ? () => onDeleteEmptyShift(emptyShift.id) : undefined}
                              />
                            ))}
                          </div>
                        );
                      })}

                      <div
                        className={cn(
                          "w-24 shrink-0 border-l border-border bg-purple-500/5",
                          isCostSticky && !isMonthView && "sticky right-0 z-20"
                        )}
                      />
                    </div>
                  );
                })()}

                {/* Drop zone row for adding new staff to this room - ALWAYS visible */}
                <div 
                  className={cn(
                    "flex border-b transition-colors",
                    isDragging && dragType === 'staff' 
                      ? "bg-gradient-to-r from-sky-50/80 to-sky-50/40 dark:from-sky-950/30 dark:to-sky-950/10 border-sky-200/50" 
                      : "bg-muted/30 border-border/50"
                  )}
                >
                  <div 
                    data-drop-zone
                    className={cn(
                      "w-64 shrink-0 p-3 border-r flex items-center gap-3 transition-colors",
                      isDragging && dragType === 'staff' 
                        ? "border-sky-200/50" 
                        : "border-border/50"
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
                      "h-8 w-8 rounded-lg flex items-center justify-center transition-colors shadow-sm",
                      isDragging && dragType === 'staff'
                        ? "bg-sky-100 dark:bg-sky-900/50"
                        : "bg-muted"
                    )}>
                      <User className={cn(
                        "h-4 w-4 transition-colors",
                        isDragging && dragType === 'staff' ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm font-semibold transition-colors",
                        isDragging && dragType === 'staff' ? "text-sky-800 dark:text-sky-200" : "text-muted-foreground"
                      )}>
                        {isDragging && dragType === 'staff' ? "Drop here" : "Add Staff"}
                      </p>
                      <p className={cn(
                        "text-[10px] transition-colors",
                        isDragging && dragType === 'staff' ? "text-sky-600/80 dark:text-sky-400/80" : "text-muted-foreground/60"
                      )}>
                        {isDragging && dragType === 'staff' 
                          ? `Assign to ${room.name}` 
                          : `Drag staff to ${room.name}`}
                      </p>
                    </div>
                  </div>

                  {dates.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const cellKey = `add-staff-${room.id}-${dateStr}`;
                    const isDragOver = dragOverCell === cellKey;
                    const showDropZone = isDragging && dragType === 'staff';

                    return (
                      <div
                        key={cellKey}
                        data-drop-zone
                        className={cn(
                          "flex-1 p-1.5 border-r relative",
                          "transition-all duration-200 ease-out",
                          isMonthView
                            ? "w-[60px] md:w-[70px]"
                            : isCompact ? "min-w-[80px]" : "min-w-[120px]",
                          showDropZone && !isDragOver && "border-sky-200/30 bg-sky-50/30 dark:bg-sky-950/10",
                          isDragOver && "bg-sky-100 dark:bg-sky-900/40 ring-2 ring-inset ring-sky-500/50",
                          !showDropZone && "border-border/30"
                        )}
                        onDragOver={(e) => {
                          e.preventDefault();
                          handleDragOver(e, cellKey);
                        }}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => {
                          e.preventDefault();
                          const staffId = e.dataTransfer.getData('staffId');
                          const draggedType = e.dataTransfer.getData('dragType');
                          if (staffId && draggedType !== 'shift') {
                            setDragOverCell(null);
                            setIsDragging(false);
                            setDragType(null);
                            onAssignStaffToRoom?.(staffId, room.id);
                          }
                        }}
                      >
                        {showDropZone && !isDragOver && (
                          <div className="absolute inset-1 rounded-md flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center">
                              <Plus className="h-3 w-3 text-sky-500" />
                            </div>
                          </div>
                        )}
                        
                        {isDragOver && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="bg-sky-600 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg animate-scale-in">
                              Add staff
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="w-24 shrink-0 border-r border-border/30" />
                </div>
                  </>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffShiftCard({
  shift,
  staff,
  allStaff,
  highlightedRecurrenceGroupId,
  onViewSeries,
  onEdit,
  onDelete,
  onCopy,
  onSwap,
  onShiftTypeChange,
  onDragStart,
  isCompact = false,
  isMonthView = false,
}: {
  shift: Shift;
  staff?: StaffMember;
  allStaff?: StaffMember[];
  highlightedRecurrenceGroupId?: string | null;
  onViewSeries?: (groupId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy?: () => void;
  onSwap?: () => void;
  onShiftTypeChange?: (shiftId: string, shiftType: ShiftSpecialType | undefined) => void;
  onDragStart: (e: React.DragEvent, shift: Shift) => void;
  isCompact?: boolean;
  isMonthView?: boolean;
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

  const shiftTypeStyles: Record<string, { icon: typeof Phone; color: string; bgColor: string; label: string }> = {
    on_call: { icon: Phone, color: 'text-blue-500', bgColor: 'bg-blue-500/20', label: 'On-Call' },
    sleepover: { icon: Moon, color: 'text-purple-500', bgColor: 'bg-purple-500/20', label: 'Sleepover' },
    broken: { icon: Zap, color: 'text-orange-500', bgColor: 'bg-orange-500/20', label: 'Split' },
    recall: { icon: PhoneCall, color: 'text-red-500', bgColor: 'bg-red-500/20', label: 'Recall' },
  };

  const style = statusStyles[shift.status];
  const shiftTypeInfo = shift.shiftType ? shiftTypeStyles[shift.shiftType] : null;
  const currentType = shift.shiftType || 'regular';

  const seriesId = shift.recurring?.isRecurring ? shift.recurring.recurrenceGroupId : undefined;
  const isSeriesHighlighted = !!seriesId && !!highlightedRecurrenceGroupId && seriesId === highlightedRecurrenceGroupId;
  const shouldDim = !!highlightedRecurrenceGroupId && (!seriesId || seriesId !== highlightedRecurrenceGroupId);

  const handleQuickToggle = (type: ShiftSpecialType, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newType = currentType === type ? undefined : type;
    onShiftTypeChange?.(shift.id, newType);
  };

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

        {shiftTypeInfo && (
          <div className={cn("flex items-center gap-2 px-2 py-1 rounded", shiftTypeInfo.bgColor)}>
            <shiftTypeInfo.icon className={cn("h-4 w-4", shiftTypeInfo.color)} />
            <span className="text-sm text-white">{shiftTypeInfo.label} Shift</span>
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

  // Ultra-compact month view rendering
  if (isMonthView) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              draggable
              onDragStart={(e) => onDragStart(e, shift)}
              onClick={onEdit}
              className={cn(
                "relative rounded border overflow-hidden cursor-pointer transition-all duration-150",
                "hover:shadow-sm hover:scale-105 active:cursor-grabbing",
                style.bg,
                style.border,
                shift.status === 'draft' && "border-dashed",
                shift.isAbsent && "border-destructive/70",
                isSeriesHighlighted && "ring-1 ring-primary/40",
                shouldDim && "opacity-50"
              )}
              style={{
                backgroundImage: shift.isAbsent
                  ? 'repeating-linear-gradient(135deg, hsl(var(--destructive) / 0.10), hsl(var(--destructive) / 0.10) 6px, hsl(var(--destructive) / 0.18) 6px, hsl(var(--destructive) / 0.18) 12px)'
                  : undefined,
              }}
            >
              {/* Left accent bar */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-0.5",
                shift.isAbsent
                  ? "bg-destructive"
                  : (shiftTypeInfo ? shiftTypeInfo.bgColor.replace('/20', '') : style.accent)
              )} />
              
              {/* Absent indicator */}
              {shift.isAbsent && (
                <div className="absolute -top-0.5 -right-0.5 z-20 rounded-full bg-destructive text-destructive-foreground p-0.5 shadow">
                  <UserX className="h-2 w-2" />
                </div>
              )}

              <div className="pl-1.5 pr-1 py-0.5 text-center">
                <div className={cn("text-[9px] font-semibold truncate leading-tight", style.text)}>
                  {shift.startTime.slice(0,5)}
                </div>
                <div className={cn("text-[8px] truncate leading-tight", style.text, "opacity-70")}>
                  {shift.endTime.slice(0,5)}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[200px]">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, shift)}
      className={cn(
        "group relative rounded-lg border overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5 active:cursor-grabbing",
        style.bg,
        style.border,
        shift.status === 'draft' && "border-dashed",
        shift.isAbsent && "border-destructive/70",
        isSeriesHighlighted && "ring-2 ring-primary/40",
        shouldDim && "opacity-50"
      )}
      style={{
        backgroundImage: shift.isAbsent
          ? 'repeating-linear-gradient(135deg, hsl(var(--destructive) / 0.10), hsl(var(--destructive) / 0.10) 10px, hsl(var(--destructive) / 0.18) 10px, hsl(var(--destructive) / 0.18) 20px)'
          : undefined,
      }}
    >
      {/* Left accent bar - colored by shift type if special */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        shift.isAbsent
          ? "bg-destructive"
          : (shiftTypeInfo ? shiftTypeInfo.bgColor.replace('/20', '') : style.accent)
      )} />

      {/* Top-left indicators */}
      <div className="absolute top-1 left-2.5 flex items-center gap-1">
        {/* Shift type indicator */}
        {shiftTypeInfo && (
          <div className={cn("p-0.5 rounded", shiftTypeInfo.bgColor)}>
            <shiftTypeInfo.icon className={cn("h-2.5 w-2.5", shiftTypeInfo.color)} />
          </div>
        )}

      </div>

      {/* Absent indicator */}
      {shift.isAbsent && (
        <div className="absolute -top-1.5 -right-1.5 z-20 rounded-full bg-destructive text-destructive-foreground p-1 shadow">
          <UserX className="h-3 w-3" />
        </div>
      )}

      {/* Three-dot actions */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
          <DropdownMenuContent align="end" className="w-56">
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

            {seriesId && onViewSeries && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewSeries(seriesId);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  View Series
                </DropdownMenuItem>
              </>
            )}

            {onShiftTypeChange && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Zap className="h-4 w-4 mr-2" />
                    Set Shift Type
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={currentType}
                      onValueChange={(value) => onShiftTypeChange(shift.id, value === 'regular' ? undefined : value as ShiftSpecialType)}
                    >
                      <DropdownMenuRadioItem value="regular">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        Regular
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="on_call">
                        <Phone className="h-4 w-4 mr-2 text-blue-500" />
                        On-Call
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="sleepover">
                        <Moon className="h-4 w-4 mr-2 text-purple-500" />
                        Sleepover
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="broken">
                        <Zap className="h-4 w-4 mr-2 text-orange-500" />
                        Split/Broken
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="recall">
                        <PhoneCall className="h-4 w-4 mr-2 text-red-500" />
                        Recall
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
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

      {/* Quick toggle buttons - show at bottom on hover */}
      {onShiftTypeChange && !isCompact && (
        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-background/80 to-transparent py-1 px-2">
          <div className="flex items-center justify-center gap-1">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-5 w-5 p-0",
                      currentType === 'on_call' && "bg-blue-500/30 text-blue-600"
                    )}
                    onClick={(e) => handleQuickToggle('on_call', e)}
                  >
                    <Phone className="h-2.5 w-2.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs py-1 px-2">
                  {currentType === 'on_call' ? 'Remove' : 'On-Call'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-5 w-5 p-0",
                      currentType === 'sleepover' && "bg-purple-500/30 text-purple-600"
                    )}
                    onClick={(e) => handleQuickToggle('sleepover', e)}
                  >
                    <Moon className="h-2.5 w-2.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs py-1 px-2">
                  {currentType === 'sleepover' ? 'Remove' : 'Sleepover'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-5 w-5 p-0",
                      currentType === 'broken' && "bg-orange-500/30 text-orange-600"
                    )}
                    onClick={(e) => handleQuickToggle('broken', e)}
                  >
                    <Zap className="h-2.5 w-2.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs py-1 px-2">
                  {currentType === 'broken' ? 'Remove' : 'Split Shift'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      <div className={cn("pl-3 pr-8 py-1.5", shiftTypeInfo && "pt-4")} onClick={onEdit}>
        <div className={cn("text-xs font-semibold flex items-center gap-1", style.text)}>
          <span>{shift.startTime}-{shift.endTime}</span>
          {/* Recurring indicator inline with time */}
          {shift.recurring?.isRecurring && shift.recurring?.recurrenceGroupId && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <RefreshCw className="h-2.5 w-2.5 text-emerald-600 flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Recurring Shift</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {shift.recurring.pattern || 'Weekly'} pattern
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {!isCompact && (
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-2.5 w-2.5" />
            <span>{shift.breakMinutes}m break</span>
          </div>
        )}
        {/* Covered by chip */}
        {shift.isAbsent && shift.replacementStaffId && !isCompact && (
          <Badge 
            variant="outline" 
            className="mt-1 text-[9px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-700"
          >
            Covered by {allStaff?.find(s => s.id === shift.replacementStaffId)?.name?.split(' ')[0] || 'Staff'}
          </Badge>
        )}
      </div>
    </div>
  );
}

function OpenShiftCard({ 
  openShift, 
  isCompact, 
  isDragOver, 
  onDelete,
  onSendToAgency 
}: { 
  openShift: OpenShift; 
  isCompact?: boolean; 
  isDragOver?: boolean; 
  onDelete?: () => void;
  onSendToAgency?: () => void;
}) {
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
      "group relative rounded-lg border overflow-hidden transition-all duration-200",
      "bg-gradient-to-br",
      openShift.urgency === 'low' && "from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border-slate-200 dark:border-slate-700",
      openShift.urgency === 'medium' && "from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200 dark:border-amber-800",
      openShift.urgency === 'high' && "from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30 border-orange-200 dark:border-orange-800",
      openShift.urgency === 'critical' && "from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30 border-red-200 dark:border-red-800",
      isDragOver && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50",
      openShift.urgency === 'critical' && "animate-pulse"
    )}>
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.accent)} />
      
      {/* Action buttons */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 hover:bg-background/80"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onSendToAgency && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onSendToAgency();
              }}>
                <Building2 className="h-4 w-4 mr-2 text-primary" />
                Send to Agency
              </DropdownMenuItem>
            )}
            {onSendToAgency && onDelete && <DropdownMenuSeparator />}
            {onDelete && (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Open Shift
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="pl-3 pr-7 py-2">
        <div className="text-xs font-semibold text-foreground">{openShift.startTime}-{openShift.endTime}</div>
        {!isCompact && (
          <div className="mt-1.5 space-y-1">
            <div className="flex flex-wrap gap-1">
              {openShift.requiredQualifications.slice(0, 2).map((qual) => (
                <Badge key={qual} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-medium">
                  {qualificationLabels[qual].slice(0, 8)}
                </Badge>
              ))}
            </div>
            <Badge 
              variant={openShift.urgency === 'critical' ? 'destructive' : 'outline'} 
              className="text-[9px] capitalize font-medium"
            >
              {openShift.urgency}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// Empty Shift Card component for unassigned shifts
function EmptyShiftCard({ 
  emptyShift, 
  isCompact, 
  onClick, 
  onDelete 
}: { 
  emptyShift: {
    id: string;
    startTime: string;
    endTime: string;
    template?: { name: string; color: string };
    requiredQualifications?: any[];
    minimumClassification?: string;
  }; 
  isCompact?: boolean; 
  onClick?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div 
      className={cn(
        "group relative rounded-lg border-2 border-dashed overflow-hidden transition-all duration-200 cursor-pointer",
        "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700",
        "hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:border-purple-400 dark:hover:border-purple-600"
      )}
      onClick={onClick}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1" 
        style={{ backgroundColor: emptyShift.template?.color || 'hsl(280, 60%, 50%)' }}
      />
      
      {/* Delete button */}
      {onDelete && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-destructive/20 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Delete empty shift</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      <div className="pl-3 pr-7 py-1.5">
        <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">
          {emptyShift.startTime}-{emptyShift.endTime}
        </div>
        {!isCompact && (
          <>
            {emptyShift.template && (
              <div className="text-[10px] text-purple-600 dark:text-purple-400 truncate">
                {emptyShift.template.name}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Badge 
                variant="outline" 
                className="text-[8px] px-1 py-0 h-3.5 bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
              >
                <Zap className="h-2 w-2 mr-0.5" />
                Auto-assign
              </Badge>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
