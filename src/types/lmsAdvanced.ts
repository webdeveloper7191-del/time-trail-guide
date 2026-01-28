// Advanced LMS Types - SCORM, xAPI, Gamification, Mobile

// ==================== SCORM & xAPI ====================

export type SCORMVersion = '1.2' | '2004_3rd' | '2004_4th';
export type xAPIVerb = 'initialized' | 'completed' | 'passed' | 'failed' | 'answered' | 'experienced' | 'progressed' | 'scored';

export interface SCORMPackage {
  id: string;
  courseId: string;
  version: SCORMVersion;
  entryPoint: string; // Path to launch file
  manifestUrl: string;
  packageUrl: string;
  metadata: SCORMMetadata;
  runtimeData?: SCORMRuntimeData;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SCORMMetadata {
  title: string;
  description?: string;
  duration?: number;
  masteryScore?: number;
  maxTimeAllowed?: number;
  timeLimitAction?: 'exit,message' | 'continue,message' | 'exit,no message' | 'continue,no message';
  prerequisites?: string;
  version?: string;
}

export interface SCORMRuntimeData {
  cmi: {
    completion_status: 'completed' | 'incomplete' | 'not attempted' | 'unknown';
    success_status: 'passed' | 'failed' | 'unknown';
    score?: {
      scaled?: number;
      raw?: number;
      min?: number;
      max?: number;
    };
    progress_measure?: number;
    location?: string;
    suspend_data?: string;
    total_time?: string;
    session_time?: string;
  };
}

export interface xAPIStatement {
  id: string;
  actor: {
    mbox: string;
    name: string;
    objectType: 'Agent';
  };
  verb: {
    id: string;
    display: { [lang: string]: string };
  };
  object: {
    id: string;
    objectType: 'Activity';
    definition?: {
      name?: { [lang: string]: string };
      description?: { [lang: string]: string };
      type?: string;
    };
  };
  result?: {
    score?: { scaled?: number; raw?: number; min?: number; max?: number };
    success?: boolean;
    completion?: boolean;
    duration?: string;
    response?: string;
  };
  context?: {
    registration?: string;
    contextActivities?: {
      parent?: { id: string }[];
      grouping?: { id: string }[];
    };
  };
  timestamp: string;
  stored?: string;
}

export interface xAPIConfig {
  endpoint: string;
  auth: string;
  version: '1.0.0' | '1.0.3';
}

// ==================== Gamification ====================

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type BadgeCategory = 'completion' | 'streak' | 'mastery' | 'social' | 'speed' | 'special';
export type ChallengeType = 'daily' | 'weekly' | 'monthly' | 'special';
export type ChallengeStatus = 'active' | 'completed' | 'expired' | 'upcoming';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  xpReward: number;
  criteria: BadgeCriteria;
  unlockedBy?: string[]; // Staff IDs who have this badge
  createdAt: string;
}

export interface BadgeCriteria {
  type: 'courses_completed' | 'streak_days' | 'total_hours' | 'perfect_score' | 'speed_completion' | 'social_share' | 'first_completion' | 'category_mastery';
  threshold: number;
  category?: string; // For category-specific badges
  timeLimit?: number; // For speed challenges (minutes)
}

export interface UserBadge {
  id: string;
  staffId: string;
  badgeId: string;
  earnedAt: string;
  featured: boolean; // User can feature up to 3 badges on profile
}

export interface GamificationProfile {
  staffId: string;
  totalXP: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  rank: number;
  badges: UserBadge[];
  streakCurrent: number;
  streakLongest: number;
  streakLastDate?: string;
  challengesCompleted: number;
  weeklyXP: number;
  monthlyXP: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningChallenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  status: ChallengeStatus;
  xpReward: number;
  badgeReward?: string; // Badge ID
  criteria: ChallengeCriteria;
  startDate: string;
  endDate: string;
  participants: ChallengeParticipant[];
  createdAt: string;
}

export interface ChallengeCriteria {
  type: 'complete_courses' | 'earn_xp' | 'watch_hours' | 'pass_assessments' | 'maintain_streak';
  target: number;
  courseIds?: string[]; // Specific courses required
  categoryIds?: string[]; // Specific categories
}

export interface ChallengeParticipant {
  staffId: string;
  progress: number;
  completed: boolean;
  completedAt?: string;
  joinedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  staffId: string;
  staffName: string;
  staffAvatar?: string;
  staffDepartment?: string;
  xp: number;
  level: number;
  badgeCount: number;
  coursesCompleted: number;
  change?: number; // Position change from last period
}

export interface XPTransaction {
  id: string;
  staffId: string;
  amount: number;
  type: 'course_complete' | 'module_complete' | 'quiz_pass' | 'streak_bonus' | 'challenge_complete' | 'badge_earned' | 'perfect_score' | 'speed_bonus';
  description: string;
  sourceId?: string; // Course ID, Challenge ID, etc.
  createdAt: string;
}

// ==================== Course Authoring ====================

export interface CourseTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry?: string;
  structure: CourseTemplateStructure;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseTemplateStructure {
  moduleCount: number;
  suggestedDuration: number;
  moduleTemplates: ModuleTemplate[];
}

export interface ModuleTemplate {
  title: string;
  description: string;
  suggestedContentTypes: string[];
  includeAssessment: boolean;
  suggestedDuration: number;
}

export interface CourseAuthoringState {
  courseId: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  thumbnail?: string;
  industry?: string;
  complianceRequired: boolean;
  certificateOnCompletion: boolean;
  validityPeriod?: number;
  passingScore: number;
  maxAttempts?: number;
  tags: string[];
  modules: ModuleAuthoringState[];
  status: 'draft' | 'review' | 'published';
  isDirty: boolean;
  lastSavedAt?: string;
}

export interface ModuleAuthoringState {
  id: string;
  title: string;
  description: string;
  order: number;
  duration: number;
  content: ContentAuthoringState[];
  assessment?: AssessmentAuthoringState;
  isLocked: boolean;
  unlockAfterModuleId?: string;
  isExpanded: boolean;
}

export interface ContentAuthoringState {
  id: string;
  title: string;
  type: string;
  url?: string;
  file?: File;
  duration?: number;
  description?: string;
  order: number;
  mandatory: boolean;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'complete' | 'error';
}

export interface AssessmentAuthoringState {
  id: string;
  title: string;
  type: string;
  passingScore: number;
  timeLimit?: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  questions: QuestionAuthoringState[];
}

export interface QuestionAuthoringState {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'multi_select' | 'short_answer' | 'matching';
  question: string;
  options: string[];
  correctAnswer: string | string[];
  points: number;
  explanation?: string;
  mediaUrl?: string;
}

// ==================== Mobile & Offline ====================

export interface OfflineCourse {
  courseId: string;
  title: string;
  downloadedAt: string;
  size: number; // bytes
  modules: OfflineModule[];
  expiresAt?: string;
  lastSyncedAt: string;
  progress: number;
}

export interface OfflineModule {
  moduleId: string;
  title: string;
  content: OfflineContent[];
  downloaded: boolean;
  size: number;
}

export interface OfflineContent {
  contentId: string;
  title: string;
  type: string;
  localPath?: string;
  downloaded: boolean;
  size: number;
}

export interface OfflineProgress {
  courseId: string;
  moduleId: string;
  contentId: string;
  completed: boolean;
  timestamp: string;
  synced: boolean;
}

export interface MobileSettings {
  downloadOverWifiOnly: boolean;
  autoDownloadAssigned: boolean;
  storageLimit: number; // MB
  notificationsEnabled: boolean;
  reminderTime?: string;
  offlineExpiryDays: number;
}

// ==================== Level System ====================

export const XP_PER_LEVEL = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1900,   // Level 7
  2600,   // Level 8
  3500,   // Level 9
  4600,   // Level 10
  5900,   // Level 11
  7400,   // Level 12
  9100,   // Level 13
  11000,  // Level 14
  13200,  // Level 15
  15700,  // Level 16
  18500,  // Level 17
  21600,  // Level 18
  25000,  // Level 19
  30000,  // Level 20 (Max)
];

export const LEVEL_TITLES = [
  'Newcomer',
  'Apprentice',
  'Learner',
  'Student',
  'Scholar',
  'Expert',
  'Master',
  'Sage',
  'Guru',
  'Legend',
];

export function calculateLevel(totalXP: number): { level: number; currentXP: number; nextLevelXP: number; progress: number } {
  let level = 1;
  for (let i = 0; i < XP_PER_LEVEL.length; i++) {
    if (totalXP >= XP_PER_LEVEL[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  
  const currentLevelXP = XP_PER_LEVEL[level - 1] || 0;
  const nextLevelXP = XP_PER_LEVEL[level] || XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progress = Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100);
  
  return { level, currentXP: xpInCurrentLevel, nextLevelXP: xpNeededForNextLevel, progress };
}

// ==================== Badge Definitions ====================

export const badgeRarityColors: Record<BadgeRarity, string> = {
  common: 'bg-slate-100 text-slate-700 border-slate-300',
  rare: 'bg-blue-100 text-blue-700 border-blue-300',
  epic: 'bg-purple-100 text-purple-700 border-purple-300',
  legendary: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-400',
};

export const badgeCategoryIcons: Record<BadgeCategory, string> = {
  completion: 'CheckCircle2',
  streak: 'Flame',
  mastery: 'Crown',
  social: 'Users',
  speed: 'Zap',
  special: 'Star',
};
