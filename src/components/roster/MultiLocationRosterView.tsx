import { useState, useMemo } from 'react';
import { Centre, Shift, OpenShift, StaffMember, DemandData, RosterComplianceFlag, ShiftTemplate, ViewMode } from '@/types/roster';
import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import { StaffTimelineGrid } from './StaffTimelineGrid';
import { DayTimelineView } from './DayTimelineView';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, MapPin, Users, AlertTriangle, X, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  onAddShiftAtTime?: (staffId: string, date: string, roomId: string, startTime: string) => void;
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
  onShiftResize,
  onAddShiftAtTime,
}: MultiLocationRosterViewProps) {
  const [collapsedCentres, setCollapsedCentres] = useState<Set<string>>(new Set());

  const toggleCollapse = (centreId: string) => {
    setCollapsedCentres(prev => {
      const next = new Set(prev);
      next.has(centreId) ? next.delete(centreId) : next.add(centreId);
      return next;
    });
  };

  // Compute stats per centre
  const centreStats = useMemo(() => {
    const stats: Record<string, { staffCount: number; totalHours: number; openCount: number }> = {};
    centres.forEach(c => {
      const centreShifts = shifts.filter(s => s.centreId === c.id);
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
        openCount: openShifts.filter(os => os.centreId === c.id).length,
      };
    });
    return stats;
  }, [centres, shifts, openShifts]);

  return (
    <div className="flex-1 flex flex-col overflow-auto min-h-0">
      {centres.map((centre) => {
        const isCollapsed = collapsedCentres.has(centre.id);
        const stats = centreStats[centre.id];
        const centreShifts = shifts.filter(s => s.centreId === centre.id);
        const centreOpenShifts = openShifts.filter(os => os.centreId === centre.id);
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
                    onAddShift={(roomId, date) => onAddShift('', date, roomId)}
                    onAddShiftAtTime={onAddShiftAtTime}
                    onDragStart={onDragStart}
                    onDropStaff={onDropStaff}
                    onStaffClick={onStaffClick}
                    onOpenShiftTemplateManager={onOpenShiftTemplateManager}
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
