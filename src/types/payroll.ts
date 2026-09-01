/**
 * Payroll module types.
 *
 * A pay run turns approved timesheets for a pay period into payable lines
 * (gross, PAYG tax, super, net) and produces accounting exports and
 * STP-style YTD summaries.
 */

export type PayRunStatus = 'draft' | 'review' | 'approved' | 'posted';

export type PayCycle = 'weekly' | 'fortnightly' | 'monthly';

export type PayComponentKind =
  | 'ordinary'
  | 'overtime'
  | 'penalty'
  | 'allowance'
  | 'leave'
  | 'deduction';

export interface PayComponent {
  id: string;
  kind: PayComponentKind;
  label: string;
  /** Hours or units (e.g. 1 for a per-shift allowance) */
  units: number;
  rate: number;
  amount: number;
  /** Whether the component attracts super guarantee */
  superable: boolean;
  /** Whether the component is taxable */
  taxable: boolean;
  /** Accounting account code resolved from the mapping */
  accountCode?: string;
}

export interface PayRunLine {
  id: string;
  staffId: string;
  staffName: string;
  employeeNumber?: string;
  payrollId?: string;
  locationId?: string;
  locationName?: string;
  employmentType?: string;
  timesheetIds: string[];
  components: PayComponent[];
  ordinaryHours: number;
  overtimeHours: number;
  grossPay: number;
  taxableGross: number;
  paygTax: number;
  superGuarantee: number;
  deductions: number;
  netPay: number;
  /** Validation issues that block posting */
  warnings: string[];
  excluded?: boolean;

  // --- Source data linkage -------------------------------------------
  /** Workforce staff record the line was resolved from, when matched. */
  staffRecordId?: string;
  dataSource: 'staff_record' | 'timesheet_fallback';
  baseRate: number;
  rateSource: 'award' | 'pay_condition_hourly' | 'pay_condition_salary' | 'timesheet';
  awardName?: string;
  classification?: string;
  casualLoadingPct?: number;
  penaltyHours?: number;
  /** Hours scheduled in the roster for the same period. */
  rosteredHours?: number;
  /** paid hours minus rostered hours */
  rosterVarianceHours?: number;
  superFundName?: string;
  bankAccountMasked?: string;
  hasTfn?: boolean;
  incomeStream?: StpIncomeStream;
}

export interface PayRun {
  id: string;
  name: string;
  cycle: PayCycle;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  status: PayRunStatus;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  postedAt?: string;
  lines: PayRunLine[];
  totals: PayRunTotals;
  notes?: string;
  /** Set once exported to an accounting platform */
  exports: PayRunExportRecord[];
}

export interface PayRunTotals {
  headcount: number;
  ordinaryHours: number;
  overtimeHours: number;
  grossPay: number;
  paygTax: number;
  superGuarantee: number;
  deductions: number;
  netPay: number;
}

export type AccountingPlatform = 'xero' | 'myob' | 'quickbooks';

export interface PayRunExportRecord {
  id: string;
  platform: AccountingPlatform | 'csv' | 'aba' | 'stp';
  exportedAt: string;
  fileName: string;
  lineCount: number;
}

export interface AccountMappingRow {
  /** Matches PayComponentKind, plus 'payg' | 'super' | 'net' for the balancing entries */
  key: PayComponentKind | 'payg' | 'super' | 'net';
  label: string;
  accountCode: string;
  taxCode?: string;
  trackingCategory?: string;
}

export interface AccountingConnection {
  platform: AccountingPlatform;
  connected: boolean;
  organisationName?: string;
  /** Reference only; no live credentials are stored in mock mode */
  tenantRef?: string;
  lastSyncedAt?: string;
  /** Journal vs detailed timesheet export */
  exportMode: 'journal' | 'timesheet' | 'bill';
  mappings: AccountMappingRow[];
}

export interface StpYtdRow {
  staffId: string;
  staffName: string;
  payrollId?: string;
  tfn?: string;
  grossPay: number;
  paygTax: number;
  superGuarantee: number;
  allowances: number;
  overtime: number;
  netPay: number;
  payRunCount: number;
}

export interface PayrollSettings {
  defaultCycle: PayCycle;
  superRate: number; // percentage e.g. 12
  overtimeMultiplier: number;
  taxScale: 'resident' | 'no_tfn' | 'none';
  financialYearStart: string; // yyyy-MM-dd
  roundNetToCents: boolean;
  abaBankCode?: string;
  abaAccountName?: string;

  /** Pay calendar used by default when creating a run. */
  defaultCalendarId?: string;
  /** NES ordinary hours, used to derive hourly from salary/weekly pay conditions. */
  ordinaryHoursPerWeek: number;
  /** Resolve the base rate from the staff member's pay conditions / award instead of the timesheet rate. */
  useAwardRates: boolean;
  /** Apply Saturday / Sunday / public holiday / night penalties from the staff member's award. */
  useAwardPenalties: boolean;
  /** Apply casual loading to casual employees whose award rate is not already loaded. */
  applyCasualLoading: boolean;
  defaultCasualLoadingPct: number;
  /** Use award overtime steps (first 2 hours / thereafter) instead of the flat multiplier. */
  useAwardOvertimeRates: boolean;
  /** Include overtime earnings in the super guarantee base (normally excluded as it is not OTE). */
  superOnOvertime: boolean;
  /** Minimum monthly earnings before super accrues ($0 since 1 July 2022). */
  superMonthlyThreshold: number;
  /** Compare paid hours against rostered hours and flag variances. */
  compareToRoster: boolean;
  rosterVarianceToleranceHours: number;
  /** Warn when an employee has no bank details or TFN on file. */
  requireBankDetails: boolean;
}

/** A recurring pay period definition that drives pay run dates. */
export interface PayCalendar {
  id: string;
  name: string;
  cycle: PayCycle;
  /** First day of a period in the series (yyyy-MM-dd). */
  anchorDate: string;
  /** Days after period end that staff are paid. */
  paymentOffsetDays: number;
  /** Empty = all locations. */
  locationIds: string[];
  isDefault: boolean;
  active: boolean;
}

export type StpIncomeStream = 'SAW' | 'CHP' | 'WHM' | 'LAB';

export interface StpSettings {
  enabled: boolean;
  abn: string;
  branchCode: string;
  bmsId: string;
  payerName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  reportingParty: 'employer' | 'registered_agent' | 'intermediary';
  agentNumber?: string;
  defaultIncomeStream: StpIncomeStream;
  /** Phase 2 disaggregation switches. */
  disaggregateOvertime: boolean;
  reportAllowancesSeparately: boolean;
  reportPaidLeaveSeparately: boolean;
  reportSalarySacrifice: boolean;
  finalEventForFy: boolean;
  lastLodgedAt?: string;
}

export const defaultStpSettings: StpSettings = {
  enabled: false,
  abn: '',
  branchCode: '001',
  bmsId: 'ROSTEREDAI-BMS-001',
  payerName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  reportingParty: 'employer',
  defaultIncomeStream: 'SAW',
  disaggregateOvertime: true,
  reportAllowancesSeparately: true,
  reportPaidLeaveSeparately: true,
  reportSalarySacrifice: false,
  finalEventForFy: false,
};

export const defaultPayCalendars: PayCalendar[] = [
  {
    id: 'cal-fortnightly',
    name: 'Fortnightly — all locations',
    cycle: 'fortnightly',
    anchorDate: '2026-01-05',
    paymentOffsetDays: 3,
    locationIds: [],
    isDefault: true,
    active: true,
  },
];

export const defaultPayrollSettings: PayrollSettings = {
  defaultCycle: 'fortnightly',
  superRate: 12,
  overtimeMultiplier: 1.5,
  taxScale: 'resident',
  financialYearStart: '2026-07-01',
  roundNetToCents: true,
  defaultCalendarId: 'cal-fortnightly',
  ordinaryHoursPerWeek: 38,
  useAwardRates: true,
  useAwardPenalties: true,
  applyCasualLoading: true,
  defaultCasualLoadingPct: 25,
  useAwardOvertimeRates: true,
  superOnOvertime: false,
  superMonthlyThreshold: 0,
  compareToRoster: true,
  rosterVarianceToleranceHours: 1,
  requireBankDetails: true,
};

export const defaultMappings = (platform: AccountingPlatform): AccountMappingRow[] => {
  const base: AccountMappingRow[] = [
    { key: 'ordinary', label: 'Ordinary hours', accountCode: '477', taxCode: 'BAS Excluded' },
    { key: 'overtime', label: 'Overtime', accountCode: '478', taxCode: 'BAS Excluded' },
    { key: 'penalty', label: 'Penalties & loadings', accountCode: '479', taxCode: 'BAS Excluded' },
    { key: 'allowance', label: 'Allowances', accountCode: '480', taxCode: 'BAS Excluded' },
    { key: 'leave', label: 'Leave payments', accountCode: '481', taxCode: 'BAS Excluded' },
    { key: 'deduction', label: 'Deductions', accountCode: '814', taxCode: 'BAS Excluded' },
    { key: 'payg', label: 'PAYG withholding', accountCode: '825', taxCode: 'BAS Excluded' },
    { key: 'super', label: 'Superannuation', accountCode: '826', taxCode: 'BAS Excluded' },
    { key: 'net', label: 'Net wages payable', accountCode: '804', taxCode: 'BAS Excluded' },
  ];
  if (platform === 'myob') {
    return base.map((m, i) => ({ ...m, accountCode: `6-${1000 + i * 10}` }));
  }
  if (platform === 'quickbooks') {
    return base.map((m) => ({ ...m, accountCode: `Payroll:${m.label}` }));
  }
  return base;
};
