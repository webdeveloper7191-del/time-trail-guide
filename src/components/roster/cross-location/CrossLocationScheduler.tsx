import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { Centre, Shift, OpenShift, StaffMember, ViewMode } from '@/types/roster';
import { SharedStaffPool } from './SharedStaffPool';
import { CentreRosterPane } from './CentreRosterPane';
import { CrossLocationConflictBar } from './CrossLocationConflictBar';
import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Columns,
  MapPin,
  Check,
} from 'lucide-react';

interface CrossLocationSchedulerProps {
  centres: Centre[];
  shifts: Shift[];
  openShifts: OpenShift[];
  staff: StaffMember[];
  dates: Date[];
  viewMode?: ViewMode;
  onSelectCentre: (centreId: string) => void;
  onUpdateShifts: (updater: (prev: Shift[]) => Shift[]) => void;
  onShiftClick?: (shift: Shift) => void;
  onShiftDelete?: (shiftId: string) => void;
  onShiftCopy?: (shift: Shift) => void;
  onShiftSwap?: (shift: Shift) => void;
  onShiftResize?: (shiftId: string, newStartTime: string, newEndTime: string) => void;
}


export function CrossLocationScheduler({
  centres,
  shifts,
  openShifts,
  staff,
  dates,
  viewMode = 'workweek',
  onSelectCentre,
  onUpdateShifts,
  onShiftClick,
  onShiftDelete,
  onShiftCopy,
  onShiftSwap,
  onShiftResize,
}: CrossLocationSchedulerProps) {
  const [activePaneIds, setActivePaneIds] = useState<string[]>(
    centres.slice(0, Math.min(2, centres.length)).map((c) => c.id)
  );
  const [dragOverPaneId, setDragOverPaneId] = useState<string | null>(null);
  const [collapsedPanes, setCollapsedPanes] = useState<Set<string>>(new Set());
  const [centrePickerOpen, setCentrePickerOpen] = useState(false);

  const toggleCollapse = (centreId: string) => {
    setCollapsedPanes((prev) => {
      const next = new Set(prev);
      next.has(centreId) ? next.delete(centreId) : next.add(centreId);
      return next;
    });
  };

  const toggleCentrePane = (centreId: string) => {
    setActivePaneIds((prev) =>
      prev.includes(centreId) ? prev.filter((id) => id !== centreId) : [...prev, centreId]
    );
  };

  const removePane = (centreId: string) => {
    setActivePaneIds((prev) => prev.filter((id) => id !== centreId));
  };

  const handleDragStart = useCallback((staffId: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/staff-id', staffId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleAssignStaff = useCallback(
    (staffId: string, centreId: string, roomId: string, date: string) => {
      const staffMember = staff.find((s) => s.id === staffId);
      if (!staffMember) return;

      // Check for existing shift on same date across all locations
      const existingShift = shifts.find(
        (s) => s.staffId === staffId && s.date === date
      );
      if (existingShift) {
        const existingCentre = centres.find((c) => c.id === existingShift.centreId);
        toast.error(
          `${staffMember.name} already has a shift at ${existingCentre?.name || 'another centre'} on this date`
        );
        return;
      }

      const centre = centres.find((c) => c.id === centreId);
      const room = centre?.rooms.find((r) => r.id === roomId);

      const newShift: Shift = {
        id: `shift-cross-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        staffId,
        centreId,
        roomId,
        date,
        startTime: centre?.operatingHours.start || '07:00',
        endTime: centre?.operatingHours.end || '18:00',
        breakMinutes: 30,
        status: 'draft',
        isOpenShift: false,
      };

      onUpdateShifts((prev) => [...prev, newShift]);
      toast.success(
        `Assigned ${staffMember.name} to ${room?.name || 'room'} at ${centre?.name}`
      );
    },
    [staff, shifts, centres, onUpdateShifts]
  );

  // Centre stats for the picker
  const centreStats = useMemo(() => {
    return centres.map((c) => {
      const centreShifts = shifts.filter((s) => s.centreId === c.id);
      const staffIds = new Set(centreShifts.map((s) => s.staffId));
      const openCount = openShifts.filter((os) => os.centreId === c.id).length;
      return {
        centre: c,
        staffCount: staffIds.size,
        shiftCount: centreShifts.length,
        openCount,
        isActive: activePaneIds.includes(c.id),
      };
    });
  }, [centres, shifts, openShifts, activePaneIds]);

  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      {/* Left: Shared Staff Pool */}
      <div className="w-[260px] flex-shrink-0">
        <SharedStaffPool
          staff={staff}
          shifts={shifts}
          centres={centres}
          dates={dates}
          onDragStart={handleDragStart}
        />
      </div>

      {/* Right: Scheduler area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Top toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border flex-wrap">
          {/* Centre chips — scrollable for many centres */}
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar">
            {centreStats.map(({ centre, staffCount, openCount, isActive }) => (
              <button
                key={centre.id}
                onClick={() => toggleCentrePane(centre.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap flex-shrink-0',
                  'border',
                  isActive
                    ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/20 hover:bg-accent/50'
                )}
              >
                {isActive && <Check className="h-3 w-3" />}
                <MapPin className="h-3 w-3" />
                {centre.name}
                <span className="text-[9px] opacity-70">({staffCount})</span>
                {openCount > 0 && (
                  <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5 ml-0.5">
                    {openCount}
                  </Badge>
                )}
              </button>
            ))}
          </div>


          {/* Active count */}
          <Badge variant="secondary" className="text-[10px] flex-shrink-0">
            {activePaneIds.length} / {centres.length}
          </Badge>
        </div>

        {/* Cross-location conflict bar */}
        <CrossLocationConflictBar
          shifts={shifts}
          staff={staff}
          centres={centres}
        />

        {/* Panes - vertical stack */}
        <div className="flex-1 flex flex-col gap-2 p-2 overflow-auto min-h-0">
          {activePaneIds.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3 max-w-md">
                <Columns className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Select centres above to start scheduling across locations.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {centres.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => toggleCentrePane(c.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all text-sm"
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                      {c.name}
                    </button>
                  ))}
                  {centres.length > 6 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{centres.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            activePaneIds.map((centreId) => {
              const centre = centres.find((c) => c.id === centreId);
              if (!centre) return null;
              return (
                <div key={centreId}>
                  <CentreRosterPane
                    centre={centre}
                    shifts={shifts}
                    openShifts={openShifts}
                    staff={staff}
                    dates={dates}
                    viewMode={viewMode}
                    onRemovePane={() => removePane(centreId)}
                    onAssignStaff={handleAssignStaff}
                    onShiftClick={onShiftClick}
                    onShiftDelete={onShiftDelete}
                    onShiftCopy={onShiftCopy}
                    onShiftSwap={onShiftSwap}
                    isDragOver={dragOverPaneId === centreId}
                    collapsed={collapsedPanes.has(centreId)}
                    onToggleCollapse={() => toggleCollapse(centreId)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverPaneId(centreId);
                    }}
                    onDragLeave={() => setDragOverPaneId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverPaneId(null);
                      const staffId = e.dataTransfer.getData('text/staff-id');
                      if (staffId) {
                        const firstRoom = centre.rooms[0];
                        if (firstRoom && dates[0]) {
                          handleAssignStaff(
                            staffId,
                            centreId,
                            firstRoom.id,
                            format(dates[0], 'yyyy-MM-dd')
                          );
                        }
                      }
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
