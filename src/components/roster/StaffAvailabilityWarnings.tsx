/**
 * StaffAvailabilityWarnings
 * -----------------------------------------------------------
 * Inline banners shown in ShiftDetailPanel once a staff member
 * is picked. Combines two signals:
 *
 *  1. deriveAvailability(staff) — hard blocks (RDO / ADO / TOIL /
 *     declared unavailable) and soft blocks (rotation_preferred).
 *  2. LeaveStore.getStaffBalance(staffId) — RDO/ADO/TOIL balances,
 *     surfaced when the shift is tagged as one of those leave types
 *     and the balance is insufficient.
 *
 * Red banner  = hard conflict (should not be assigned).
 * Amber banner = soft warning (assign with caution).
 */
import { useMemo } from 'react';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { StaffMember as RosterStaffMember } from '@/types/roster';
import type { StaffMember as WorkforceStaffMember } from '@/types/staff';
import {
  deriveAvailability,
  DerivedAvailabilityBlock,
} from '@/lib/availabilityDerivation';
import { LeaveStore, LeaveKind } from '@/lib/leaveAccrualEngine';
import { cn } from '@/lib/utils';

interface Props {
  staff: RosterStaffMember;
  shiftDate: string; // yyyy-MM-dd
  /** Optional: shift's leave tag if this shift is being marked as RDO/ADO/TOIL leave */
  leaveTag?: LeaveKind | null;
  /** Optional: hours the shift would consume from a leave bucket */
  leaveHours?: number;
}

function tryDerive(staff: RosterStaffMember) {
  if (!staff.weeklyAvailability && !staff.currentPayCondition) return null;
  try {
    return deriveAvailability(staff as unknown as WorkforceStaffMember);
  } catch {
    return null;
  }
}

export function StaffAvailabilityWarnings({
  staff,
  shiftDate,
  leaveTag,
  leaveHours = 0,
}: Props) {
  const summary = useMemo(() => tryDerive(staff), [staff]);

  const { hardBlocks, softBlocks } = useMemo(() => {
    const hard: DerivedAvailabilityBlock[] = [];
    const soft: DerivedAvailabilityBlock[] = [];
    if (!summary) return { hardBlocks: hard, softBlocks: soft };

    // Same-day hard hits
    summary.blocks.forEach((b) => {
      if (b.date === shiftDate && b.severity === 'hard') hard.push(b);
    });

    // Rotation-preferred soft: matches ISO week Monday
    const d = new Date(shiftDate);
    const mondayOffset = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - mondayOffset);
    const weekKey = monday.toISOString().slice(0, 10);
    summary.blocks.forEach((b) => {
      if (b.kind === 'rotation_preferred' && b.date === weekKey) soft.push(b);
    });

    return { hardBlocks: hard, softBlocks: soft };
  }, [summary, shiftDate]);

  const balanceWarning = useMemo(() => {
    if (!leaveTag) return null;
    const balances = LeaveStore.getStaffBalance(staff.id);
    const available = balances?.[leaveTag] ?? 0;
    if (leaveHours > 0 && available < leaveHours) {
      return {
        kind: leaveTag,
        available,
        required: leaveHours,
      };
    }
    return null;
  }, [staff.id, leaveTag, leaveHours]);

  if (
    !summary &&
    hardBlocks.length === 0 &&
    softBlocks.length === 0 &&
    !balanceWarning
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      {hardBlocks.map((b, i) => (
        <Banner
          key={`hard-${i}`}
          tone="red"
          icon={<ShieldAlert className="h-4 w-4" />}
          title={b.label}
          detail={b.detail}
        />
      ))}

      {balanceWarning && (
        <Banner
          tone="red"
          icon={<ShieldAlert className="h-4 w-4" />}
          title={`Insufficient ${balanceWarning.kind} balance`}
          detail={`Requires ${balanceWarning.required.toFixed(1)}h, staff has ${balanceWarning.available.toFixed(1)}h available.`}
        />
      )}

      {softBlocks.map((b, i) => (
        <Banner
          key={`soft-${i}`}
          tone="amber"
          icon={<AlertTriangle className="h-4 w-4" />}
          title={b.label}
          detail={b.detail}
        />
      ))}
    </div>
  );
}

function Banner({
  tone,
  icon,
  title,
  detail,
}: {
  tone: 'red' | 'amber';
  icon: React.ReactNode;
  title: string;
  detail?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border p-2.5 text-xs',
        tone === 'red'
          ? 'border-destructive/50 bg-destructive/10 text-destructive'
          : 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-500',
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-medium leading-tight">{title}</p>
        {detail && <p className="mt-0.5 opacity-90">{detail}</p>}
      </div>
    </div>
  );
}

export default StaffAvailabilityWarnings;
