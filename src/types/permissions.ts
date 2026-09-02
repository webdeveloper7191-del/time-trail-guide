export type PermissionAction =
  | 'view'
  | 'manage'
  | 'approve'
  | 'export'
  | 'configure';

/** Actions used before the matrix was simplified. Still accepted when reading stored data. */
export type LegacyPermissionAction =
  | 'create'
  | 'edit'
  | 'delete'
  | 'assign';

const LEGACY_ACTION_MAP: Record<LegacyPermissionAction, PermissionAction> = {
  create: 'manage',
  edit: 'manage',
  delete: 'manage',
  assign: 'manage',
};

/** Map any stored (possibly legacy) action list onto the reduced action set. */
export function normalizeActions(
  actions: (PermissionAction | LegacyPermissionAction | string)[] | undefined | null,
): PermissionAction[] {
  if (!actions) return [];
  const out: PermissionAction[] = [];
  for (const raw of actions) {
    const mapped = (LEGACY_ACTION_MAP as Record<string, PermissionAction>)[raw] ?? (raw as PermissionAction);
    if (ALL_ACTIONS.includes(mapped) && !out.includes(mapped)) out.push(mapped);
  }
  return out;
}

export const ALL_ACTIONS: PermissionAction[] = [
  'view',
  'manage',
  'approve',
  'export',
  'configure',
];

export const actionLabels: Record<PermissionAction, string> = {
  view: 'View',
  manage: 'Manage',
  approve: 'Approve',
  export: 'Export',
  configure: 'Configure',
};

export const actionDescriptions: Record<PermissionAction, string> = {
  view: 'Read records and open screens in this module.',
  manage: 'Create, edit, delete and assign records in this module.',
  approve: 'Sign off items in a workflow (timesheets, leave, pay changes).',
  export: 'Download data as CSV / Excel / PDF.',
  configure: 'Change module-level rules, defaults and integrations.',
};


export type ModuleGroup =
  | 'Operations'
  | 'People'
  | 'Pay & Compliance'
  | 'Insights'
  | 'Administration';

export interface PermissionModule {
  id: string;
  label: string;
  group: ModuleGroup;
  description: string;
  /** Actions that are meaningful for this module. */
  actions: PermissionAction[];
  /** Scope hint shown in the matrix. */
  scope: 'Tenant' | 'Location' | 'Self';
}

export interface RoleDefinition {
  id: string;
  label: string;
  description: string;
  /** System roles cannot be deleted. */
  system: boolean;
}

/** roleId -> moduleId -> actions granted */
export type PermissionMatrix = Record<string, Record<string, PermissionAction[]>>;

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    group: 'Operations',
    description: 'Landing KPIs, alerts and daily operational summary.',
    actions: ['view', 'export'],
    scope: 'Location',
  },
  {
    id: 'roster',
    label: 'Roster & Scheduling',
    group: 'Operations',
    description: 'Shifts, open shifts, templates, copy week, auto-schedule and optimisation.',
    actions: ['view', 'manage', 'approve', 'export', 'configure'],
    scope: 'Location',
  },
  {
    id: 'demand',
    label: 'Demand & Optimisation',
    group: 'Operations',
    description: 'Expected attendance, ratio-driven demand, generate shifts from demand.',
    actions: ['view', 'manage', 'export', 'configure'],
    scope: 'Location',
  },
  {
    id: 'timesheets',
    label: 'Timesheets',
    group: 'Pay & Compliance',
    description: 'Clock data, manual entries, breaks, exceptions and approval chains.',
    actions: ['view', 'manage', 'approve', 'export', 'configure'],
    scope: 'Location',
  },
  {
    id: 'leave',
    label: 'Leave & Accruals',
    group: 'People',
    description: 'Leave requests, balances, RDO / ADO / TOIL ledgers.',
    actions: ['view', 'manage', 'approve', 'export', 'configure'],
    scope: 'Location',
  },
  {
    id: 'unavailability',
    label: 'Unavailability & Availability',
    group: 'People',
    description: 'Recurring unavailability, one-off blackout dates, availability patterns and approvals.',
    actions: ['view', 'manage', 'approve', 'export', 'configure'],
    scope: 'Location',
  },
  {
    id: 'contracts',
    label: 'Contracts & Documents',
    group: 'People',
    description: 'Employment contracts, letters and policy documents with digital signing.',
    actions: ['view', 'manage', 'approve', 'export', 'configure'],
    scope: 'Tenant',
  },
  {

    id: 'workforce',
    label: 'Workforce',
    group: 'People',
    description: 'Staff profiles, availability, qualifications, onboarding and bulk actions.',
    actions: ['view', 'manage', 'export', 'configure'],
    scope: 'Location',
  },
  {
    id: 'pay-conditions',
    label: 'Pay Conditions & Awards',
    group: 'Pay & Compliance',
    description: 'Award mapping, classifications, penalties, allowances and rate overrides.',
    actions: ['view', 'manage', 'approve', 'export', 'configure'],
    scope: 'Tenant',
  },
  {
    id: 'payroll',
    label: 'Payroll',
    group: 'Pay & Compliance',
    description:
      'Pay calendars, period approvals, pay runs, payslips, deductions, super, STP and accounting exports.',
    actions: ['view', 'manage', 'approve', 'export', 'configure'],
    scope: 'Tenant',
  },
  {
    id: 'compliance',
    label: 'Compliance & Ratios',
    group: 'Pay & Compliance',
    description: 'Ratio breaches, fatigue, rest breaks and qualification compliance.',
    actions: ['view', 'export', 'configure'],
    scope: 'Location',
  },

  {
    id: 'locations',
    label: 'Locations & Areas',
    group: 'Administration',
    description: 'Locations, areas, staffing ratios, budgets and operational thresholds.',
    actions: ['view', 'manage', 'configure'],
    scope: 'Tenant',
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    group: 'Insights',
    description: 'Operational, labour cost and payroll reporting plus scheduled exports.',
    actions: ['view', 'manage', 'export'],
    scope: 'Location',
  },
  {
    id: 'forms',
    label: 'Forms & Tasks',
    group: 'Operations',
    description: 'Form templates, submissions, task pipelines and offline capture.',
    actions: ['view', 'manage', 'approve', 'export'],
    scope: 'Location',
  },
  {
    id: 'performance',
    label: 'Performance & Learning',
    group: 'People',
    description: 'Reviews, goals/OKRs, courses, learning paths and 360 feedback.',
    actions: ['view', 'manage', 'approve', 'export'],
    scope: 'Location',
  },
  {
    id: 'recognition',
    label: 'Recognition & Surveys',
    group: 'People',
    description: 'Praise wall, awards, engagement surveys.',
    actions: ['view', 'manage', 'export'],
    scope: 'Location',
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    group: 'People',
    description: 'Requisitions, candidate pipeline, interviews and offers.',
    actions: ['view', 'manage', 'approve', 'export'],
    scope: 'Location',
  },
  {
    id: 'agency',
    label: 'Agency Partners',
    group: 'Administration',
    description: 'Partner applications, onboarding, rate cards, coverage and API credentials.',
    actions: ['view', 'manage', 'approve', 'configure'],
    scope: 'Tenant',
  },
  {
    id: 'master-data',
    label: 'Master Data',
    group: 'Administration',
    description: 'Positions, employment types, leave types, shift types, allowances.',
    actions: ['view', 'manage', 'export'],
    scope: 'Tenant',
  },
  {
    id: 'settings',
    label: 'Settings & Integrations',
    group: 'Administration',
    description: 'Tenant configuration, timesheet policy, payroll and third-party integrations.',
    actions: ['view', 'manage', 'configure'],
    scope: 'Tenant',
  },
  {
    id: 'permissions',
    label: 'Users & Permissions',
    group: 'Administration',
    description: 'Roles, the permission matrix and user-to-role assignment.',
    actions: ['view', 'manage', 'configure'],
    scope: 'Tenant',
  },
  {
    id: 'employee-portal',
    label: 'Employee Portal',
    group: 'Operations',
    description: 'Own roster, clock in/out, own timesheets, leave and swap requests.',
    actions: ['view', 'manage', 'export'],
    scope: 'Self',
  },
  {
    id: 'kiosk',
    label: 'Kiosk & Time Clock',
    group: 'Operations',
    description:
      'On-site kiosk devices: pairing, PIN / QR / face verification, clocking, offline sync and kiosk audit.',
    actions: ['view', 'manage', 'approve', 'export', 'configure'],
    scope: 'Location',
  },
];

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'owner',
    label: 'Owner / Tenant Admin',
    description: 'Full unrestricted access across every location and configuration screen.',
    system: true,
  },
  {
    id: 'hr-manager',
    label: 'HR Manager',
    description: 'Owns people data, onboarding, performance and leave across all locations.',
    system: true,
  },
  {
    id: 'location-manager',
    label: 'Location Manager',
    description: 'Runs one or more locations: roster, timesheet approvals, compliance and staff.',
    system: true,
  },
  {
    id: 'scheduler',
    label: 'Rostering Coordinator',
    description: 'Builds and optimises rosters, fills open shifts, no pay or approval rights.',
    system: true,
  },
  {
    id: 'payroll',
    label: 'Payroll Officer',
    description: 'Approves and exports timesheets, manages awards, pay conditions and rates.',
    system: true,
  },
  {
    id: 'supervisor',
    label: 'Team Supervisor',
    description: 'Day-to-day oversight of one area: view roster, first-tier timesheet approval.',
    system: true,
  },
  {
    id: 'employee',
    label: 'Employee',
    description: 'Self-service only — own shifts, timesheets, leave, learning and recognition.',
    system: true,
  },
  {
    id: 'agency-partner',
    label: 'Agency Partner',
    description: 'External staffing partner — sees broadcast shifts and submits candidates.',
    system: true,
  },
];

const A = (...a: PermissionAction[]) => a;

/** Baseline matrix. Any module/role pair not listed = no access. */
const BASE_MATRIX: PermissionMatrix = {
  owner: Object.fromEntries(PERMISSION_MODULES.map(m => [m.id, [...m.actions]])),
  'hr-manager': {
    dashboard: A('view', 'export'),
    roster: A('view', 'export'),
    demand: A('view'),
    timesheets: A('view', 'export'),
    leave: A('view', 'manage', 'approve', 'export', 'configure'),
    unavailability: A('view', 'manage', 'approve', 'export', 'configure'),
    contracts: A('view', 'manage', 'approve', 'export', 'configure'),
    workforce: A('view', 'manage', 'export', 'configure'),
    'pay-conditions': A('view', 'manage', 'export'),
    payroll: A('view', 'export'),
    compliance: A('view', 'export'),
    locations: A('view'),
    reports: A('view', 'manage', 'export'),
    forms: A('view', 'manage', 'approve'),
    performance: A('view', 'manage', 'approve', 'export'),
    recognition: A('view', 'manage', 'export'),
    recruitment: A('view', 'manage', 'approve', 'export'),
    agency: A('view'),
    'master-data': A('view', 'manage'),
    settings: A('view'),
    permissions: A('view', 'manage'),
    'employee-portal': A('view'),
    kiosk: A('view', 'export', 'configure'),
  },
  'location-manager': {
    dashboard: A('view', 'export'),
    roster: A('view', 'manage', 'approve', 'export'),
    demand: A('view', 'manage', 'export'),
    timesheets: A('view', 'manage', 'approve', 'export'),
    leave: A('view', 'manage', 'approve', 'export'),
    unavailability: A('view', 'manage', 'approve', 'export'),
    contracts: A('view', 'manage', 'export'),
    workforce: A('view', 'manage', 'export'),
    'pay-conditions': A('view'),
    payroll: A('view', 'export'),
    compliance: A('view', 'export'),
    locations: A('view', 'manage'),
    reports: A('view', 'manage', 'export'),
    forms: A('view', 'manage', 'approve'),
    performance: A('view', 'manage', 'approve'),
    recognition: A('view', 'manage'),
    recruitment: A('view', 'manage'),
    agency: A('view', 'manage'),
    'master-data': A('view'),
    settings: A('view'),
    'employee-portal': A('view'),
    kiosk: A('view', 'manage', 'approve', 'export', 'configure'),
  },
  scheduler: {
    dashboard: A('view'),
    roster: A('view', 'manage', 'export'),
    demand: A('view', 'manage', 'export'),
    timesheets: A('view'),
    leave: A('view'),
    unavailability: A('view', 'manage'),
    contracts: A('view'),
    workforce: A('view'),
    compliance: A('view'),
    locations: A('view'),
    reports: A('view', 'export'),
    forms: A('view', 'manage'),
    agency: A('view', 'manage'),
    'master-data': A('view'),
    'employee-portal': A('view'),
    kiosk: A('view'),
  },
  payroll: {
    dashboard: A('view', 'export'),
    roster: A('view', 'export'),
    timesheets: A('view', 'manage', 'approve', 'export', 'configure'),
    leave: A('view', 'approve', 'export'),
    unavailability: A('view', 'export'),
    contracts: A('view', 'export'),
    workforce: A('view', 'manage', 'export'),
    'pay-conditions': A('view', 'manage', 'approve', 'export', 'configure'),
    payroll: A('view', 'manage', 'approve', 'export', 'configure'),
    compliance: A('view', 'export'),
    locations: A('view'),
    reports: A('view', 'manage', 'export'),
    'master-data': A('view', 'manage'),
    settings: A('view', 'manage', 'configure'),
    'employee-portal': A('view'),
    kiosk: A('view', 'manage', 'approve', 'export'),
  },
  supervisor: {
    dashboard: A('view'),
    roster: A('view', 'manage'),
    demand: A('view'),
    timesheets: A('view', 'manage', 'approve'),
    leave: A('view', 'approve'),
    unavailability: A('view', 'approve'),
    contracts: A('view'),
    workforce: A('view'),
    compliance: A('view'),
    reports: A('view'),
    forms: A('view', 'manage'),
    performance: A('view', 'manage'),
    recognition: A('view', 'manage'),
    'employee-portal': A('view'),
    kiosk: A('view', 'manage', 'approve'),
  },
  employee: {
    'employee-portal': A('view', 'manage', 'export'),
    roster: A('view'),
    timesheets: A('view', 'manage'),
    leave: A('view', 'manage'),
    unavailability: A('view', 'manage'),
    contracts: A('view', 'approve'),
    forms: A('view', 'manage'),
    performance: A('view', 'manage'),
    recognition: A('view', 'manage'),
    workforce: A('view', 'manage'),
    kiosk: A('view', 'manage'),
  },
  'agency-partner': {
    roster: A('view'),
    agency: A('view', 'manage'),
    forms: A('view', 'manage'),
    timesheets: A('view', 'manage'),
    kiosk: A('view', 'manage'),
  },
};

export const moduleGroups: ModuleGroup[] = [
  'Operations',
  'People',
  'Pay & Compliance',
  'Insights',
  'Administration',
];

/* ------------------------------------------------------------------ */
/* Sub-permissions: the individual screens / capabilities in a module   */
/* ------------------------------------------------------------------ */

export interface SubPermission {
  id: string;
  label: string;
  description: string;
  /** Actions meaningful for this sub-area (always a subset of the module's actions). */
  actions: PermissionAction[];
}

/** Composite matrix key for a sub-permission. */
export const subKey = (moduleId: string, subId: string) => `${moduleId}::${subId}`;

const S = (
  id: string,
  label: string,
  description: string,
  actions: PermissionAction[],
): SubPermission => ({ id, label, description, actions });

export const SUB_PERMISSIONS: Record<string, SubPermission[]> = {
  dashboard: [
    S('tenant-admin-view', 'Tenant Admin dashboard', 'Organisation-wide KPIs, location performance and governance alerts.', ['view', 'export']),
    S('location-admin-view', 'Location Admin dashboard', 'Daily coverage, approvals and ratio alerts for assigned locations.', ['view', 'export']),
    S('staff-view', 'Staff dashboard', 'Personal hours, upcoming shifts, leave balances and self-service actions.', ['view']),
    S('kpis', 'KPI tiles', 'Headline coverage, cost and attendance tiles.', ['view', 'export']),
    S('alerts', 'Alerts & exceptions feed', 'Ratio breaches, unfilled shifts and overdue tasks.', ['view']),
    S('org-wide', 'Cross-location view', 'See figures for every location, not just assigned ones.', ['view', 'export']),
  ],

  roster: [
    S('shifts', 'Shifts', 'Create, edit, delete and move individual shifts.', ['view', 'manage', 'export']),
    S('open-shifts', 'Open shifts', 'Publish, claim, approve claims and fill open shifts.', ['view', 'manage', 'approve']),
    S('assignment', 'Staff assignment', 'Assign or unassign people on a shift.', ['view', 'manage']),
    S('templates', 'Templates & copy week', 'Save, apply and update roster templates and week copies.', ['view', 'manage']),
    S('auto-schedule', 'Auto-schedule & optimiser', 'Run the solver and apply generated plans.', ['view', 'manage', 'configure']),
    S('publish', 'Publish & notify', 'Publish the roster and send shift notifications.', ['view', 'approve']),
    S('swaps', 'Swaps & shift offers', 'Approve swap requests and give-away offers.', ['view', 'manage', 'approve']),
    S('agency-dispatch', 'Agency dispatch', 'Broadcast shifts to agency partners and accept candidates.', ['view', 'manage', 'approve']),
    S('costs', 'Cost & budget view', 'See shift cost, penalties and budget consumption on the roster.', ['view', 'export']),
    S('constraints', 'Scheduling constraints', 'Configure hard/soft rules, fatigue and rest settings.', ['view', 'configure']),
  ],
  demand: [
    S('expected', 'Expected demand entry', 'Enter or import expected attendance / volumes.', ['view', 'manage', 'export']),
    S('ratios', 'Ratio & staffing rules', 'Ratio bands and qualification mix used to size demand.', ['view', 'manage', 'configure']),
    S('generate', 'Generate shifts from demand', 'Turn demand into draft shifts on the roster.', ['view', 'manage']),
    S('optimiser', 'Demand optimiser', 'Reconcile roster against demand, fill gaps, release surplus.', ['view', 'manage']),
    S('area-combining', 'Area combining', 'Suggest and apply low-attendance area mergers.', ['view', 'manage', 'configure']),
    S('reports', 'Optimisation reports', 'Weekly optimisation report and drill-downs.', ['view', 'export']),
  ],
  timesheets: [
    S('own', 'Own timesheets', 'View and edit the user’s own timesheets only.', ['view', 'manage']),
    S('team', 'Team timesheets', 'All timesheets for the user’s locations / areas.', ['view', 'manage', 'export']),
    S('breaks', 'Breaks & clock data', 'Adjust clock in/out punches and paid/unpaid breaks.', ['view', 'manage']),
    S('exceptions', 'Exceptions & flags', 'Raise, respond to and clear timesheet exceptions.', ['view', 'manage', 'approve']),
    S('approval', 'Approval chain', 'Approve or reject timesheets in the workflow.', ['view', 'approve']),
    S('unlock', 'Unlock / reopen approved', 'Reopen a locked or approved timesheet period.', ['view', 'manage', 'approve']),
    S('leave-marking', 'Leave day marking', 'Mark a day as leave and pick the leave type.', ['view', 'manage']),
    S('payroll-export', 'Payroll export', 'Export approved timesheets to payroll.', ['view', 'export']),
    S('policy', 'Timesheet policy', 'Rounding, variance flags and compliance defaults.', ['view', 'configure']),
    S('kiosk-capture', 'Kiosk-captured time', 'Review, adjust and approve punches captured on a kiosk device.', ['view', 'manage', 'approve', 'export']),
  ],
  leave: [
    S('own-requests', 'Own leave requests', 'Submit and manage the user’s own leave.', ['view', 'manage']),
    S('team-requests', 'Team leave requests', 'See and manage leave for the user’s people.', ['view', 'manage', 'export']),
    S('approval', 'Leave approval', 'Approve or decline leave requests.', ['view', 'approve']),
    S('balances', 'Balances & accruals', 'Leave balances and accrual ledgers.', ['view', 'export']),
    S('adjustments', 'Manual balance adjustments', 'Credit or debit a balance outside normal accrual.', ['view', 'manage', 'approve']),
    S('rdo-ado-toil', 'RDO / ADO / TOIL ledgers', 'Accrue, bank and consume RDO, ADO and TOIL.', ['view', 'manage', 'approve']),
    S('config', 'Leave configuration', 'Accrual rules, entitlements and leave year settings.', ['view', 'configure']),
  ],
  unavailability: [
    S('own', 'Own unavailability', 'Submit and manage the user’s own unavailability.', ['view', 'manage']),
    S('team', 'Team unavailability', 'View and manage unavailability for the user’s people.', ['view', 'manage', 'export']),
    S('approval', 'Unavailability approval', 'Approve or decline submitted unavailability.', ['view', 'approve']),
    S('override', 'Override on roster', 'Schedule a person despite recorded unavailability.', ['view', 'manage', 'approve']),
    S('config', 'Unavailability rules', 'Notice periods, limits and blackout policy.', ['view', 'configure']),
  ],
  contracts: [
    S('templates', 'Contract templates', 'Create and maintain contract and letter templates.', ['view', 'manage']),
    S('contracts', 'Contracts', 'Create, edit and delete individual staff contracts.', ['view', 'manage', 'export']),
    S('send', 'Send for signature', 'Issue a contract or document to a recipient for digital signing.', ['view', 'manage']),
    S('sign', 'Sign documents', 'Digitally sign a document as the recipient.', ['view', 'manage']),
    S('countersign', 'Countersign / approve', 'Approve and countersign on behalf of the organisation.', ['view', 'approve']),
    S('variations', 'Variations & amendments', 'Pay change letters, role changes and contract variations.', ['view', 'manage', 'approve']),
    S('documents', 'Document library', 'Policies, handbooks and supporting documents.', ['view', 'manage', 'export']),
    S('audit', 'Signing audit trail', 'Signature history, IP / timestamp evidence and certificates.', ['view', 'export']),
    S('config', 'Signing configuration', 'E-signature provider, signing order and reminder settings.', ['view', 'configure']),
  ],
  workforce: [
    S('profiles', 'Staff profiles', 'Personal, employment and contact details.', ['view', 'manage', 'export']),
    S('pay-conditions', 'Pay conditions', 'Base rate, classification, loadings and overrides on a profile.', ['view', 'manage', 'export']),
    S('bank-tax', 'Bank, super & tax', 'Bank details, superannuation and tax declarations.', ['view', 'manage']),
    S('qualifications', 'Qualifications & compliance', 'Certificates, expiries and clearance documents.', ['view', 'manage']),
    S('availability', 'Availability & preferences', 'Weekly availability, cycles and scheduling preferences.', ['view', 'manage']),
    S('locations', 'Location & area assignment', 'Which locations and areas a person can work in.', ['view', 'manage']),
    S('onboarding', 'Onboarding & invites', 'Paperless invites, questionnaires and onboarding progress.', ['view', 'manage']),
    S('bulk-actions', 'Bulk actions', 'Bulk edits, imports and mass email to staff.', ['view', 'manage', 'export']),
    S('termination', 'Termination & reactivation', 'End employment, set end dates and reactivate staff.', ['view', 'manage']),
  ],
  'pay-conditions': [
    S('awards', 'Awards & classifications', 'Award mapping, levels, pay points and codes.', ['view', 'manage', 'export']),
    S('penalties', 'Penalties & loadings', 'Weekend, public holiday, shift and overtime rules.', ['view', 'manage', 'configure']),
    S('allowances', 'Allowances', 'Allowance types, values and eligibility conditions.', ['view', 'manage']),
    S('overtime', 'Overtime engine', 'Daily/weekly thresholds and the overtime rule order.', ['view', 'manage', 'configure']),
    S('rate-overrides', 'Rate overrides', 'Manual override of an award-resolved rate.', ['view', 'manage', 'approve']),
    S('retrospective', 'Retrospective pay', 'Back-pay runs across historical timesheets.', ['view', 'manage', 'approve', 'export']),
    S('employment-types', 'Employment types', 'Rename defaults and add custom employment types.', ['view', 'manage']),
  ],
  payroll: [
    S('pay-calendars', 'Pay calendars & periods', 'Pay frequencies, period dates, cut-offs and payment dates.', ['view', 'manage', 'configure']),
    S('period-approval', 'Pay period approval', 'Review estimated cost and timesheet warnings, then sign off a period for payroll.', ['view', 'manage', 'approve']),
    S('pay-runs', 'Pay runs', 'Create, calculate, edit and delete draft pay runs.', ['view', 'manage', 'export']),
    S('approval', 'Pay run approval', 'Second-person sign-off that locks a pay run for payment.', ['view', 'approve']),
    S('unlock-reverse', 'Unlock & reverse', 'Reopen a locked pay run or post a reversal run.', ['view', 'manage', 'approve']),
    S('adjustments', 'Adjustments & back pay', 'Manual line adjustments, retrospective pay and termination payments.', ['view', 'manage', 'approve']),
    S('deductions', 'Deductions & salary sacrifice', 'Pre and post-tax deductions, salary sacrifice and garnishees.', ['view', 'manage', 'configure']),
    S('tax-declarations', 'Tax declarations', 'TFN declarations, tax scales, STSL and residency settings.', ['view', 'manage', 'export']),
    S('super', 'Superannuation', 'Super guarantee rate, maximum contribution base, funds and contributions.', ['view', 'manage', 'export', 'configure']),
    S('payslips', 'Payslips', 'Generate, preview and distribute payslips to staff.', ['view', 'manage', 'export']),
    S('payments', 'Payment files (ABA)', 'Generate and download bank payment files for a pay run.', ['view', 'manage', 'export']),
    S('stp', 'STP Phase 2', 'Single Touch Payroll settings, YTD figures and lodgement submissions.', ['view', 'manage', 'approve', 'export', 'configure']),
    S('accounting', 'Accounting integrations', 'Xero, MYOB and QuickBooks connections, account mappings and journal posting.', ['view', 'manage', 'export', 'configure']),
    S('reports', 'Payroll reports', 'Payroll register, cost by location, liabilities and reconciliation reports.', ['view', 'export']),
    S('settings', 'Payroll settings', 'Calculation rules, rounding, thresholds and payroll defaults.', ['view', 'configure']),
    S('audit', 'Payroll audit trail', 'Who created, approved, unlocked or reversed each pay run.', ['view', 'export']),
  ],
  compliance: [
    S('ratios', 'Ratio compliance', 'Live staffing ratio monitoring and breach history.', ['view', 'export']),
    S('fatigue', 'Fatigue & rest', 'Rest gaps, consecutive days and fatigue scoring.', ['view', 'export']),
    S('quals', 'Qualification compliance', 'Expired or missing qualifications against shifts.', ['view', 'export']),
    S('rules', 'Rule configuration', 'Severity, thresholds and violation actions.', ['view', 'configure']),
  ],
  locations: [
    S('locations', 'Locations', 'Create and edit locations and their core settings.', ['view', 'manage']),
    S('areas', 'Areas / rooms', 'Areas, capacities and area-level settings.', ['view', 'manage']),
    S('budgets', 'Budgets', 'Labour budgets and cost thresholds per location.', ['view', 'manage', 'configure']),
    S('hours', 'Operating hours & closures', 'Opening hours, public holidays and closure days.', ['view', 'manage']),
    S('optimisation', 'Optimisation thresholds', 'Triggers for area combining and demand smoothing.', ['view', 'configure']),
  ],
  reports: [
    S('roster-reports', 'Roster & scheduling reports', 'Utilisation, coverage gaps, fill rate, fairness and demand vs actuals.', ['view', 'export']),
    S('timesheet-reports', 'Timesheet & attendance reports', 'Weekly summaries, punctuality, breaks, exceptions and approval SLA.', ['view', 'export']),
    S('workforce-reports', 'Workforce & people reports', 'Headcount, FTE, turnover, onboarding, qualifications and skills.', ['view', 'export']),
    S('location-reports', 'Location & compliance reports', 'Budget vs actuals, area utilisation, ratio compliance and violations.', ['view', 'export']),
    S('payroll', 'Payroll & labour cost reports', 'Pay runs, allowances, overtime spend and payroll reconciliation.', ['view', 'export']),
    S('agency-reports', 'Agency reports', 'Agency usage, cost and partner performance.', ['view', 'export']),
    S('tenant-scope', 'Tenant-wide report access', 'Run reports across every location in the organisation.', ['view', 'export']),
    S('location-scope', 'Location-scoped report access', 'Run reports limited to assigned locations.', ['view', 'export']),
    S('self-scope', 'Own-data reports', 'Staff-level reports limited to the signed-in person.', ['view', 'export']),
    S('builder', 'Custom report builder', 'Build, save and share custom reports.', ['view', 'manage']),
    S('scheduled', 'Scheduled exports', 'Recurring emailed or delivered exports.', ['view', 'manage']),
  ],

  forms: [
    S('templates', 'Form templates', 'Build and version form templates.', ['view', 'manage']),
    S('submissions', 'Submissions', 'View and manage submitted forms.', ['view', 'manage', 'export']),
    S('approval', 'Submission approval', 'Approve or reject submitted forms.', ['view', 'approve']),
    S('tasks', 'Tasks & pipelines', 'Task boards, pipelines and stage configuration.', ['view', 'manage']),
    S('assignment', 'Assign forms & tasks', 'Assign work to individuals or groups.', ['view', 'manage']),
  ],
  performance: [
    S('reviews', 'Reviews & appraisals', 'Review cycles, forms and completed appraisals.', ['view', 'manage', 'approve']),
    S('goals', 'Goals & OKRs', 'Objectives, key results and progress updates.', ['view', 'manage']),
    S('plans', 'Improvement plans', 'Performance improvement and development plans.', ['view', 'manage', 'approve']),
    S('feedback', '360 feedback', 'Request, give and view multi-rater feedback.', ['view', 'manage']),
    S('lms-courses', 'Courses & learning paths', 'Author, publish and retire learning content.', ['view', 'manage']),
    S('lms-enrolment', 'Enrolments', 'Assign courses and set due dates.', ['view', 'manage']),
    S('lms-reporting', 'Learning reporting', 'Completion, compliance training and overdue tracking.', ['view', 'export']),
  ],
  recognition: [
    S('praise', 'Praise wall', 'Give and view praise and shout-outs.', ['view', 'manage']),
    S('awards', 'Awards & rewards', 'Nominate, approve and issue awards.', ['view', 'manage']),
    S('surveys', 'Engagement surveys', 'Create and run surveys.', ['view', 'manage']),
    S('results', 'Survey results', 'Aggregated engagement results and exports.', ['view', 'export']),
  ],
  recruitment: [
    S('requisitions', 'Requisitions', 'Raise and manage hiring requisitions.', ['view', 'manage', 'approve']),
    S('candidates', 'Candidates & pipeline', 'Candidate records and pipeline stages.', ['view', 'manage', 'export']),
    S('interviews', 'Interviews', 'Schedule interviews and record scorecards.', ['view', 'manage']),
    S('offers', 'Offers', 'Create, approve and send offers.', ['view', 'manage', 'approve']),
    S('convert', 'Convert to employee', 'Push a hired candidate into onboarding.', ['view', 'manage']),
  ],
  agency: [
    S('applications', 'Partner applications', 'Invite, review, approve or decline agencies.', ['view', 'manage', 'approve']),
    S('onboarding', 'Partner onboarding', 'Run the onboarding wizard and gates.', ['view', 'manage', 'approve']),
    S('rate-cards', 'Rate cards', 'Agency rates, awards and classification mapping.', ['view', 'manage', 'approve']),
    S('coverage', 'Coverage zones', 'Postcodes, radius and serviced locations.', ['view', 'manage']),
    S('compliance', 'Partner compliance', 'Insurances, clearances and document expiry.', ['view', 'manage', 'approve']),
    S('role-mapping', 'Role mapping', 'Map agency role labels to tenant positions.', ['view', 'manage', 'configure']),
    S('credentials', 'API credentials & webhooks', 'Mint or rotate keys, scopes and webhook endpoints.', ['view', 'manage', 'configure']),
    S('assignment', 'Location assignment', 'Assign approved agencies to locations.', ['view', 'manage']),
  ],
  'master-data': [
    S('positions', 'Positions / job titles', 'Position list and award linkage.', ['view', 'manage', 'export']),
    S('employment-types', 'Employment types', 'Employment type list and payroll mapping.', ['view', 'manage']),
    S('leave-types', 'Leave types', 'Leave types and their accrual behaviour.', ['view', 'manage']),
    S('shift-types', 'Shift types', 'On-call, sleepover, split, recall and custom types.', ['view', 'manage']),
    S('allowances', 'Allowance types', 'Allowance master list.', ['view', 'manage']),
    S('reasons', 'Reason codes', 'Exception, absence and adjustment reason codes.', ['view', 'manage']),
  ],
  settings: [
    S('organisation', 'Organisation profile', 'Tenant details, branding and industry.', ['view', 'manage']),
    S('timesheet-policy', 'Timesheet policy', 'Rounding, variance and break policy defaults.', ['view', 'manage', 'configure']),
    S('notifications', 'Notifications', 'Notification channels, templates and triggers.', ['view', 'manage', 'configure']),
    S('integrations', 'Integrations', 'Payroll, HRIS and third-party connections.', ['view', 'manage', 'configure']),
    S('security', 'Security & session policy', 'Password, MFA and session rules.', ['view', 'configure']),
    S('audit', 'Audit log', 'System-wide change history.', ['view']),
  ],
  permissions: [
    S('matrix', 'Permission matrix', 'Change what each role can do.', ['view', 'manage', 'configure']),
    S('roles', 'Roles', 'Create, clone and delete roles.', ['view', 'manage']),
    S('assignment', 'User assignment', 'Assign people to roles.', ['view', 'manage']),
    S('elevate', 'Grant admin roles', 'Assign Owner / Tenant Admin level roles.', ['view', 'manage']),
  ],
  'employee-portal': [
    S('roster', 'My roster', 'See own upcoming shifts.', ['view', 'export']),
    S('clocking', 'Clock in / out', 'Record own punches and breaks.', ['view', 'manage']),
    S('timesheets', 'My timesheets', 'Submit and review own timesheets.', ['view', 'manage', 'export']),
    S('leave', 'My leave', 'Request leave and view own balances.', ['view', 'manage']),
    S('swaps', 'Shift swaps & open shifts', 'Offer, claim and swap shifts.', ['view', 'manage']),
    S('payslips', 'My payslips', 'View and download own payslips and payment summaries.', ['view', 'export']),
    S('profile', 'My profile & documents', 'Update own details, bank, tax and documents.', ['view', 'manage']),
    S('learning', 'My learning & tasks', 'Own courses, forms and assigned tasks.', ['view', 'manage']),
    S('kiosk-clocking', 'Kiosk clock in / out', 'Clock on and off at a shared on-site kiosk using PIN, QR or face verification.', ['view', 'manage']),
  ],
  kiosk: [
    S('devices', 'Kiosk devices', 'Register, rename, pair and retire kiosk devices for a location.', ['view', 'manage', 'export']),
    S('pairing', 'Device pairing & tokens', 'Issue, rotate and revoke kiosk pairing codes and device tokens.', ['view', 'manage']),
    S('clocking', 'Kiosk clocking', 'Clock staff on and off at the kiosk.', ['view', 'manage']),
    S('pin-management', 'Staff PINs', 'Issue and reset the PINs staff use to clock at a kiosk.', ['view', 'manage']),
    S('face-verification', 'Face verification', 'Enrol, review and clear face-verification templates and match failures.', ['view', 'manage', 'approve']),
    S('supervisor-override', 'Supervisor override', 'Authorise a clock event the kiosk rejected (late, wrong location, failed match).', ['view', 'manage', 'approve']),
    S('offline-sync', 'Offline queue & sync', 'View and resolve punches queued while the kiosk was offline.', ['view', 'manage', 'approve']),
    S('exceptions', 'Kiosk exceptions', 'Buddy-punch alerts, duplicate scans and missed clock-outs raised by the kiosk.', ['view', 'manage', 'approve', 'export']),
    S('assignment', 'Device to location / area', 'Assign kiosk devices to locations and areas.', ['view', 'manage']),
    S('audit', 'Kiosk audit trail', 'Device, photo and geolocation evidence for every kiosk event.', ['view', 'export']),
    S('settings', 'Kiosk configuration', 'Clock methods, photo requirements, geofence radius, timeout and branding.', ['view', 'configure']),
  ],
};

export const getSubPermissions = (moduleId: string): SubPermission[] =>
  SUB_PERMISSIONS[moduleId] ?? [];

/** Sub-areas that must stay closed for a role even though the parent module is granted. */
const SUB_DENY: Record<string, string[]> = {
  employee: [
    'dashboard::tenant-admin-view',
    'dashboard::location-admin-view',
    'dashboard::org-wide',
    'reports::tenant-scope',
    'reports::location-scope',
    'reports::roster-reports',
    'reports::timesheet-reports',
    'reports::workforce-reports',
    'reports::location-reports',
    'reports::payroll',
    'reports::agency-reports',
    'reports::builder',
    'reports::scheduled',
    'timesheets::team',
    'timesheets::approval',
    'timesheets::unlock',
    'timesheets::payroll-export',
    'timesheets::policy',
    'leave::team-requests',
    'leave::approval',
    'leave::adjustments',
    'leave::config',
    'workforce::pay-conditions',
    'workforce::locations',
    'workforce::onboarding',
    'workforce::bulk-actions',
    'workforce::termination',
    'workforce::profiles',
    'roster::templates',
    'roster::auto-schedule',
    'roster::costs',
    'roster::agency-dispatch',
    'performance::reviews',
    'performance::lms-courses',
    'performance::lms-enrolment',
    'performance::lms-reporting',
    'unavailability::team',
    'unavailability::approval',
    'unavailability::override',
    'unavailability::config',
    'contracts::templates',
    'contracts::contracts',
    'contracts::send',
    'contracts::countersign',
    'contracts::variations',
    'contracts::audit',
    'contracts::config',
    'kiosk::devices',
    'kiosk::pairing',
    'kiosk::pin-management',
    'kiosk::supervisor-override',
    'kiosk::offline-sync',
    'kiosk::exceptions',
    'kiosk::assignment',
    'kiosk::audit',
    'kiosk::settings',
  ],
  'location-manager': [
    'payroll::tax-declarations',
    'payroll::super',
    'payroll::payments',
    'payroll::stp',
    'payroll::accounting',
    'payroll::settings',
    'payroll::deductions',
  ],
  'hr-manager': [
    'payroll::payments',
    'payroll::stp',
    'payroll::accounting',
    'payroll::settings',
  ],
  supervisor: [
    'dashboard::tenant-admin-view',
    'dashboard::org-wide',
    'reports::tenant-scope',
    'reports::payroll',
    'reports::agency-reports',
    'timesheets::unlock',
    'timesheets::payroll-export',
    'timesheets::policy',
    'roster::agency-dispatch',
    'roster::costs',
    'contracts::config',
    'contracts::templates',
    'kiosk::pairing',
    'kiosk::settings',
  ],
  'agency-partner': [
    'dashboard::tenant-admin-view',
    'dashboard::location-admin-view',
    'dashboard::org-wide',
    'reports::tenant-scope',
    'reports::payroll',
    'reports::workforce-reports',
    'reports::location-reports',
    'roster::templates',
    'roster::auto-schedule',
    'roster::costs',
    'roster::assignment',
    'roster::constraints',
    'roster::open-shifts',
    'roster::publish',
    'roster::swaps',
    'timesheets::team',
    'timesheets::breaks',
    'timesheets::exceptions',
    'timesheets::approval',
    'timesheets::leave-marking',
    'timesheets::unlock',
    'timesheets::payroll-export',
    'timesheets::policy',
    'agency::applications',
    'agency::credentials',
    'agency::role-mapping',
    'agency::assignment',
    'kiosk::devices',
    'kiosk::pairing',
    'kiosk::pin-management',
    'kiosk::face-verification',
    'kiosk::supervisor-override',
    'kiosk::offline-sync',
    'kiosk::exceptions',
    'kiosk::assignment',
    'kiosk::audit',
    'kiosk::settings',
  ],
  scheduler: ['kiosk::pairing', 'kiosk::pin-management', 'kiosk::settings', 'roster::constraints', 'dashboard::tenant-admin-view', 'reports::tenant-scope', 'reports::payroll'],
};

/** Seed every sub-permission from its parent module grant in the baseline matrix. */
function withSubDefaults(base: PermissionMatrix): PermissionMatrix {
  const out: PermissionMatrix = {};
  for (const [roleId, modules] of Object.entries(base)) {
    const denied = new Set(SUB_DENY[roleId] ?? []);
    const next: Record<string, PermissionAction[]> = { ...modules };
    for (const [moduleId, granted] of Object.entries(modules)) {
      for (const sub of getSubPermissions(moduleId)) {
        const key = subKey(moduleId, sub.id);
        next[key] = denied.has(key) ? [] : sub.actions.filter(a => granted.includes(a));
      }
    }
    out[roleId] = next;
  }
  return out;
}

export const DEFAULT_MATRIX: PermissionMatrix = withSubDefaults(BASE_MATRIX);


