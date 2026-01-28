// LMS Engagement Types: Notes, Bookmarks, Streaks, Reviews

// ==================== Notes & Bookmarks ====================

export interface CourseNote {
  id: string;
  staffId: string;
  courseId: string;
  moduleId: string;
  contentId: string;
  note: string;
  timestamp: number; // seconds into content (for video notes)
  createdAt: string;
  updatedAt: string;
}

export interface ContentBookmark {
  id: string;
  staffId: string;
  courseId: string;
  moduleId: string;
  contentId: string;
  label?: string;
  timestamp?: number; // seconds into content (for video bookmarks)
  createdAt: string;
}

// ==================== Learning Streaks ====================

export interface LearningStreak {
  staffId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  dailyGoalMinutes: number;
  todayMinutes: number;
  weeklyGoalMinutes: number;
  weekMinutes: number;
  streakFreezesAvailable: number;
  streakFreezesUsed: number;
}

export interface DailyActivity {
  date: string;
  minutesLearned: number;
  coursesCompleted: number;
  modulesCompleted: number;
  goalMet: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'streak' | 'completion' | 'mastery' | 'engagement' | 'milestone';
  requirement: number;
  earnedAt?: string;
  progress: number;
  unlocked: boolean;
}

// ==================== Course Reviews ====================

export interface CourseReview {
  id: string;
  staffId: string;
  staffName: string;
  staffAvatar?: string;
  courseId: string;
  rating: number; // 1-5
  title: string;
  review: string;
  helpfulCount: number;
  verified: boolean; // completed the course
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  courseId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentReviews: CourseReview[];
}

// ==================== Helper Labels ====================

export const achievementTypeLabels: Record<Achievement['type'], string> = {
  streak: 'Streak',
  completion: 'Completion',
  mastery: 'Mastery',
  engagement: 'Engagement',
  milestone: 'Milestone',
};

export const achievementIcons: Record<string, string> = {
  fire: '🔥',
  trophy: '🏆',
  star: '⭐',
  medal: '🏅',
  rocket: '🚀',
  brain: '🧠',
  book: '📚',
  graduate: '🎓',
  lightning: '⚡',
  heart: '❤️',
  diamond: '💎',
  crown: '👑',
};
