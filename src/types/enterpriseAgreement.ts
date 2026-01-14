/**
 * Enterprise Agreement Types
 * Supports EBAs alongside Modern Awards with custom rate structures
 */

import { AustralianState } from './leaveAccrual';

// Agreement types
export type AgreementType = 'modern_award' | 'enterprise_agreement' | 'individual_flexibility';

// Agreement status
export type AgreementStatus = 'active' | 'expired' | 'pending_approval' | 'superseded';

// Enterprise Agreement definition
export interface EnterpriseAgreement {
  id: string;
  name: string;
  code: string;
  
  // Type classification
  type: AgreementType;
  
  // Status
  status: AgreementStatus;
  
  // Coverage
  coverageDescription: string;
  applicableStates: AustralianState[];
  industryClassifications: string[];
  
  // Dates
  approvalDate: string;
  commencementDate: string;
  nominalExpiryDate: string;
  
  // Fair Work Commission reference
  fwcReference?: string;
  fwcApprovalNumber?: string;
  
  // Base Modern Award (BOOT test reference)
  underlyingAwardId?: string;
  underlyingAwardName?: string;
  
  // Classification structure
  classifications: EBAClassification[];
  
  // Pay rates (may differ from underlying award)
  payRates: EBAPayRate[];
  
  // Allowances specific to this EBA
  allowances: EBAAllowance[];
  
  // Penalty rates
  penaltyRates: EBAPenaltyRates;
  
  // Leave entitlements (may exceed NES)
  leaveEntitlements: EBALeaveEntitlement[];
  
  // Superannuation
  superannuationRate: number; // percentage
  
  // Redundancy provisions
  redundancyScale?: EBARedundancyScale[];
  
  // Other conditions
  conditions: EBACondition[];
  
  // Version tracking
  version: string;
  previousVersionId?: string;
  
  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Notes
  notes?: string;
}

// EBA Classification
export interface EBAClassification {
  id: string;
  code: string;
  name: string;
  description: string;
  level: number;
  
  // Minimum qualifications
  requiredQualifications?: string[];
  
  // Experience requirements
  minExperienceMonths?: number;
  
  // Mapped to Modern Award classification (for comparison)
  mappedAwardClassification?: string;
}

// EBA Pay Rate
export interface EBAPayRate {
  id: string;
  classificationId: string;
  
  // Rate type
  rateType: 'hourly' | 'annual' | 'weekly';
  
  // Base rate
  baseRate: number;
  
  // Effective dates
  effectiveFrom: string;
  effectiveTo?: string;
  
  // Annual increase provisions
  annualIncreasePercent?: number;
  nextIncreaseDate?: string;
  
  // Notes
  notes?: string;
}

// EBA Allowance
export interface EBAAllowance {
  id: string;
  name: string;
  code: string;
  description: string;
  
  // Amount and frequency
  amount: number;
  frequency: 'per_hour' | 'per_shift' | 'per_week' | 'per_annum' | 'per_occurrence';
  
  // Conditions for payment
  conditions?: string;
  
  // Taxable
  isTaxable: boolean;
  
  // Super applicable
  isSuperApplicable: boolean;
  
  // Xero mapping
  xeroEarningsTypeId?: string;
}

// EBA Penalty Rates
export interface EBAPenaltyRates {
  saturdayMultiplier: number;
  sundayMultiplier: number;
  publicHolidayMultiplier: number;
  
  eveningShift?: {
    startTime: string;
    endTime: string;
    multiplier: number;
  };
  
  nightShift?: {
    startTime: string;
    endTime: string;
    multiplier: number;
  };
  
  overtime: {
    first2Hours: number;      // multiplier
    after2Hours: number;      // multiplier
    sundayOvertime?: number;  // multiplier
    publicHolidayOvertime?: number;
  };
  
  casualLoading: number;      // percentage
}

// EBA Leave Entitlement
export interface EBALeaveEntitlement {
  leaveType: string;
  entitlementDays: number;     // per year
  accrualMethod: 'progressive' | 'anniversary' | 'immediate';
  
  // Enhanced conditions
  conditions?: string;
  
  // Above NES?
  exceedsNES: boolean;
  nesEntitlementDays?: number;
}

// EBA Redundancy Scale
export interface EBARedundancyScale {
  yearsOfService: number;      // minimum years
  weeksPayEntitlement: number;
  
  // Enhanced conditions
  conditions?: string;
}

// EBA Condition
export interface EBACondition {
  id: string;
  category: 'hours' | 'breaks' | 'rosters' | 'consultation' | 'dispute' | 'other';
  title: string;
  description: string;
  clauseReference?: string;
}

// Multi-Award Employee configuration
export interface MultiAwardEmployee {
  staffId: string;
  
  // Primary agreement (default for calculations)
  primaryAgreementId: string;
  primaryAgreementType: AgreementType;
  
  // Additional agreements that may apply
  additionalAgreements: {
    agreementId: string;
    agreementType: AgreementType;
    applicableConditions: string[];
    priority: number; // lower = higher priority
  }[];
  
  // Classification in each agreement
  classifications: {
    agreementId: string;
    classificationId: string;
    classificationName: string;
    effectiveFrom: string;
  }[];
  
  // Notes
  notes?: string;
  
  // Audit
  updatedAt: string;
  updatedBy: string;
}

// Agreement comparison result
export interface AgreementComparison {
  baseAgreementId: string;
  comparisonAgreementId: string;
  
  classificationMapping: {
    baseClassificationId: string;
    comparisonClassificationId: string;
    baseRate: number;
    comparisonRate: number;
    difference: number;
    differencePercent: number;
  }[];
  
  allowanceComparison: {
    allowanceName: string;
    baseAmount?: number;
    comparisonAmount?: number;
    difference: number;
  }[];
  
  penaltyComparison: {
    penaltyType: string;
    baseMultiplier: number;
    comparisonMultiplier: number;
    difference: number;
  }[];
  
  leaveComparison: {
    leaveType: string;
    baseDays: number;
    comparisonDays: number;
    difference: number;
  }[];
  
  // Overall assessment
  overallDifference: 'base_better' | 'comparison_better' | 'equivalent';
  notes: string[];
}

// Agreement type labels
export const agreementTypeLabels: Record<AgreementType, string> = {
  modern_award: 'Modern Award',
  enterprise_agreement: 'Enterprise Agreement',
  individual_flexibility: 'Individual Flexibility Arrangement',
};

// Agreement status labels
export const agreementStatusLabels: Record<AgreementStatus, string> = {
  active: 'Active',
  expired: 'Expired',
  pending_approval: 'Pending Approval',
  superseded: 'Superseded',
};
