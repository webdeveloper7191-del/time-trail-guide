import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { StaffMember, Shift, Centre, roleLabels } from '@/types/roster';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Search,
  Users,
  Clock,
  MapPin,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface SharedStaffPoolProps {
  staff: StaffMember[];
  shifts: Shift[];
  centres: Centre[];
  dates: Date[];
  onDragStart: (staffId: string, e: React.DragEvent) => void;
}

interface StaffAvailability {
  staff: StaffMember;
  assignedCentreId?: string;
  assignedCentreName?: string;
  hoursThisWeek: number;
  availableHours: number;
  shiftsThisWeek: number;
  isAvailable: boolean;
}

export function SharedStaffPool({
  staff,
  shifts,
  centres,
  dates,
  onDragStart,
}: SharedStaffPoolProps) {
  const [search, setSearch] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['available', 'assigned']));

  const dateStrings = useMemo(() => dates.map(d => format(d, 'yyyy-MM-dd')), [dates]);

  const staffAvailability: StaffAvailability[] = useMemo(() => {
    return staff.map((s) => {
      const staffShifts = shifts.filter(
        (sh) => sh.staffId === s.id && dateStrings.includes(sh.date)
      );

      const hoursThisWeek = staffShifts.reduce((sum, sh) => {
        const start = parseInt(sh.startTime.split(':')[0]) + parseInt(sh.startTime.split(':')[1]) / 60;
        const end = parseInt(sh.endTime.split(':')[0]) + parseInt(sh.endTime.split(':')[1]) / 60;
        return sum + (end - start) - (sh.breakMinutes || 0) / 60;
      }, 0);

      // Find which centre(s) they're assigned to this period
      const assignedCentreIds = [...new Set(staffShifts.map((sh) => sh.centreId))];
      const primaryCentreId = assignedCentreIds[0];
      const primaryCentre = centres.find((c) => c.id === primaryCentreId);

      return {
        staff: s,
        assignedCentreId: primaryCentreId,
        assignedCentreName: primaryCentre?.name,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        availableHours: Math.round((s.maxHoursPerWeek - hoursThisWeek) * 10) / 10,
        shiftsThisWeek: staffShifts.length,
        isAvailable: hoursThisWeek < s.maxHoursPerWeek,
      };
    });
  }, [staff, shifts, centres, dateStrings]);

  const filtered = useMemo(() => {
    let list = staffAvailability;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (sa) =>
          sa.staff.name.toLowerCase().includes(q) ||
          roleLabels[sa.staff.role].toLowerCase().includes(q)
      );
    }
    if (showAvailableOnly) {
      list = list.filter((sa) => sa.isAvailable);
    }
    return list;
  }, [staffAvailability, search, showAvailableOnly]);

  const availableStaff = filtered.filter((sa) => sa.shiftsThisWeek === 0);
  const assignedStaff = filtered.filter((sa) => sa.shiftsThisWeek > 0);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Staff Pool</h3>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {filtered.length}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
        <button
          onClick={() => setShowAvailableOnly(!showAvailableOnly)}
          className={cn(
            'flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md transition-colors w-full',
            showAvailableOnly
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          <Filter className="h-3 w-3" />
          {showAvailableOnly ? 'Showing available only' : 'Show available only'}
        </button>
      </div>

      {/* Staff List */}
      <div className="flex-1 overflow-auto">
        {/* Unassigned / Available */}
        <GroupHeader
          label="Unassigned"
          count={availableStaff.length}
          expanded={expandedGroups.has('available')}
          onToggle={() => toggleGroup('available')}
          color="text-green-600"
        />
        {expandedGroups.has('available') && (
          <div className="px-2 pb-2 space-y-1">
            {availableStaff.length === 0 ? (
              <p className="text-[11px] text-muted-foreground px-2 py-3 text-center">
                All staff assigned
              </p>
            ) : (
              availableStaff.map((sa) => (
                <StaffCard key={sa.staff.id} data={sa} onDragStart={onDragStart} />
              ))
            )}
          </div>
        )}

        {/* Assigned to centres */}
        <GroupHeader
          label="Currently Assigned"
          count={assignedStaff.length}
          expanded={expandedGroups.has('assigned')}
          onToggle={() => toggleGroup('assigned')}
          color="text-blue-600"
        />
        {expandedGroups.has('assigned') && (
          <div className="px-2 pb-2 space-y-1">
            {assignedStaff.length === 0 ? (
              <p className="text-[11px] text-muted-foreground px-2 py-3 text-center">
                No staff assigned yet
              </p>
            ) : (
              assignedStaff.map((sa) => (
                <StaffCard key={sa.staff.id} data={sa} onDragStart={onDragStart} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer summary */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-muted-foreground">Available</span>
            <p className="font-semibold text-foreground">{availableStaff.length}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Assigned</span>
            <p className="font-semibold text-foreground">{assignedStaff.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupHeader({
  label,
  count,
  expanded,
  onToggle,
  color,
}: {
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium bg-muted/50 hover:bg-muted transition-colors"
    >
      {expanded ? (
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className={color}>{label}</span>
      <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0">
        {count}
      </Badge>
    </button>
  );
}

function StaffCard({
  data,
  onDragStart,
}: {
  data: StaffAvailability;
  onDragStart: (staffId: string, e: React.DragEvent) => void;
}) {
  const { staff, assignedCentreName, hoursThisWeek, availableHours, isAvailable } = data;
  const initials = staff.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const capacityPercent = staff.maxHoursPerWeek > 0
    ? Math.min((hoursThisWeek / staff.maxHoursPerWeek) * 100, 100)
    : 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(staff.id, e)}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all',
        'hover:border-primary/40 hover:shadow-sm hover:bg-accent/30',
        isAvailable
          ? 'border-border bg-card'
          : 'border-border/50 bg-muted/30 opacity-70'
      )}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
        style={{ backgroundColor: staff.color }}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{staff.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{roleLabels[staff.role]}</span>
          {assignedCentreName && (
            <>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-primary flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {assignedCentreName}
              </span>
            </>
          )}
        </div>
        {/* Capacity bar */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                capacityPercent >= 90
                  ? 'bg-red-500'
                  : capacityPercent >= 70
                    ? 'bg-amber-500'
                    : 'bg-green-500'
              )}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground whitespace-nowrap">
            {hoursThisWeek}/{staff.maxHoursPerWeek}h
          </span>
        </div>
      </div>
    </div>
  );
}
