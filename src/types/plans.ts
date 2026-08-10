import { PermissionAction, PERMISSION_MODULES, getSubPermissions, subKey } from '@/types/permissions';

/* ------------------------------------------------------------------ */
/* Subscription tiers                                                   */
/* ------------------------------------------------------------------ */

export type PlanTier = 'essentials' | 'growth' | 'enterprise';

export const PLAN_ORDER: PlanTier[] = ['essentials', 'growth', 'enterprise'];

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
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  essentials: {
    id: 'essentials',
    label: 'Essentials',
    tagline: 'Everything a single site needs to roster, record time and pay people correctly.',
    highlights: [
      'Roster, open shifts, templates and copy week',
      'Timesheets, breaks, exceptions and approvals',
      'Leave requests, balances and staff profiles',
      'Employee portal with clock in / out',
    ],
    limits: { locations: 3, staff: 100, customRoles: 0, apiCredentials: 0 },
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
    ],
    limits: { locations: 25, staff: 1000, customRoles: 10, apiCredentials: 2 },
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    tagline: 'Agency supply chain, recruitment, integrations and governance at scale.',
    highlights: [
      'Agency partners, dispatch, rate cards and API credentials',
      'Recruitment pipeline and cross-location org-wide reporting',
      'Third-party integrations, SSO/security and audit trail',
      'Unlimited locations, staff and custom roles',
    ],
    limits: { locations: null, staff: null, customRoles: null, apiCredentials: null },
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

/** What Essentials includes out of the box. */
const ESSENTIALS: TierDelta = {
  modules: {
    dashboard: ['view', 'export'],
    roster: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'assign'],
    timesheets: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'configure'],
    leave: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'configure'],
    workforce: ['view', 'create', 'edit', 'delete', 'export', 'assign'],
    compliance: ['view', 'export'],
    locations: ['view', 'create', 'edit', 'delete', 'configure'],
    reports: ['view', 'export'],
    'master-data': true,
    settings: ['view', 'edit'],
    permissions: ['view', 'edit', 'assign'],
    'employee-portal': true,
    unavailability: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    contracts: ['view', 'create', 'edit', 'export'],
  },
};

/** What Growth adds on top of Essentials. */
const GROWTH: TierDelta = {
  modules: {
    demand: true,
    unavailability: true,
    contracts: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'assign'],
    'pay-conditions': true,
    forms: true,
    performance: true,
    recognition: true,
    dashboard: true,
    roster: true,
    compliance: true,
    reports: true,
    workforce: true,
    permissions: ['view', 'create', 'edit', 'delete', 'assign'],
    settings: ['view', 'edit', 'configure'],
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
    'reports::location-scope': true,
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
  },
};

const DELTAS: Record<PlanTier, TierDelta> = {
  essentials: ESSENTIALS,
  growth: GROWTH,
  enterprise: ENTERPRISE,
};

/** All keys that are introduced (or widened) above Essentials — i.e. gated. */
const gatedModules = new Set<string>([
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

