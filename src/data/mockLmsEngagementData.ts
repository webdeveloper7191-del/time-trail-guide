import { 
  CourseNote, 
  ContentBookmark, 
  LearningStreak, 
  DailyActivity, 
  Achievement,
  CourseReview,
  ReviewSummary 
} from '@/types/lmsEngagement';

// ==================== Notes ====================

export const mockCourseNotes: CourseNote[] = [
  {
    id: 'note-1',
    staffId: 'staff-1',
    courseId: 'course-1',
    moduleId: 'mod-1-2',
    contentId: 'c-1-2-1',
    note: 'Important: Remember the 5 types of hazards - Physical, Chemical, Biological, Ergonomic, Psychosocial',
    timestamp: 120,
    createdAt: '2024-03-05T10:30:00Z',
    updatedAt: '2024-03-05T10:30:00Z',
  },
  {
    id: 'note-2',
    staffId: 'staff-1',
    courseId: 'course-3',
    moduleId: 'mod-3-1',
    contentId: 'c-3-1-1',
    note: 'Key leadership styles: Transformational, Servant, Situational - need to identify which fits my approach',
    timestamp: 300,
    createdAt: '2024-04-10T14:20:00Z',
    updatedAt: '2024-04-10T14:20:00Z',
  },
  {
    id: 'note-3',
    staffId: 'staff-1',
    courseId: 'course-3',
    moduleId: 'mod-3-2',
    contentId: 'c-3-2-1',
    note: 'Team dynamics framework: Forming → Storming → Norming → Performing. Current team is in storming phase.',
    timestamp: 180,
    createdAt: '2024-05-02T09:15:00Z',
    updatedAt: '2024-05-02T09:15:00Z',
  },
];

// ==================== Bookmarks ====================

export const mockContentBookmarks: ContentBookmark[] = [
  {
    id: 'bm-1',
    staffId: 'staff-1',
    courseId: 'course-1',
    moduleId: 'mod-1-3',
    contentId: 'c-1-3-1',
    label: 'Risk Matrix explanation',
    timestamp: 450,
    createdAt: '2024-03-12T11:00:00Z',
  },
  {
    id: 'bm-2',
    staffId: 'staff-1',
    courseId: 'course-3',
    moduleId: 'mod-3-1',
    contentId: 'c-3-1-2',
    label: 'Leadership self-assessment tool',
    createdAt: '2024-04-05T15:30:00Z',
  },
  {
    id: 'bm-3',
    staffId: 'staff-1',
    courseId: 'course-3',
    moduleId: 'mod-3-3',
    contentId: 'c-3-3-1',
    label: 'Strategic planning frameworks',
    timestamp: 600,
    createdAt: '2024-05-15T08:45:00Z',
  },
];

// ==================== Learning Streaks ====================

export const mockLearningStreak: LearningStreak = {
  staffId: 'staff-1',
  currentStreak: 7,
  longestStreak: 21,
  lastActivityDate: new Date().toISOString().split('T')[0],
  dailyGoalMinutes: 15,
  todayMinutes: 22,
  weeklyGoalMinutes: 90,
  weekMinutes: 75,
  streakFreezesAvailable: 2,
  streakFreezesUsed: 1,
};

export const mockDailyActivities: DailyActivity[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const hasActivity = Math.random() > 0.25;
  const minutes = hasActivity ? Math.floor(Math.random() * 45) + 5 : 0;
  return {
    date: date.toISOString().split('T')[0],
    minutesLearned: minutes,
    coursesCompleted: minutes > 30 ? Math.floor(Math.random() * 2) : 0,
    modulesCompleted: hasActivity ? Math.floor(Math.random() * 3) + 1 : 0,
    goalMet: minutes >= 15,
  };
});

// ==================== Achievements ====================

export const mockAchievements: Achievement[] = [
  // Streak achievements
  {
    id: 'ach-streak-3',
    title: 'Getting Started',
    description: 'Maintain a 3-day learning streak',
    icon: 'fire',
    type: 'streak',
    requirement: 3,
    earnedAt: '2024-03-10T00:00:00Z',
    progress: 100,
    unlocked: true,
  },
  {
    id: 'ach-streak-7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: 'fire',
    type: 'streak',
    requirement: 7,
    earnedAt: '2024-06-20T00:00:00Z',
    progress: 100,
    unlocked: true,
  },
  {
    id: 'ach-streak-14',
    title: 'Fortnight Focus',
    description: 'Maintain a 14-day learning streak',
    icon: 'fire',
    type: 'streak',
    requirement: 14,
    progress: 50,
    unlocked: false,
  },
  {
    id: 'ach-streak-30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day learning streak',
    icon: 'crown',
    type: 'streak',
    requirement: 30,
    progress: 23,
    unlocked: false,
  },
  // Completion achievements
  {
    id: 'ach-complete-1',
    title: 'First Steps',
    description: 'Complete your first course',
    icon: 'trophy',
    type: 'completion',
    requirement: 1,
    earnedAt: '2024-03-15T00:00:00Z',
    progress: 100,
    unlocked: true,
  },
  {
    id: 'ach-complete-5',
    title: 'Knowledge Seeker',
    description: 'Complete 5 courses',
    icon: 'book',
    type: 'completion',
    requirement: 5,
    progress: 40,
    unlocked: false,
  },
  {
    id: 'ach-complete-10',
    title: 'Dedicated Learner',
    description: 'Complete 10 courses',
    icon: 'graduate',
    type: 'completion',
    requirement: 10,
    progress: 20,
    unlocked: false,
  },
  // Mastery achievements
  {
    id: 'ach-perfect-score',
    title: 'Perfectionist',
    description: 'Score 100% on any assessment',
    icon: 'star',
    type: 'mastery',
    requirement: 1,
    progress: 0,
    unlocked: false,
  },
  {
    id: 'ach-ace-3',
    title: 'Assessment Ace',
    description: 'Pass 3 assessments with 90%+ score',
    icon: 'medal',
    type: 'mastery',
    requirement: 3,
    earnedAt: '2024-04-20T00:00:00Z',
    progress: 100,
    unlocked: true,
  },
  // Engagement achievements
  {
    id: 'ach-notes-10',
    title: 'Active Note-Taker',
    description: 'Create 10 course notes',
    icon: 'brain',
    type: 'engagement',
    requirement: 10,
    progress: 30,
    unlocked: false,
  },
  {
    id: 'ach-bookmarks-5',
    title: 'Curator',
    description: 'Bookmark 5 lessons for later',
    icon: 'heart',
    type: 'engagement',
    requirement: 5,
    progress: 60,
    unlocked: false,
  },
  // Milestone achievements
  {
    id: 'ach-hours-10',
    title: 'Time Invested',
    description: 'Spend 10 hours learning',
    icon: 'rocket',
    type: 'milestone',
    requirement: 600,
    earnedAt: '2024-05-01T00:00:00Z',
    progress: 100,
    unlocked: true,
  },
  {
    id: 'ach-hours-50',
    title: 'Learning Marathon',
    description: 'Spend 50 hours learning',
    icon: 'diamond',
    type: 'milestone',
    requirement: 3000,
    progress: 25,
    unlocked: false,
  },
];

// ==================== Course Reviews ====================

export const mockCourseReviews: CourseReview[] = [
  {
    id: 'review-1',
    staffId: 'staff-1',
    staffName: 'Emma Wilson',
    courseId: 'course-1',
    rating: 5,
    title: 'Excellent foundational training',
    review: 'This course provided a comprehensive overview of WHS principles. The interactive hazard identification exercise was particularly useful. Highly recommend for all new staff.',
    helpfulCount: 12,
    verified: true,
    createdAt: '2024-03-16T10:00:00Z',
    updatedAt: '2024-03-16T10:00:00Z',
  },
  {
    id: 'review-2',
    staffId: 'staff-3',
    staffName: 'Michael Chen',
    courseId: 'course-1',
    rating: 4,
    title: 'Good content, could use more examples',
    review: 'Solid course covering all the essentials. Would benefit from more industry-specific examples, but overall very informative.',
    helpfulCount: 8,
    verified: true,
    createdAt: '2024-04-02T14:30:00Z',
    updatedAt: '2024-04-02T14:30:00Z',
  },
  {
    id: 'review-3',
    staffId: 'staff-2',
    staffName: 'Sarah Johnson',
    courseId: 'course-3',
    rating: 5,
    title: 'Transformative leadership content',
    review: 'This program changed how I approach team management. The strategic thinking module was eye-opening. The practical exercises helped me apply concepts immediately.',
    helpfulCount: 24,
    verified: true,
    createdAt: '2024-05-20T09:15:00Z',
    updatedAt: '2024-05-20T09:15:00Z',
  },
  {
    id: 'review-4',
    staffId: 'staff-4',
    staffName: 'James Brown',
    courseId: 'course-4',
    rating: 4,
    title: 'Quick and practical',
    review: 'Concise course that covers the basics effectively. The ergonomics section was very helpful for setting up my workspace.',
    helpfulCount: 5,
    verified: true,
    createdAt: '2024-04-15T11:00:00Z',
    updatedAt: '2024-04-15T11:00:00Z',
  },
  {
    id: 'review-5',
    staffId: 'staff-5',
    staffName: 'Lisa Park',
    courseId: 'course-5',
    rating: 5,
    title: 'Essential for customer-facing roles',
    review: 'The de-escalation techniques module was invaluable. I have used these skills multiple times since completing the course.',
    helpfulCount: 18,
    verified: true,
    createdAt: '2024-06-01T16:45:00Z',
    updatedAt: '2024-06-01T16:45:00Z',
  },
];

export const mockReviewSummaries: Record<string, ReviewSummary> = {
  'course-1': {
    courseId: 'course-1',
    averageRating: 4.5,
    totalReviews: 342,
    ratingDistribution: { 1: 5, 2: 12, 3: 45, 4: 120, 5: 160 },
    recentReviews: mockCourseReviews.filter(r => r.courseId === 'course-1'),
  },
  'course-2': {
    courseId: 'course-2',
    averageRating: 4.8,
    totalReviews: 189,
    ratingDistribution: { 1: 2, 2: 5, 3: 15, 4: 42, 5: 125 },
    recentReviews: [],
  },
  'course-3': {
    courseId: 'course-3',
    averageRating: 4.7,
    totalReviews: 156,
    ratingDistribution: { 1: 3, 2: 8, 3: 20, 4: 50, 5: 75 },
    recentReviews: mockCourseReviews.filter(r => r.courseId === 'course-3'),
  },
  'course-4': {
    courseId: 'course-4',
    averageRating: 4.3,
    totalReviews: 428,
    ratingDistribution: { 1: 10, 2: 25, 3: 60, 4: 180, 5: 153 },
    recentReviews: mockCourseReviews.filter(r => r.courseId === 'course-4'),
  },
  'course-5': {
    courseId: 'course-5',
    averageRating: 4.6,
    totalReviews: 267,
    ratingDistribution: { 1: 5, 2: 15, 3: 35, 4: 82, 5: 130 },
    recentReviews: mockCourseReviews.filter(r => r.courseId === 'course-5'),
  },
  'course-6': {
    courseId: 'course-6',
    averageRating: 4.9,
    totalReviews: 512,
    ratingDistribution: { 1: 3, 2: 8, 3: 25, 4: 76, 5: 400 },
    recentReviews: [],
  },
};
