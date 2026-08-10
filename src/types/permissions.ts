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
