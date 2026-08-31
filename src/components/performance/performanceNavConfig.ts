import {
  Target, ClipboardCheck, MessageSquareHeart, MessageSquare,
  BarChart3, Users, FileText, ListTodo, GraduationCap, Users2,
  Grid3X3, Compass, HeartPulse, Scale, Activity, Crosshair,
  Sparkles, Smile, TrendingUp, Heart, Wallet,
  UserPlus, Calendar, Lightbulb, Brain, GitCompareArrows, Route, SlidersHorizontal,
  Rocket, MessagesSquare, Gauge, Settings2,
  type LucideIcon,
} from 'lucide-react';

export interface PerfTabItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

export interface PerfTabGroup {
  /** Stable id used for expand/collapse state. */
  id: string;
  label: string;
  icon: LucideIcon;
  items: PerfTabItem[];
}

/** Single source of truth for Performance module navigation. */
export const performanceTabGroups: PerfTabGroup[] = [
  {
    id: 'development',
    label: 'Development',
    icon: Rocket,
    items: [
      { value: 'plans', label: 'Plans', icon: FileText },
      { value: 'goals', label: 'Goals', icon: Target },
      { value: 'goal-recommendations', label: 'Goal Suggestions', icon: Lightbulb },
      { value: 'okr', label: 'OKRs', icon: Crosshair },
      { value: 'lms', label: 'Learning', icon: GraduationCap },
      { value: 'pip', label: 'PIPs', icon: Activity },
    ],
  },
  {
    id: 'reviews',
    label: 'Reviews & Feedback',
    icon: ClipboardCheck,
    items: [
      { value: 'reviews', label: 'Reviews', icon: ClipboardCheck },
      { value: 'feedback', label: 'Feedback', icon: MessageSquareHeart },
      { value: '360feedback', label: '360° Feedback', icon: Users2 },
      { value: 'calibration', label: 'Calibration', icon: Scale },
    ],
  },
  {
    id: 'engagement',
    label: 'Engagement',
    icon: Sparkles,
    items: [
      { value: 'recognition', label: 'Recognition', icon: Sparkles },
      { value: 'happiness', label: 'Happiness', icon: Smile },
      { value: 'pulse', label: 'Pulse Surveys', icon: Activity },
      { value: 'wellbeing', label: 'Wellbeing', icon: HeartPulse },
      { value: 'nominations', label: 'Peer Nominations', icon: UserPlus },
      { value: 'mentorship', label: 'Mentorship', icon: Heart },
      { value: 'budget', label: 'Dev Budget', icon: Wallet },
    ],
  },
  {
    id: 'talent',
    label: 'Talent',
    icon: Users,
    items: [
      { value: 'talent', label: '9-Box Grid', icon: Grid3X3 },
      { value: 'skills', label: 'Skills & Careers', icon: Compass },
      { value: 'career-pathing', label: 'Career Paths', icon: Route },
      { value: 'succession', label: 'Succession', icon: Users },
      { value: 'team', label: 'Team Overview', icon: Users2 },
    ],
  },
  {
    id: 'activities',
    label: 'Activities',
    icon: MessagesSquare,
    items: [
      { value: 'tasks', label: 'Tasks', icon: ListTodo },
      { value: 'conversations', label: '1:1 Conversations', icon: MessageSquare },
      { value: 'calendar', label: 'Calendar Sync', icon: Calendar },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: Gauge,
    items: [
      { value: 'summary', label: 'Executive Summary', icon: TrendingUp },
      { value: 'analytics', label: 'Analytics', icon: BarChart3 },
      { value: 'sentiment', label: 'Sentiment Analysis', icon: Brain },
      { value: 'benchmarking', label: 'Benchmarking', icon: GitCompareArrows },
      { value: 'compensation', label: 'Compensation', icon: TrendingUp },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: Settings2,
    items: [
      { value: 'admin-config', label: 'Performance Setup', icon: SlidersHorizontal },
    ],
  },
];

export const performanceTabItems: PerfTabItem[] = performanceTabGroups.flatMap((g) => g.items);

export function findPerformanceTab(value: string): PerfTabItem | undefined {
  return performanceTabItems.find((i) => i.value === value);
}

export function findPerformanceGroup(value: string): PerfTabGroup | undefined {
  return performanceTabGroups.find((g) => g.items.some((i) => i.value === value));
}
