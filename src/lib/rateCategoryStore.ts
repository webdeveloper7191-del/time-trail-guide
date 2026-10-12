import { useEffect, useState } from 'react';
import { DEFAULT_RATE_TABLE, RateProfile, RateReview, RateTable, detectRateReviews } from './rateCategory';

const KEY = 'rai.payroll.rateCategories.v1';

interface AuditEntry { at: string; by: string; staffId: string; action: string }
interface State {
  profiles: Record<string, RateProfile>;
  tables: Record<string, RateTable>;
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
  tables: {},
  audit: [],
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
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
  getTable: (awardKey = 'default'): RateTable => state.tables[awardKey] ?? DEFAULT_RATE_TABLE,
  setTable(awardKey: string, table: RateTable) {
    state = { ...state, tables: { ...state.tables, [awardKey]: table } };
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
  approveReview(r: RateReview) {
    const p = state.profiles[r.staffId];
    if (!p || !r.needsApproval) return;
    const now = new Date().toISOString();
    const next: RateProfile = r.kind === 'qualification_adult_rate' && r.qualification
      ? { ...p, adultRateQualification: { name: r.qualification, approvedAt: now, approvedBy: MANAGER } }
      : { ...p, ...r.approve };
    state = {
      ...state,
      profiles: { ...state.profiles, [r.staffId]: next },
      audit: [...state.audit, { at: now, by: MANAGER, staffId: r.staffId, action: `Approved: ${r.title}` }],
    };
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
