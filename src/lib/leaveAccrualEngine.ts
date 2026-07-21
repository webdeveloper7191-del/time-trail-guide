/**
 * Leave Accrual Engine — RDO / ADO / TOIL
 * ------------------------------------------------------------
 * A single, in-memory implementation covering:
 *  - 3-layer configuration (Award → Location → Staff override)
 *  - Ledger of accruals, consumptions, expiries, payouts
 *  - Shift-tag derivation used by the roster editor
 *
 * Everything is a pure TS module so the hub page + pay-conditions
 * sheet + roster demo can all read/write the same store.
 */

export type LeaveKind = 'RDO' | 'ADO' | 'TOIL';
export type LedgerType = 'accrual' | 'consumption' | 'adjustment' | 'expiry' | 'payout';

// ---------- Config ----------

export interface AwardLeaveRule {
  awardCode: string;
  awardName: string;
  rdo?: {
    cycleWeeks: number;      // 4-week / 20-day cycle etc.
    hoursPerCycle: number;   // typical 8h
    accrualPerOrdinaryHour: number; // e.g. 0.4/38 → banked minutes per hour worked
  };
  ado?: {
    accrualPerOrdinaryHour: number;
    maxBalanceHours: number;
    minBlockHours: number;
  };
  toil?: {
    enabled: boolean;
    conversion: 'time_for_time' | 'penalty_equivalent';
    expiryDays: number;      // must be taken within
    requiresPreApproval: boolean;
  };
}

export interface LocationLeavePolicy {
  locationId: string;
  locationName: string;
  rdoStrategy: 'fixed_day' | 'rolling' | 'staff_choice';
  fixedRdoDayOfMonth?: number;
  adoOfferedOnHire: boolean;
  toilCap: number;                // hours cap on outstanding TOIL
  minNoticeDaysToTake: number;
  overrides?: Partial<Record<LeaveKind, boolean>>; // disable a kind at this location
}

export interface StaffLeaveConfig {
  staffId: string;
  staffName: string;
  optedIn: Record<LeaveKind, boolean>;
  balanceHours: Record<LeaveKind, number>;
  rdoAnchorDate?: string; // ISO
}

// ---------- Ledger ----------

export interface LedgerEntry {
  id: string;
  staffId: string;
  kind: LeaveKind;
  type: LedgerType;
  hours: number;              // + accrues, - consumes
  occurredOn: string;         // ISO date
  sourceShiftId?: string;
  note?: string;
  createdAt: string;
}

// ---------- Shift tagging ----------

export interface ShiftContext {
  staffId: string;
  date: string;               // ISO
  scheduledHours: number;
  actualHours?: number;
  isOvertime?: boolean;
  isPublicHoliday?: boolean;
  manualTag?: LeaveKind | 'NONE';
}

export interface DerivedShiftTag {
  tag: LeaveKind | null;
  reason: string;
  autoAccrualHours: number;
  requiresApproval: boolean;
}

// ---------- Seed data ----------

export const DEFAULT_AWARDS: AwardLeaveRule[] = [
  {
    awardCode: 'MA000010',
    awardName: 'Manufacturing & Associated Industries Award',
    rdo: { cycleWeeks: 4, hoursPerCycle: 8, accrualPerOrdinaryHour: 0.4 / 38 },
    ado: { accrualPerOrdinaryHour: 0.4 / 38, maxBalanceHours: 80, minBlockHours: 4 },
    toil: { enabled: true, conversion: 'time_for_time', expiryDays: 90, requiresPreApproval: true },
  },
  {
    awardCode: 'MA000100',
    awardName: 'Social, Community, Home Care & Disability Services (SCHADS)',
    ado: { accrualPerOrdinaryHour: 0.2 / 38, maxBalanceHours: 40, minBlockHours: 4 },
    toil: { enabled: true, conversion: 'time_for_time', expiryDays: 180, requiresPreApproval: false },
  },
  {
    awardCode: 'MA000020',
    awardName: 'Building & Construction General On-site Award',
    rdo: { cycleWeeks: 4, hoursPerCycle: 8, accrualPerOrdinaryHour: 0.4 / 38 },
    toil: { enabled: false, conversion: 'time_for_time', expiryDays: 60, requiresPreApproval: true },
  },
];

export const DEFAULT_LOCATIONS: LocationLeavePolicy[] = [
  {
    locationId: 'loc-1',
    locationName: 'Sydney CBD',
    rdoStrategy: 'fixed_day',
    fixedRdoDayOfMonth: 15,
    adoOfferedOnHire: true,
    toilCap: 40,
    minNoticeDaysToTake: 7,
  },
  {
    locationId: 'loc-2',
    locationName: 'Melbourne North',
    rdoStrategy: 'staff_choice',
    adoOfferedOnHire: false,
    toilCap: 60,
    minNoticeDaysToTake: 3,
  },
];

// ---------- In-memory store ----------

const _store = {
  awards: [...DEFAULT_AWARDS],
  locations: [...DEFAULT_LOCATIONS],
  staff: [
    { staffId: 's-1', staffName: 'Sarah Chen',   optedIn: { RDO: true,  ADO: false, TOIL: true  }, balanceHours: { RDO: 12, ADO: 0,  TOIL: 6.5 } },
    { staffId: 's-2', staffName: 'Marcus Nguyen', optedIn: { RDO: false, ADO: true,  TOIL: true  }, balanceHours: { RDO: 0,  ADO: 24, TOIL: 3   } },
    { staffId: 's-3', staffName: 'Priya Patel',  optedIn: { RDO: true,  ADO: true,  TOIL: false }, balanceHours: { RDO: 8,  ADO: 16, TOIL: 0   } },
  ] as StaffLeaveConfig[],
  ledger: [
    { id: 'l-1', staffId: 's-1', kind: 'RDO' as LeaveKind, type: 'accrual' as LedgerType,     hours:  8,   occurredOn: '2026-07-01', sourceShiftId: 'sh-101', note: '4-week cycle', createdAt: '2026-07-01T09:00:00Z' },
    { id: 'l-2', staffId: 's-1', kind: 'TOIL' as LeaveKind, type: 'accrual' as LedgerType,    hours:  2.5, occurredOn: '2026-07-05', sourceShiftId: 'sh-118', note: 'OT converted to TOIL', createdAt: '2026-07-05T18:00:00Z' },
    { id: 'l-3', staffId: 's-2', kind: 'ADO' as LeaveKind, type: 'accrual' as LedgerType,     hours:  1.6, occurredOn: '2026-07-10', sourceShiftId: 'sh-140', note: 'Weekly ADO accrual', createdAt: '2026-07-10T17:00:00Z' },
    { id: 'l-4', staffId: 's-1', kind: 'TOIL' as LeaveKind, type: 'consumption' as LedgerType, hours: -4,   occurredOn: '2026-07-14', sourceShiftId: 'sh-150', note: 'TOIL leave taken', createdAt: '2026-07-14T09:00:00Z' },
  ] as LedgerEntry[],
};

const listeners = new Set<() => void>();
let _snapshot = {
  awards: _store.awards,
  locations: _store.locations,
  staff: _store.staff,
  ledger: _store.ledger,
};
function emit() {
  _snapshot = {
    awards: _store.awards,
    locations: _store.locations,
    staff: _store.staff,
    ledger: _store.ledger,
  };
  listeners.forEach(fn => fn());
}
export function subscribeLeave(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }
export function getLeaveSnapshot() { return _snapshot; }

// ---------- API ----------

export const LeaveStore = {
  getAwards: () => _store.awards,
  getLocations: () => _store.locations,
  getStaff: () => _store.staff,
  getLedger: () => _store.ledger,
  getStaffBalance: (staffId: string): Record<LeaveKind, number> => {
    const s = _store.staff.find(x => x.staffId === staffId);
    return s?.balanceHours ?? { RDO: 0, ADO: 0, TOIL: 0 };
  },
  updateStaffConfig: (staffId: string, patch: Partial<StaffLeaveConfig>) => {
    const idx = _store.staff.findIndex(s => s.staffId === staffId);
    if (idx >= 0) _store.staff[idx] = { ..._store.staff[idx], ...patch };
    else _store.staff.push({ staffId, staffName: staffId, optedIn: { RDO: false, ADO: false, TOIL: false }, balanceHours: { RDO: 0, ADO: 0, TOIL: 0 }, ...patch });
    emit();
  },
  updateLocation: (locationId: string, patch: Partial<LocationLeavePolicy>) => {
    const idx = _store.locations.findIndex(l => l.locationId === locationId);
    if (idx >= 0) { _store.locations[idx] = { ..._store.locations[idx], ...patch }; emit(); }
  },
  updateAward: (awardCode: string, patch: Partial<AwardLeaveRule>) => {
    const idx = _store.awards.findIndex(a => a.awardCode === awardCode);
    if (idx >= 0) { _store.awards[idx] = { ..._store.awards[idx], ...patch }; emit(); }
  },
  postLedger: (e: Omit<LedgerEntry, 'id' | 'createdAt'>) => {
    const entry: LedgerEntry = { ...e, id: `l-${Date.now()}`, createdAt: new Date().toISOString() };
    _store.ledger.unshift(entry);
    // Update balance
    const staff = _store.staff.find(s => s.staffId === e.staffId);
    if (staff) staff.balanceHours[e.kind] = Math.max(0, (staff.balanceHours[e.kind] ?? 0) + e.hours);
    emit();
    return entry;
  },
};

// ---------- Shift tag derivation ----------

/**
 * Derive the RDO/ADO/TOIL tag for a shift given context.
 * Priority:
 *   1. Explicit manual tag (unless 'NONE')
 *   2. Overtime + TOIL opted-in     → TOIL accrual
 *   3. RDO anchor date match        → RDO consumption event
 *   4. ADO cycle threshold reached  → ADO accrual event
 *   5. Otherwise no tag
 */
export function deriveShiftTag(
  ctx: ShiftContext,
  award: AwardLeaveRule | undefined,
  location: LocationLeavePolicy | undefined,
  staff: StaffLeaveConfig | undefined,
): DerivedShiftTag {
  if (ctx.manualTag && ctx.manualTag !== 'NONE') {
    return { tag: ctx.manualTag, reason: `Manually tagged as ${ctx.manualTag}`, autoAccrualHours: ctx.scheduledHours, requiresApproval: ctx.manualTag === 'TOIL' && !!award?.toil?.requiresPreApproval };
  }

  const overtime = ctx.isOvertime ?? (ctx.actualHours && ctx.actualHours > ctx.scheduledHours);
  if (overtime && staff?.optedIn.TOIL && award?.toil?.enabled) {
    const extra = Math.max(0, (ctx.actualHours ?? ctx.scheduledHours) - ctx.scheduledHours);
    return { tag: 'TOIL', reason: 'Overtime converted to TOIL (time-for-time)', autoAccrualHours: extra, requiresApproval: !!award.toil.requiresPreApproval };
  }

  if (staff?.optedIn.RDO && staff.rdoAnchorDate && staff.rdoAnchorDate === ctx.date) {
    return { tag: 'RDO', reason: 'Anchor date matches RDO cycle', autoAccrualHours: award?.rdo?.hoursPerCycle ?? 8, requiresApproval: false };
  }

  if (staff?.optedIn.ADO && award?.ado) {
    const accrue = award.ado.accrualPerOrdinaryHour * ctx.scheduledHours;
    return { tag: null, reason: `Standard shift — accrues ${accrue.toFixed(2)}h ADO`, autoAccrualHours: accrue, requiresApproval: false };
  }

  return { tag: null, reason: 'No leave-accrual treatment', autoAccrualHours: 0, requiresApproval: false };
}

// ---------- Compatibility shims (used by LeaveBalanceDashboard) ----------

export function calculateServiceYears(startDate: string): number {
  const start = new Date(startDate).getTime();
  const now = Date.now();
  return Math.max(0, (now - start) / (1000 * 60 * 60 * 24 * 365.25));
}

export function formatLeaveBalance(hours: number): string {
  if (!isFinite(hours)) return '0h';
  const days = hours / 7.6;
  return `${hours.toFixed(1)}h (${days.toFixed(1)}d)`;
}

export function getLSLProRataEntitlement(_startDate: string, _state: string): number {
  // Simplified: 8.667 weeks after 10 years (NSW/VIC baseline)
  return 8.667 * 38;
}

export function initializeLeaveBalances(_staffId: string): unknown[] {
  return [];
}
