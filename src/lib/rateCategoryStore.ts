import { useEffect, useState } from 'react';
import { RateProfile, RateReview, RateTable, ResolvedCategoryRate, detectRateReviews, resolveCategoryRate } from './rateCategory';

import { EMPTY_OVERRIDES, PUBLISHED_RATE_TABLE, PublishedRateTable, RateOverrides, confirmOverride, mergeRateTable, overridesFromDraft, removeOverride, staleOverrides } from './rateTableOverrides';
import { BackPayAdjustment, BackPayChoice, daysLate } from './rateBackPay';

const KEY = 'rai.payroll.rateCategories.v2';

interface AuditEntry { at: string; by: string; staffId: string; action: string }
interface State {
  profiles: Record<string, RateProfile>;
  /** Overrides on top of the award's published tables, per award key. */
  overrides: Record<string, RateOverrides>;
  backPay: BackPayAdjustment[];
  audit: AuditEntry[];
}

const SEED: State = {
  profiles: {
    // Sample data so managers can see the review queue in the preview.
    'staff-3': { staffId: 'staff-3', category: 'junior', approvedJuniorAge: 17 },
    'staff-4': {
      staffId: 'staff-4', category: 'trainee', traineeLevel: 'Level B',
      traineeProgress: 'Left school + 1 year', traineeEndDate: '2026-11-01', trainingContractNumber: 'TC-448812',
    },
  },
  overrides: {},
  backPay: [],
  audit: [],
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...structuredClone(SEED), ...JSON.parse(raw) };
    const old = localStorage.getItem('rai.payroll.rateCategories.v1');
    if (old) { const o = JSON.parse(old); return { ...structuredClone(SEED), profiles: o.profiles ?? SEED.profiles, audit: o.audit ?? [] }; }
  } catch { /* ignore */ }
  return structuredClone(SEED);
}

let state: State = typeof window === 'undefined' ? structuredClone(SEED) : load();
const listeners = new Set<() => void>();
let version = 0;
function emit() {
  version++;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach(l => l());
}

const MANAGER = 'Admin';

export const rateCategoryStore = {
  getProfile: (staffId: string): RateProfile | undefined => state.profiles[staffId],
  getAllProfiles: () => state.profiles,
  getPublished: (_awardKey = 'default'): PublishedRateTable => PUBLISHED_RATE_TABLE,
  getOverrides: (awardKey = 'default'): RateOverrides => state.overrides[awardKey] ?? EMPTY_OVERRIDES,
  /** Effective table: award's published figures with overrides applied. */
  getTable(awardKey = 'default'): RateTable {
    return mergeRateTable(this.getPublished(awardKey).table, this.getOverrides(awardKey));
  },
  /** Save an edited table — only cells that differ from the award are stored, as overrides. */
  setTable(awardKey: string, table: RateTable) {
    const next = overridesFromDraft(this.getPublished(awardKey), table, this.getOverrides(awardKey));
    state = { ...state, overrides: { ...state.overrides, [awardKey]: next } };
    emit();
  },
  staleOverrides(awardKey = 'default') {
    return staleOverrides(this.getOverrides(awardKey), this.getPublished(awardKey).version);
  },
  keepOverride(key: string, awardKey = 'default') {
    state = { ...state, overrides: { ...state.overrides, [awardKey]: confirmOverride(this.getOverrides(awardKey), key, this.getPublished(awardKey)) } };
    emit();
  },
  useAwardValue(key: string, awardKey = 'default') {
    state = { ...state, overrides: { ...state.overrides, [awardKey]: removeOverride(this.getOverrides(awardKey), key) } };
    emit();
  },
  saveProfile(p: RateProfile) {
    state = {
      ...state,
      profiles: { ...state.profiles, [p.staffId]: p },
      audit: [...state.audit, { at: new Date().toISOString(), by: MANAGER, staffId: p.staffId, action: `Rate category set to ${p.category}` }],
    };
    emit();
  },
  setCategoryBulk(staffIds: string[], category: RateProfile['category']) {
    const profiles = { ...state.profiles };
    staffIds.forEach(id => { profiles[id] = { ...(profiles[id] ?? { staffId: id }), staffId: id, category }; });
    state = { ...state, profiles };
    emit();
  },
  approveReview(r: RateReview, backPay: BackPayChoice = 'from_approval', today = new Date()) {
    const p = state.profiles[r.staffId];
    if (!p || !r.needsApproval) return;
    const now = today.toISOString();
    const late = daysLate(r.effectiveFrom, today);
    const adj: BackPayAdjustment[] = backPay === 'backdate' && late > 0 && r.effectiveFrom
      ? [{ id: `${r.id}:${now}`, staffId: r.staffId, reviewTitle: r.title, from: r.effectiveFrom, to: now.slice(0, 10),
          fromPercent: r.fromPercent ?? 0, toPercent: r.toPercent ?? 0, status: 'pending_pay_run', createdAt: now }]
      : [];
    const next: RateProfile = r.kind === 'qualification_adult_rate' && r.qualification
      ? { ...p, adultRateQualification: { name: r.qualification, approvedAt: now, approvedBy: MANAGER } }
      : { ...p, ...r.approve };
    state = {
      ...state,
      profiles: { ...state.profiles, [r.staffId]: next },
      backPay: [...state.backPay, ...adj],
      audit: [...state.audit, { at: now, by: MANAGER, staffId: r.staffId,
        action: `Approved: ${r.title}${late > 0 ? (adj.length ? ` — backdated to ${r.effectiveFrom}` : ' — from approval date, not backdated') : ''}` }],
    };
    emit();
  },
  getBackPay: (staffId?: string) => state.backPay.filter(b => !staffId || b.staffId === staffId),
  markBackPayPaid(id: string) {
    state = { ...state, backPay: state.backPay.map(b => b.id === id ? { ...b, status: 'paid' as const } : b) };
    emit();
  },
  declineReview(r: RateReview) {
    const p = state.profiles[r.staffId];
    if (!p) return;
    const now = new Date().toISOString();
    const next: RateProfile = r.kind === 'qualification_adult_rate' && r.qualification
      ? { ...p, dismissedQualifications: [...(p.dismissedQualifications ?? []), r.qualification] }
      : p;
    state = {
      ...state,
      profiles: { ...state.profiles, [r.staffId]: next },
      audit: [...state.audit, { at: now, by: MANAGER, staffId: r.staffId, action: `Declined: ${r.title}` }],
    };
    emit();
  },
  /** Apply the approved junior/apprentice/trainee percentage to an adult rate. Used by roster costs, timesheets and payroll. */
  applyToRate(staffId: string | undefined, adultRate: number, label = 'Adult'): ResolvedCategoryRate {
    const profile = staffId ? state.profiles[staffId] : undefined;
    const r = resolveCategoryRate(adultRate, profile, this.getTable(), label);
    if (!profile || r.percent === 100) return r;
    const o = this.getOverrides();
    const key = profile.category === 'junior' ? `juniorByAge.${profile.approvedJuniorAge}`
      : profile.category === 'apprentice' ? `${profile.adultApprentice ? 'adultApprenticeByYear' : profile.completedYear12 ? 'apprenticeYear12ByYear' : 'apprenticeByYear'}.${profile.approvedApprenticeYear ?? 1}`
      : `traineeByLevel.${profile.traineeLevel}`;
    return { ...r, working: `${r.working} · ${o.cells[key] ? 'override' : 'award rate'}` };
  },
  setCategoryBulkAudited(staffIds: string[], category: RateProfile['category']) {
    const now = new Date().toISOString();
    const profiles = { ...state.profiles };
    staffIds.forEach(id => { profiles[id] = { ...(profiles[id] ?? { staffId: id }), staffId: id, category }; });
    state = { ...state, profiles, audit: [...state.audit, ...staffIds.map(id => ({ at: now, by: MANAGER, staffId: id, action: `Rate category set to ${category} (bulk)` }))] };
    emit();
  },
  resetTable(awardKey = 'default') {
    const overrides = { ...state.overrides }; delete overrides[awardKey];
    state = { ...state, overrides }; emit();
  },
  getAudit: (staffId: string) => state.audit.filter(a => a.staffId === staffId),
  reviewsFor(staff: { id: string; dateOfBirth?: string; qualifications?: string[] }, today = new Date()) {
    return detectRateReviews(staff, state.profiles[staff.id], this.getTable(), today);
  },
};

export function useRateCategories() {
  const [, set] = useState(version);
  useEffect(() => {
    const l = () => set(version);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return rateCategoryStore;
}
