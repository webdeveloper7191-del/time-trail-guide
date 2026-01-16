// Performance Management Types

export type ReviewStatus = 'draft' | 'pending_self' | 'pending_manager' | 'completed' | 'cancelled';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackType = 'praise' | 'constructive' | 'coaching' | 'general';
export type ConversationType = 'one_on_one' | 'check_in' | 'coaching' | 'feedback' | 'career';
export type ReviewCycle = 'annual' | 'semi_annual' | 'quarterly' | 'monthly';

// Performance Review
export interface ReviewCriteria {
  id: string;
  name: string;
  description: string;
  weight: number; // percentage weight for overall score
}

export interface ReviewRating {
  criteriaId: string;
  selfRating?: number; // 1-5
  managerRating?: number; // 1-5
  selfComments?: string;
  managerComments?: string;
}

export interface PerformanceReview {
  id: string;
  staffId: string;
  reviewerId: string; // manager conducting review
  reviewCycle: ReviewCycle;
  periodStart: string;
  periodEnd: string;
  status: ReviewStatus;
  ratings: ReviewRating[];
  overallSelfRating?: number;
  overallManagerRating?: number;
  selfSummary?: string;
  managerSummary?: string;
  strengths?: string[];
  areasForImprovement?: string[];
  developmentPlan?: string;
  careerAspirations?: string;
  nextReviewDate?: string;
  submittedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Goals
export interface GoalMilestone {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  completedAt?: string;
}

export interface Goal {
  id: string;
  staffId: string;
  title: string;
  description: string;
  category: string;
  priority: GoalPriority;
  status: GoalStatus;
  progress: number; // 0-100
  startDate: string;
  targetDate: string;
  completedAt?: string;
  milestones: GoalMilestone[];
  linkedReviewId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Feedback & Recognition
export interface Feedback {
  id: string;
  fromStaffId: string;
  toStaffId: string;
  type: FeedbackType;
  message: string;
  isPrivate: boolean; // if true, only visible to recipient and managers
  linkedGoalId?: string;
  linkedReviewId?: string;
  createdAt: string;
}

// Continuous Conversations
export interface ConversationNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  staffId: string;
  managerId: string;
  type: ConversationType;
  title: string;
  scheduledDate: string;
  duration: number; // minutes
  completed: boolean;
  notes: ConversationNote[];
  actionItems: string[];
  nextMeetingDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Label mappings
export const reviewStatusLabels: Record<ReviewStatus, string> = {
  draft: 'Draft',
  pending_self: 'Pending Self-Review',
  pending_manager: 'Pending Manager Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const goalStatusLabels: Record<GoalStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const goalPriorityLabels: Record<GoalPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const feedbackTypeLabels: Record<FeedbackType, string> = {
  praise: 'Praise',
  constructive: 'Constructive',
  coaching: 'Coaching',
  general: 'General',
};

export const conversationTypeLabels: Record<ConversationType, string> = {
  one_on_one: '1:1 Meeting',
  check_in: 'Check-in',
  coaching: 'Coaching Session',
  feedback: 'Feedback Session',
  career: 'Career Discussion',
};

export const reviewCycleLabels: Record<ReviewCycle, string> = {
  annual: 'Annual',
  semi_annual: 'Semi-Annual',
  quarterly: 'Quarterly',
  monthly: 'Monthly',
};

// Review criteria templates
export const defaultReviewCriteria: ReviewCriteria[] = [
  { id: 'quality', name: 'Quality of Work', description: 'Accuracy, thoroughness, and reliability of work output', weight: 20 },
  { id: 'productivity', name: 'Productivity', description: 'Efficiency and volume of work completed', weight: 20 },
  { id: 'communication', name: 'Communication', description: 'Clarity, professionalism, and effectiveness of communication', weight: 15 },
  { id: 'teamwork', name: 'Teamwork', description: 'Collaboration, support of colleagues, and team contribution', weight: 15 },
  { id: 'initiative', name: 'Initiative', description: 'Proactiveness, problem-solving, and taking ownership', weight: 15 },
  { id: 'growth', name: 'Professional Growth', description: 'Learning, development, and skill improvement', weight: 15 },
];

// Goal categories
export const goalCategories = [
  'Performance',
  'Skill Development',
  'Leadership',
  'Project Delivery',
  'Customer Service',
  'Personal Growth',
  'Team Contribution',
  'Process Improvement',
];
