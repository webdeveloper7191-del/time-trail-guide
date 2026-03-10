import { useMemo } from 'react';
import { format } from 'date-fns';
import { Centre, Shift, OpenShift, StaffMember } from '@/types/roster';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Users,
  Clock,
  AlertTriangle,
  DollarSign,
  ChevronRight,
  Layers,
  UserCheck,
  UserX,
} from 'lucide-react';

interface MultiLocationRosterGridProps {
  centres: Centre[];
  shifts: Shift[];
  openShifts: OpenShift[];
  staff: StaffMember[];
  dates: Date[];
  onSelectCentre: (centreId: string) => void;
}

interface CentreSummary {
  centre: Centre;
  totalShifts: number;
  openShiftCount: number;
  staffAssigned: number;
  totalStaff: number;
  totalHours: number;
  estimatedCost: number;
  coverageByDay: { date: Date; filled: number; required: number }[];
  hasWarnings: boolean;
}

export function MultiLocationRosterGrid({
  centres,
  shifts,
  openShifts,
  staff,
  dates,
  onSelectCentre,
}: MultiLocationRosterGridProps) {
  const centreSummaries: CentreSummary[] = useMemo(() => {
    return centres.map((centre) => {
      const centreShifts = shifts.filter((s) => s.centreId === centre.id);
      const centreOpenShifts = openShifts.filter((os) => os.centreId === centre.id);
      const centreStaff = staff.filter((s) => s.preferredCentres.includes(centre.id));
      const assignedStaffIds = new Set(centreShifts.map((s) => s.staffId));

      const totalHours = centreShifts.reduce((sum, s) => {
        const start = parseInt(s.startTime.split(':')[0]) + parseInt(s.startTime.split(':')[1]) / 60;
        const end = parseInt(s.endTime.split(':')[0]) + parseInt(s.endTime.split(':')[1]) / 60;
        return sum + (end - start) - (s.breakMinutes || 0) / 60;
      }, 0);

      const estimatedCost = centreShifts.reduce((sum, s) => {
        const staffMember = staff.find((st) => st.id === s.staffId);
        const start = parseInt(s.startTime.split(':')[0]) + parseInt(s.startTime.split(':')[1]) / 60;
        const end = parseInt(s.endTime.split(':')[0]) + parseInt(s.endTime.split(':')[1]) / 60;
        const hours = (end - start) - (s.breakMinutes || 0) / 60;
        return sum + hours * (staffMember?.hourlyRate || 30);
      }, 0);

      const coverageByDay = dates.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const filled = centreShifts.filter((s) => s.date === dateStr).length;
        const required = filled + centreOpenShifts.filter((os) => os.date === dateStr).length;
        return { date, filled, required: Math.max(required, filled) };
      });

      const hasWarnings = centreOpenShifts.length > 0;

      return {
        centre,
        totalShifts: centreShifts.length,
        openShiftCount: centreOpenShifts.length,
        staffAssigned: assignedStaffIds.size,
        totalStaff: centreStaff.length,
        totalHours: Math.round(totalHours * 10) / 10,
        estimatedCost: Math.round(estimatedCost),
        coverageByDay,
        hasWarnings,
      };
    });
  }, [centres, shifts, openShifts, staff, dates]);

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {centreSummaries.map((summary) => (
          <LocationCard
            key={summary.centre.id}
            summary={summary}
            dates={dates}
            onClick={() => onSelectCentre(summary.centre.id)}
          />
        ))}
      </div>
    </div>
  );
}

function LocationCard({
  summary,
  dates,
  onClick,
}: {
  summary: CentreSummary;
  dates: Date[];
  onClick: () => void;
}) {
  const { centre, totalShifts, openShiftCount, staffAssigned, totalStaff, totalHours, estimatedCost, coverageByDay, hasWarnings } = summary;
  const maxRequired = Math.max(...coverageByDay.map((d) => d.required), 1);

  return (
    <div
      onClick={onClick}
      className="group bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{centre.name}</h3>
            <p className="text-xs text-muted-foreground">
              {centre.operatingHours.start} – {centre.operatingHours.end} · {centre.rooms.length} areas
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {/* Warning badge */}
      {hasWarnings && (
        <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-md bg-amber-500/10">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-700">
            {openShiftCount} open shift{openShiftCount !== 1 ? 's' : ''} to fill
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatItem icon={Users} label="Staff Rostered" value={staffAssigned} subValue={`/ ${totalStaff}`} />
        <StatItem icon={Layers} label="Shifts" value={totalShifts} />
        <StatItem icon={Clock} label="Total Hours" value={totalHours} />
        <StatItem icon={DollarSign} label="Est. Cost" value={`$${estimatedCost.toLocaleString()}`} />
      </div>

      {/* Mini Coverage Bar Chart */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Daily Coverage</p>
        <div className="flex items-end gap-0.5 h-10">
          {coverageByDay.map((day, i) => {
            const fillPercent = day.required > 0 ? (day.filled / day.required) * 100 : 100;
            const barColor = fillPercent >= 100
              ? 'bg-green-500'
              : fillPercent >= 70
                ? 'bg-amber-500'
                : 'bg-red-500';

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full relative rounded-sm overflow-hidden" style={{ height: '28px' }}>
                  <div className="absolute inset-0 bg-muted/50 rounded-sm" />
                  <div
                    className={cn('absolute bottom-0 left-0 right-0 rounded-sm transition-all', barColor)}
                    style={{ height: `${Math.min(fillPercent, 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground leading-none">
                  {format(day.date, 'E').charAt(0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Room chips */}
      <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border">
        {centre.rooms.map((room) => (
          <Badge
            key={room.id}
            variant="outline"
            className="text-[10px] px-1.5 py-0"
            style={{ borderColor: room.color, color: room.color }}
          >
            {room.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subValue?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground leading-none">{label}</p>
        <p className="text-sm font-semibold text-foreground leading-tight">
          {value}
          {subValue && <span className="text-muted-foreground font-normal">{subValue}</span>}
        </p>
      </div>
    </div>
  );
}
