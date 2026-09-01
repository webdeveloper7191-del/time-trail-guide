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
  | 'termination'
  | 'deduction';

/** How a deduction is treated for tax, super and reporting. */
export type DeductionCategory =
  | 'pre_tax'
  | 'post_tax'
  | 'salary_sacrifice_super'
  | 'child_support'
  | 'union'
  | 'other';

export type DeductionCalc = 'fixed' | 'percent_gross';

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
  /** Deduction classification (deduction components only). */
  category?: DeductionCategory;
  /** Where the component came from, so recalculation can rebuild it. */
  source?: 'earnings' | 'standing_deduction' | 'adjustment';
  /** Tax withheld separately at a lump-sum rate (termination components). */
  lumpSumTax?: number;
  /** STP Phase 2 reporting code, e.g. LumpSumA, ETP, Leave-A. */
  stpCode?: string;
}

/** A recurring deduction or salary sacrifice arrangement. */
export interface StandingDeduction {
  id: string;
  name: string;
  category: DeductionCategory;
  calc: DeductionCalc;
  /** Dollar amount per pay, or a percentage of gross when calc = percent_gross. */
  amount: number;
  /** Empty = applies to every employee in the run. */
  staffIds: string[];
  /** Protected earnings floor — the deduction is trimmed so net never falls below this. */
  protectedEarnings?: number;
  reference?: string;
  active: boolean;
  notes?: string;
}

export type PayRunAdjustmentKind = 'leave' | 'deduction' | 'termination' | 'back_pay';

/** A one-off addition to a pay run line: leave payment, ad-hoc deduction, back pay or termination pay. */
export interface PayRunAdjustment {
  id: string;
  lineId: string;
  staffId: string;
  kind: PayRunAdjustmentKind;
  label: string;

  // Leave payment
  leaveTypeCode?: string;
  hours?: number;
  rate?: number;
  /** Annual leave loading percentage applied on top (typically 17.5). */
  loadingPct?: number;

  // Ad-hoc deduction
  category?: DeductionCategory;
  amount?: number;

  // Back pay / retrospective adjustment
  /** Period the back pay relates to, shown on the payslip. */
  backPayFrom?: string;
  backPayTo?: string;
  /** Hours re-priced and the rate difference applied, when calculated from timesheets. */
  backPayHours?: number;
  backPayRateDifference?: number;
  /** Back pay is superable unless it relates to a non-OTE component. */
  superable?: boolean;

  // Termination pay
  unusedAnnualLeaveHours?: number;
  unusedLslHours?: number;
  paymentInLieuAmount?: number;
  redundancyAmount?: number;
  etpTaxableAmount?: number;
  completedYearsOfService?: number;
  genuineRedundancy?: boolean;
  notes?: string;
}

/** Per-employee tax declaration driving the ATO withholding scale. */
export interface EmployeeTaxProfile {
  staffId: string;
  /** ATO scale identifier: scale1..scale6. */
  scale: string;
  /** Withhold the study and training support loan (HELP/VET/SFSS) component. */
  hasStsl: boolean;
  updatedAt?: string;
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
  /** Real bank details used to build the ABA payment file. */
  bankBsb?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;

  hasTfn?: boolean;
  incomeStream?: StpIncomeStream;

  // --- Deductions, sacrifice, leave and termination -------------------
  /** Deductions taken before tax (excluding salary sacrifice to super). */
  preTaxDeductions?: number;
  postTaxDeductions?: number;
  /** Salary sacrificed to superannuation (RESC) — reduces taxable income. */
  salarySacrificeSuper?: number;
  /** Paid leave included in gross. */
  leavePay?: number;
  /** Termination lump sums included in gross. */
  terminationPay?: number;
  /** Tax withheld on termination lump sums at the flat lump-sum rates. */
  lumpSumTax?: number;
  /** Employer super = SG + salary sacrifice. */
  totalSuperContribution?: number;
  isTermination?: boolean;
}

/** An immutable audit entry recorded against a pay run. */
export interface PayRunAuditEvent {
  id: string;
  at: string;
  action: 'created' | 'review' | 'approved' | 'posted' | 'locked' | 'unlocked' | 'reversed' | 'published' | 'exported' | 'recalculated';
  by?: string;
  detail?: string;
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
  /** One-off leave payments, deductions and termination pay applied to lines. */
  adjustments?: PayRunAdjustment[];
  /** Set once exported to an accounting platform */
  exports: PayRunExportRecord[];

  /** A posted run is locked against edits until explicitly unlocked. */
  locked?: boolean;
  unlockedAt?: string;
  unlockReason?: string;
  /** Set when the run has been reversed; points at the reversal run. */
  reversedAt?: string;
  reversalOfRunId?: string;
  reversedByRunId?: string;
  /** Payslips published to the employee portal. */
  payslipsPublishedAt?: string;
  auditTrail?: PayRunAuditEvent[];
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
  salarySacrificeSuper?: number;
  leavePay?: number;
  terminationPay?: number;
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
  /** APCA user identification number on the ABA descriptive record. */
  abaUserNumber?: string;
  /** Withdrawal (clearing) account the ABA file debits. */
  abaBsb?: string;
  abaAccountNumber?: string;
  /** Statement text shown on the employee's bank statement. */
  abaLodgementReference?: string;


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

  // --- Leave & termination --------------------------------------------
  /** Annual leave loading paid on annual leave taken (typically 17.5%). */
  annualLeaveLoadingPct: number;
  /** Pay leave loading on annual leave taken during the period. */
  payLeaveLoadingOnLeaveTaken: boolean;
  /** Include annual leave loading in unused-leave termination payouts. */
  payLeaveLoadingOnTermination: boolean;
  /** Flat withholding rate on unused annual/LSL paid on termination (schedule 7). */
  terminationLeaveTaxRate: number;
  /** Flat withholding rate on the taxable component of an ETP under the cap. */
  etpTaxRate: number;
  /** Genuine redundancy tax-free base amount for the financial year. */
  redundancyTaxFreeBase: number;
  /** Genuine redundancy tax-free amount per completed year of service. */
  redundancyTaxFreePerYear: number;
  /** Super guarantee is not payable on most termination lump sums. */
  superOnTerminationPay: boolean;

  // --- Withholding & super caps ----------------------------------------
  /** Use the ATO NAT 1004 coefficient scales (incl. STSL) instead of the simplified model. */
  useAtoTaxScales: boolean;
  /** Scale applied when an employee has no tax declaration recorded. */
  defaultAtoScale: string;
  /** Cap superable earnings at the maximum contribution base. */
  applySuperMaxContributionBase: boolean;
  /** Maximum super contribution base per quarter (2025-26: $62,500). */
  superMaxContributionBaseQuarterly: number;
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
  annualLeaveLoadingPct: 17.5,
  payLeaveLoadingOnLeaveTaken: true,
  payLeaveLoadingOnTermination: false,
  terminationLeaveTaxRate: 32,
  etpTaxRate: 32,
  redundancyTaxFreeBase: 12524,
  redundancyTaxFreePerYear: 6264,
  superOnTerminationPay: false,
  useAtoTaxScales: true,
  defaultAtoScale: 'scale2',
  applySuperMaxContributionBase: true,
  superMaxContributionBaseQuarterly: 62500,
};

export const defaultMappings = (platform: AccountingPlatform): AccountMappingRow[] => {
  const base: AccountMappingRow[] = [
    { key: 'ordinary', label: 'Ordinary hours', accountCode: '477', taxCode: 'BAS Excluded' },
    { key: 'overtime', label: 'Overtime', accountCode: '478', taxCode: 'BAS Excluded' },
    { key: 'penalty', label: 'Penalties & loadings', accountCode: '479', taxCode: 'BAS Excluded' },
    { key: 'allowance', label: 'Allowances', accountCode: '480', taxCode: 'BAS Excluded' },
    { key: 'leave', label: 'Leave payments', accountCode: '481', taxCode: 'BAS Excluded' },
    { key: 'termination', label: 'Termination payments', accountCode: '482', taxCode: 'BAS Excluded' },
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
