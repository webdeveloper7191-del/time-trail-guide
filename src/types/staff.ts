export type EmploymentStatus = 'active' | 'inactive' | 'onboarding' | 'terminated';
export type PayRateType = 'hourly' | 'salary' | 'award';
export type EmploymentType = 'full_time' | 'part_time' | 'casual' | 'contractor';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface Address {
  line1: string;
  line2?: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
}

export interface BankDetails {
  accountName: string;
  bsb: string;
  accountNumber: string;
  superFundName?: string;
  superMemberNumber?: string;
}

export interface PayCondition {
  id: string;
  effectiveFrom: string;
  effectiveTo?: string;
  position: string;
  payRateType: PayRateType;
  hourlyRate: number;
  annualSalary?: number;
  industryAward?: string;
  employmentType: EmploymentType;
  classification?: string;
  payPeriod: 'weekly' | 'fortnightly' | 'monthly';
  contractedHours?: number;
}

export interface Allowance {
  id: string;
  name: string;
  type: 'fixed' | 'per_hour' | 'per_shift' | 'per_km';
  amount: number;
  taxable: boolean;
  superGuarantee: boolean;
}

export interface AwardRule {
  id: string;
  awardName: string;
  classification: string;
  level: string;
  baseHourlyRate: number;
  casualLoading?: number;
  saturdayRate?: number;
  sundayRate?: number;
  publicHolidayRate?: number;
  overtimeRates: {
    first2Hours: number;
    after2Hours: number;
  };
  penaltyRates?: {
    evening?: number;
    night?: number;
    earlyMorning?: number;
  };
  allowances: Allowance[];
}

export interface WeeklyAvailability {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  area?: string;
}

export interface StaffMember {
  id: string;
  // Personal Details
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  email: string;
  mobilePhone: string;
  workPhone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  avatar?: string;
  
  // Employment
  employeeId: string;
  employmentStartDate: string;
  employmentEndDate?: string;
  status: EmploymentStatus;
  department?: string;
  position: string;
  locations: string[];
  
  // Address
  address?: Address;
  
  // Bank & Super
  bankDetails?: BankDetails;
  taxFileNumber?: string;
  
  // Pay Conditions
  currentPayCondition?: PayCondition;
  payConditionHistory: PayCondition[];
  
  // Award Rules
  applicableAward?: AwardRule;
  customAllowances: Allowance[];
  
  // Availability
  weeklyAvailability: WeeklyAvailability[];
  availabilityPattern: 'same_every_week' | 'alternate_weekly';
  
  // Other
  timeClockPasscode?: string;
  payrollId?: string;
  emergencyContacts: EmergencyContact[];
  notes?: string;
  
  // Qualifications
  qualifications: string[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface StaffFilters {
  search: string;
  status: EmploymentStatus | 'all';
  employmentType: EmploymentType | 'all';
  location: string | 'all';
  department: string | 'all';
}

// Label mappings
export const employmentStatusLabels: Record<EmploymentStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  onboarding: 'Onboarding',
  terminated: 'Terminated',
};

export const employmentTypeLabels: Record<EmploymentType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  casual: 'Casual',
  contractor: 'Contractor',
};

export const payRateTypeLabels: Record<PayRateType, string> = {
  hourly: 'Hourly Rate',
  salary: 'Annual Salary',
  award: 'Award Rate',
};

export const genderLabels: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};
