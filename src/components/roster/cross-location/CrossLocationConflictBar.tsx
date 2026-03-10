import { useMemo } from 'react';
import { Shift, StaffMember, Centre } from '@/types/roster';
import { detectCrossLocationConflicts } from '@/lib/shiftConflictDetection';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  MapPin,
  Clock,
  X,
  ChevronRight,
} from 'lucide-react';

interface CrossLocationConflictBarProps {
  shifts: Shift[];
  staff: StaffMember[];
  centres: Centre[];
  onDismiss?: () => void;
}

interface ConflictDetail {
  staffName: string;
  staffId: string;
  date: string;
  shifts: {
    centreName: string;
    startTime: string;
    endTime: string;
  }[];
}

export function CrossLocationConflictBar({
  shifts,
  staff,
  centres,
  onDismiss,
}: CrossLocationConflictBarProps) {
  const conflicts = useMemo(() => {
    const allConflicts: ConflictDetail[] = [];
    const seenPairs = new Set<string>();

    // Check each staff member for cross-location overlaps
    const staffIds = [...new Set(shifts.map((s) => s.staffId))];

    for (const staffId of staffIds) {
      const staffShifts = shifts.filter((s) => s.staffId === staffId);
      if (staffShifts.length < 2) continue;

      // Group by date
      const byDate = new Map<string, Shift[]>();
      staffShifts.forEach((s) => {
        const arr = byDate.get(s.date) || [];
        arr.push(s);
        byDate.set(s.date, arr);
      });

      byDate.forEach((dayShifts, date) => {
        if (dayShifts.length < 2) return;

        // Check all pairs for overlaps
        for (let i = 0; i < dayShifts.length; i++) {
          for (let j = i + 1; j < dayShifts.length; j++) {
            const a = dayShifts[i];
            const b = dayShifts[j];
            const pairKey = [a.id, b.id].sort().join('-');
            if (seenPairs.has(pairKey)) continue;

            const aStart = timeToMin(a.startTime);
            const aEnd = timeToMin(a.endTime);
            const bStart = timeToMin(b.startTime);
            const bEnd = timeToMin(b.endTime);

            if (aStart < bEnd && bStart < aEnd) {
              seenPairs.add(pairKey);
              const staffMember = staff.find((s) => s.id === staffId);
              const centreA = centres.find((c) => c.id === a.centreId);
              const centreB = centres.find((c) => c.id === b.centreId);

              allConflicts.push({
                staffName: staffMember?.name || 'Unknown',
                staffId,
                date,
                shifts: [
                  {
                    centreName: centreA?.name || 'Unknown',
                    startTime: a.startTime,
                    endTime: a.endTime,
                  },
                  {
                    centreName: centreB?.name || 'Unknown',
                    startTime: b.startTime,
                    endTime: b.endTime,
                  },
                ],
              });
            }
          }
        }
      });
    }

    return allConflicts;
  }, [shifts, staff, centres]);

  if (conflicts.length === 0) return null;

  return (
    <div className="mx-2 mt-2 rounded-lg border border-destructive/30 bg-destructive/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border-b border-destructive/20">
        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
        <span className="text-xs font-semibold text-destructive">
          Cross-Location Conflicts
        </span>
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
          {conflicts.length}
        </Badge>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-auto p-0.5 rounded hover:bg-destructive/20 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-destructive" />
          </button>
        )}
      </div>

      {/* Conflict items */}
      <div className="max-h-[160px] overflow-auto divide-y divide-destructive/10">
        {conflicts.map((conflict, i) => (
          <div key={i} className="flex items-start gap-2 px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-3 w-3 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">
                {conflict.staffName}
                <span className="text-muted-foreground font-normal ml-1.5">
                  on {conflict.date}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-1 mt-1">
                {conflict.shifts.map((s, j) => (
                  <span key={j} className="inline-flex items-center gap-1">
                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
                      <MapPin className="h-2.5 w-2.5" />
                      {s.centreName}
                      <Clock className="h-2.5 w-2.5 ml-0.5" />
                      {s.startTime}–{s.endTime}
                    </span>
                    {j < conflict.shifts.length - 1 && (
                      <span className="text-[10px] text-destructive font-medium">⚡</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function timeToMin(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
