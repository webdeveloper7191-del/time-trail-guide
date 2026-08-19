import { useEffect, useState } from 'react';
import { mockStaff } from '@/data/mockStaffData';
import { permissionsStore } from '@/lib/permissionsStore';
import { billingStore } from '@/lib/billingStore';

/**
 * Billed seats vs the people who actually need a login.
 *
 * A licensed user = an active staff member holding at least one role. Anything
 * else is either an unlicensed worker (no role, so no login) or an assignment
 * pointing at someone who is no longer active.
 */
export interface SeatReconciliation {
  /** What the subscription is currently charged for. */
  billedSeats: number;
  /** Active staff with at least one role assignment. */
  licensedUsers: number;
  /** Active staff with no role — they cannot sign in today. */
  unassignedActive: number;
  /** Assignments held by inactive / terminated staff (should be revoked). */
  staleAssignments: number;
  /** Total staff records, regardless of status. */
  totalStaff: number;
  /** billedSeats − licensedUsers. Positive = paying for empty seats. */
  delta: number;
  state: 'balanced' | 'over' | 'under';
}

const ACTIVE = new Set(['active', 'onboarding']);

export function reconcileSeats(): SeatReconciliation {
  const assignments = permissionsStore.getAssignments();
  const billedSeats = billingStore.get().seats;

  let licensedUsers = 0;
  let unassignedActive = 0;
  const activeIds = new Set<string>();

  for (const staff of mockStaff) {
    if (!ACTIVE.has(staff.status)) continue;
    activeIds.add(staff.id);
    if ((assignments[staff.id]?.length ?? 0) > 0) licensedUsers += 1;
    else unassignedActive += 1;
  }

  const staleAssignments = Object.entries(assignments).filter(
    ([staffId, list]) => list.length > 0 && !activeIds.has(staffId),
  ).length;

  const delta = billedSeats - licensedUsers;
  return {
    billedSeats,
    licensedUsers,
    unassignedActive,
    staleAssignments,
    totalStaff: mockStaff.length,
    delta,
    state: delta === 0 ? 'balanced' : delta > 0 ? 'over' : 'under',
  };
}

/** Set billed seats to the licensed-user count. */
export function syncSeatsToLicensedUsers(): number {
  const { licensedUsers } = reconcileSeats();
  billingStore.update({ seats: Math.max(1, licensedUsers) });
  return licensedUsers;
}

export function useSeatReconciliation(): SeatReconciliation {
  const [value, setValue] = useState(reconcileSeats);
  useEffect(() => {
    const refresh = () => setValue(reconcileSeats());
    const offBilling = billingStore.subscribe(refresh);
    const offPerms = permissionsStore.subscribe(refresh);
    refresh();
    return () => {
      offBilling();
      offPerms();
    };
  }, []);
  return value;
}
