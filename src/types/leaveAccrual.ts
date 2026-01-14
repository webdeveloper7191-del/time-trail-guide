/**
 * Leave Accrual Types and Interfaces
 * Covers Annual Leave, Personal Leave, and Long Service Leave for all Australian states
 */

// Australian States/Territories
export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';

// Leave Types
export type LeaveType = 
  | 'annual_leave'
  | 'personal_leave'     // Sick/carer's leave combined
  | 'long_service_leave'
  | 'compassionate_leave'
  | 'parental_leave'
  | 'unpaid_leave'
  | 'public_holiday'
  | 'jury_duty'
  | 'community_service';

// Employment basis for leave calculations
export type EmploymentBasis = 'full_time' | 'part_time' | 'casual';

// Leave accrual frequency
export type AccrualFrequency = 'per_hour' | 'per_pay_period' | 'annual' | 'continuous';

// Long Service Leave state-specific rules
export interface LSLStateRules {
  state: AustralianState;
  stateName: string;
  
  // When LSL starts accruing
  accrualStartYears: number;      // e.g., 5 years in VIC
  
  // First entitlement threshold
  entitlementYears: number;       // e.g., 10 years in most states
  entitlementWeeks: number;       // e.g., 8.67 weeks
  
  // Pro-rata access threshold (if applicable)
  proRataYears?: number;          // e.g., 7 years in some states
  proRataOnResignation: boolean;
  proRataOnTermination: boolean;
  
  // Accrual rate after initial entitlement
  additionalWeeksPerYear: number; // e.g., 0.867 weeks per year
  
  // Calculation method
  calculationBasis: 'ordinary_pay' | 'average_pay' | 'current_pay';
  includesAllowances: boolean;
  includesLoadings: boolean;
  
  // Notes/special conditions
  notes: string;
  
  // Last updated
  effectiveDate: string;
}

// Long Service Leave rules by state
export const LSL_STATE_RULES: Record<AustralianState, LSLStateRules> = {
  NSW: {
    state: 'NSW',
    stateName: 'New South Wales',
    accrualStartYears: 0,
    entitlementYears: 10,
    entitlementWeeks: 8.67,
    proRataYears: 5,
    proRataOnResignation: true,
    proRataOnTermination: true,
    additionalWeeksPerYear: 0.867,
    calculationBasis: 'ordinary_pay',
    includesAllowances: true,
    includesLoadings: true,
    notes: 'Covered by Long Service Leave Act 1955. Pro-rata available after 5 years.',
    effectiveDate: '2024-01-01',
  },
  VIC: {
    state: 'VIC',
    stateName: 'Victoria',
    accrualStartYears: 0,
    entitlementYears: 7,
    entitlementWeeks: 6.07,
    proRataYears: 7,
    proRataOnResignation: true,
    proRataOnTermination: true,
    additionalWeeksPerYear: 0.867,
    calculationBasis: 'ordinary_pay',
    includesAllowances: true,
    includesLoadings: true,
    notes: 'Covered by Long Service Leave Act 2018. Earlier entitlement at 7 years.',
    effectiveDate: '2024-01-01',
  },
  QLD: {
    state: 'QLD',
    stateName: 'Queensland',
    accrualStartYears: 0,
    entitlementYears: 10,
    entitlementWeeks: 8.67,
    proRataYears: 7,
    proRataOnResignation: false,
    proRataOnTermination: true,
    additionalWeeksPerYear: 0.867,
    calculationBasis: 'ordinary_pay',
    includesAllowances: false,
    includesLoadings: true,
    notes: 'Covered by Industrial Relations Act 2016. Pro-rata on termination after 7 years.',
    effectiveDate: '2024-01-01',
  },
  SA: {
    state: 'SA',
    stateName: 'South Australia',
    accrualStartYears: 0,
    entitlementYears: 10,
    entitlementWeeks: 13,
    proRataYears: 7,
    proRataOnResignation: true,
    proRataOnTermination: true,
    additionalWeeksPerYear: 1.3,
    calculationBasis: 'ordinary_pay',
    includesAllowances: true,
    includesLoadings: true,
    notes: 'Covered by Long Service Leave Act 1987. Higher entitlement of 13 weeks.',
    effectiveDate: '2024-01-01',
  },
  WA: {
    state: 'WA',
    stateName: 'Western Australia',
    accrualStartYears: 0,
    entitlementYears: 10,
    entitlementWeeks: 8.67,
    proRataYears: 7,
    proRataOnResignation: false,
    proRataOnTermination: true,
    additionalWeeksPerYear: 0.867,
    calculationBasis: 'ordinary_pay',
    includesAllowances: false,
    includesLoadings: true,
    notes: 'Covered by Long Service Leave Act 1958. Pro-rata only on termination.',
    effectiveDate: '2024-01-01',
  },
  TAS: {
    state: 'TAS',
    stateName: 'Tasmania',
    accrualStartYears: 0,
    entitlementYears: 10,
    entitlementWeeks: 8.67,
    proRataYears: 7,
    proRataOnResignation: true,
    proRataOnTermination: true,
    additionalWeeksPerYear: 0.867,
    calculationBasis: 'ordinary_pay',
    includesAllowances: true,
    includesLoadings: true,
    notes: 'Covered by Long Service Leave Act 1976.',
    effectiveDate: '2024-01-01',
  },
  NT: {
    state: 'NT',
    stateName: 'Northern Territory',
    accrualStartYears: 0,
    entitlementYears: 10,
    entitlementWeeks: 13,
    proRataYears: 7,
    proRataOnResignation: true,
    proRataOnTermination: true,
    additionalWeeksPerYear: 1.3,
    calculationBasis: 'ordinary_pay',
    includesAllowances: true,
    includesLoadings: true,
    notes: 'Covered by Long Service Leave Act 1981. 13 weeks entitlement like SA.',
    effectiveDate: '2024-01-01',
  },
  ACT: {
    state: 'ACT',
    stateName: 'Australian Capital Territory',
    accrualStartYears: 0,
    entitlementYears: 7,
    entitlementWeeks: 6.07,
    proRataYears: 5,
    proRataOnResignation: true,
    proRataOnTermination: true,
    additionalWeeksPerYear: 0.867,
    calculationBasis: 'ordinary_pay',
    includesAllowances: true,
    includesLoadings: true,
    notes: 'Covered by Long Service Leave Act 1976. Earlier entitlement at 7 years.',
    effectiveDate: '2024-01-01',
  },
};

// Leave balance record
export interface LeaveBalance {
  id: string;
  staffId: string;
  leaveType: LeaveType;
  
  // Current balance (in hours)
  currentBalanceHours: number;
  
  // Accrued this period
  accruedThisPeriod: number;
  
  // Taken this period
  takenThisPeriod: number;
  
  // Year-to-date
  accruedYTD: number;
  takenYTD: number;
  
  // Opening balance (start of financial year)
  openingBalance: number;
  
  // For LSL: service years
  serviceYears?: number;
  lslState?: AustralianState;
  
  // Monetary value
  valueAtCurrentRate: number;
  
  // Last updated
  lastUpdated: string;
  
  // Calculation audit
  lastCalculationDate: string;
  calculationNotes?: string;
}

// Leave accrual configuration per employee
export interface LeaveAccrualConfig {
  staffId: string;
  employmentBasis: EmploymentBasis;
  
  // Standard hours per week (for pro-rata calculations)
  standardHoursPerWeek: number;
  
  // Actual hours worked per week (average)
  averageHoursPerWeek: number;
  
  // Start date for service calculations
  serviceStartDate: string;
  
  // State for LSL calculations
  state: AustralianState;
  
  // Custom accrual rates (overrides defaults)
  customAnnualLeaveRate?: number;    // hours per year
  customPersonalLeaveRate?: number;  // hours per year
  
  // Casual loading applied (affects leave accrual)
  hasCasualLoading: boolean;
  casualLoadingPercent?: number;
  
  // Leave in advance allowed
  allowLeaveInAdvance: boolean;
  maxAdvanceLeaveHours?: number;
  
  // Last updated
  updatedAt: string;
  updatedBy?: string;
}

// Leave transaction record
export interface LeaveTransaction {
  id: string;
  staffId: string;
  leaveType: LeaveType;
  transactionType: 'accrual' | 'taken' | 'adjustment' | 'payout' | 'forfeit';
  
  // Amount in hours
  hours: number;
  
  // Monetary value
  value: number;
  
  // Balance after transaction
  balanceAfter: number;
  
  // For leave taken
  leaveRequestId?: string;
  startDate?: string;
  endDate?: string;
  
  // Reason/notes
  reason: string;
  
  // Audit
  createdAt: string;
  createdBy: string;
  
  // Pay period reference
  payPeriodId?: string;
}

// NES Minimum Entitlements
export const NES_ENTITLEMENTS = {
  annualLeave: {
    fullTimeHours: 152, // 4 weeks × 38 hours
    accrualRate: 0.07692, // per hour worked (4/52 weeks)
    description: '4 weeks annual leave for full-time employees',
  },
  personalLeave: {
    fullTimeHours: 76, // 10 days × 7.6 hours
    accrualRate: 0.03846, // per hour worked (2/52 weeks)
    description: '10 days personal/carer\'s leave for full-time employees',
  },
  compassionateLeave: {
    daysPerOccasion: 2,
    paid: true,
    description: '2 days per occasion for death or serious illness of immediate family',
  },
  parentalLeave: {
    weeks: 12,
    paid: false, // Government funded separately
    description: '12 months unpaid parental leave',
  },
  communityServiceLeave: {
    description: 'Unpaid leave for voluntary emergency activities, jury duty (first 10 days paid)',
  },
};

// Accrual calculation result
export interface AccrualCalculation {
  staffId: string;
  periodStart: string;
  periodEnd: string;
  hoursWorked: number;
  
  annualLeaveAccrued: number;
  personalLeaveAccrued: number;
  lslAccrued: number;
  
  calculations: {
    leaveType: LeaveType;
    hoursAccrued: number;
    rate: number;
    formula: string;
    notes?: string;
  }[];
}

// Xero leave category mapping
export interface XeroLeaveMapping {
  internalType: LeaveType;
  xeroLeaveTypeId: string;
  xeroLeaveTypeName: string;
  unitType: 'Hours' | 'Days';
  conversionRate: number; // hours per unit
}

// Default Xero mappings
export const DEFAULT_XERO_MAPPINGS: XeroLeaveMapping[] = [
  {
    internalType: 'annual_leave',
    xeroLeaveTypeId: 'annual-leave',
    xeroLeaveTypeName: 'Annual Leave',
    unitType: 'Hours',
    conversionRate: 1,
  },
  {
    internalType: 'personal_leave',
    xeroLeaveTypeId: 'personal-leave',
    xeroLeaveTypeName: 'Personal/Carer\'s Leave',
    unitType: 'Hours',
    conversionRate: 1,
  },
  {
    internalType: 'long_service_leave',
    xeroLeaveTypeId: 'lsl',
    xeroLeaveTypeName: 'Long Service Leave',
    unitType: 'Hours',
    conversionRate: 1,
  },
  {
    internalType: 'compassionate_leave',
    xeroLeaveTypeId: 'compassionate',
    xeroLeaveTypeName: 'Compassionate Leave',
    unitType: 'Days',
    conversionRate: 7.6,
  },
  {
    internalType: 'parental_leave',
    xeroLeaveTypeId: 'parental',
    xeroLeaveTypeName: 'Parental Leave',
    unitType: 'Days',
    conversionRate: 7.6,
  },
  {
    internalType: 'unpaid_leave',
    xeroLeaveTypeId: 'unpaid',
    xeroLeaveTypeName: 'Leave Without Pay',
    unitType: 'Hours',
    conversionRate: 1,
  },
];

// Leave type labels
export const leaveTypeLabels: Record<LeaveType, string> = {
  annual_leave: 'Annual Leave',
  personal_leave: 'Personal/Carer\'s Leave',
  long_service_leave: 'Long Service Leave',
  compassionate_leave: 'Compassionate Leave',
  parental_leave: 'Parental Leave',
  unpaid_leave: 'Leave Without Pay',
  public_holiday: 'Public Holiday',
  jury_duty: 'Jury Duty',
  community_service: 'Community Service Leave',
};

// State labels
export const stateLabels: Record<AustralianState, string> = {
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  SA: 'South Australia',
  WA: 'Western Australia',
  TAS: 'Tasmania',
  NT: 'Northern Territory',
  ACT: 'Australian Capital Territory',
};
