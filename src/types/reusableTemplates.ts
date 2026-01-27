// Reusable Goal and Review Templates

export interface ReusableGoalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  defaultDaysToComplete: number;
  milestones: {
    title: string;
    relativeDays: number; // Days before target (negative) or from start (positive)
  }[];
  industry?: string;
  tags: string[];
  usageCount: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReusableReviewTemplate {
  id: string;
  name: string;
  description: string;
  reviewCycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  defaultDaysFromStart: number;
  criteria: {
    id: string;
    name: string;
    description: string;
    weight: number;
  }[];
  industry?: string;
  tags: string[];
  usageCount: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export const goalTemplateCategories = [
  'Onboarding',
  'Compliance',
  'Skill Development',
  'Performance',
  'Leadership',
  'Customer Service',
  'Documentation',
  'Team Contribution',
  'Project Delivery',
  'Personal Growth',
];

export const reviewTemplateTypes = [
  { value: 'probation_mid', label: 'Probation Mid-Point' },
  { value: 'probation_end', label: 'Probation End' },
  { value: 'quarterly', label: 'Quarterly Review' },
  { value: 'semi_annual', label: 'Semi-Annual Review' },
  { value: 'annual', label: 'Annual Review' },
  { value: 'pip_progress', label: 'PIP Progress Check' },
  { value: 'pip_final', label: 'PIP Final Assessment' },
  { value: 'leadership', label: 'Leadership Review' },
];
