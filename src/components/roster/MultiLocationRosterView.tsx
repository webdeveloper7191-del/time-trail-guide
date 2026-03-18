import { useState, useMemo } from 'react';
import { Centre, Shift, OpenShift, StaffMember, DemandData, RosterComplianceFlag, ShiftTemplate, ViewMode } from '@/types/roster';
import { CallbackEvent } from './CallbackEventLoggingPanel';
import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import { StaffTimelineGrid } from './StaffTimelineGrid';
import { DayTimelineView } from './DayTimelineView';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, MapPin, Users, AlertTriangle, X, Clock } from 'lucide-react';

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

interface MultiLocationRosterViewProps {
  centres: Centre[];
  shifts: Shift[];
  openShifts: OpenShift[];
  staff: StaffMember[];
  dates: Date[];
  currentDate: Date;
  viewMode: ViewMode;
  showDemandOverlay: boolean;
  showAnalyticsCharts?: boolean;
  demandData: DemandData[];
  complianceFlags: RosterComplianceFlag[];
  demandAnalytics?: DemandAnalyticsData[];
  staffAbsences?: StaffAbsence[];
  shiftTemplates: ShiftTemplate[];
  emptyShifts?: EmptyShift[];
  highlightedRecurrenceGroupId?: string | null;
  staffRoomAssignmentsByCentre: Record<string, Record<string, string>>;

  onViewSeries?: (groupId: string) => void;
  onDropStaff: (staffId: string, roomId: string, date: string, timeSlot?: string) => void;
  onShiftEdit: (shift: Shift) => void;
  onShiftDelete: (shiftId: string) => void;
  onShiftCopy?: (shift: Shift) => void;
  onShiftSwap?: (shift: Shift) => void;
  onShiftTypeChange?: (shiftId: string, shiftType: any) => void;
  onOpenShiftFill: (openShift: OpenShift) => void;
  onOpenShiftClick?: (openShift: OpenShift) => void;
  onOpenShiftDelete?: (openShiftId: string) => void;
  onAddOpenShift?: (roomId: string, date: string) => void;
  onAddShift: (staffId: string, date: string, roomId: string, template?: ShiftTemplate) => void;
  onDragStart: (e: React.DragEvent, staff: StaffMember) => void;
  onOpenShiftDrop: (staffId: string, openShift: OpenShift) => void;
  onShiftMove?: (shiftId: string, newDate: string, newRoomId: string) => void;
  onShiftReassign?: (shiftId: string, newStaffId: string, newDate: string, newRoomId: string) => void;
  onStaffClick?: (staff: StaffMember) => void;
  onOpenShiftTemplateManager?: () => void;
  onEmptyShiftClick?: (emptyShift: any) => void;
  onDeleteEmptyShift?: (emptyShiftId: string) => void;
  onSendToAgency?: (openShift: OpenShift) => void;
  onAssignStaffToRoom?: (staffId: string, roomId: string) => void;
  onRemoveStaffFromRoom?: (staffId: string, roomId: string) => void;
  onShiftResize?: (shiftId: string, newStartTime: string, newEndTime: string) => void;
  onRemoveCentre?: (centreId: string) => void;
  onAddShiftAtTime?: (staffId: string, date: string, roomId: string, startTime: string) => void;
  callbackEvents?: CallbackEvent[];
  onCallbackLogged?: (event: CallbackEvent) => void;
}

export function MultiLocationRosterView({
  centres,
  shifts,
  openShifts,
  staff,
  dates,
  currentDate,
  viewMode,
  showDemandOverlay,
  showAnalyticsCharts = false,
  demandData,
  complianceFlags,
  demandAnalytics = [],
  staffAbsences = [],
  shiftTemplates,
  emptyShifts = [],
  highlightedRecurrenceGroupId,
  staffRoomAssignmentsByCentre,
  onViewSeries,
  onDropStaff,
  onShiftEdit,
  onShiftDelete,
  onShiftCopy,
  onShiftSwap,
  onShiftTypeChange,
  onOpenShiftFill,
  onOpenShiftClick,
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
  onAssignStaffToRoom,
  onRemoveStaffFromRoom,
  onRemoveCentre,
  onShiftResize,
  onAddShiftAtTime,
  callbackEvents = [],
  onCallbackLogged,
}: MultiLocationRosterViewProps) {
  const [collapsedCentres, setCollapsedCentres] = useState<Set<string>>(new Set());
  const MAX_EXPANDED_PANES = 6;

  const toggleCollapse = (centreId: string) => {
    setCollapsedCentres(prev => {
      const next = new Set(prev);
      if (next.has(centreId)) {
        // Expanding - check if we'd exceed the limit
        const currentExpanded = centres.filter(c => !next.has(c.id)).length;
        if (currentExpanded >= MAX_EXPANDED_PANES) {
          // Auto-collapse the first expanded centre to make room
          const firstExpanded = centres.find(c => !next.has(c.id) && c.id !== centreId);
          if (firstExpanded) next.add(firstExpanded.id);
        }
        next.delete(centreId);
      } else {
        next.add(centreId);
      }
      return next;
    });
  };

  // Auto-collapse centres beyond the limit on mount/when centres change
  useMemo(() => {
    if (centres.length > MAX_EXPANDED_PANES) {
      const toCollapse = new Set<string>();
      centres.slice(MAX_EXPANDED_PANES).forEach(c => toCollapse.add(c.id));
      // Only update if needed
      const needsUpdate = centres.slice(MAX_EXPANDED_PANES).some(c => !collapsedCentres.has(c.id));
      if (needsUpdate) {
        setCollapsedCentres(prev => {
          const next = new Set(prev);
          centres.slice(MAX_EXPANDED_PANES).forEach(c => next.add(c.id));
          return next;
        });
      }
    }
  }, [centres.length]);

  // Pre-group shifts by centreId for O(1) lookups
  const shiftsByCentre = useMemo(() => {
    const map = new Map<string, Shift[]>();
    shifts.forEach(s => {
      if (!map.has(s.centreId)) map.set(s.centreId, []);
      map.get(s.centreId)!.push(s);
    });
    return map;
  }, [shifts]);

  const openShiftsByCentre = useMemo(() => {
    const map = new Map<string, OpenShift[]>();
    openShifts.forEach(os => {
      if (!map.has(os.centreId)) map.set(os.centreId, []);
      map.get(os.centreId)!.push(os);
    });
    return map;
  }, [openShifts]);

  // Compute stats per centre using pre-grouped maps
  const centreStats = useMemo(() => {
    const stats: Record<string, { staffCount: number; totalHours: number; openCount: number }> = {};
    centres.forEach(c => {
      const centreShifts = shiftsByCentre.get(c.id) || [];
      const staffIds = new Set(centreShifts.map(s => s.staffId));
      let totalHours = 0;
      centreShifts.forEach(shift => {
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        totalHours += ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
      });
      stats[c.id] = {
        staffCount: staffIds.size,
        totalHours: Math.round(totalHours * 10) / 10,
        openCount: (openShiftsByCentre.get(c.id) || []).length,
      };
    });
    return stats;
  }, [centres, shiftsByCentre, openShiftsByCentre]);

  return (
    <div className="flex-1 flex flex-col overflow-auto min-h-0">
      {centres.map((centre) => {
        const isCollapsed = collapsedCentres.has(centre.id);
        const stats = centreStats[centre.id];
        const centreShifts = shiftsByCentre.get(centre.id) || [];
        const centreOpenShifts = openShiftsByCentre.get(centre.id) || [];
        const centreEmptyShifts = emptyShifts.filter(es => es.centreId === centre.id);

        return (
          <div key={centre.id} className="border-b border-border last:border-b-0">
            {/* Location Header */}
            <button
              onClick={() => toggleCollapse(centre.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 bg-card hover:bg-accent/50 transition-colors text-left',
                !isCollapsed && 'border-b border-border'
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-semibold text-sm text-foreground">{centre.name}</span>
              <span className="text-xs text-muted-foreground">
                {centre.operatingHours.start} – {centre.operatingHours.end}
              </span>

              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{stats?.staffCount || 0} staff</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{stats?.totalHours || 0}h</span>
                </div>
                {(stats?.openCount || 0) > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                    <AlertTriangle className="h-3 w-3 mr-0.5" />
                    {stats.openCount} open
                  </Badge>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveCentre?.(centre.id); }}
                  className="ml-2 rounded-full hover:bg-destructive/10 p-1 flex-shrink-0"
                  title="Remove centre"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </button>

            {/* Location Content - Same grid as single location */}
            {!isCollapsed && (
              <div className="w-full">
                {viewMode === 'day' ? (
                  <DayTimelineView
                    centre={centre}
                    shifts={centreShifts}
                    openShifts={centreOpenShifts}
                    staff={staff}
                    date={currentDate}
                    shiftTemplates={shiftTemplates}
                    showAnalyticsCharts={showAnalyticsCharts}
                    demandAnalytics={demandAnalytics}
                    staffAbsences={staffAbsences}
                    onShiftEdit={onShiftEdit}
                    onShiftDelete={onShiftDelete}
                    onShiftResize={onShiftResize}
                    onAddShift={onAddShift}
                    onAddShiftAtTime={onAddShiftAtTime}
                    onDragStart={onDragStart}
                    onDropStaff={onDropStaff}
                    onStaffClick={onStaffClick}
                    onOpenShiftTemplateManager={onOpenShiftTemplateManager}
                    onOpenShiftClick={onOpenShiftClick}
                    onOpenShiftDrop={onOpenShiftDrop}
                    onOpenShiftDelete={onOpenShiftDelete}
                    onAddOpenShift={onAddOpenShift}
                    onAssignStaffToRoom={onAssignStaffToRoom}
                    staffRoomAssignments={staffRoomAssignmentsByCentre[centre.id] || {}}
                  />
                ) : (
                  <StaffTimelineGrid
                    centre={centre}
                    shifts={centreShifts}
                    openShifts={centreOpenShifts}
                    staff={staff}
                    demandData={demandData}
                    complianceFlags={complianceFlags.filter(f => f.centreId === centre.id)}
                    dates={dates}
                    viewMode={viewMode}
                    showDemandOverlay={showDemandOverlay}
                    showAnalyticsCharts={showAnalyticsCharts}
                    demandAnalytics={demandAnalytics}
                    staffAbsences={staffAbsences}
                    shiftTemplates={shiftTemplates}
                    emptyShifts={centreEmptyShifts}
                    highlightedRecurrenceGroupId={highlightedRecurrenceGroupId}
                    onViewSeries={onViewSeries}
                    onDropStaff={onDropStaff}
                    staffRoomAssignments={staffRoomAssignmentsByCentre[centre.id] || {}}
                    onAssignStaffToRoom={onAssignStaffToRoom}
                    onRemoveStaffFromRoom={onRemoveStaffFromRoom}
                    onShiftEdit={onShiftEdit}
                    onShiftDelete={onShiftDelete}
                    onShiftCopy={onShiftCopy}
                    onShiftSwap={onShiftSwap}
                    onShiftTypeChange={onShiftTypeChange}
                    onOpenShiftFill={onOpenShiftFill}
                    onOpenShiftClick={onOpenShiftClick}
                    onOpenShiftDelete={onOpenShiftDelete}
                    onAddOpenShift={onAddOpenShift}
                    onAddShift={onAddShift}
                    onDragStart={onDragStart}
                    onOpenShiftDrop={onOpenShiftDrop}
                    onShiftMove={onShiftMove}
                    onShiftReassign={onShiftReassign}
                    onStaffClick={onStaffClick}
                    onOpenShiftTemplateManager={onOpenShiftTemplateManager}
                    onEmptyShiftClick={onEmptyShiftClick}
                    onDeleteEmptyShift={onDeleteEmptyShift}
                    onSendToAgency={onSendToAgency}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
