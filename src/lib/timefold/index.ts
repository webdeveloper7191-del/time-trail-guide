/**
 * Timefold Solver Integration Module
 * 
 * Exports all Timefold-related types, constraints, and utilities
 * for AI-powered shift optimization.
 */

// Core Timefold types and functions
export * from '../timefoldSolver';

// Childcare-specific constraints - exported with namespace prefix
export {
  allChildcareConstraints,
  childcareCategoryWeights,
  childcarePresets,
  nqfRatioConstraints,
  qualificationConstraints as childcareQualificationConstraints,
  availabilityConstraints as childcareAvailabilityConstraints,
  complianceConstraints as childcareComplianceConstraints,
  qualityConstraints as childcareQualityConstraints,
  demandConstraints,
  budgetConstraints as childcareBudgetConstraints,
  awardConstraints,
  fairnessConstraints as childcareFairnessConstraints,
} from './childcareConstraints';

// Aged care-specific constraints - exported with namespace prefix
export {
  allAgedCareConstraints,
  agedCareCategoryWeights,
  agedCarePresets,
  agedCareConstraintGroups,
  rnCoverageConstraints,
  qualificationConstraints as agedCareQualificationConstraints,
  skillsMixConstraints,
  availabilityConstraints as agedCareAvailabilityConstraints,
  complianceConstraints as agedCareComplianceConstraints,
  qualityConstraints as agedCareQualityConstraints,
  careMinuteTrackingConstraints,
  budgetConstraints as agedCareBudgetConstraints,
  fairnessConstraints as agedCareFairnessConstraints,
  calculateCareMinuteCompliance,
} from './agedCareConstraints';

// Industry configurations
export * from './industryConstraints';
