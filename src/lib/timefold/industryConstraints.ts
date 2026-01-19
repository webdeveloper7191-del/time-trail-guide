/**
 * Industry-Specific Constraint Configurations for Timefold Solver
 * 
 * This module provides constraint presets for different industries,
 * allowing the solver to be configured appropriately based on
 * regulatory requirements and business needs.
 */

import { TimefoldConstraint, TimefoldSolverConfig, defaultSolverConfig } from '../timefoldSolver';
import { 
  allChildcareConstraints, 
  childcareCategoryWeights, 
  childcarePresets 
} from './childcareConstraints';
import {
  allAgedCareConstraints,
  agedCareCategoryWeights,
  agedCarePresets,
} from './agedCareConstraints';

// ============================================================================
// INDUSTRY TYPES
// ============================================================================

export type IndustryType = 
  | 'childcare'
  | 'aged_care'
  | 'disability_services'
  | 'hospitality'
  | 'retail'
  | 'healthcare'
  | 'education'
  | 'general';

export interface IndustryConfig {
  id: IndustryType;
  name: string;
  description: string;
  applicableAwards: string[];
  defaultConstraints: TimefoldConstraint[];
  categoryWeights: Record<string, number>;
  presets: Record<string, {
    name: string;
    description: string;
    categoryWeights: Record<string, number>;
  }>;
  regulatoryNotes: string[];
}

// ============================================================================
// CHILDCARE INDUSTRY CONFIG
// ============================================================================

export const childcareConfig: IndustryConfig = {
  id: 'childcare',
  name: 'Early Childhood Education & Care',
  description: 'Long day care, family day care, preschools, and outside school hours care',
  applicableAwards: [
    "Children's Services Award 2020",
    "Educational Services (Teachers) Award 2020",
  ],
  defaultConstraints: allChildcareConstraints,
  categoryWeights: childcareCategoryWeights,
  presets: childcarePresets,
  regulatoryNotes: [
    'National Quality Framework (NQF) ratios must be maintained at all times',
    'Minimum 50% of educators must hold approved qualification (Diploma+)',
    'Responsible Person must be present during all operating hours',
    'Working With Children Check required for all staff',
    'First Aid, CPR, Anaphylaxis and Asthma training required',
    'Early Childhood Teacher requirements based on service size',
  ],
};

// ============================================================================
// AGED CARE INDUSTRY CONFIG
// ============================================================================

export const agedCareConfig: IndustryConfig = {
  id: 'aged_care',
  name: 'Residential Aged Care',
  description: 'Residential aged care facilities, nursing homes, and home care services',
  applicableAwards: [
    'Aged Care Award 2010',
    'Nurses Award 2020',
  ],
  defaultConstraints: allAgedCareConstraints,
  categoryWeights: agedCareCategoryWeights,
  presets: agedCarePresets,
  regulatoryNotes: [
    'Registered Nurse must be on-site 24 hours a day, 7 days a week',
    'Minimum 215 care minutes per resident per day (AN-ACC)',
    'Minimum 44 RN minutes per resident per day',
    'AHPRA registration required for all nurses',
    'Skills mix requirements (RN, EN, PCW ratios)',
    'Medication competency required for medication administration',
    'Staffing affects Aged Care Quality Star Ratings',
  ],
};

// ============================================================================
// FUTURE INDUSTRY CONFIGS (PLACEHOLDER)
// ============================================================================

export const disabilityServicesConfig: IndustryConfig = {
  id: 'disability_services',
  name: 'Disability Services',
  description: 'NDIS providers and disability support services',
  applicableAwards: [
    'SCHADS Award 2010',
  ],
  defaultConstraints: [], // To be implemented
  categoryWeights: {
    availability: 100,
    qualification: 90,
    capacity: 85,
    compliance: 95,
    fairness: 55,
    cost: 50,
    preference: 45,
    continuity: 80,
  },
  presets: {},
  regulatoryNotes: [
    'NDIS Worker Screening Check required',
    'Participant-to-support worker ratios vary by support needs',
    'Sleepover and on-call arrangements per SCHADS',
  ],
};

export const hospitalityConfig: IndustryConfig = {
  id: 'hospitality',
  name: 'Hospitality',
  description: 'Hotels, restaurants, cafes, and catering services',
  applicableAwards: [
    'Hospitality Industry (General) Award 2020',
  ],
  defaultConstraints: [], // To be implemented
  categoryWeights: {
    availability: 100,
    qualification: 70,
    capacity: 85,
    compliance: 85,
    fairness: 50,
    cost: 70,
    preference: 35,
    continuity: 30,
  },
  presets: {},
  regulatoryNotes: [
    'RSA certification for alcohol service',
    'Food safety certification requirements',
    'Penalty rates for weekends and public holidays',
  ],
};

export const retailConfig: IndustryConfig = {
  id: 'retail',
  name: 'Retail',
  description: 'General retail stores and shopping centres',
  applicableAwards: [
    'General Retail Industry Award 2020',
  ],
  defaultConstraints: [], // To be implemented
  categoryWeights: {
    availability: 100,
    qualification: 60,
    capacity: 80,
    compliance: 80,
    fairness: 55,
    cost: 75,
    preference: 40,
    continuity: 25,
  },
  presets: {},
  regulatoryNotes: [
    'Trading hours restrictions by state',
    'Public holiday penalty rates',
    'Junior rates and minimum shift lengths',
  ],
};

// ============================================================================
// INDUSTRY REGISTRY
// ============================================================================

export const industryConfigs: Record<IndustryType, IndustryConfig> = {
  childcare: childcareConfig,
  aged_care: agedCareConfig,
  disability_services: disabilityServicesConfig,
  hospitality: hospitalityConfig,
  retail: retailConfig,
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Hospitals, clinics, and medical practices',
    applicableAwards: ['Nurses Award 2020', 'Health Professionals Award 2020'],
    defaultConstraints: [],
    categoryWeights: {},
    presets: {},
    regulatoryNotes: [],
  },
  education: {
    id: 'education',
    name: 'Education',
    description: 'Schools and educational institutions',
    applicableAwards: ['Educational Services (Teachers) Award 2020'],
    defaultConstraints: [],
    categoryWeights: {},
    presets: {},
    regulatoryNotes: [],
  },
  general: {
    id: 'general',
    name: 'General',
    description: 'General business operations',
    applicableAwards: ['Clerks Award 2020'],
    defaultConstraints: [],
    categoryWeights: {},
    presets: {},
    regulatoryNotes: [],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getIndustryConfig(industry: IndustryType): IndustryConfig {
  return industryConfigs[industry] || industryConfigs.general;
}

export function getIndustryConstraints(industry: IndustryType): TimefoldConstraint[] {
  const config = getIndustryConfig(industry);
  if (config.defaultConstraints.length > 0) {
    return config.defaultConstraints;
  }
  // Fall back to default constraints if industry-specific not available
  return defaultSolverConfig.constraints;
}

export function getIndustrySolverConfig(industry: IndustryType): TimefoldSolverConfig {
  const config = getIndustryConfig(industry);
  
  return {
    terminationTimeSeconds: 30,
    moveThreadCount: 4,
    categoryWeights: config.categoryWeights as any,
    constraints: config.defaultConstraints.length > 0 
      ? config.defaultConstraints 
      : defaultSolverConfig.constraints,
    optimizationGoal: 'balanced',
  };
}

export function listAvailableIndustries(): { id: IndustryType; name: string; description: string; isImplemented: boolean }[] {
  return Object.entries(industryConfigs).map(([id, config]) => ({
    id: id as IndustryType,
    name: config.name,
    description: config.description,
    isImplemented: config.defaultConstraints.length > 0,
  }));
}

export function getIndustryPresets(industry: IndustryType): Record<string, { name: string; description: string }> {
  const config = getIndustryConfig(industry);
  return Object.fromEntries(
    Object.entries(config.presets).map(([key, preset]) => [
      key,
      { name: preset.name, description: preset.description }
    ])
  );
}
