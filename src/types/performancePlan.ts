// Performance Plan Types

export type PlanType = 
  | 'onboarding' 
  | 'probation' 
  | 'annual_development' 
  | 'performance_improvement' 
  | 'leadership_development'
  | 'skill_development'
  | 'succession'
  | 'custom';

export type PlanStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'on_hold';

export interface PlanGoalTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetDaysFromStart: number; // Days from plan start date
  milestones: {
    title: string;
    daysFromStart: number;
  }[];
}

export interface PlanReviewTemplate {
  id: string;
  title: string;
  reviewCycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  daysFromStart: number;
  customCriteria?: {
    id: string;
    name: string;
    description: string;
    weight: number;
  }[];
}

export interface PlanConversationTemplate {
  id: string;
  title: string;
  type: 'one_on_one' | 'check_in' | 'coaching' | 'feedback' | 'career';
  daysFromStart: number;
  duration: number;
  agendaItems?: string[];
}

export interface PerformancePlanTemplate {
  id: string;
  name: string;
  description: string;
  type: PlanType;
  industry?: string;
  durationDays: number;
  goals: PlanGoalTemplate[];
  reviews: PlanReviewTemplate[];
  conversations: PlanConversationTemplate[];
  /** Optional: LMS content linked to this template (used to pre-link learning on assignment) */
  learningPathIds?: string[];
  /** Optional: individual courses linked to this template */
  courseIds?: string[];
  tags: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssignedPlan {
  id: string;
  templateId: string;
  templateName: string;
  staffId: string;
  assignedBy: string;
  type: PlanType;
  status: PlanStatus;
  startDate: string;
  endDate: string;
  notes?: string;
  goalIds: string[]; // Created goals linked to this plan
  reviewIds: string[]; // Created reviews linked to this plan
  conversationIds: string[]; // Scheduled conversations linked to this plan
  learningPathIds: string[]; // Linked learning paths from LMS
  courseIds: string[]; // Linked individual courses from LMS
  progress: number;
  createdAt: string;
  updatedAt: string;
}

// Type labels
export const planTypeLabels: Record<PlanType, string> = {
  onboarding: 'Onboarding Plan',
  probation: 'Probation Plan',
  annual_development: 'Annual Development Plan',
  performance_improvement: 'Performance Improvement Plan (PIP)',
  leadership_development: 'Leadership Development Plan',
  skill_development: 'Skill Development Plan',
  succession: 'Succession Plan',
  custom: 'Custom Plan',
};

export const planStatusLabels: Record<PlanStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
  on_hold: 'On Hold',
};

export const planStatusColors: Record<PlanStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-primary/10 text-primary',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-destructive/10 text-destructive',
  on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export const planTypeColors: Record<PlanType, string> = {
  onboarding: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  probation: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  annual_development: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  performance_improvement: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  leadership_development: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  skill_development: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  succession: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

// Industry options
export const planIndustries = [
  'Childcare',
  'Aged Care',
  'Healthcare',
  'Hospital',
  'Retail',
  'Hospitality',
  'Manufacturing',
  'Corporate',
  'Education',
  'General',
];
