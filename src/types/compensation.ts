// Compensation & Salary Types

export type SalaryBandLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'principal' | 'executive';

export interface SalaryBand {
  id: string;
  level: SalaryBandLevel;
  title: string;
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  currency: string;
  department?: string;
  effectiveDate: string;
}

export interface EmployeeCompensation {
  id: string;
  staffId: string;
  currentSalary: number;
  salaryBandId: string;
  compaRatio: number; // current salary / mid-point (1.0 = at mid)
  lastReviewDate: string;
  lastIncreaseDate?: string;
  lastIncreasePercent?: number;
  bonusTarget?: number; // percentage of salary
  stockOptions?: number;
  currency: string;
}

// Merit increase matrix based on performance rating
export interface MeritMatrix {
  id: string;
  name: string;
  effectiveYear: number;
  budget: number; // total budget percentage
  matrix: MeritMatrixCell[];
}

export interface MeritMatrixCell {
  performanceRating: number; // 1-5
  compaRatioRange: 'below' | 'at' | 'above'; // below 0.9, 0.9-1.1, above 1.1
  recommendedIncrease: number; // percentage
  minIncrease: number;
  maxIncrease: number;
}

export interface MeritRecommendation {
  id: string;
  staffId: string;
  cycleYear: number;
  performanceRating: number;
  currentSalary: number;
  currentCompaRatio: number;
  recommendedIncreasePercent: number;
  recommendedNewSalary: number;
  managerAdjustedPercent?: number;
  managerAdjustedSalary?: number;
  justification?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  approvedBy?: string;
  approvedAt?: string;
  effectiveDate?: string;
}

// Bonus calculation
export type BonusType = 'annual' | 'quarterly' | 'spot' | 'retention' | 'signing';

export interface BonusCalculation {
  id: string;
  staffId: string;
  bonusType: BonusType;
  cycleYear: number;
  cyclePeriod?: string; // Q1, Q2, etc. for quarterly
  targetPercent: number;
  performanceMultiplier: number; // based on rating (0.5 - 1.5)
  companyMultiplier: number; // based on company performance
  individualMultiplier: number; // manager discretion
  calculatedAmount: number;
  finalAmount?: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'paid';
  paidDate?: string;
}

// Performance to Compensation Mapping
export const performanceToMeritMultiplier: Record<number, number> = {
  1: 0, // Does not meet expectations - no increase
  2: 0.5, // Partially meets
  3: 1.0, // Meets expectations
  4: 1.25, // Exceeds
  5: 1.5, // Exceptional
};

export const performanceToBonusMultiplier: Record<number, number> = {
  1: 0, // No bonus
  2: 0.5, // 50% of target
  3: 1.0, // 100% of target
  4: 1.25, // 125% of target
  5: 1.5, // 150% of target
};

export const salaryBandLevelLabels: Record<SalaryBandLevel, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior',
  lead: 'Lead',
  principal: 'Principal',
  executive: 'Executive',
};

export const bonusTypeLabels: Record<BonusType, string> = {
  annual: 'Annual Bonus',
  quarterly: 'Quarterly Bonus',
  spot: 'Spot Bonus',
  retention: 'Retention Bonus',
  signing: 'Signing Bonus',
};

// PIP (Performance Improvement Plan) Types

export type PIPStatus = 'draft' | 'active' | 'extended' | 'completed_success' | 'completed_failure' | 'cancelled';
export type PIPOutcome = 'improved' | 'extended' | 'terminated' | 'resigned' | 'pending';

export interface PIPMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'missed';
  evidence?: string;
  managerNotes?: string;
}

export interface PIPCheckIn {
  id: string;
  scheduledDate: string;
  completedDate?: string;
  attendees: string[];
  notes: string;
  progressRating: number; // 1-5
  concerns?: string;
  nextSteps?: string;
  createdBy: string;
}

export interface PIPDocument {
  id: string;
  type: 'initial_notice' | 'extension' | 'check_in_notes' | 'outcome_letter' | 'supporting_evidence';
  title: string;
  uploadedAt: string;
  uploadedBy: string;
  fileUrl?: string;
  notes?: string;
}

export interface PerformanceImprovementPlan {
  id: string;
  staffId: string;
  managerId: string;
  hrPartnerId?: string;
  status: PIPStatus;
  reason: string;
  performanceGaps: string[];
  expectedOutcomes: string[];
  supportProvided: string[];
  startDate: string;
  originalEndDate: string;
  currentEndDate: string; // may be extended
  extensionCount: number;
  milestones: PIPMilestone[];
  checkIns: PIPCheckIn[];
  documents: PIPDocument[];
  outcome?: PIPOutcome;
  outcomeDate?: string;
  outcomeNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export const pipStatusLabels: Record<PIPStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  extended: 'Extended',
  completed_success: 'Completed - Success',
  completed_failure: 'Completed - Unsuccessful',
  cancelled: 'Cancelled',
};

export const pipOutcomeLabels: Record<PIPOutcome, string> = {
  improved: 'Performance Improved',
  extended: 'Plan Extended',
  terminated: 'Employment Terminated',
  resigned: 'Employee Resigned',
  pending: 'Pending Outcome',
};

// Succession Planning Types

export type ReadinessLevel = 'ready_now' | 'ready_1_2_years' | 'ready_3_5_years' | 'not_ready';
export type SuccessionRisk = 'low' | 'medium' | 'high' | 'critical';

export interface KeyRole {
  id: string;
  title: string;
  department: string;
  currentHolderId?: string;
  criticality: 'essential' | 'important' | 'standard';
  vacancyRisk: SuccessionRisk;
  impactOfVacancy: string;
  requiredCompetencies: string[];
  successorCount: number;
  lastReviewedAt: string;
}

export interface SuccessionCandidate {
  id: string;
  staffId: string;
  keyRoleId: string;
  readiness: ReadinessLevel;
  overallScore: number; // 0-100
  performanceScore: number;
  potentialScore: number;
  experienceScore: number;
  competencyGaps: CompetencyGap[];
  developmentActions: DevelopmentAction[];
  mentorId?: string;
  notes?: string;
  addedAt: string;
  lastAssessedAt: string;
}

export interface CompetencyGap {
  id: string;
  competency: string;
  currentLevel: number; // 1-5
  requiredLevel: number; // 1-5
  gap: number;
  developmentPriority: 'low' | 'medium' | 'high';
}

export interface DevelopmentAction {
  id: string;
  title: string;
  type: 'training' | 'project' | 'mentoring' | 'stretch_assignment' | 'external_course';
  description: string;
  targetDate: string;
  completedDate?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  linkedLearningPathId?: string;
}

export interface SuccessionPipeline {
  keyRole: KeyRole;
  candidates: SuccessionCandidate[];
  readyNowCount: number;
  benchStrength: number; // percentage of ready candidates
}

export const readinessLabels: Record<ReadinessLevel, string> = {
  ready_now: 'Ready Now',
  ready_1_2_years: 'Ready in 1-2 Years',
  ready_3_5_years: 'Ready in 3-5 Years',
  not_ready: 'Not Ready',
};

export const successionRiskLabels: Record<SuccessionRisk, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
};

export const readinessColors: Record<ReadinessLevel, string> = {
  ready_now: '#22c55e',
  ready_1_2_years: '#3b82f6',
  ready_3_5_years: '#f59e0b',
  not_ready: '#ef4444',
};
