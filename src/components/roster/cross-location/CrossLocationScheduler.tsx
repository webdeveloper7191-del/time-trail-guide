import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Centre, Shift, OpenShift, StaffMember } from '@/types/roster';
import { SharedStaffPool } from './SharedStaffPool';
import { CentreRosterPane } from './CentreRosterPane';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  LayoutGrid,
  Columns,
  MapPin,
} from 'lucide-react';

interface CrossLocationSchedulerProps {
  centres: Centre[];
  shifts: Shift[];
  openShifts: OpenShift[];
  staff: StaffMember[];
  dates: Date[];
  onSelectCentre: (centreId: string) => void;
  onUpdateShifts: (updater: (prev: Shift[]) => Shift[]) => void;
}

export function CrossLocationScheduler({
  centres,
  shifts,
  openShifts,
  staff,
  dates,
  onSelectCentre,
  onUpdateShifts,
}: CrossLocationSchedulerProps) {
  // Which centres are open in split-screen panes
  const [activePaneIds, setActivePaneIds] = useState<string[]>(
    centres.slice(0, 2).map((c) => c.id)
  );
  const [dragOverPaneId, setDragOverPaneId] = useState<string | null>(null);

  const addPane = (centreId: string) => {
    if (!activePaneIds.includes(centreId)) {
      setActivePaneIds((prev) => [...prev, centreId]);
    }
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

      // Check for existing shift on same date
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
        `Assigned ${staffMember.name} to ${room?.name || 'room'} at ${centre?.name} on ${date}`
      );
    },
    [staff, shifts, centres, onUpdateShifts]
  );

  const unaddedCentres = centres.filter((c) => !activePaneIds.includes(c.id));

  return (
    <div className="flex-1 flex overflow-hidden">
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

      {/* Right: Split-screen Roster Panes */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Pane toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">
            Split View
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {activePaneIds.length} centres
          </Badge>

          {/* Add centre buttons */}
          {unaddedCentres.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[10px] text-muted-foreground mr-1">Add:</span>
              {unaddedCentres.map((c) => (
                <button
                  key={c.id}
                  onClick={() => addPane(c.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-muted hover:bg-accent transition-colors"
                >
                  <Plus className="h-2.5 w-2.5" />
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panes */}
        <div className="flex-1 flex gap-2 p-2 overflow-auto">
          {activePaneIds.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Columns className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  No centres selected. Add a centre to start scheduling.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {centres.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => addPane(c.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all text-sm"
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            activePaneIds.map((centreId) => {
              const centre = centres.find((c) => c.id === centreId);
              if (!centre) return null;
              return (
                <div
                  key={centreId}
                  className="flex-1 min-w-[300px]"
                >
                  <CentreRosterPane
                    centre={centre}
                    shifts={shifts}
                    openShifts={openShifts}
                    staff={staff}
                    dates={dates}
                    onRemovePane={() => removePane(centreId)}
                    onAssignStaff={handleAssignStaff}
                    isDragOver={dragOverPaneId === centreId}
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
                          const { format } = await import('date-fns');
                          handleAssignStaff(staffId, centreId, firstRoom.id, format(dates[0], 'yyyy-MM-dd'));
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
