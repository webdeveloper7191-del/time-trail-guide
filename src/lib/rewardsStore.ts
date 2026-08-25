/**
 * Recognition & rewards store.
 *
 * Covers the configuration surface that was previously hard-coded inside the
 * Recognition panel:
 *  - the reward catalogue (what points can be redeemed for)
 *  - points earning rules (how points are generated)
 *  - program settings (monthly award allowance, approval requirement)
 *  - staff point balances + ledger
 *  - redemption requests and their approval lifecycle
 *
 * Persisted to localStorage (no backend yet) with a subscribe/notify bridge so
 * panels re-render on change.
 */

export type RewardCategory = 'voucher' | 'time_off' | 'experience' | 'merchandise' | 'charity' | 'other';

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  pointsCost: number;
  category: RewardCategory;
  /** undefined = unlimited */
  stock?: number;
  /** Max redemptions per staff member per year. undefined = unlimited */
  limitPerStaffPerYear?: number;
  requiresApproval: boolean;
  isActive: boolean;
}

export type EarningTrigger =
  | 'praise_received'
  | 'praise_given'
  | 'course_completed'
  | 'learning_path_completed'
  | 'goal_completed'
  | 'review_completed'
  | 'peer_nomination'
  | 'work_anniversary';

export interface EarningRule {
  id: string;
  trigger: EarningTrigger;
  points: number;
  /** Cap on points from this trigger per staff member per month. 0 = no cap */
  monthlyCap: number;
  isActive: boolean;
}

export interface RewardsSettings {
  /** Points every manager can hand out per month via "Award points" */
  managerMonthlyAllowance: number;
  /** Anyone (peer-to-peer) allowance per month */
  peerMonthlyAllowance: number;
  /** Redemptions need admin approval before fulfilment */
  requireApprovalForRedemption: boolean;
  /** Points expire after N months of inactivity. 0 = never */
  pointsExpiryMonths: number;
  currency: string;
  /** Indicative cash value of 1 point, used for budget reporting */
  pointValue: number;
  programEnabled: boolean;
}

export interface PointsLedgerEntry {
  id: string;
  staffId: string;
  type: 'earned' | 'awarded' | 'spent' | 'expired' | 'adjusted';
  points: number; // negative for spent/expired
  reason: string;
  date: string; // ISO
}

export type RedemptionStatus = 'pending' | 'approved' | 'fulfilled' | 'declined' | 'cancelled';

export interface RedemptionRequest {
  id: string;
  staffId: string;
  rewardId: string;
  rewardName: string;
  pointsCost: number;
  status: RedemptionStatus;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  note?: string;
}

export interface RewardsState {
  settings: RewardsSettings;
  catalogue: RewardItem[];
  earningRules: EarningRule[];
  ledger: PointsLedgerEntry[];
  redemptions: RedemptionRequest[];
}

export const rewardCategoryLabels: Record<RewardCategory, string> = {
  voucher: 'Voucher',
  time_off: 'Time off',
  experience: 'Experience',
  merchandise: 'Merchandise',
  charity: 'Charity donation',
  other: 'Other',
};

export const earningTriggerLabels: Record<EarningTrigger, string> = {
  praise_received: 'Received praise',
  praise_given: 'Gave praise',
  course_completed: 'Completed a course',
  learning_path_completed: 'Completed a learning path',
  goal_completed: 'Completed a goal',
  review_completed: 'Completed a review on time',
  peer_nomination: 'Peer nomination accepted',
  work_anniversary: 'Work anniversary',
};

export const redemptionStatusLabels: Record<RedemptionStatus, string> = {
  pending: 'Pending approval',
  approved: 'Approved',
  fulfilled: 'Fulfilled',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

const STORAGE_KEY = 'rostered.performance.rewards.v1';

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

const defaultState = (): RewardsState => ({
  settings: {
    managerMonthlyAllowance: 500,
    peerMonthlyAllowance: 100,
    requireApprovalForRedemption: true,
    pointsExpiryMonths: 0,
    currency: 'AUD',
    pointValue: 0.1,
    programEnabled: true,
  },
  catalogue: [
    { id: 'rw-coffee', name: 'Coffee voucher', description: 'Free coffee at the local café', emoji: '☕', pointsCost: 50, category: 'voucher', requiresApproval: false, isActive: true },
    { id: 'rw-break', name: 'Extra break', description: 'An extra 15-minute break on a shift of your choice', emoji: '⏰', pointsCost: 100, category: 'time_off', limitPerStaffPerYear: 6, requiresApproval: true, isActive: true },
    { id: 'rw-lunch', name: 'Lunch on us', description: 'Lunch at any participating restaurant', emoji: '🍽️', pointsCost: 200, category: 'voucher', requiresApproval: false, isActive: true },
    { id: 'rw-halfday', name: 'Half day off', description: 'Finish four hours early on an approved day', emoji: '🏖️', pointsCost: 500, category: 'time_off', limitPerStaffPerYear: 2, requiresApproval: true, isActive: true },
    { id: 'rw-giftcard', name: '$25 gift card', description: 'Gift card of your choice', emoji: '🎁', pointsCost: 300, category: 'voucher', stock: 40, requiresApproval: true, isActive: true },
    { id: 'rw-shoutout', name: 'Team shoutout', description: 'Featured in the team newsletter', emoji: '📣', pointsCost: 25, category: 'experience', requiresApproval: false, isActive: true },
    { id: 'rw-charity', name: 'Charity donation', description: 'We donate $25 to a charity you nominate', emoji: '💚', pointsCost: 250, category: 'charity', requiresApproval: true, isActive: true },
  ],
  earningRules: [
    { id: 'er-praise-received', trigger: 'praise_received', points: 25, monthlyCap: 200, isActive: true },
    { id: 'er-praise-given', trigger: 'praise_given', points: 5, monthlyCap: 50, isActive: true },
    { id: 'er-course', trigger: 'course_completed', points: 25, monthlyCap: 0, isActive: true },
    { id: 'er-path', trigger: 'learning_path_completed', points: 100, monthlyCap: 0, isActive: true },
    { id: 'er-goal', trigger: 'goal_completed', points: 50, monthlyCap: 0, isActive: true },
    { id: 'er-review', trigger: 'review_completed', points: 30, monthlyCap: 0, isActive: true },
    { id: 'er-nomination', trigger: 'peer_nomination', points: 20, monthlyCap: 0, isActive: false },
    { id: 'er-anniversary', trigger: 'work_anniversary', points: 100, monthlyCap: 0, isActive: true },
  ],
  ledger: [
    { id: 'pl-1', staffId: 'staff-1', type: 'earned', points: 50, reason: 'Received praise', date: iso(4) },
    { id: 'pl-2', staffId: 'staff-1', type: 'earned', points: 25, reason: 'Completed training module', date: iso(9) },
    { id: 'pl-3', staffId: 'staff-1', type: 'awarded', points: 45, reason: 'Team collaboration award', date: iso(12) },
    { id: 'pl-4', staffId: 'staff-1', type: 'spent', points: -50, reason: 'Redeemed: Coffee voucher', date: iso(15) },
    { id: 'pl-5', staffId: 'staff-1', type: 'earned', points: 380, reason: 'Opening balance', date: iso(60) },
    { id: 'pl-6', staffId: 'staff-2', type: 'earned', points: 50, reason: 'Leadership recognition', date: iso(5) },
    { id: 'pl-7', staffId: 'staff-2', type: 'awarded', points: 45, reason: 'Mentoring a new team member', date: iso(11) },
    { id: 'pl-8', staffId: 'staff-2', type: 'earned', points: 585, reason: 'Opening balance', date: iso(60) },
    { id: 'pl-9', staffId: 'staff-3', type: 'earned', points: 50, reason: 'Going above and beyond', date: iso(6) },
    { id: 'pl-10', staffId: 'staff-3', type: 'earned', points: 270, reason: 'Opening balance', date: iso(60) },
    { id: 'pl-11', staffId: 'staff-4', type: 'earned', points: 35, reason: 'Innovation award', date: iso(3) },
    { id: 'pl-12', staffId: 'staff-4', type: 'earned', points: 150, reason: 'Opening balance', date: iso(60) },
  ],
  redemptions: [
    { id: 'rd-1', staffId: 'staff-2', rewardId: 'rw-giftcard', rewardName: '$25 gift card', pointsCost: 300, status: 'pending', requestedAt: iso(2) },
    { id: 'rd-3', staffId: 'staff-1', rewardId: 'rw-coffee', rewardName: 'Coffee voucher', pointsCost: 50, status: 'fulfilled', requestedAt: iso(15), decidedAt: iso(14) },
  ],
});

let cache: RewardsState | null = null;
const listeners = new Set<() => void>();

function read(): RewardsState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    cache = defaultState();
  }
  return cache!;
}

function write(next: RewardsState) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep in memory */
  }
  listeners.forEach(l => l());
}

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const sameMonth = (d: string) => {
  const x = new Date(d);
  const now = new Date();
  return x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear();
};

export const rewardsStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: read,
  reset() {
    write(defaultState());
  },

  // ---- Settings ----
  saveSettings(patch: Partial<RewardsSettings>) {
    const s = read();
    write({ ...s, settings: { ...s.settings, ...patch } });
  },

  // ---- Catalogue ----
  saveReward(item: Omit<RewardItem, 'id'> & { id?: string }) {
    const s = read();
    const id = item.id ?? uid('rw');
    const next = { ...item, id } as RewardItem;
    const catalogue = s.catalogue.some(r => r.id === id)
      ? s.catalogue.map(r => (r.id === id ? next : r))
      : [...s.catalogue, next];
    write({ ...s, catalogue });
    return id;
  },
  deleteReward(id: string) {
    const s = read();
    if (s.redemptions.some(r => r.rewardId === id && (r.status === 'pending' || r.status === 'approved'))) {
      throw new Error('This reward has open redemptions. Decline them or deactivate the reward instead.');
    }
    write({ ...s, catalogue: s.catalogue.filter(r => r.id !== id) });
  },

  // ---- Earning rules ----
  saveEarningRule(rule: Omit<EarningRule, 'id'> & { id?: string }) {
    const s = read();
    const id = rule.id ?? uid('er');
    const next = { ...rule, id } as EarningRule;
    const earningRules = s.earningRules.some(r => r.id === id)
      ? s.earningRules.map(r => (r.id === id ? next : r))
      : [...s.earningRules, next];
    write({ ...s, earningRules });
    return id;
  },
  deleteEarningRule(id: string) {
    const s = read();
    write({ ...s, earningRules: s.earningRules.filter(r => r.id !== id) });
  },

  // ---- Points ----
  addLedgerEntry(entry: Omit<PointsLedgerEntry, 'id' | 'date'> & { date?: string }) {
    const s = read();
    const next: PointsLedgerEntry = { ...entry, id: uid('pl'), date: entry.date ?? new Date().toISOString() };
    write({ ...s, ledger: [next, ...s.ledger] });
    return next;
  },
  /** Points automatically granted for a trigger, respecting the monthly cap. */
  awardForTrigger(staffId: string, trigger: EarningTrigger, reason?: string) {
    const s = read();
    const rule = s.earningRules.find(r => r.trigger === trigger && r.isActive);
    if (!s.settings.programEnabled || !rule) return 0;
    if (rule.monthlyCap > 0) {
      const earnedThisMonth = s.ledger
        .filter(l => l.staffId === staffId && l.points > 0 && sameMonth(l.date) && l.reason.startsWith(earningTriggerLabels[trigger]))
        .reduce((sum, l) => sum + l.points, 0);
      if (earnedThisMonth >= rule.monthlyCap) return 0;
    }
    rewardsStore.addLedgerEntry({
      staffId,
      type: 'earned',
      points: rule.points,
      reason: reason ? `${earningTriggerLabels[trigger]} — ${reason}` : earningTriggerLabels[trigger],
    });
    return rule.points;
  },

  // ---- Redemptions ----
  requestRedemption(staffId: string, rewardId: string) {
    const s = read();
    const reward = s.catalogue.find(r => r.id === rewardId);
    if (!reward || !reward.isActive) throw new Error('This reward is no longer available.');
    if (balanceFor(s, staffId) < reward.pointsCost) throw new Error('Not enough points for this reward.');
    if (typeof reward.stock === 'number' && reward.stock <= 0) throw new Error('This reward is out of stock.');
    if (reward.limitPerStaffPerYear) {
      const year = new Date().getFullYear();
      const used = s.redemptions.filter(
        r => r.staffId === staffId && r.rewardId === rewardId && r.status !== 'declined' && r.status !== 'cancelled' && new Date(r.requestedAt).getFullYear() === year,
      ).length;
      if (used >= reward.limitPerStaffPerYear) throw new Error('You have reached the yearly limit for this reward.');
    }

    const needsApproval = s.settings.requireApprovalForRedemption || reward.requiresApproval;
    const request: RedemptionRequest = {
      id: uid('rd'),
      staffId,
      rewardId,
      rewardName: reward.name,
      pointsCost: reward.pointsCost,
      status: needsApproval ? 'pending' : 'fulfilled',
      requestedAt: new Date().toISOString(),
      decidedAt: needsApproval ? undefined : new Date().toISOString(),
    };

    // Points are held (debited) at request time so a balance cannot be spent twice.
    const ledgerEntry: PointsLedgerEntry = {
      id: uid('pl'),
      staffId,
      type: 'spent',
      points: -reward.pointsCost,
      reason: `Redeemed: ${reward.name}`,
      date: new Date().toISOString(),
    };

    write({
      ...s,
      redemptions: [request, ...s.redemptions],
      ledger: [ledgerEntry, ...s.ledger],
      catalogue: s.catalogue.map(r => (r.id === rewardId && typeof r.stock === 'number' ? { ...r, stock: r.stock - 1 } : r)),
    });
    return request;
  },
  decideRedemption(id: string, status: Extract<RedemptionStatus, 'approved' | 'declined' | 'fulfilled' | 'cancelled'>, note?: string) {
    const s = read();
    const req = s.redemptions.find(r => r.id === id);
    if (!req) return;
    const refund = (status === 'declined' || status === 'cancelled') && req.status !== 'declined' && req.status !== 'cancelled';
    write({
      ...s,
      redemptions: s.redemptions.map(r => (r.id === id ? { ...r, status, note, decidedAt: new Date().toISOString() } : r)),
      ledger: refund
        ? [{ id: uid('pl'), staffId: req.staffId, type: 'adjusted', points: req.pointsCost, reason: `Refund: ${req.rewardName}`, date: new Date().toISOString() }, ...s.ledger]
        : s.ledger,
      catalogue: refund
        ? s.catalogue.map(r => (r.id === req.rewardId && typeof r.stock === 'number' ? { ...r, stock: r.stock + 1 } : r))
        : s.catalogue,
    });
  },
};

function balanceFor(state: RewardsState, staffId: string) {
  return state.ledger.filter(l => l.staffId === staffId).reduce((sum, l) => sum + l.points, 0);
}

/** Current point balance for a staff member. */
export function pointsBalance(state: RewardsState, staffId: string) {
  return balanceFor(state, staffId);
}

export function pointsThisMonth(state: RewardsState, staffId: string) {
  const rows = state.ledger.filter(l => l.staffId === staffId && sameMonth(l.date));
  return {
    earned: rows.filter(l => l.points > 0).reduce((s, l) => s + l.points, 0),
    spent: Math.abs(rows.filter(l => l.points < 0).reduce((s, l) => s + l.points, 0)),
  };
}

/** Leaderboard of points earned this month. */
export function topEarners(state: RewardsState, limit = 5) {
  const map = new Map<string, number>();
  state.ledger
    .filter(l => l.points > 0 && sameMonth(l.date))
    .forEach(l => map.set(l.staffId, (map.get(l.staffId) ?? 0) + l.points));
  return [...map.entries()]
    .map(([staffId, earnedThisMonth]) => ({ staffId, earnedThisMonth, totalPoints: balanceFor(state, staffId) }))
    .sort((a, b) => b.earnedThisMonth - a.earnedThisMonth)
    .slice(0, limit);
}

/** Outstanding liability of unspent points, in currency. */
export function pointsLiability(state: RewardsState) {
  const total = state.ledger.reduce((s, l) => s + l.points, 0);
  return { points: total, value: total * state.settings.pointValue };
}
