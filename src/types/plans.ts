import { PermissionAction, PERMISSION_MODULES, getSubPermissions, subKey } from '@/types/permissions';

/* ------------------------------------------------------------------ */
/* Subscription tiers                                                   */
/* ------------------------------------------------------------------ */

export type PlanTier = 'free' | 'essentials' | 'growth' | 'enterprise';

export const PLAN_ORDER: PlanTier[] = ['free', 'essentials', 'growth', 'enterprise'];

export interface PlanLimits {
  locations: number | null;
  staff: number | null;
  customRoles: number | null;
  apiCredentials: number | null;
}

export interface PlanDefinition {
  id: PlanTier;
  label: string;
  tagline: string;
  /** Short headline of what the tier unlocks over the previous one. */
  highlights: string[];
  limits: PlanLimits;
  /** Sold through sales rather than self-serve checkout. */
  contactSales?: boolean;
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  free: {
    id: 'free',
    label: 'Free',
    tagline: 'Get a small team rostered and clocking on — up to 3 staff, one location.',
    highlights: [
      'Roster and open shifts for one location',
      'Timesheets with clock in / out and breaks',
      'Leave requests and staff profiles',
      'Employee portal access',
      'Hard limit of 3 staff',
    ],
    limits: { locations: 1, staff: 3, customRoles: 0, apiCredentials: 0 },
  },
  essentials: {
    id: 'essentials',
    label: 'Essentials',
    tagline: 'Everything a single site needs to roster, record time and pay people correctly.',
    highlights: [
      'Roster, open shifts, templates and copy week',
      'Timesheets, breaks, exceptions and approvals',
      'Leave requests, balances and staff profiles',
      'Employee portal with clock in / out',
      'On-site kiosk time clock with PIN and QR clocking',
    ],
    limits: { locations: 3, staff: null, customRoles: 0, apiCredentials: 0 },
  },
  growth: {
    id: 'growth',
    label: 'Growth',
    tagline: 'Automation, award intelligence and analytics for multi-site operators.',
    highlights: [
      'Demand forecasting, auto-schedule and the optimiser',
      'Awards, penalties, allowances and shift costing',
      'RDO / ADO / TOIL accruals and payroll export',
      'Report builder, scheduled exports, forms, performance',
      'Custom roles and bulk workforce actions',
      'Kiosk face verification, overrides and exception handling',
    ],
    limits: { locations: 25, staff: null, customRoles: 10, apiCredentials: 2 },
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    tagline: 'Agency supply chain, recruitment, integrations and governance at scale.',
    highlights: [
      'Agency partners, dispatch, rate cards and API credentials',
      'Recruitment pipeline and cross-location org-wide reporting',
      'Third-party integrations, SSO/security and audit trail',
      'Unlimited locations and custom roles',
      'Kiosk offline sync and full kiosk audit evidence',
    ],
    limits: { locations: null, staff: null, customRoles: null, apiCredentials: null },
    contactSales: true,
  },
};

export const planLabel = (tier: PlanTier) => PLANS[tier].label;
export const planRank = (tier: PlanTier) => PLAN_ORDER.indexOf(tier);
export const isAtLeast = (tier: PlanTier, required: PlanTier) =>
  planRank(tier) >= planRank(required);

/* ------------------------------------------------------------------ */
/* Entitlements                                                         */
/* ------------------------------------------------------------------ */

/** `true` = every action the module/sub supports, otherwise the allowed subset. */
export type Grant = true | PermissionAction[];

interface TierDelta {
  /** moduleId -> grant */
  modules?: Record<string, Grant>;
  /** `module::sub` -> grant */
  subs?: Record<string, Grant>;
}

/** What the Free plan includes. */
const FREE: TierDelta = {
  modules: {
    dashboard: ['view'],
    roster: ['view', 'manage'],
    timesheets: ['view', 'manage', 'approve'],
    leave: ['view', 'manage', 'approve'],
    workforce: ['view', 'manage'],
    locations: ['view'],
    'master-data': ['view'],
    settings: ['view'],
    permissions: ['view'],
    'employee-portal': true,
    unavailability: ['view', 'manage'],
  },
};

/** What Essentials adds on top of Free. */
const ESSENTIALS: TierDelta = {
  modules: {
    dashboard: ['view', 'export'],
    roster: ['view', 'manage', 'approve', 'export'],
    timesheets: ['view', 'manage', 'approve', 'export', 'configure'],
    leave: ['view', 'manage', 'approve', 'export', 'configure'],
    workforce: ['view', 'manage', 'export'],
    compliance: ['view', 'export'],
    locations: ['view', 'manage', 'configure'],
    reports: ['view', 'export'],
    'master-data': true,
    settings: ['view', 'manage'],
    permissions: ['view', 'manage'],
    'employee-portal': true,
    unavailability: ['view', 'manage', 'approve', 'export'],
    contracts: ['view', 'manage', 'export'],
    kiosk: ['view', 'manage', 'export', 'configure'],
  },
};

/** What Growth adds on top of Essentials. */
const GROWTH: TierDelta = {
  modules: {
    demand: true,
    unavailability: true,
    contracts: ['view', 'manage', 'approve', 'export'],
    'pay-conditions': true,
    forms: true,
    performance: true,
    recognition: true,
    dashboard: true,
    roster: true,
    compliance: true,
    reports: true,
    workforce: true,
    permissions: ['view', 'manage'],
    settings: ['view', 'manage', 'configure'],
    kiosk: true,
  },
  subs: {
    'roster::auto-schedule': true,
    'roster::costs': true,
    'roster::constraints': true,
    'roster::swaps': true,
    'timesheets::payroll-export': true,
    'leave::rdo-ado-toil': true,
    'leave::adjustments': true,
    'workforce::pay-conditions': true,
    'workforce::bulk-actions': true,
    'reports::roster-reports': true,
    'reports::timesheet-reports': true,
    'reports::workforce-reports': true,
    'reports::location-reports': true,
    'reports::payroll': true,
    'reports::agency-reports': true,
    'reports::builder': true,
    'reports::scheduled': true,
    'locations::budgets': true,
    'locations::optimisation': true,
    'compliance::fatigue': true,
    'permissions::roles': true,
    'unavailability::config': true,
    'contracts::send': true,
    'contracts::sign': true,
    'contracts::countersign': true,
    'contracts::variations': true,
    'contracts::audit': true,
    'kiosk::face-verification': true,
    'kiosk::supervisor-override': true,
    'kiosk::exceptions': true,
    'timesheets::kiosk-capture': true,
  },
};

/** What Enterprise adds on top of Growth. */
const ENTERPRISE: TierDelta = {
  modules: {
    agency: true,
    recruitment: true,
    contracts: true,
    settings: true,
    permissions: true,
  },
  subs: {
    'dashboard::org-wide': true,
    'dashboard::tenant-admin-view': true,
    'reports::tenant-scope': true,
    'roster::agency-dispatch': true,
    'demand::area-combining': true,
    'settings::integrations': true,
    'settings::security': true,
    'settings::audit': true,
    'permissions::elevate': true,
    'contracts::config': true,
    'unavailability::override': true,
    'kiosk::audit': true,
    'kiosk::offline-sync': true,
  },
};

const DELTAS: Record<PlanTier, TierDelta> = {
  free: FREE,
  essentials: ESSENTIALS,
  growth: GROWTH,
  enterprise: ENTERPRISE,
};

/** All keys that are introduced (or widened) above Essentials — i.e. gated. */
const gatedModules = new Set<string>([
  ...Object.keys(ESSENTIALS.modules ?? {}),
  ...Object.keys(GROWTH.modules ?? {}),
  ...Object.keys(ENTERPRISE.modules ?? {}),
]);
const gatedSubs = new Set<string>([
  ...Object.keys(GROWTH.subs ?? {}),
  ...Object.keys(ENTERPRISE.subs ?? {}),
]);

const expand = (grant: Grant, actions: PermissionAction[]): PermissionAction[] =>
  grant === true ? [...actions] : grant.filter(a => actions.includes(a));

const moduleActions = (moduleId: string) =>
  PERMISSION_MODULES.find(m => m.id === moduleId)?.actions ?? [];

const subActions = (moduleId: string, subId: string) =>
  getSubPermissions(moduleId).find(s => s.id === subId)?.actions ?? [];

/** Resolved module actions for a tier (cumulative across lower tiers). */
export function defaultPlanModuleActions(tier: PlanTier, moduleId: string): PermissionAction[] {
  const all = moduleActions(moduleId);
  const out = new Set<PermissionAction>();
  for (const t of PLAN_ORDER) {
    const grant = DELTAS[t].modules?.[moduleId];
    if (grant) expand(grant, all).forEach(a => out.add(a));
    if (t === tier) break;
  }
  return all.filter(a => out.has(a));
}

/** Resolved sub-permission actions for a tier. Ungated subs inherit the module. */
export function defaultPlanSubActions(
  tier: PlanTier,
  moduleId: string,
  subId: string,
): PermissionAction[] {
  const all = subActions(moduleId, subId);
  const key = subKey(moduleId, subId);
  if (!gatedSubs.has(key)) {
    const parent = defaultPlanModuleActions(tier, moduleId);
    return all.filter(a => parent.includes(a));
  }
  const out = new Set<PermissionAction>();
  for (const t of PLAN_ORDER) {
    const grant = DELTAS[t].subs?.[key];
    if (grant) expand(grant, all).forEach(a => out.add(a));
    if (t === tier) break;
  }
  const parent = defaultPlanModuleActions(tier, moduleId);
  return all.filter(a => out.has(a) && parent.includes(a));
}

/* ------------------------------------------------------------------ */
/* Editable entitlement matrix                                          */
/* ------------------------------------------------------------------ */

/** key = moduleId, or `module::sub` for a sub-permission. */
export type PlanEntitlements = Record<string, PermissionAction[]>;
export type PlanEntitlementMatrix = Record<PlanTier, PlanEntitlements>;

/** The shipped baseline, flattened so every key can be edited per tier. */
export function buildDefaultEntitlements(): PlanEntitlementMatrix {
  const out = {} as PlanEntitlementMatrix;
  for (const t of PLAN_ORDER) {
    const ent: PlanEntitlements = {};
    for (const m of PERMISSION_MODULES) {
      ent[m.id] = defaultPlanModuleActions(t, m.id);
      for (const sub of getSubPermissions(m.id)) {
        ent[subKey(m.id, sub.id)] = defaultPlanSubActions(t, m.id, sub.id);
      }
    }
    out[t] = ent;
  }
  return out;
}

/** Actions a module/sub supports at all (the editable universe). */
export const moduleActionUniverse = (moduleId: string) => moduleActions(moduleId);
export const subActionUniverse = (moduleId: string, subId: string) => subActions(moduleId, subId);

export const isGatedModule = (moduleId: string) => gatedModules.has(moduleId);
export const isGatedSub = (moduleId: string, subId: string) => gatedSubs.has(subKey(moduleId, subId));

