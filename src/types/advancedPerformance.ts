// Advanced Performance Management Types

// ============ 360° Feedback System ============
export type FeedbackSourceType = 'self' | 'manager' | 'peer' | 'direct_report' | 'cross_functional' | 'external';
export type Feedback360Status = 'draft' | 'pending' | 'in_progress' | 'completed' | 'expired';

export interface Feedback360Request {
  id: string;
  subjectStaffId: string; // Person being reviewed
  requesterId: string; // Manager who initiated
  reviewCycleId?: string;
  title: string;
  description?: string;
  dueDate: string;
  status: Feedback360Status;
  anonymousResponses: boolean;
  selfAssessmentCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback360Response {
  id: string;
  requestId: string;
  responderId: string;
  sourceType: FeedbackSourceType;
  isAnonymous: boolean;
  status: 'pending' | 'completed' | 'declined';
  ratings: Feedback360Rating[];
  strengths?: string;
  areasForImprovement?: string;
  additionalComments?: string;
  submittedAt?: string;
  createdAt: string;
}

export interface Feedback360Rating {
  competencyId: string;
  rating: number; // 1-5
  comments?: string;
}

export interface Feedback360Competency {
  id: string;
  name: string;
  description: string;
  category: string;
}

// ============ 9-Box Talent Grid ============
export type PerformanceLevel = 'low' | 'medium' | 'high';
export type PotentialLevel = 'low' | 'medium' | 'high';

export interface TalentAssessment {
  id: string;
  staffId: string;
  assessorId: string;
  assessmentDate: string;
  performanceLevel: PerformanceLevel;
  potentialLevel: PotentialLevel;
  performanceScore: number; // 1-5
  potentialScore: number; // 1-5
  notes?: string;
  developmentRecommendations?: string[];
  flightRisk: 'low' | 'medium' | 'high';
  readiness: 'ready_now' | 'ready_1_year' | 'ready_2_years' | 'not_ready';
  createdAt: string;
  updatedAt: string;
}

export interface NineBoxPosition {
  performance: PerformanceLevel;
  potential: PotentialLevel;
  label: string;
  description: string;
  color: string;
  recommendations: string[];
}

// ============ Skills Matrix & Career Pathing ============
export type SkillLevel = 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  isCore: boolean; // Core competency vs nice-to-have
}

export interface StaffSkill {
  skillId: string;
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  lastAssessedAt: string;
  certifications?: string[];
  notes?: string;
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  currentLevel: SkillLevel;
  requiredLevel: SkillLevel;
  gapSize: number; // 0-4
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CareerPath {
  id: string;
  name: string;
  description: string;
  levels: CareerLevel[];
}

export interface CareerLevel {
  id: string;
  title: string;
  level: number;
  requiredSkills: { skillId: string; minLevel: SkillLevel }[];
  requiredExperienceYears: number;
  typicalSalaryRange?: { min: number; max: number };
}

export interface StaffCareerProgress {
  staffId: string;
  currentPathId: string;
  currentLevelId: string;
  targetLevelId?: string;
  skillGaps: SkillGap[];
  readinessPercentage: number;
  estimatedTimeToNextLevel?: string; // e.g., "6-12 months"
}

// ============ Pulse Surveys & eNPS ============
export type PulseSurveyFrequency = 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly';
export type PulseSurveyStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface PulseSurvey {
  id: string;
  title: string;
  questions: PulseQuestion[];
  frequency: PulseSurveyFrequency;
  status: PulseSurveyStatus;
  targetAudience: 'all' | 'department' | 'team';
  targetIds?: string[]; // Department or team IDs
  anonymousResponses: boolean;
  startDate: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PulseQuestion {
  id: string;
  text: string;
  type: 'rating' | 'enps' | 'text' | 'yes_no';
  category: 'engagement' | 'satisfaction' | 'culture' | 'leadership' | 'workload' | 'growth';
  required: boolean;
}

export interface PulseResponse {
  id: string;
  surveyId: string;
  responderId?: string; // null if anonymous
  responses: { questionId: string; value: string | number }[];
  submittedAt: string;
}

export interface ENPSResult {
  period: string;
  score: number; // -100 to 100
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
  responseRate: number;
  trend: 'up' | 'down' | 'stable';
  previousScore?: number;
}

// ============ Wellbeing & Burnout Indicators ============
export type WellbeingRiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface WellbeingIndicator {
  id: string;
  staffId: string;
  periodStart: string;
  periodEnd: string;
  overtimeHours: number;
  averageWorkdayLength: number;
  consecutiveWorkDays: number;
  leaveBalance: number;
  lastLeaveDate?: string;
  daysSinceLastLeave: number;
  missedBreaks: number;
  afterHoursMessages: number;
  workloadScore: number; // 1-10
  engagementScore: number; // 1-10
  riskLevel: WellbeingRiskLevel;
  riskFactors: string[];
  recommendations: string[];
  createdAt: string;
}

export interface WellbeingCheckIn {
  id: string;
  staffId: string;
  date: string;
  energyLevel: number; // 1-5
  stressLevel: number; // 1-5
  workLifeBalance: number; // 1-5
  notes?: string;
  createdAt: string;
}

export interface TeamWellbeingSummary {
  departmentId?: string;
  period: string;
  totalStaff: number;
  lowRiskCount: number;
  moderateRiskCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  averageWorkloadScore: number;
  averageEngagementScore: number;
  topRiskFactors: { factor: string; count: number }[];
}

// ============ Calibration Sessions ============
export type CalibrationStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface CalibrationSession {
  id: string;
  title: string;
  reviewCycle: string;
  facilitatorId: string;
  participantIds: string[]; // Managers participating
  status: CalibrationStatus;
  scheduledDate: string;
  completedAt?: string;
  department?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalibrationRating {
  id: string;
  sessionId: string;
  staffId: string;
  originalRating: number;
  calibratedRating?: number;
  ratingJustification?: string;
  discussionNotes?: string;
  adjustedBy?: string;
  adjustedAt?: string;
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
  expectedPercentage: number; // Based on bell curve
  variance: number;
}

// ============ Label Mappings ============
export const feedbackSourceLabels: Record<FeedbackSourceType, string> = {
  self: 'Self Assessment',
  manager: 'Manager',
  peer: 'Peer',
  direct_report: 'Direct Report',
  cross_functional: 'Cross-Functional',
  external: 'External Stakeholder',
};

export const feedback360StatusLabels: Record<Feedback360Status, string> = {
  draft: 'Draft',
  pending: 'Pending Responses',
  in_progress: 'In Progress',
  completed: 'Completed',
  expired: 'Expired',
};

export const skillLevelLabels: Record<SkillLevel, string> = {
  none: 'None',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export const skillLevelValues: Record<SkillLevel, number> = {
  none: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

export const wellbeingRiskLabels: Record<WellbeingRiskLevel, string> = {
  low: 'Low Risk',
  moderate: 'Moderate Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
};

// 9-Box Grid Configuration
export const nineBoxPositions: NineBoxPosition[] = [
  { performance: 'low', potential: 'high', label: 'Enigma', description: 'High potential but underperforming', color: 'amber', recommendations: ['Coaching', 'Role clarification', 'Skill development'] },
  { performance: 'medium', potential: 'high', label: 'Growth Employee', description: 'Good performer with high potential', color: 'lime', recommendations: ['Stretch assignments', 'Mentoring', 'Leadership exposure'] },
  { performance: 'high', potential: 'high', label: 'Star', description: 'Top performer with high potential', color: 'emerald', recommendations: ['Succession planning', 'Executive exposure', 'Retention focus'] },
  { performance: 'low', potential: 'medium', label: 'Dilemma', description: 'Inconsistent performance', color: 'orange', recommendations: ['Performance plan', 'Skills assessment', 'Role fit evaluation'] },
  { performance: 'medium', potential: 'medium', label: 'Core Player', description: 'Solid contributor', color: 'blue', recommendations: ['Recognition', 'Incremental development', 'Expertise building'] },
  { performance: 'high', potential: 'medium', label: 'High Performer', description: 'Strong performer, steady potential', color: 'cyan', recommendations: ['Expertise roles', 'Knowledge transfer', 'Spot bonuses'] },
  { performance: 'low', potential: 'low', label: 'Underperformer', description: 'Not meeting expectations', color: 'red', recommendations: ['Performance improvement plan', 'Clear expectations', 'Consider role change'] },
  { performance: 'medium', potential: 'low', label: 'Effective', description: 'Adequate performance', color: 'slate', recommendations: ['Maintain engagement', 'Process improvement', 'Technical training'] },
  { performance: 'high', potential: 'low', label: 'Trusted Professional', description: 'Reliable expert in role', color: 'violet', recommendations: ['Subject matter expert role', 'Mentoring others', 'Retention strategies'] },
];
