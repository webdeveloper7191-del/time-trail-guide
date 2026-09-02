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
    /** Cash-out of banked TOIL */
    cashoutEnabled?: boolean;
    /**
     * Which rate the cash-out is paid at:
     *  - 'accrual_rate' (DEFAULT): pay each banked hour at the rate/penalty that
     *    applied when it was earned (FIFO through the ledger). Protects the employer
     *    from paying old cheap hours at today's higher rate.
     *  - 'current_rate': pay all hours at the employee's rate on the cash-out date.
     */
    cashoutRateBasis?: ToilCashoutBasis;
    /** Re-apply the original overtime multiplier (1.5/2.0) when paying out. */
    cashoutIncludesPenalty?: boolean;
    cashoutRequiresApproval?: boolean;
    minCashoutHours?: number;
    maxCashoutHoursPerRequest?: number;
  };
  /** What happens when a drawdown exceeds the available balance. */
  shortfall?: BalanceShortfallPolicy;
}

export type ToilCashoutBasis = 'accrual_rate' | 'current_rate';
export type ShortfallTreatment = 'leave_without_pay' | 'allow_negative';

export interface BalanceShortfallPolicy {
  /** Applied per leave kind — RDO/ADO/TOIL can differ. */
  treatment: Record<LeaveKind, ShortfallTreatment>;
  /** Only when treatment = allow_negative: how far below zero a balance may go. */
  maxNegativeHours: Record<LeaveKind, number>;
  /** Going negative needs a manager sign-off. */
  requiresApprovalToGoNegative: boolean;
}

export const DEFAULT_SHORTFALL: BalanceShortfallPolicy = {
  treatment: { RDO: 'leave_without_pay', ADO: 'leave_without_pay', TOIL: 'leave_without_pay' },
  maxNegativeHours: { RDO: 0, ADO: 0, TOIL: 0 },
  requiresApprovalToGoNegative: true,
};

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
  rdoAnchorDate?: string; // ISO — first scheduled RDO
  // ---- Per-scheme overrides (fall back to award if undefined) ----
  rdoSettings?: {
    dayOfWeek?: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
    cycleWeeks?: number;              // usually 4
    extraMinutesPerDay?: number;      // e.g. 24 min/day → banks 8h over 4 wks
  };
  adoSettings?: {
    extraMinutesPerDay?: number;      // additional ordinary mins/day
    targetHoursPerDayOff?: number;    // hours needed to trigger a day off (e.g. 7.6)
    autoScheduleDayOff?: boolean;     // auto-book once threshold reached
  };
  toilSettings?: {
    conversion?: 'time_for_time' | 'penalty_equivalent';
    penaltyMultiplier?: number;       // e.g. 1.5
    maxBalanceHours?: number;         // cap
    expiryDays?: number;              // must be taken within
    requiresPreApproval?: boolean;
  };
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
  /** Base hourly rate that applied when these hours were banked (accruals only). */
  rateAtAccrual?: number;
  /** Overtime/penalty multiplier that applied when banked (e.g. 1.5). */
  multiplierAtAccrual?: number;
  /** Hours of this accrual layer already consumed or cashed out (FIFO bookkeeping). */
  drawnHours?: number;
  /** Set on consumption entries that could not be covered by the balance. */
  unpaidHours?: number;
}

// ---------- TOIL cash-out ----------

export type CashoutStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface ToilCashoutRequest {
  id: string;
  staffId: string;
  staffName: string;
  hours: number;
  requestedOn: string;
  reason?: string;
  status: CashoutStatus;
  basis: ToilCashoutBasis;
  /** Rate used when basis = current_rate. */
  currentRate: number;
  /** Calculated gross value at request time. */
  estimatedAmount: number;
  breakdown: CashoutLayer[];
  decidedBy?: string;
  decidedOn?: string;
  decisionNote?: string;
  /** Set when picked up by a timesheet / pay run. */
  paidInPeriod?: string;
  payItemCode?: string;
}

export interface CashoutLayer {
  sourceEntryId: string;
  accruedOn: string;
  hours: number;
  rate: number;
  multiplier: number;
  amount: number;
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

const TOIL_CASHOUT_DEFAULTS = {
  cashoutEnabled: true,
  cashoutRateBasis: 'accrual_rate' as ToilCashoutBasis,
  cashoutIncludesPenalty: true,
  cashoutRequiresApproval: true,
  minCashoutHours: 4,
  maxCashoutHoursPerRequest: 38,
};

export const DEFAULT_AWARDS: AwardLeaveRule[] = [
  {
    awardCode: 'MA000010',
    awardName: 'Manufacturing & Associated Industries Award',
    rdo: { cycleWeeks: 4, hoursPerCycle: 8, accrualPerOrdinaryHour: 0.4 / 38 },
    ado: { accrualPerOrdinaryHour: 0.4 / 38, maxBalanceHours: 80, minBlockHours: 4 },
    toil: { enabled: true, conversion: 'time_for_time', expiryDays: 90, requiresPreApproval: true, ...TOIL_CASHOUT_DEFAULTS },
    shortfall: { ...DEFAULT_SHORTFALL, treatment: { ...DEFAULT_SHORTFALL.treatment }, maxNegativeHours: { ...DEFAULT_SHORTFALL.maxNegativeHours } },
  },
  {
    awardCode: 'MA000100',
    awardName: 'Social, Community, Home Care & Disability Services (SCHADS)',
    ado: { accrualPerOrdinaryHour: 0.2 / 38, maxBalanceHours: 40, minBlockHours: 4 },
    toil: { enabled: true, conversion: 'time_for_time', expiryDays: 180, requiresPreApproval: false, ...TOIL_CASHOUT_DEFAULTS },
    shortfall: { ...DEFAULT_SHORTFALL, treatment: { ...DEFAULT_SHORTFALL.treatment }, maxNegativeHours: { ...DEFAULT_SHORTFALL.maxNegativeHours } },
  },
  {
    awardCode: 'MA000020',
    awardName: 'Building & Construction General On-site Award',
    rdo: { cycleWeeks: 4, hoursPerCycle: 8, accrualPerOrdinaryHour: 0.4 / 38 },
    toil: { enabled: false, conversion: 'time_for_time', expiryDays: 60, requiresPreApproval: true, ...TOIL_CASHOUT_DEFAULTS, cashoutEnabled: false },
    shortfall: { ...DEFAULT_SHORTFALL, treatment: { ...DEFAULT_SHORTFALL.treatment }, maxNegativeHours: { ...DEFAULT_SHORTFALL.maxNegativeHours } },
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

// ---------- In-memory store (with localStorage persistence) ----------

const LS_KEY = 'rostered.leaveAccruals.v2';

const _defaults = {
  awards: [...DEFAULT_AWARDS],
  locations: [...DEFAULT_LOCATIONS],
  staff: [
    { staffId: 's-1', staffName: 'Sarah Chen',    optedIn: { RDO: true,  ADO: false, TOIL: true  }, balanceHours: { RDO: 12, ADO: 0,  TOIL: 6.5 } },
    { staffId: 's-2', staffName: 'Marcus Nguyen', optedIn: { RDO: false, ADO: true,  TOIL: true  }, balanceHours: { RDO: 0,  ADO: 24, TOIL: 3   } },
    { staffId: 's-3', staffName: 'Priya Patel',   optedIn: { RDO: true,  ADO: true,  TOIL: false }, balanceHours: { RDO: 8,  ADO: 16, TOIL: 0   } },
  ] as StaffLeaveConfig[],
  ledger: [
    { id: 'l-1', staffId: 's-1', kind: 'RDO'  as LeaveKind, type: 'accrual'     as LedgerType, hours:  8,   occurredOn: '2026-07-01', sourceShiftId: 'sh-101', note: '4-week cycle',           createdAt: '2026-07-01T09:00:00Z', rateAtAccrual: 32.5, multiplierAtAccrual: 1 },
    { id: 'l-2', staffId: 's-1', kind: 'TOIL' as LeaveKind, type: 'accrual'     as LedgerType, hours:  2.5, occurredOn: '2026-07-05', sourceShiftId: 'sh-118', note: 'OT converted to TOIL',   createdAt: '2026-07-05T18:00:00Z', rateAtAccrual: 32.5, multiplierAtAccrual: 1.5 },
    { id: 'l-3', staffId: 's-2', kind: 'ADO'  as LeaveKind, type: 'accrual'     as LedgerType, hours:  1.6, occurredOn: '2026-07-10', sourceShiftId: 'sh-140', note: 'Weekly ADO accrual',     createdAt: '2026-07-10T17:00:00Z', rateAtAccrual: 30.1, multiplierAtAccrual: 1 },
    { id: 'l-4', staffId: 's-1', kind: 'TOIL' as LeaveKind, type: 'consumption' as LedgerType, hours: -4,   occurredOn: '2026-07-14', sourceShiftId: 'sh-150', note: 'TOIL leave taken',       createdAt: '2026-07-14T09:00:00Z' },
  ] as LedgerEntry[],
  cashouts: [] as ToilCashoutRequest[],
};


function hydrate() {
  if (typeof window === 'undefined') return { ..._defaults };
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { ..._defaults };
    const parsed = JSON.parse(raw);
    return {
      awards: parsed.awards ?? _defaults.awards,
      locations: parsed.locations ?? _defaults.locations,
      staff: parsed.staff ?? _defaults.staff,
      ledger: parsed.ledger ?? _defaults.ledger,
      cashouts: parsed.cashouts ?? _defaults.cashouts,
    };
  } catch {
    return { ..._defaults };
  }
}

const _store = hydrate();

function persist() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(_store)); } catch { /* quota */ }
}

const listeners = new Set<() => void>();
let _snapshot = {
  awards: _store.awards,
  locations: _store.locations,
  staff: _store.staff,
  ledger: _store.ledger,
  cashouts: _store.cashouts,
};
function emit() {
  _snapshot = {
    awards: [..._store.awards],
    locations: [..._store.locations],
    staff: [..._store.staff],
    ledger: [..._store.ledger],
    cashouts: [..._store.cashouts],
  };
  persist();
  listeners.forEach(fn => fn());
}
export function subscribeLeave(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }
export function getLeaveSnapshot() { return _snapshot; }
export function resetLeaveStore() {
  _store.awards = [..._defaults.awards];
  _store.locations = [..._defaults.locations];
  _store.staff = _defaults.staff.map(s => ({ ...s, optedIn: { ...s.optedIn }, balanceHours: { ...s.balanceHours } }));
  _store.ledger = [..._defaults.ledger];
  _store.cashouts = [];
  emit();
}

// ---------- API ----------

export const LeaveStore = {
  getAwards: () => _store.awards,
  getLocations: () => _store.locations,
  getStaff: () => _store.staff,
  getLedger: () => _store.ledger,
  getCashouts: () => _store.cashouts,
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
    const entry: LedgerEntry = { ...e, id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() };
    _store.ledger.unshift(entry);
    // Update balance — floor at zero only when the award forbids negatives.
    const staff = _store.staff.find(s => s.staffId === e.staffId);
    if (staff) {
      const next = (staff.balanceHours[e.kind] ?? 0) + e.hours;
      staff.balanceHours[e.kind] = Math.round(next * 100) / 100;
    }
    emit();
    return entry;
  },
  upsertCashout: (req: ToilCashoutRequest) => {
    const idx = _store.cashouts.findIndex(c => c.id === req.id);
    if (idx >= 0) _store.cashouts[idx] = req; else _store.cashouts.unshift(req);
    emit();
    return req;
  },
};

// ---------- Balance shortfall (negative balance vs leave without pay) ----------

export function getShortfallPolicy(awardCode?: string): BalanceShortfallPolicy {
  return findAward(awardCode)?.shortfall ?? DEFAULT_SHORTFALL;
}

export interface DrawdownPlan {
  requestedHours: number;
  /** Hours covered by the existing balance. */
  paidFromBalance: number;
  /** Hours taken into a negative balance (advance). */
  negativeHours: number;
  /** Hours that become leave without pay. */
  unpaidHours: number;
  treatment: ShortfallTreatment;
  requiresApproval: boolean;
  message: string;
}

/**
 * Work out how a drawdown that exceeds the balance is treated.
 * Either the balance is allowed to go negative (advance, up to a floor) or
 * the uncovered hours fall to leave without pay.
 */
export function planDrawdown(input: {
  staffId: string;
  kind: LeaveKind;
  hours: number;
  awardCode?: string;
}): DrawdownPlan {
  const requested = Math.abs(input.hours);
  const balance = LeaveStore.getStaffBalance(input.staffId)[input.kind] ?? 0;
  const policy = getShortfallPolicy(input.awardCode);
  const treatment = policy.treatment[input.kind];
  const paidFromBalance = Math.max(0, Math.min(requested, balance));
  const shortfall = round2(requested - paidFromBalance);

  if (shortfall <= 0) {
    return {
      requestedHours: requested, paidFromBalance, negativeHours: 0, unpaidHours: 0,
      treatment, requiresApproval: false,
      message: 'Fully covered by the current balance.',
    };
  }

  if (treatment === 'allow_negative') {
    const floor = policy.maxNegativeHours[input.kind] ?? 0;
    const roomBelowZero = Math.max(0, floor - Math.max(0, -Math.min(0, balance)));
    const negativeHours = round2(Math.min(shortfall, roomBelowZero));
    const unpaidHours = round2(shortfall - negativeHours);
    return {
      requestedHours: requested, paidFromBalance, negativeHours, unpaidHours,
      treatment,
      requiresApproval: policy.requiresApprovalToGoNegative && negativeHours > 0,
      message: unpaidHours > 0
        ? `${negativeHours}h advanced against future accrual (floor ${floor}h); ${unpaidHours}h beyond the floor becomes leave without pay.`
        : `${negativeHours}h advanced against future accrual — balance goes negative and repays as the employee accrues.`,
    };
  }

  return {
    requestedHours: requested, paidFromBalance, negativeHours: 0, unpaidHours: shortfall,
    treatment, requiresApproval: false,
    message: `${shortfall}h is not covered by the balance and is paid as leave without pay.`,
  };
}

/** Post a drawdown honouring the shortfall policy. Returns the plan that was applied. */
export function consumeLeave(input: {
  staffId: string;
  kind: LeaveKind;
  hours: number;
  occurredOn: string;
  awardCode?: string;
  sourceShiftId?: string;
  note?: string;
}): { plan: DrawdownPlan; entry: LedgerEntry | null } {
  const plan = planDrawdown(input);
  const drawn = round2(plan.paidFromBalance + plan.negativeHours);
  if (drawn <= 0) return { plan, entry: null };
  const entry = LeaveStore.postLedger({
    staffId: input.staffId,
    kind: input.kind,
    type: 'consumption',
    hours: -drawn,
    occurredOn: input.occurredOn,
    sourceShiftId: input.sourceShiftId,
    unpaidHours: plan.unpaidHours || undefined,
    note: input.note ?? `${input.kind} taken${plan.unpaidHours ? ` (+${plan.unpaidHours}h leave without pay)` : ''}${plan.negativeHours ? ` — ${plan.negativeHours}h advanced` : ''}`,
  });
  return { plan, entry };
}

// ---------- TOIL cash-out valuation ----------

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface CashoutQuote {
  hours: number;
  basis: ToilCashoutBasis;
  amount: number;
  blendedRate: number;
  layers: CashoutLayer[];
  shortHours: number;      // requested beyond available balance
  warnings: string[];
}

/**
 * Value a TOIL cash-out.
 *  - accrual_rate: FIFO through the TOIL accrual layers, each hour paid at the
 *    base rate (and optionally the OT multiplier) that applied when it was banked.
 *  - current_rate: every hour paid at today's rate.
 */
export function quoteToilCashout(input: {
  staffId: string;
  hours: number;
  currentRate: number;
  awardCode?: string;
  basisOverride?: ToilCashoutBasis;
}): CashoutQuote {
  const award = findAward(input.awardCode);
  const toil = award?.toil;
  const basis = input.basisOverride ?? toil?.cashoutRateBasis ?? 'accrual_rate';
  const includePenalty = toil?.cashoutIncludesPenalty ?? true;
  const warnings: string[] = [];

  const balance = LeaveStore.getStaffBalance(input.staffId).TOIL ?? 0;
  const requested = Math.max(0, input.hours);
  const payable = Math.min(requested, Math.max(0, balance));
  const shortHours = round2(requested - payable);
  if (shortHours > 0) warnings.push(`Only ${payable.toFixed(2)}h of TOIL is available — ${shortHours}h cannot be cashed out.`);
  if (toil && toil.cashoutEnabled === false) warnings.push('Cash-out is disabled on this award.');
  if (toil?.minCashoutHours && requested < toil.minCashoutHours) warnings.push(`Minimum cash-out is ${toil.minCashoutHours}h.`);
  if (toil?.maxCashoutHoursPerRequest && requested > toil.maxCashoutHoursPerRequest) warnings.push(`Maximum cash-out per request is ${toil.maxCashoutHoursPerRequest}h.`);

  const layers: CashoutLayer[] = [];

  if (basis === 'current_rate') {
    if (payable > 0) {
      layers.push({
        sourceEntryId: 'current', accruedOn: new Date().toISOString().slice(0, 10),
        hours: round2(payable), rate: input.currentRate, multiplier: 1,
        amount: round2(payable * input.currentRate),
      });
    }
  } else {
    // FIFO across TOIL accruals net of prior consumption/payout
    const entries = _store.ledger
      .filter(e => e.staffId === input.staffId && e.kind === 'TOIL')
      .slice()
      .sort((a, b) => (a.occurredOn < b.occurredOn ? -1 : 1));

    const accruals = entries.filter(e => e.hours > 0).map(e => ({ e, remaining: e.hours }));
    let alreadyDrawn = entries.filter(e => e.hours < 0).reduce((n, e) => n + Math.abs(e.hours), 0);
    for (const layer of accruals) {
      if (alreadyDrawn <= 0) break;
      const take = Math.min(layer.remaining, alreadyDrawn);
      layer.remaining -= take;
      alreadyDrawn -= take;
    }

    let left = payable;
    for (const layer of accruals) {
      if (left <= 0) break;
      if (layer.remaining <= 0) continue;
      const take = round2(Math.min(layer.remaining, left));
      const rate = layer.e.rateAtAccrual ?? input.currentRate;
      const mult = includePenalty ? (layer.e.multiplierAtAccrual ?? 1) : 1;
      layers.push({
        sourceEntryId: layer.e.id, accruedOn: layer.e.occurredOn,
        hours: take, rate, multiplier: mult, amount: round2(take * rate * mult),
      });
      left = round2(left - take);
    }
    if (left > 0) {
      warnings.push(`${left}h had no recorded accrual rate — valued at the current rate.`);
      layers.push({
        sourceEntryId: 'unmatched', accruedOn: new Date().toISOString().slice(0, 10),
        hours: left, rate: input.currentRate, multiplier: 1, amount: round2(left * input.currentRate),
      });
    }
  }

  const amount = round2(layers.reduce((n, l) => n + l.amount, 0));
  const hours = round2(layers.reduce((n, l) => n + l.hours, 0));
  return {
    hours, basis, amount,
    blendedRate: hours > 0 ? round2(amount / hours) : 0,
    layers, shortHours, warnings,
  };
}

/** Employee-initiated cash-out request. Auto-approves when the award allows. */
export function requestToilCashout(input: {
  staffId: string;
  staffName: string;
  hours: number;
  currentRate: number;
  awardCode?: string;
  reason?: string;
}): ToilCashoutRequest {
  const award = findAward(input.awardCode);
  const quote = quoteToilCashout(input);
  const needsApproval = award?.toil?.cashoutRequiresApproval ?? true;
  const req: ToilCashoutRequest = {
    id: `toil-co-${Date.now()}`,
    staffId: input.staffId,
    staffName: input.staffName,
    hours: quote.hours,
    requestedOn: new Date().toISOString().slice(0, 10),
    reason: input.reason,
    status: needsApproval ? 'pending' : 'approved',
    basis: quote.basis,
    currentRate: input.currentRate,
    estimatedAmount: quote.amount,
    breakdown: quote.layers,
    payItemCode: 'TOIL_CASHOUT',
  };
  LeaveStore.upsertCashout(req);
  if (!needsApproval) approveToilCashout(req.id, 'Auto-approved by award rule');
  return req;
}

/** Manager approval — posts the payout to the ledger so the balance drops. */
export function approveToilCashout(id: string, note?: string, approver = 'Manager'): ToilCashoutRequest | null {
  const req = _store.cashouts.find(c => c.id === id);
  if (!req || (req.status !== 'pending' && req.status !== 'approved')) return null;
  const already = _store.ledger.some(e => e.sourceShiftId === req.id);
  if (!already) {
    LeaveStore.postLedger({
      staffId: req.staffId, kind: 'TOIL', type: 'payout',
      hours: -Math.abs(req.hours), occurredOn: new Date().toISOString().slice(0, 10),
      sourceShiftId: req.id,
      note: `TOIL cash-out ${req.hours}h @ ${req.basis === 'current_rate' ? 'current rate' : 'original accrual rates'} = $${req.estimatedAmount.toFixed(2)}`,
    });
  }
  const updated: ToilCashoutRequest = { ...req, status: 'approved', decidedBy: approver, decidedOn: new Date().toISOString().slice(0, 10), decisionNote: note };
  return LeaveStore.upsertCashout(updated);
}

export function rejectToilCashout(id: string, note: string, approver = 'Manager'): ToilCashoutRequest | null {
  const req = _store.cashouts.find(c => c.id === id);
  if (!req) return null;
  return LeaveStore.upsertCashout({ ...req, status: 'rejected', decidedBy: approver, decidedOn: new Date().toISOString().slice(0, 10), decisionNote: note });
}

/** Marks an approved cash-out as picked up by a timesheet / pay run period. */
export function markCashoutPaid(id: string, period: string): ToilCashoutRequest | null {
  const req = _store.cashouts.find(c => c.id === id);
  if (!req || req.status !== 'approved') return null;
  return LeaveStore.upsertCashout({ ...req, status: 'paid', paidInPeriod: period });
}

/**
 * Approved-but-unpaid cash-outs for a staff member — consumed by the timesheet
 * and pay-run builders as a `TOIL_CASHOUT` earnings line.
 */
export function getPayableCashouts(staffId?: string): ToilCashoutRequest[] {
  return _store.cashouts.filter(c => c.status === 'approved' && (!staffId || c.staffId === staffId));
}


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

// ---------- Roster / timesheet integration helpers ----------

export function findStaffByName(name: string): StaffLeaveConfig | undefined {
  if (!name) return undefined;
  const n = name.trim().toLowerCase();
  return _store.staff.find(s => s.staffName.trim().toLowerCase() === n);
}
export function findAward(code?: string): AwardLeaveRule | undefined {
  if (!code) return _store.awards[0];
  return _store.awards.find(a => a.awardCode === code) ?? _store.awards[0];
}
export function findLocation(id?: string): LocationLeavePolicy | undefined {
  if (!id) return _store.locations[0];
  return _store.locations.find(l => l.locationId === id) ?? _store.locations[0];
}

export type ShiftLeaveTag = 'AUTO' | 'NONE' | 'RDO' | 'ADO' | 'TOIL' | 'RDO_LEAVE' | 'ADO_LEAVE' | 'TOIL_LEAVE';

/**
 * Called by the roster editor when a shift is saved.
 * Returns the ledger entry that was posted (or null if no effect).
 */
export function applyShiftLeaveEffect(input: {
  staffId?: string;
  staffName?: string;
  awardCode?: string;
  locationId?: string;
  shiftId: string;
  date: string;
  scheduledHours: number;
  actualHours?: number;
  isOvertime?: boolean;
  isPublicHoliday?: boolean;
  leaveTag?: ShiftLeaveTag;
  note?: string;
}): LedgerEntry | null {
  const staff =
    (input.staffId ? _store.staff.find(s => s.staffId === input.staffId) : undefined) ??
    (input.staffName ? findStaffByName(input.staffName) : undefined);
  if (!staff) return null;

  const tag = input.leaveTag ?? 'AUTO';

  // Consumption tags — a "leave day" shift that draws down balance
  if (tag === 'RDO_LEAVE' || tag === 'ADO_LEAVE' || tag === 'TOIL_LEAVE') {
    const kind: LeaveKind = tag === 'RDO_LEAVE' ? 'RDO' : tag === 'ADO_LEAVE' ? 'ADO' : 'TOIL';
    const hours = -Math.abs(input.scheduledHours || 8);
    return LeaveStore.postLedger({
      staffId: staff.staffId,
      kind,
      type: 'consumption',
      hours,
      occurredOn: input.date,
      sourceShiftId: input.shiftId,
      note: input.note ?? `${kind} leave taken`,
    });
  }

  if (tag === 'NONE') return null;

  // Explicit accrual tag
  if (tag === 'RDO' || tag === 'ADO' || tag === 'TOIL') {
    const award = findAward(input.awardCode);
    const hours =
      tag === 'RDO' ? (award?.rdo?.hoursPerCycle ?? input.scheduledHours) :
      tag === 'ADO' ? ((award?.ado?.accrualPerOrdinaryHour ?? 0) * input.scheduledHours) :
      /* TOIL */    Math.max(0, (input.actualHours ?? input.scheduledHours) - input.scheduledHours) || input.scheduledHours;
    if (hours <= 0) return null;
    return LeaveStore.postLedger({
      staffId: staff.staffId,
      kind: tag,
      type: 'accrual',
      hours,
      occurredOn: input.date,
      sourceShiftId: input.shiftId,
      note: input.note ?? `${tag} accrual (manual)`,
    });
  }

  // AUTO — derive from context
  const derived = deriveShiftTag(
    {
      staffId: staff.staffId,
      date: input.date,
      scheduledHours: input.scheduledHours,
      actualHours: input.actualHours,
      isOvertime: input.isOvertime,
      isPublicHoliday: input.isPublicHoliday,
    },
    findAward(input.awardCode),
    findLocation(input.locationId),
    staff,
  );
  if (!derived.tag || derived.autoAccrualHours <= 0) return null;
  return LeaveStore.postLedger({
    staffId: staff.staffId,
    kind: derived.tag,
    type: 'accrual',
    hours: derived.autoAccrualHours,
    occurredOn: input.date,
    sourceShiftId: input.shiftId,
    note: input.note ?? derived.reason,
  });
}

/**
 * Called by timesheet approval to bank approved overtime as TOIL
 * instead of paying it out.
 */
export function bankOvertimeAsTOIL(input: {
  staffId?: string;
  staffName?: string;
  timesheetId: string;
  date: string;
  overtimeHours: number;
  awardCode?: string;
}): LedgerEntry | null {
  const staff =
    (input.staffId ? _store.staff.find(s => s.staffId === input.staffId) : undefined) ??
    (input.staffName ? findStaffByName(input.staffName) : undefined);
  if (!staff || input.overtimeHours <= 0) return null;
  const award = findAward(input.awardCode);
  const factor = award?.toil?.conversion === 'penalty_equivalent' ? 1.5 : 1;
  return LeaveStore.postLedger({
    staffId: staff.staffId,
    kind: 'TOIL',
    type: 'accrual',
    hours: input.overtimeHours * factor,
    occurredOn: input.date,
    sourceShiftId: input.timesheetId,
    note: `Banked from approved OT (×${factor})`,
  });
}

