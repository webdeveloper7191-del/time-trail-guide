// Learning Management System Types

export type CourseStatus = 'draft' | 'published' | 'archived';
export type EnrollmentStatus = 'not_started' | 'in_progress' | 'completed' | 'failed' | 'expired';
export type ContentType = 'video' | 'document' | 'quiz' | 'scorm' | 'interactive' | 'webinar' | 'external_link';
export type AssessmentType = 'quiz' | 'assignment' | 'practical' | 'certification_exam';
export type CertificateStatus = 'active' | 'expired' | 'revoked';

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  courseIds: string[];
  requiredCompletionOrder: boolean;
  estimatedDuration: number; // minutes
  tags: string[];
  industry?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  subcategory?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: number; // minutes
  status: CourseStatus;
  modules: CourseModule[];
  instructor: string;
  prerequisites: string[];
  skills: string[];
  industry?: string;
  complianceRequired: boolean;
  certificateOnCompletion: boolean;
  validityPeriod?: number; // days, for compliance courses
  passingScore: number; // percentage
  maxAttempts?: number;
  tags: string[];
  rating: number;
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: number; // minutes
  content: ModuleContent[];
  assessment?: Assessment;
  isLocked: boolean;
  unlockAfterModuleId?: string;
}

export interface ModuleContent {
  id: string;
  title: string;
  type: ContentType;
  url?: string;
  duration?: number;
  description?: string;
  order: number;
  mandatory: boolean;
}

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  questions: AssessmentQuestion[];
  passingScore: number;
  timeLimit?: number; // minutes
  maxAttempts: number;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
}

export interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'multi_select' | 'short_answer' | 'matching';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
}

export interface Enrollment {
  id: string;
  staffId: string;
  courseId: string;
  status: EnrollmentStatus;
  progress: number; // percentage
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  lastAccessedAt?: string;
  moduleProgress: ModuleProgress[];
  assessmentAttempts: AssessmentAttempt[];
  certificateId?: string;
  assignedBy?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleProgress {
  moduleId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  completedContentIds: string[];
  startedAt?: string;
  completedAt?: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  attemptNumber: number;
  score: number;
  passed: boolean;
  answers: { questionId: string; answer: string | string[]; correct: boolean }[];
  startedAt: string;
  completedAt?: string;
  timeSpent: number; // seconds
}

export interface Certificate {
  id: string;
  staffId: string;
  courseId: string;
  enrollmentId: string;
  certificateNumber: string;
  issuedAt: string;
  expiresAt?: string;
  status: CertificateStatus;
  verificationUrl?: string;
}

export interface LearningGoal {
  id: string;
  staffId: string;
  title: string;
  description: string;
  targetDate: string;
  linkedCourseIds: string[];
  linkedPathIds: string[];
  progress: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Analytics
export interface LearnerAnalytics {
  staffId: string;
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalLearningHours: number;
  averageScore: number;
  certificatesEarned: number;
  currentStreak: number; // days
  longestStreak: number;
  skillsAcquired: string[];
  weeklyProgress: { week: string; hours: number; completions: number }[];
}

export interface CourseAnalytics {
  courseId: string;
  totalEnrollments: number;
  completionRate: number;
  averageScore: number;
  averageCompletionTime: number; // minutes
  dropoffPoints: { moduleId: string; dropoffRate: number }[];
  ratings: { score: number; count: number }[];
}

// Labels
export const difficultyLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  advanced: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  expert: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
  expired: 'Expired',
};

export const enrollmentStatusColors: Record<EnrollmentStatus, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export const contentTypeLabels: Record<ContentType, string> = {
  video: 'Video',
  document: 'Document',
  quiz: 'Quiz',
  scorm: 'SCORM Package',
  interactive: 'Interactive',
  webinar: 'Webinar',
  external_link: 'External Link',
};

export const contentTypeIcons: Record<ContentType, string> = {
  video: 'Play',
  document: 'FileText',
  quiz: 'HelpCircle',
  scorm: 'Package',
  interactive: 'MousePointer',
  webinar: 'Video',
  external_link: 'ExternalLink',
};

// Course categories
export const lmsCategories = [
  'Compliance & Safety',
  'Professional Development',
  'Technical Skills',
  'Leadership & Management',
  'Customer Service',
  'Industry Specific',
  'Onboarding',
  'Soft Skills',
  'Health & Wellbeing',
  'IT & Software',
];

export const lmsIndustries = [
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
