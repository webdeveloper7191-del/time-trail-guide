export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'export'
  | 'assign'
  | 'configure';

export const ALL_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'export',
  'assign',
  'configure',
];

export const actionLabels: Record<PermissionAction, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  export: 'Export',
  assign: 'Assign',
  configure: 'Configure',
};

export const actionDescriptions: Record<PermissionAction, string> = {
  view: 'Read records and open screens in this module.',
  create: 'Add new records (shifts, staff, templates, requests…).',
  edit: 'Change existing records the user can view.',
  delete: 'Permanently remove or archive records.',
  approve: 'Sign off items in a workflow (timesheets, leave, pay changes).',
  export: 'Download data as CSV / Excel / PDF.',
  assign: 'Allocate people to work, tasks, courses or locations.',
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
    actions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'assign', 'configure'],
    scope: 'Location',
  },
  {
    id: 'demand',
    label: 'Demand & Optimisation',
    group: 'Operations',
    description: 'Expected attendance, ratio-driven demand, generate shifts from demand.',
    actions: ['view', 'create', 'edit', 'export', 'configure'],
    scope: 'Location',
  },
  {
    id: 'timesheets',
    label: 'Timesheets',
    group: 'Pay & Compliance',
    description: 'Clock data, manual entries, breaks, exceptions and approval chains.',
    actions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'configure'],
    scope: 'Location',
  },
  {
    id: 'leave',
    label: 'Leave & Accruals',
    group: 'People',
    description: 'Leave requests, balances, RDO / ADO / TOIL ledgers.',
    actions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'configure'],
    scope: 'Location',
  },
  {
    id: 'unavailability',
    label: 'Unavailability & Availability',
    group: 'People',
    description: 'Recurring unavailability, one-off blackout dates, availability patterns and approvals.',
    actions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'configure'],
    scope: 'Location',
  },
  {
    id: 'contracts',
    label: 'Contracts & Documents',
    group: 'People',
    description: 'Employment contracts, letters and policy documents with digital signing.',
    actions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'assign', 'configure'],
    scope: 'Tenant',
  },
  {

    id: 'workforce',
    label: 'Workforce',
    group: 'People',
    description: 'Staff profiles, availability, qualifications, onboarding and bulk actions.',
    actions: ['view', 'create', 'edit', 'delete', 'export', 'assign', 'configure'],
    scope: 'Location',
  },
  {
    id: 'pay-conditions',
    label: 'Pay Conditions & Awards',
    group: 'Pay & Compliance',
    description: 'Award mapping, classifications, penalties, allowances and rate overrides.',
    actions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'configure'],
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
    actions: ['view', 'create', 'edit', 'delete', 'configure'],
    scope: 'Tenant',
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    group: 'Insights',
    description: 'Operational, labour cost and payroll reporting plus scheduled exports.',
    actions: ['view', 'create', 'edit', 'delete', 'export'],
    scope: 'Location',
  },
  {
    id: 'forms',
    label: 'Forms & Tasks',
    group: 'Operations',
    description: 'Form templates, submissions, task pipelines and offline capture.',
    actions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'assign'],
    scope: 'Location',
  },
  {
    id: 'performance',
    label: 'Performance & Learning',
    group: 'People',
    description: 'Reviews, goals/OKRs, courses, learning paths and 360 feedback.',
    actions: ['view', 'create', 'edit', 'delete', 'approve', 'assign', 'export'],
    scope: 'Location',
  },
  {
    id: 'recognition',
    label: 'Recognition & Surveys',
    group: 'People',
    description: 'Praise wall, awards, engagement surveys.',
    actions: ['view', 'create', 'edit', 'delete', 'export'],
    scope: 'Location',
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    group: 'People',
    description: 'Requisitions, candidate pipeline, interviews and offers.',
    actions: ['view', 'create', 'edit', 'delete', 'approve', 'assign', 'export'],
    scope: 'Location',
  },
  {
    id: 'agency',
    label: 'Agency Partners',
    group: 'Administration',
    description: 'Partner applications, onboarding, rate cards, coverage and API credentials.',
    actions: ['view', 'create', 'edit', 'delete', 'approve', 'assign', 'configure'],
    scope: 'Tenant',
  },
  {
    id: 'master-data',
    label: 'Master Data',
    group: 'Administration',
    description: 'Positions, employment types, leave types, shift types, allowances.',
    actions: ['view', 'create', 'edit', 'delete', 'export'],
    scope: 'Tenant',
  },
  {
    id: 'settings',
    label: 'Settings & Integrations',
    group: 'Administration',
    description: 'Tenant configuration, timesheet policy, payroll and third-party integrations.',
    actions: ['view', 'edit', 'configure'],
    scope: 'Tenant',
  },
  {
    id: 'permissions',
    label: 'Users & Permissions',
    group: 'Administration',
    description: 'Roles, the permission matrix and user-to-role assignment.',
    actions: ['view', 'create', 'edit', 'delete', 'assign', 'configure'],
    scope: 'Tenant',
  },
  {
    id: 'employee-portal',
    label: 'Employee Portal',
    group: 'Operations',
    description: 'Own roster, clock in/out, own timesheets, leave and swap requests.',
    actions: ['view', 'create', 'edit', 'export'],
    scope: 'Self',
  },
  {
    id: 'kiosk',
    label: 'Kiosk & Time Clock',
    group: 'Operations',
    description:
      'On-site kiosk devices: pairing, PIN / QR / face verification, clocking, offline sync and kiosk audit.',
    actions: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'assign', 'configure'],
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
    leave: A('view', 'create', 'edit', 'delete', 'approve', 'export', 'configure'),
    unavailability: A('view', 'create', 'edit', 'delete', 'approve', 'export', 'configure'),
    contracts: A('view', 'create', 'edit', 'delete', 'approve', 'export', 'assign', 'configure'),
    workforce: A('view', 'create', 'edit', 'delete', 'export', 'assign', 'configure'),
    'pay-conditions': A('view', 'edit', 'export'),
    compliance: A('view', 'export'),
    locations: A('view'),
    reports: A('view', 'create', 'edit', 'export'),
    forms: A('view', 'create', 'edit', 'delete', 'approve', 'assign'),
    performance: A('view', 'create', 'edit', 'delete', 'approve', 'assign', 'export'),
    recognition: A('view', 'create', 'edit', 'delete', 'export'),
    recruitment: A('view', 'create', 'edit', 'delete', 'approve', 'assign', 'export'),
    agency: A('view'),
    'master-data': A('view', 'create', 'edit'),
    settings: A('view'),
    permissions: A('view', 'assign'),
    'employee-portal': A('view'),
  },
  'location-manager': {
    dashboard: A('view', 'export'),
    roster: A('view', 'create', 'edit', 'delete', 'approve', 'export', 'assign'),
    demand: A('view', 'create', 'edit', 'export'),
    timesheets: A('view', 'create', 'edit', 'approve', 'export'),
    leave: A('view', 'create', 'edit', 'approve', 'export'),
    unavailability: A('view', 'create', 'edit', 'approve', 'export'),
    contracts: A('view', 'create', 'edit', 'export', 'assign'),
    workforce: A('view', 'create', 'edit', 'export', 'assign'),
    'pay-conditions': A('view'),
    compliance: A('view', 'export'),
    locations: A('view', 'edit'),
    reports: A('view', 'create', 'export'),
    forms: A('view', 'create', 'edit', 'approve', 'assign'),
    performance: A('view', 'create', 'edit', 'approve', 'assign'),
    recognition: A('view', 'create', 'edit'),
    recruitment: A('view', 'create', 'edit', 'assign'),
    agency: A('view', 'assign'),
    'master-data': A('view'),
    settings: A('view'),
    'employee-portal': A('view'),
  },
  scheduler: {
    dashboard: A('view'),
    roster: A('view', 'create', 'edit', 'delete', 'export', 'assign'),
    demand: A('view', 'create', 'edit', 'export'),
    timesheets: A('view'),
    leave: A('view'),
    unavailability: A('view', 'create', 'edit'),
    contracts: A('view'),
    workforce: A('view'),
    compliance: A('view'),
    locations: A('view'),
    reports: A('view', 'export'),
    forms: A('view', 'create'),
    agency: A('view', 'assign'),
    'master-data': A('view'),
    'employee-portal': A('view'),
  },
  payroll: {
    dashboard: A('view', 'export'),
    roster: A('view', 'export'),
    timesheets: A('view', 'create', 'edit', 'delete', 'approve', 'export', 'configure'),
    leave: A('view', 'approve', 'export'),
    unavailability: A('view', 'export'),
    contracts: A('view', 'export'),
    workforce: A('view', 'edit', 'export'),
    'pay-conditions': A('view', 'create', 'edit', 'delete', 'approve', 'export', 'configure'),
    compliance: A('view', 'export'),
    locations: A('view'),
    reports: A('view', 'create', 'edit', 'export'),
    'master-data': A('view', 'create', 'edit'),
    settings: A('view', 'edit', 'configure'),
    'employee-portal': A('view'),
  },
  supervisor: {
    dashboard: A('view'),
    roster: A('view', 'create', 'edit', 'assign'),
    demand: A('view'),
    timesheets: A('view', 'edit', 'approve'),
    leave: A('view', 'approve'),
    unavailability: A('view', 'approve'),
    contracts: A('view'),
    workforce: A('view'),
    compliance: A('view'),
    reports: A('view'),
    forms: A('view', 'create', 'edit', 'assign'),
    performance: A('view', 'create', 'edit'),
    recognition: A('view', 'create'),
    'employee-portal': A('view'),
  },
  employee: {
    'employee-portal': A('view', 'create', 'edit', 'export'),
    roster: A('view'),
    timesheets: A('view', 'create', 'edit'),
    leave: A('view', 'create', 'edit'),
    unavailability: A('view', 'create', 'edit', 'delete'),
    contracts: A('view', 'approve'),
    forms: A('view', 'create'),
    performance: A('view', 'create', 'edit'),
    recognition: A('view', 'create'),
    workforce: A('view', 'edit'),
  },
  'agency-partner': {
    roster: A('view'),
    agency: A('view', 'create', 'edit'),
    forms: A('view', 'create'),
    timesheets: A('view', 'create'),
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
    S('shifts', 'Shifts', 'Create, edit, delete and move individual shifts.', ['view', 'create', 'edit', 'delete', 'export']),
    S('open-shifts', 'Open shifts', 'Publish, claim, approve claims and fill open shifts.', ['view', 'create', 'edit', 'delete', 'approve', 'assign']),
    S('assignment', 'Staff assignment', 'Assign or unassign people on a shift.', ['view', 'edit', 'assign']),
    S('templates', 'Templates & copy week', 'Save, apply and update roster templates and week copies.', ['view', 'create', 'edit', 'delete', 'assign']),
    S('auto-schedule', 'Auto-schedule & optimiser', 'Run the solver and apply generated plans.', ['view', 'create', 'edit', 'configure']),
    S('publish', 'Publish & notify', 'Publish the roster and send shift notifications.', ['view', 'approve']),
    S('swaps', 'Swaps & shift offers', 'Approve swap requests and give-away offers.', ['view', 'edit', 'approve']),
    S('agency-dispatch', 'Agency dispatch', 'Broadcast shifts to agency partners and accept candidates.', ['view', 'create', 'approve', 'assign']),
    S('costs', 'Cost & budget view', 'See shift cost, penalties and budget consumption on the roster.', ['view', 'export']),
    S('constraints', 'Scheduling constraints', 'Configure hard/soft rules, fatigue and rest settings.', ['view', 'configure']),
  ],
  demand: [
    S('expected', 'Expected demand entry', 'Enter or import expected attendance / volumes.', ['view', 'create', 'edit', 'export']),
    S('ratios', 'Ratio & staffing rules', 'Ratio bands and qualification mix used to size demand.', ['view', 'edit', 'configure']),
    S('generate', 'Generate shifts from demand', 'Turn demand into draft shifts on the roster.', ['view', 'create', 'edit']),
    S('optimiser', 'Demand optimiser', 'Reconcile roster against demand, fill gaps, release surplus.', ['view', 'create', 'edit']),
    S('area-combining', 'Area combining', 'Suggest and apply low-attendance area mergers.', ['view', 'edit', 'configure']),
    S('reports', 'Optimisation reports', 'Weekly optimisation report and drill-downs.', ['view', 'export']),
  ],
  timesheets: [
    S('own', 'Own timesheets', 'View and edit the user’s own timesheets only.', ['view', 'create', 'edit']),
    S('team', 'Team timesheets', 'All timesheets for the user’s locations / areas.', ['view', 'create', 'edit', 'delete', 'export']),
    S('breaks', 'Breaks & clock data', 'Adjust clock in/out punches and paid/unpaid breaks.', ['view', 'edit']),
    S('exceptions', 'Exceptions & flags', 'Raise, respond to and clear timesheet exceptions.', ['view', 'create', 'edit', 'approve']),
    S('approval', 'Approval chain', 'Approve or reject timesheets in the workflow.', ['view', 'approve']),
    S('unlock', 'Unlock / reopen approved', 'Reopen a locked or approved timesheet period.', ['view', 'edit', 'approve']),
    S('leave-marking', 'Leave day marking', 'Mark a day as leave and pick the leave type.', ['view', 'create', 'edit']),
    S('payroll-export', 'Payroll export', 'Export approved timesheets to payroll.', ['view', 'export']),
    S('policy', 'Timesheet policy', 'Rounding, variance flags and compliance defaults.', ['view', 'configure']),
  ],
  leave: [
    S('own-requests', 'Own leave requests', 'Submit and manage the user’s own leave.', ['view', 'create', 'edit', 'delete']),
    S('team-requests', 'Team leave requests', 'See and manage leave for the user’s people.', ['view', 'create', 'edit', 'delete', 'export']),
    S('approval', 'Leave approval', 'Approve or decline leave requests.', ['view', 'approve']),
    S('balances', 'Balances & accruals', 'Leave balances and accrual ledgers.', ['view', 'export']),
    S('adjustments', 'Manual balance adjustments', 'Credit or debit a balance outside normal accrual.', ['view', 'create', 'edit', 'approve']),
    S('rdo-ado-toil', 'RDO / ADO / TOIL ledgers', 'Accrue, bank and consume RDO, ADO and TOIL.', ['view', 'create', 'edit', 'approve']),
    S('config', 'Leave configuration', 'Accrual rules, entitlements and leave year settings.', ['view', 'configure']),
  ],
  unavailability: [
    S('own', 'Own unavailability', 'Submit and manage the user’s own unavailability.', ['view', 'create', 'edit', 'delete']),
    S('team', 'Team unavailability', 'View and manage unavailability for the user’s people.', ['view', 'create', 'edit', 'delete', 'export']),
    S('approval', 'Unavailability approval', 'Approve or decline submitted unavailability.', ['view', 'approve']),
    S('override', 'Override on roster', 'Schedule a person despite recorded unavailability.', ['view', 'edit', 'approve']),
    S('config', 'Unavailability rules', 'Notice periods, limits and blackout policy.', ['view', 'configure']),
  ],
  contracts: [
    S('templates', 'Contract templates', 'Create and maintain contract and letter templates.', ['view', 'create', 'edit', 'delete']),
    S('contracts', 'Contracts', 'Create, edit and delete individual staff contracts.', ['view', 'create', 'edit', 'delete', 'export']),
    S('send', 'Send for signature', 'Issue a contract or document to a recipient for digital signing.', ['view', 'create', 'assign']),
    S('sign', 'Sign documents', 'Digitally sign a document as the recipient.', ['view', 'create']),
    S('countersign', 'Countersign / approve', 'Approve and countersign on behalf of the organisation.', ['view', 'approve']),
    S('variations', 'Variations & amendments', 'Pay change letters, role changes and contract variations.', ['view', 'create', 'edit', 'approve']),
    S('documents', 'Document library', 'Policies, handbooks and supporting documents.', ['view', 'create', 'edit', 'delete', 'export']),
    S('audit', 'Signing audit trail', 'Signature history, IP / timestamp evidence and certificates.', ['view', 'export']),
    S('config', 'Signing configuration', 'E-signature provider, signing order and reminder settings.', ['view', 'configure']),
  ],
  workforce: [
    S('profiles', 'Staff profiles', 'Personal, employment and contact details.', ['view', 'create', 'edit', 'delete', 'export']),
    S('pay-conditions', 'Pay conditions', 'Base rate, classification, loadings and overrides on a profile.', ['view', 'edit', 'export']),
    S('bank-tax', 'Bank, super & tax', 'Bank details, superannuation and tax declarations.', ['view', 'edit']),
    S('qualifications', 'Qualifications & compliance', 'Certificates, expiries and clearance documents.', ['view', 'create', 'edit', 'delete']),
    S('availability', 'Availability & preferences', 'Weekly availability, cycles and scheduling preferences.', ['view', 'edit']),
    S('locations', 'Location & area assignment', 'Which locations and areas a person can work in.', ['view', 'edit', 'assign']),
    S('onboarding', 'Onboarding & invites', 'Paperless invites, questionnaires and onboarding progress.', ['view', 'create', 'edit', 'assign']),
    S('bulk-actions', 'Bulk actions', 'Bulk edits, imports and mass email to staff.', ['view', 'create', 'edit', 'export']),
    S('termination', 'Termination & reactivation', 'End employment, set end dates and reactivate staff.', ['view', 'edit', 'delete']),
  ],
  'pay-conditions': [
    S('awards', 'Awards & classifications', 'Award mapping, levels, pay points and codes.', ['view', 'create', 'edit', 'delete', 'export']),
    S('penalties', 'Penalties & loadings', 'Weekend, public holiday, shift and overtime rules.', ['view', 'create', 'edit', 'delete', 'configure']),
    S('allowances', 'Allowances', 'Allowance types, values and eligibility conditions.', ['view', 'create', 'edit', 'delete']),
    S('overtime', 'Overtime engine', 'Daily/weekly thresholds and the overtime rule order.', ['view', 'edit', 'configure']),
    S('rate-overrides', 'Rate overrides', 'Manual override of an award-resolved rate.', ['view', 'create', 'edit', 'approve']),
    S('retrospective', 'Retrospective pay', 'Back-pay runs across historical timesheets.', ['view', 'create', 'approve', 'export']),
    S('employment-types', 'Employment types', 'Rename defaults and add custom employment types.', ['view', 'create', 'edit', 'delete']),
  ],
  compliance: [
    S('ratios', 'Ratio compliance', 'Live staffing ratio monitoring and breach history.', ['view', 'export']),
    S('fatigue', 'Fatigue & rest', 'Rest gaps, consecutive days and fatigue scoring.', ['view', 'export']),
    S('quals', 'Qualification compliance', 'Expired or missing qualifications against shifts.', ['view', 'export']),
    S('rules', 'Rule configuration', 'Severity, thresholds and violation actions.', ['view', 'configure']),
  ],
  locations: [
    S('locations', 'Locations', 'Create and edit locations and their core settings.', ['view', 'create', 'edit', 'delete']),
    S('areas', 'Areas / rooms', 'Areas, capacities and area-level settings.', ['view', 'create', 'edit', 'delete']),
    S('budgets', 'Budgets', 'Labour budgets and cost thresholds per location.', ['view', 'edit', 'configure']),
    S('hours', 'Operating hours & closures', 'Opening hours, public holidays and closure days.', ['view', 'edit']),
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
    S('builder', 'Custom report builder', 'Build, save and share custom reports.', ['view', 'create', 'edit', 'delete']),
    S('scheduled', 'Scheduled exports', 'Recurring emailed or delivered exports.', ['view', 'create', 'edit', 'delete']),
  ],

  forms: [
    S('templates', 'Form templates', 'Build and version form templates.', ['view', 'create', 'edit', 'delete']),
    S('submissions', 'Submissions', 'View and manage submitted forms.', ['view', 'create', 'edit', 'delete', 'export']),
    S('approval', 'Submission approval', 'Approve or reject submitted forms.', ['view', 'approve']),
    S('tasks', 'Tasks & pipelines', 'Task boards, pipelines and stage configuration.', ['view', 'create', 'edit', 'delete', 'assign']),
    S('assignment', 'Assign forms & tasks', 'Assign work to individuals or groups.', ['view', 'assign']),
  ],
  performance: [
    S('reviews', 'Reviews & appraisals', 'Review cycles, forms and completed appraisals.', ['view', 'create', 'edit', 'delete', 'approve']),
    S('goals', 'Goals & OKRs', 'Objectives, key results and progress updates.', ['view', 'create', 'edit', 'delete']),
    S('plans', 'Improvement plans', 'Performance improvement and development plans.', ['view', 'create', 'edit', 'approve']),
    S('feedback', '360 feedback', 'Request, give and view multi-rater feedback.', ['view', 'create', 'edit']),
    S('lms-courses', 'Courses & learning paths', 'Author, publish and retire learning content.', ['view', 'create', 'edit', 'delete']),
    S('lms-enrolment', 'Enrolments', 'Assign courses and set due dates.', ['view', 'assign', 'edit']),
    S('lms-reporting', 'Learning reporting', 'Completion, compliance training and overdue tracking.', ['view', 'export']),
  ],
  recognition: [
    S('praise', 'Praise wall', 'Give and view praise and shout-outs.', ['view', 'create', 'edit', 'delete']),
    S('awards', 'Awards & rewards', 'Nominate, approve and issue awards.', ['view', 'create', 'edit', 'delete']),
    S('surveys', 'Engagement surveys', 'Create and run surveys.', ['view', 'create', 'edit', 'delete']),
    S('results', 'Survey results', 'Aggregated engagement results and exports.', ['view', 'export']),
  ],
  recruitment: [
    S('requisitions', 'Requisitions', 'Raise and manage hiring requisitions.', ['view', 'create', 'edit', 'delete', 'approve']),
    S('candidates', 'Candidates & pipeline', 'Candidate records and pipeline stages.', ['view', 'create', 'edit', 'delete', 'export']),
    S('interviews', 'Interviews', 'Schedule interviews and record scorecards.', ['view', 'create', 'edit', 'assign']),
    S('offers', 'Offers', 'Create, approve and send offers.', ['view', 'create', 'edit', 'approve']),
    S('convert', 'Convert to employee', 'Push a hired candidate into onboarding.', ['view', 'create', 'assign']),
  ],
  agency: [
    S('applications', 'Partner applications', 'Invite, review, approve or decline agencies.', ['view', 'create', 'edit', 'delete', 'approve']),
    S('onboarding', 'Partner onboarding', 'Run the onboarding wizard and gates.', ['view', 'create', 'edit', 'approve']),
    S('rate-cards', 'Rate cards', 'Agency rates, awards and classification mapping.', ['view', 'create', 'edit', 'approve']),
    S('coverage', 'Coverage zones', 'Postcodes, radius and serviced locations.', ['view', 'create', 'edit']),
    S('compliance', 'Partner compliance', 'Insurances, clearances and document expiry.', ['view', 'edit', 'approve']),
    S('role-mapping', 'Role mapping', 'Map agency role labels to tenant positions.', ['view', 'edit', 'configure']),
    S('credentials', 'API credentials & webhooks', 'Mint or rotate keys, scopes and webhook endpoints.', ['view', 'create', 'edit', 'delete', 'configure']),
    S('assignment', 'Location assignment', 'Assign approved agencies to locations.', ['view', 'assign']),
  ],
  'master-data': [
    S('positions', 'Positions / job titles', 'Position list and award linkage.', ['view', 'create', 'edit', 'delete', 'export']),
    S('employment-types', 'Employment types', 'Employment type list and payroll mapping.', ['view', 'create', 'edit', 'delete']),
    S('leave-types', 'Leave types', 'Leave types and their accrual behaviour.', ['view', 'create', 'edit', 'delete']),
    S('shift-types', 'Shift types', 'On-call, sleepover, split, recall and custom types.', ['view', 'create', 'edit', 'delete']),
    S('allowances', 'Allowance types', 'Allowance master list.', ['view', 'create', 'edit', 'delete']),
    S('reasons', 'Reason codes', 'Exception, absence and adjustment reason codes.', ['view', 'create', 'edit', 'delete']),
  ],
  settings: [
    S('organisation', 'Organisation profile', 'Tenant details, branding and industry.', ['view', 'edit']),
    S('timesheet-policy', 'Timesheet policy', 'Rounding, variance and break policy defaults.', ['view', 'edit', 'configure']),
    S('notifications', 'Notifications', 'Notification channels, templates and triggers.', ['view', 'edit', 'configure']),
    S('integrations', 'Integrations', 'Payroll, HRIS and third-party connections.', ['view', 'edit', 'configure']),
    S('security', 'Security & session policy', 'Password, MFA and session rules.', ['view', 'configure']),
    S('audit', 'Audit log', 'System-wide change history.', ['view']),
  ],
  permissions: [
    S('matrix', 'Permission matrix', 'Change what each role can do.', ['view', 'edit', 'configure']),
    S('roles', 'Roles', 'Create, clone and delete roles.', ['view', 'create', 'edit', 'delete']),
    S('assignment', 'User assignment', 'Assign people to roles.', ['view', 'assign']),
    S('elevate', 'Grant admin roles', 'Assign Owner / Tenant Admin level roles.', ['view', 'assign']),
  ],
  'employee-portal': [
    S('roster', 'My roster', 'See own upcoming shifts.', ['view', 'export']),
    S('clocking', 'Clock in / out', 'Record own punches and breaks.', ['view', 'create', 'edit']),
    S('timesheets', 'My timesheets', 'Submit and review own timesheets.', ['view', 'create', 'edit', 'export']),
    S('leave', 'My leave', 'Request leave and view own balances.', ['view', 'create', 'edit']),
    S('swaps', 'Shift swaps & open shifts', 'Offer, claim and swap shifts.', ['view', 'create', 'edit']),
    S('profile', 'My profile & documents', 'Update own details, bank, tax and documents.', ['view', 'edit']),
    S('learning', 'My learning & tasks', 'Own courses, forms and assigned tasks.', ['view', 'create', 'edit']),
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
  ],
  scheduler: ['roster::constraints', 'dashboard::tenant-admin-view', 'reports::tenant-scope', 'reports::payroll'],
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


