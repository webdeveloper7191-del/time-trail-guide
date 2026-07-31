import { useMemo } from 'react';
import MuiDialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatTime12h } from '@/lib/timeFormat';
import { Shift, StaffMember, Room, ageGroupLabels } from '@/types/roster';
import { DemandAnalyticsData } from '@/types/demandAnalytics';
import { AlertTriangle, CheckCircle2, Clock, Users, Baby } from 'lucide-react';

export interface RoomDaySelection {
  roomId: string;
  date: string;
}

interface RoomDayDrillDownDialogProps {
  selection: RoomDaySelection | null;
  onClose: () => void;
  room?: Room;
  shifts: Shift[];
  staff: StaffMember[];
  analyticsData: DemandAnalyticsData[];
}

const shiftHours = (s: Shift) => {
  const [sh, sm] = s.startTime.split(':').map(Number);
  const [eh, em] = s.endTime.split(':').map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm) - (s.breakMinutes || 0))) / 60;
};

export function RoomDayDrillDownDialog({
  selection,
  onClose,
  room,
  shifts,
  staff,
  analyticsData,
}: RoomDayDrillDownDialogProps) {
  const slots = useMemo(() => {
    if (!selection) return [];
    return analyticsData
      .filter(d => d.roomId === selection.roomId && d.date === selection.date)
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [analyticsData, selection]);

  const daySlots = useMemo(() => {
    if (!selection) return [];
    return shifts.filter(s => s.roomId === selection.roomId && s.date === selection.date);
  }, [shifts, selection]);

  if (!selection) return null;

  const breachSlots = slots.filter(s => !s.staffRatioCompliant);
  const totalHours = daySlots.reduce((sum, s) => sum + shiftHours(s), 0);
  const maxRequired = slots.length ? Math.max(...slots.map(s => s.requiredStaff)) : 0;
  const dateLabel = new Date(`${selection.date}T00:00:00`).toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'short',
  });

  return (
    <MuiDialog
      open
      onClose={onClose}
      maxWidth="md"
      fullWidth
      // Rendered inside the Radix Sheet subtree: portalling to <body> gets
      // blocked by Radix's pointer-events lock and focus trap.
      disablePortal
      disableEnforceFocus
      disableScrollLock
      sx={{ zIndex: 2000, pointerEvents: 'auto' }}
      PaperProps={{
        sx: {
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          borderRadius: '0.75rem',
          border: '1px solid hsl(var(--border))',
          pointerEvents: 'auto',
        },
      }}
      slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.6)', pointerEvents: 'auto' } } }}
    >

      <div className="relative p-6 space-y-4">
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close"
          sx={{ position: 'absolute', right: 12, top: 12, color: 'hsl(var(--muted-foreground))' }}
        >
          <X className="h-4 w-4" />
        </IconButton>
        <div className="pr-8">
          <h2 className="text-lg font-semibold tracking-tight">
            {room?.name ?? 'Area'} · {dateLabel}
          </h2>
          <p className="text-sm text-muted-foreground">
            {room ? ageGroupLabels[room.ageGroup] : ''} — required vs scheduled staff, breach slots and contributing shifts.
          </p>
        </div>


        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Tile icon={<Users className="h-4 w-4" />} label="Peak required" value={`${maxRequired}`} sub={`${slots.length} intervals`} />
          <Tile icon={<Clock className="h-4 w-4" />} label="Hours scheduled" value={`${Math.round(totalHours * 10) / 10}h`} sub={`${daySlots.length} shift(s)`} />
          <Tile
            icon={breachSlots.length ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            label="Breach slots"
            value={`${breachSlots.length}`}
            sub={breachSlots.length ? 'Ratio not met' : 'Compliant all day'}
            tone={breachSlots.length ? 'destructive' : 'success'}
          />
          <Tile
            icon={<Baby className="h-4 w-4" />}
            label="Peak children"
            value={`${slots.length ? Math.max(...slots.map(s => s.bookedChildren)) : 0}`}
            sub="booked"
          />
        </div>

        <ScrollArea className="max-h-[45vh] pr-2">
          <div className="space-y-4">
            <section>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Interval breakdown</h4>
              {slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No demand data captured for this area/day.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-2 font-medium">Time</th>
                      <th className="text-center p-2 font-medium">Booked</th>
                      <th className="text-center p-2 font-medium">Required</th>
                      <th className="text-center p-2 font-medium">Scheduled</th>
                      <th className="text-center p-2 font-medium">Gap</th>
                      <th className="text-center p-2 font-medium">Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map(s => {
                      const gap = s.scheduledStaff - s.requiredStaff;
                      return (
                        <tr
                          key={s.timeSlot}
                          className={cn('border-b border-border/60', !s.staffRatioCompliant && 'bg-destructive/5')}
                        >
                          <td className="p-2 font-medium">{formatTime12h(s.timeSlot)}</td>
                          <td className="p-2 text-center">{s.bookedChildren}</td>
                          <td className="p-2 text-center">{s.requiredStaff}</td>
                          <td className="p-2 text-center">{s.scheduledStaff}</td>
                          <td className={cn('p-2 text-center font-medium',
                            gap < 0 && 'text-destructive', gap > 0 && 'text-warning', gap === 0 && 'text-success')}>
                            {gap > 0 ? `+${gap}` : gap}
                          </td>
                          <td className="p-2 text-center">
                            {s.staffRatioCompliant
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-success inline" />
                              : <AlertTriangle className="h-3.5 w-3.5 text-destructive inline" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>

            <section>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">
                Contributing shifts ({daySlots.length})
              </h4>
              {daySlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No shifts rostered for this area/day.</p>
              ) : (
                <div className="space-y-1.5">
                  {daySlots.map(shift => {
                    const person = staff.find(st => st.id === shift.staffId);
                    return (
                      <div key={shift.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {shift.isOpenShift || !person ? 'Open shift' : person.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime12h(shift.startTime)} – {formatTime12h(shift.endTime)} ·{' '}
                            {Math.round(shiftHours(shift) * 10) / 10}h
                            {shift.breakMinutes ? ` · ${shift.breakMinutes}m break` : ''}
                          </div>
                        </div>
                        {shift.isAbsent && <Badge variant="destructive" className="text-[10px]">Absent</Badge>}
                        {shift.isAIGenerated && <Badge variant="outline" className="text-[10px]">AI</Badge>}
                        <Badge variant="secondary" className="text-[10px] capitalize">{shift.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
      </div>
    </MuiDialog>
  );
}

function Tile({ icon, label, value, sub, tone }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; tone?: 'success' | 'destructive';
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">{icon}{label}</div>
      <div className={cn('text-lg font-semibold mt-1 tracking-tight',
        tone === 'success' && 'text-success', tone === 'destructive' && 'text-destructive')}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
