export type AwardType = 
  | 'children_services' 
  | 'hospitality' 
  | 'retail' 
  | 'healthcare' 
  | 'general';

export type AllowanceCategory = 
  | 'shift' 
  | 'clothing' 
  | 'travel' 
  | 'qualification' 
  | 'meal' 
  | 'first_aid' 
  | 'on_call'
  | 'sleepover'
  | 'broken_shift'
  | 'higher_duties'
  | 'other';

// Shift-based allowance trigger types
export type AllowanceTriggerType = 
  | 'manual'           // User adds manually
  | 'shift_type'       // Auto-triggered by shift type (on-call, sleepover, etc.)
  | 'qualification'    // Based on staff qualifications
  | 'role'            // Based on staff role
  | 'time_based'      // Based on shift time/duration
  | 'location';       // Based on work location

export interface AllowanceType {
  id: string;
  code: string;
  name: string;
  description: string;
  category: AllowanceCategory;
  applicableAwards: AwardType[];
  rateType: 'fixed' | 'hourly' | 'daily' | 'per_occurrence' | 'per_km';
  defaultRate: number;
  taxable: boolean;
  superIncluded: boolean;
  // New fields for shift-based detection
  triggerType?: AllowanceTriggerType;
  triggerConditions?: AllowanceTriggerConditions;
  minimumEngagement?: number; // Minimum hours/occurrences to trigger
  maxPerPeriod?: number; // Maximum times claimable per day/week
  requiresApproval?: boolean;
  stackable?: boolean; // Can be combined with other allowances
}

// On-call specific configuration for award settings
export interface OnCallConfiguration {
  standbyRate: number; // Flat rate for being on-call (paid regardless of callback)
  standbyRateType: 'per_period' | 'per_hour' | 'daily'; // How standby is calculated
  callbackMinimumHours: number; // Minimum hours paid when called back (e.g., 2 or 3)
  callbackRateMultiplier: number; // Multiplier for callback pay (e.g., 1.5 for time-and-a-half)
  publicHolidayStandbyMultiplier?: number; // Higher rate for public holiday on-call
  weekendStandbyRate?: number; // Different rate for weekend on-call
  maximumCallbacksPerPeriod?: number; // Maximum separate callbacks in one on-call period
}

// Conditions that trigger automatic allowance application
export interface AllowanceTriggerConditions {
  shiftTypes?: ('on_call' | 'sleepover' | 'broken' | 'recall' | 'emergency')[];
  qualificationTypes?: string[];
  roleTypes?: string[];
  minBreakMinutes?: number; // For broken shift detection
  overnightRequired?: boolean; // For sleepover detection
  recallRequired?: boolean; // For on-call recall
  higherClassification?: boolean; // For higher duties
  travelKilometres?: boolean; // For vehicle allowance
  weekendOnly?: boolean;
  publicHolidayOnly?: boolean;
}

export interface AppliedAllowance {
  id: string;
  allowanceTypeId: string;
  allowanceType: AllowanceType;
  quantity: number;
  rate: number;
  total: number;
  notes?: string;
  entryDate?: string;
  appliedBy?: string;
  appliedAt?: string;
}

// Australian Children's Services Award (MA000120) Allowances
export const CHILDREN_SERVICES_ALLOWANCES: AllowanceType[] = [
  {
    id: 'cs-broken-shift',
    code: 'BROKEN_SHIFT',
    name: 'Broken Shift Allowance',
    description: 'Paid when an employee works two separate shifts in a single day',
    category: 'broken_shift',
    applicableAwards: ['children_services'],
    rateType: 'per_occurrence',
    defaultRate: 18.46,
    taxable: true,
    superIncluded: true,
    triggerType: 'shift_type',
    triggerConditions: {
      shiftTypes: ['broken'],
      minBreakMinutes: 60,
    },
    stackable: true,
  },
  {
    id: 'cs-first-aid',
    code: 'FIRST_AID',
    name: 'First Aid Allowance',
    description: 'For certified first-aiders required to administer first aid to children',
    category: 'first_aid',
    applicableAwards: ['children_services', 'general'],
    rateType: 'daily',
    defaultRate: 3.32,
    taxable: true,
    superIncluded: true,
  },
  {
    id: 'cs-first-aid-osh',
    code: 'FIRST_AID_OSH',
    name: 'First Aid Allowance (Out of School Hours)',
    description: 'Higher rate for first-aiders working out-of-school hours',
    category: 'first_aid',
    applicableAwards: ['children_services'],
    rateType: 'daily',
    defaultRate: 4.15,
    taxable: true,
    superIncluded: true,
  },
  {
    id: 'cs-laundry',
    code: 'LAUNDRY',
    name: 'Laundry Allowance',
    description: 'For employees required to launder their work clothing',
    category: 'clothing',
    applicableAwards: ['children_services', 'general'],
    rateType: 'daily',
    defaultRate: 0.32,
    taxable: true,
    superIncluded: false,
  },
  {
    id: 'cs-laundry-ironing',
    code: 'LAUNDRY_IRONING',
    name: 'Laundry & Ironing Allowance',
    description: 'For employees required to launder and iron their work clothing',
    category: 'clothing',
    applicableAwards: ['children_services'],
    rateType: 'daily',
    defaultRate: 0.65,
    taxable: true,
    superIncluded: false,
  },
  {
    id: 'cs-special-clothing',
    code: 'SPECIAL_CLOTHING',
    name: 'Special Clothing Allowance',
    description: 'Reimbursement for purchasing specialized clothing or protective items',
    category: 'clothing',
    applicableAwards: ['children_services', 'general'],
    rateType: 'per_occurrence',
    defaultRate: 1.87,
    taxable: true,
    superIncluded: false,
  },
  {
    id: 'cs-meal',
    code: 'MEAL',
    name: 'Meal Allowance',
    description: 'When working more than 2 hours overtime with less than 24 hours notice',
    category: 'meal',
    applicableAwards: ['children_services', 'general'],
    rateType: 'per_occurrence',
    defaultRate: 18.83,
    taxable: true,
    superIncluded: false,
  },
  {
    id: 'cs-travel-excess',
    code: 'TRAVEL_EXCESS',
    name: 'Excess Travelling Costs',
    description: 'Compensation for additional travel when working away from usual location',
    category: 'travel',
    applicableAwards: ['children_services', 'general'],
    rateType: 'per_occurrence',
    defaultRate: 0.96,
    taxable: true,
    superIncluded: false,
  },
  {
    id: 'cs-vehicle',
    code: 'VEHICLE',
    name: 'Vehicle Allowance',
    description: 'For using personal vehicle for work duties (per km)',
    category: 'travel',
    applicableAwards: ['children_services', 'general'],
    rateType: 'per_occurrence',
    defaultRate: 0.96,
    taxable: true,
    superIncluded: false,
  },
  {
    id: 'cs-qualification',
    code: 'QUALIFICATION',
    name: 'Qualifications Allowance',
    description: 'For Director/Assistant Director with Graduate Certificate in Childcare Management',
    category: 'qualification',
    applicableAwards: ['children_services'],
    rateType: 'daily',
    defaultRate: 5.79,
    taxable: true,
    superIncluded: true,
  },
  {
    id: 'cs-nqa-leadership',
    code: 'NQA_LEADERSHIP',
    name: 'NQA Leadership Allowance',
    description: 'For Educational Leaders under the National Quality Framework',
    category: 'qualification',
    applicableAwards: ['children_services'],
    rateType: 'daily',
    defaultRate: 7.23,
    taxable: true,
    superIncluded: true,
  },
  {
    id: 'cs-higher-duties',
    code: 'HIGHER_DUTIES',
    name: 'Higher Duties Allowance',
    description: 'When performing duties of a higher classification',
    category: 'higher_duties',
    applicableAwards: ['children_services', 'general'],
    rateType: 'hourly',
    defaultRate: 2.50,
    taxable: true,
    superIncluded: true,
    triggerType: 'shift_type',
    triggerConditions: {
      higherClassification: true,
    },
    requiresApproval: true,
  },
  {
    id: 'cs-sleepover',
    code: 'SLEEPOVER',
    name: 'Sleepover Allowance',
    description: 'For overnight sleepover shifts at the facility',
    category: 'sleepover',
    applicableAwards: ['children_services'],
    rateType: 'per_occurrence',
    defaultRate: 69.85,
    taxable: true,
    superIncluded: false,
    triggerType: 'shift_type',
    triggerConditions: {
      shiftTypes: ['sleepover'],
      overnightRequired: true,
    },
    maxPerPeriod: 1,
  },
  {
    id: 'cs-sleepover-disturbed',
    code: 'SLEEPOVER_DISTURBED',
    name: 'Sleepover Disturbance Allowance',
    description: 'Additional pay when sleepover is disturbed - minimum 1 hour at overtime rates',
    category: 'sleepover',
    applicableAwards: ['children_services'],
    rateType: 'hourly',
    defaultRate: 45.50,
    taxable: true,
    superIncluded: true,
    triggerType: 'shift_type',
    triggerConditions: {
      shiftTypes: ['sleepover'],
    },
    minimumEngagement: 1,
  },
  {
    id: 'cs-on-call',
    code: 'ON_CALL',
    name: 'On Call Allowance',
    description: 'For being available on-call outside regular hours',
    category: 'on_call',
    applicableAwards: ['children_services', 'general'],
    rateType: 'daily',
    defaultRate: 15.42,
    taxable: true,
    superIncluded: false,
    triggerType: 'shift_type',
    triggerConditions: {
      shiftTypes: ['on_call'],
    },
    maxPerPeriod: 1,
  },
  {
    id: 'cs-on-call-recall',
    code: 'ON_CALL_RECALL',
    name: 'On Call Recall Allowance',
    description: 'Minimum 2 hours pay at overtime rates when recalled during on-call period',
    category: 'on_call',
    applicableAwards: ['children_services', 'general'],
    rateType: 'hourly',
    defaultRate: 52.50,
    taxable: true,
    superIncluded: true,
    triggerType: 'shift_type',
    triggerConditions: {
      shiftTypes: ['recall'],
      recallRequired: true,
    },
    minimumEngagement: 2,
  },
];

// Default on-call configuration for different awards
export const DEFAULT_ON_CALL_CONFIGS: Record<AwardType, OnCallConfiguration> = {
  children_services: {
    standbyRate: 15.42,
    standbyRateType: 'per_period',
    callbackMinimumHours: 2,
    callbackRateMultiplier: 1.5,
    publicHolidayStandbyMultiplier: 2.0,
    weekendStandbyRate: 23.13,
    maximumCallbacksPerPeriod: 3,
  },
  healthcare: {
    standbyRate: 18.50,
    standbyRateType: 'per_period',
    callbackMinimumHours: 3,
    callbackRateMultiplier: 1.5,
    publicHolidayStandbyMultiplier: 2.5,
    weekendStandbyRate: 27.75,
    maximumCallbacksPerPeriod: 4,
  },
  hospitality: {
    standbyRate: 12.00,
    standbyRateType: 'per_period',
    callbackMinimumHours: 2,
    callbackRateMultiplier: 1.5,
    publicHolidayStandbyMultiplier: 2.0,
  },
  retail: {
    standbyRate: 10.50,
    standbyRateType: 'per_period',
    callbackMinimumHours: 2,
    callbackRateMultiplier: 1.5,
  },
  general: {
    standbyRate: 15.00,
    standbyRateType: 'per_period',
    callbackMinimumHours: 2,
    callbackRateMultiplier: 1.5,
    publicHolidayStandbyMultiplier: 2.0,
  },
};

// General industry allowances applicable across multiple awards
export const GENERAL_ALLOWANCES: AllowanceType[] = [
  {
    id: 'gen-tool',
    code: 'TOOL',
    name: 'Tool Allowance',
    description: 'For employees required to provide their own tools',
    category: 'other',
    applicableAwards: ['general'],
    rateType: 'daily',
    defaultRate: 2.85,
    taxable: true,
    superIncluded: false,
  },
  {
    id: 'gen-phone',
    code: 'PHONE',
    name: 'Phone Allowance',
    description: 'For using personal phone for work purposes',
    category: 'other',
    applicableAwards: ['general'],
    rateType: 'daily',
    defaultRate: 1.50,
    taxable: true,
    superIncluded: false,
  },
  {
    id: 'gen-uniform',
    code: 'UNIFORM',
    name: 'Uniform Allowance',
    description: 'For purchasing or maintaining required uniforms',
    category: 'clothing',
    applicableAwards: ['general', 'hospitality', 'retail'],
    rateType: 'daily',
    defaultRate: 1.23,
    taxable: true,
    superIncluded: false,
  },
];

// Combined list of all available allowances
export const ALL_ALLOWANCES: AllowanceType[] = [
  ...CHILDREN_SERVICES_ALLOWANCES,
  ...GENERAL_ALLOWANCES,
];

// Award display names
export const AWARD_NAMES: Record<AwardType, string> = {
  children_services: 'Children\'s Services Award (MA000120)',
  hospitality: 'Hospitality Industry Award',
  retail: 'General Retail Industry Award',
  healthcare: 'Health Professionals Award',
  general: 'General Industry',
};

// Helper function to get allowances by award
export function getAllowancesByAward(award: AwardType): AllowanceType[] {
  return ALL_ALLOWANCES.filter(a => a.applicableAwards.includes(award));
}

// Helper function to calculate allowance total
export function calculateAllowanceTotal(allowances: AppliedAllowance[]): number {
  return allowances.reduce((sum, a) => sum + a.total, 0);
}

// Helper to format rate display
export function formatAllowanceRate(allowance: AllowanceType): string {
  const rate = `$${allowance.defaultRate.toFixed(2)}`;
  switch (allowance.rateType) {
    case 'hourly':
      return `${rate}/hr`;
    case 'daily':
      return `${rate}/day`;
    case 'per_occurrence':
      return `${rate}/each`;
    default:
      return rate;
  }
}
