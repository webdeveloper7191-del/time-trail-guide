import { useState, useMemo } from 'react';
import { Centre, Shift, OpenShift, StaffMember, DemandData, RosterComplianceFlag, ShiftTemplate, ViewMode } from '@/types/roster';
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
  const [activeCentreIds, setActiveCentreIds] = useState<string[]>(centres.map(c => c.id));
  const [centrePickerOpen, setCentrePickerOpen] = useState(false);
  const [centreSearch, setCentreSearch] = useState('');

  const toggleCollapse = (centreId: string) => {
    setCollapsedCentres(prev => {
      const next = new Set(prev);
      next.has(centreId) ? next.delete(centreId) : next.add(centreId);
      return next;
    });
  };

  const toggleCentre = (centreId: string) => {
    setActiveCentreIds(prev =>
      prev.includes(centreId) ? prev.filter(id => id !== centreId) : [...prev, centreId]
    );
  };

  const removeCentre = (centreId: string) => {
    setActiveCentreIds(prev => prev.filter(id => id !== centreId));
  };

  const activeCentres = useMemo(() =>
    centres.filter(c => activeCentreIds.includes(c.id)),
    [centres, activeCentreIds]
  );

  const filteredPickerCentres = useMemo(() => {
    if (!centreSearch.trim()) return centres;
    const q = centreSearch.toLowerCase();
    return centres.filter(c => c.name.toLowerCase().includes(q));
  }, [centres, centreSearch]);

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
      {/* Centre Filter Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border flex-shrink-0">
        <Popover open={centrePickerOpen} onOpenChange={setCentrePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {activeCentreIds.length === 0
                ? 'Select Centres'
                : activeCentreIds.length <= 2
                  ? activeCentreIds.map(id => centres.find(c => c.id === id)?.name).filter(Boolean).join(', ')
                  : `${activeCentreIds.length} centres selected`}
              <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search centres..."
                  value={centreSearch}
                  onChange={(e) => setCentreSearch(e.target.value)}
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>
            <div className="p-1 flex items-center justify-between border-b border-border">
              <button
                onClick={() => setActiveCentreIds(centres.map(c => c.id))}
                className="text-[10px] text-primary hover:underline px-2 py-1"
              >
                Select all
              </button>
              <button
                onClick={() => setActiveCentreIds([])}
                className="text-[10px] text-muted-foreground hover:underline px-2 py-1"
              >
                Clear all
              </button>
            </div>
            <ScrollArea className="max-h-64">
              <div className="p-1">
                {filteredPickerCentres.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No centres found</p>
                ) : (
                  filteredPickerCentres.map((centre) => {
                    const isActive = activeCentreIds.includes(centre.id);
                    const stats = centreStats[centre.id];
                    return (
                      <button
                        key={centre.id}
                        onClick={() => toggleCentre(centre.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                          isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                        )}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                          isActive ? 'bg-primary border-primary' : 'border-border'
                        )}>
                          {isActive && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate flex-1 text-left">{centre.name}</span>
                        <span className="text-[10px] text-muted-foreground">{stats?.staffCount || 0} staff</span>
                        {(stats?.openCount || 0) > 0 && (
                          <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">
                            {stats.openCount}
                          </Badge>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Selected centre badges */}
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar">
          {activeCentreIds.map(id => {
            const centre = centres.find(c => c.id === id);
            if (!centre) return null;
            return (
              <Badge key={id} variant="secondary" className="text-[10px] gap-1 flex-shrink-0 pr-1">
                {centre.name}
                <button
                  onClick={() => removeCentre(id)}
                  className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}
        </div>

        <Badge variant="secondary" className="text-[10px] flex-shrink-0">
          {activeCentreIds.length} / {centres.length}
        </Badge>
      </div>

      {/* Centre Roster Panes */}
      {activeCentres.map((centre) => {
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
                <button
                  onClick={(e) => { e.stopPropagation(); removeCentre(centre.id); }}
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
