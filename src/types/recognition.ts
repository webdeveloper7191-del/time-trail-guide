// Recognition & Engagement Types

export type PraiseCategory = 'teamwork' | 'innovation' | 'leadership' | 'customer_focus' | 'going_above' | 'mentoring';
export type SurveyStatus = 'draft' | 'active' | 'closed';
export type QuestionType = 'rating' | 'text' | 'multiple_choice' | 'yes_no';

export interface PraisePost {
  id: string;
  fromStaffId: string;
  toStaffId: string;
  category: PraiseCategory;
  message: string;
  badges: string[];
  likes: string[]; // staff IDs who liked
  comments: PraiseComment[];
  createdAt: string;
}

export interface PraiseComment {
  id: string;
  staffId: string;
  content: string;
  createdAt: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  anonymous: boolean;
  questions: SurveyQuestion[];
  startDate: string;
  endDate: string;
  responseCount: number;
  targetAudience: 'all' | 'department' | 'location';
  targetValue?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[];
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  staffId?: string;
  answers: { questionId: string; value: string | number }[];
  submittedAt: string;
}

export interface CultureValue {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface Milestone {
  id: string;
  staffId: string;
  type: 'anniversary' | 'birthday' | 'promotion' | 'certification' | 'custom';
  title: string;
  date: string;
  celebrated: boolean;
}

// Label mappings
export const praiseCategoryLabels: Record<PraiseCategory, string> = {
  teamwork: 'Teamwork',
  innovation: 'Innovation',
  leadership: 'Leadership',
  customer_focus: 'Customer Focus',
  going_above: 'Going Above & Beyond',
  mentoring: 'Mentoring',
};

export const praiseCategoryEmojis: Record<PraiseCategory, string> = {
  teamwork: '🤝',
  innovation: '💡',
  leadership: '🌟',
  customer_focus: '💖',
  going_above: '🚀',
  mentoring: '🎓',
};

export const surveyStatusLabels: Record<SurveyStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  closed: 'Closed',
};

export const questionTypeLabels: Record<QuestionType, string> = {
  rating: 'Rating (1-5)',
  text: 'Open Text',
  multiple_choice: 'Multiple Choice',
  yes_no: 'Yes/No',
};

export const defaultCultureValues: CultureValue[] = [
  { id: 'cv-1', name: 'Integrity', description: 'We do the right thing, even when no one is watching', icon: 'shield', color: 'blue' },
  { id: 'cv-2', name: 'Excellence', description: 'We strive for the highest standards in everything we do', icon: 'star', color: 'amber' },
  { id: 'cv-3', name: 'Collaboration', description: 'We achieve more together than we ever could alone', icon: 'users', color: 'green' },
  { id: 'cv-4', name: 'Innovation', description: 'We embrace change and continuously improve', icon: 'lightbulb', color: 'purple' },
  { id: 'cv-5', name: 'Care', description: 'We genuinely care for each other and our community', icon: 'heart', color: 'rose' },
];
