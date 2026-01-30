// Advanced Performance Module Types

// ============= Peer Nominations for 360° Feedback =============

export type NominationStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface PeerNomination {
  id: string;
  nominatorId: string; // employee who nominates
  nomineeId: string; // peer being nominated
  reviewCycleId: string;
  reason: string;
  relationship: 'peer' | 'cross_functional' | 'project_collaborator' | 'mentor';
  status: NominationStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface ReviewCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  nominationDeadline: string;
  maxNominations: number;
  status: 'draft' | 'nominations_open' | 'in_review' | 'completed';
}

// ============= Mentorship Matching =============

export type MentorshipStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface MentorProfile {
  id: string;
  staffId: string;
  skills: string[];
  interests: string[];
  careerGoals: string[];
  yearsExperience: number;
  maxMentees: number;
  currentMentees: number;
  availability: 'high' | 'medium' | 'low';
  preferredMeetingFrequency: 'weekly' | 'biweekly' | 'monthly';
  bio?: string;
  isActive: boolean;
}

export interface MenteeProfile {
  id: string;
  staffId: string;
  desiredSkills: string[];
  interests: string[];
  careerGoals: string[];
  developmentAreas: string[];
  preferredMeetingFrequency: 'weekly' | 'biweekly' | 'monthly';
  bio?: string;
  isActive: boolean;
}

export interface MentorshipMatch {
  id: string;
  mentorId: string;
  menteeId: string;
  status: MentorshipStatus;
  matchScore: number; // 0-100
  matchReasons: string[];
  startDate?: string;
  endDate?: string;
  goals: string[];
  meetingCount: number;
  lastMeetingDate?: string;
  notes?: string;
  createdAt: string;
}

export interface MentorshipMeeting {
  id: string;
  matchId: string;
  scheduledDate: string;
  completedDate?: string;
  duration: number; // minutes
  topics: string[];
  actionItems: string[];
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
}

// ============= Development Budget Tracker =============

export type BudgetRequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'cancelled';
export type BudgetCategory = 'training' | 'conference' | 'certification' | 'books' | 'tools' | 'coaching' | 'other';

export interface DevelopmentBudget {
  id: string;
  staffId: string;
  fiscalYear: number;
  totalBudget: number;
  usedBudget: number;
  pendingBudget: number;
  currency: string;
}

export interface BudgetRequest {
  id: string;
  staffId: string;
  title: string;
  description: string;
  category: BudgetCategory;
  amount: number;
  currency: string;
  vendor?: string;
  eventDate?: string;
  eventLocation?: string;
  justification: string;
  expectedOutcomes: string[];
  status: BudgetRequestStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  receiptUrl?: string;
  completedAt?: string;
}

export interface BudgetApprover {
  id: string;
  staffId: string;
  maxApprovalAmount: number;
  department?: string;
}

// Labels and constants
export const nominationStatusLabels: Record<NominationStatus, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Feedback Completed',
};

export const mentorshipStatusLabels: Record<MentorshipStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const budgetCategoryLabels: Record<BudgetCategory, string> = {
  training: 'Training Course',
  conference: 'Conference',
  certification: 'Certification',
  books: 'Books & Materials',
  tools: 'Tools & Software',
  coaching: 'External Coaching',
  other: 'Other',
};

export const budgetStatusLabels: Record<BudgetRequestStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
