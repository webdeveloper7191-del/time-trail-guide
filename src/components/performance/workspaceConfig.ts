import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Brain,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Compass,
  DollarSign,
  Gauge,
  Grid3X3,
  HeartHandshake,
  Lightbulb,
  LineChart,
  MessageSquare,
  Scale,
  Settings,
  Sparkles,
  Smile,
  Target,
  TrendingUp,
  Users,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { isPast, parseISO } from 'date-fns';
import type { Conversation, Feedback, Goal, PerformanceReview } from '@/types/performance';
import type { StaffMember } from '@/types/staff';
import type { WorkspaceKpi, WorkspaceStep } from './shared/ModuleWorkspace';

export interface WorkspaceContext {
  goals: Goal[];
  reviews: PerformanceReview[];
  feedback: Feedback[];
  conversations: Conversation[];
  staff: StaffMember[];
  goTo: (tab: string) => void;
}

export interface WorkspaceMeta {
  icon: React.ElementType;
  title: string;
  description: string;
  kpis?: WorkspaceKpi[];
  steps?: WorkspaceStep[];
  guideTitle?: string;
}

const safePast = (date?: string) => {
  if (!date) return false;
  try {
    return isPast(parseISO(date));
  } catch {
    return false;
  }
};

const pct = (part: number, total: number) => (total > 0 ? `${Math.round((part / total) * 100)}%` : '0%');

/**
 * Plain-English header, guidance and KPI definitions for every Performance tab.
 * Presentation only — no business logic lives here.
 */
export function getWorkspaceMeta(tab: string, ctx: WorkspaceContext): WorkspaceMeta | null {
  const { goals, reviews, feedback, conversations, staff, goTo } = ctx;

  switch (tab) {
    case 'plans': {
      return {
        icon: ClipboardList,
        title: 'Performance Plans',
        description:
          'Bundle goals, reviews and check-ins into a ready-made plan, then give it to a person or a whole team.',
        kpis: [
          { label: 'Staff', value: staff.length, hint: 'people you can assign to', icon: Users, tone: 'muted' },
          { label: 'Goals in play', value: goals.length, hint: 'across all plans', icon: Target },
          {
            label: 'Reviews scheduled',
            value: reviews.length,
            hint: 'included in plans',
            icon: ClipboardList,
            tone: 'muted',
          },
          {
            label: 'Check-ins booked',
            value: conversations.length,
            hint: '1:1s coming up',
            icon: MessageSquare,
            tone: 'primary',
          },
        ],
        steps: [
          { title: 'Pick a template', body: 'Start from a ready-made plan, or build your own from scratch.', cta: 'Browse templates', onClick: () => goTo('plans') },
          { title: 'Choose the people', body: 'Assign to one person, or bulk assign to a team or location.' },
          { title: 'Track progress', body: 'Goals, reviews and check-ins are created automatically and tracked here.' },
        ],
      };
    }

    case 'goals': {
      const completed = goals.filter((g) => g.status === 'completed').length;
      const overdue = goals.filter((g) => g.status !== 'completed' && safePast(g.targetDate)).length;
      const inProgress = goals.filter((g) => g.status === 'in_progress').length;
      return {
        icon: Target,
        title: 'Goals',
        description: 'What each person is working towards, how far along they are, and what is running late.',
        kpis: [
          { label: 'Total goals', value: goals.length, hint: 'set across the team', icon: Target },
          { label: 'In progress', value: inProgress, hint: 'being worked on', icon: Clock, tone: 'warning' },
          { label: 'Completed', value: pct(completed, goals.length), hint: `${completed} finished`, icon: CheckCircle2, tone: 'success' },
          { label: 'Overdue', value: overdue, hint: 'past the target date', icon: AlertTriangle, tone: 'danger' },
        ],
        steps: [
          { title: 'Write a clear goal', body: 'Say what "done" looks like and when it needs to be finished by.' },
          { title: 'Break it into steps', body: 'Add milestones so progress moves in small, visible chunks.' },
          { title: 'Review in your 1:1', body: 'Update progress during check-ins so nothing drifts.', cta: 'Go to check-ins', onClick: () => goTo('conversations') },
        ],
      };
    }

    case 'goal-recommendations':
      return {
        icon: Lightbulb,
        title: 'Suggested Goals',
        description: 'Ready-to-use goal ideas based on a person\u2019s role and past performance. Adopt one and it becomes a real goal.',
        steps: [
          { title: 'Pick a person', body: 'Suggestions are tailored to their position and history.' },
          { title: 'Review the suggestion', body: 'Each one comes with milestones you can edit.' },
          { title: 'Adopt it', body: 'The goal is created and appears on the Goals tab.', cta: 'Open Goals', onClick: () => goTo('goals') },
        ],
      };

    case 'okr':
      return {
        icon: Compass,
        title: 'Objectives & Key Results',
        description: 'Company objectives cascaded down to teams and individuals so everyone can see how their work ladders up.',
        steps: [
          { title: 'Set company objectives', body: 'A handful of clear outcomes for the quarter.' },
          { title: 'Cascade to teams', body: 'Each team adds key results that support the objective above.' },
          { title: 'Update regularly', body: 'Progress rolls up automatically to the company view.' },
        ],
      };

    case 'reviews': {
      const completed = reviews.filter((r) => r.status === 'completed').length;
      const pendingSelf = reviews.filter((r) => r.status === 'pending_self').length;
      const pendingManager = reviews.filter((r) => r.status === 'pending_manager').length;
      return {
        icon: ClipboardList,
        title: 'Performance Reviews',
        description: 'Run review cycles end to end — the staff member reflects first, then the manager completes and shares the outcome.',
        kpis: [
          { label: 'Reviews', value: reviews.length, hint: 'in the current cycles', icon: ClipboardList },
          { label: 'Waiting on staff', value: pendingSelf, hint: 'self-review not submitted', icon: Clock, tone: 'warning' },
          { label: 'Waiting on manager', value: pendingManager, hint: 'ready to be completed', icon: UserCheck, tone: 'warning' },
          { label: 'Completed', value: pct(completed, reviews.length), hint: `${completed} finished`, icon: CheckCircle2, tone: 'success' },
        ],
        steps: [
          { title: 'Start the cycle', body: 'Choose the period and who is included.' },
          { title: 'Staff self-review', body: 'They rate themselves and add comments first.' },
          { title: 'Manager completes', body: 'You add ratings, strengths and a development plan, then share it.' },
        ],
      };
    }

    case 'feedback': {
      const praise = feedback.filter((f) => String(f.type).includes('praise') || String(f.type).includes('recognition')).length;
      return {
        icon: MessageSquare,
        title: 'Feedback',
        description: 'Day-to-day feedback between colleagues — quick praise, coaching notes and things to work on.',
        kpis: [
          { label: 'Feedback notes', value: feedback.length, hint: 'shared so far', icon: MessageSquare },
          { label: 'Positive', value: praise, hint: 'praise and recognition', icon: Sparkles, tone: 'success' },
          { label: 'People', value: staff.length, hint: 'who can give feedback', icon: Users, tone: 'muted' },
        ],
        steps: [
          { title: 'Give it early', body: 'Short and specific beats a long note six months later.' },
          { title: 'Say what you saw', body: 'Describe the behaviour and its impact, not the person.' },
          { title: 'Use it in reviews', body: 'Feedback is pulled through when review time comes.', cta: 'Open reviews', onClick: () => goTo('reviews') },
        ],
      };
    }

    case '360feedback':
      return {
        icon: Users,
        title: '360\u00b0 Feedback',
        description: 'Collect a rounded view of someone from their manager, peers and the people they work with day to day.',
        steps: [
          { title: 'Choose the person', body: 'Pick who the feedback is about.' },
          { title: 'Invite the reviewers', body: 'Manager, peers and direct reports — usually 5 to 8 people.' },
          { title: 'Share the summary', body: 'Responses are grouped so individual answers stay confidential.' },
        ],
      };

    case 'calibration':
      return {
        icon: Scale,
        title: 'Calibration',
        description: 'Get managers in a room to compare ratings side by side so scoring stays fair and consistent across teams.',
        steps: [
          { title: 'Create a session', body: 'Pick the group of staff and the managers attending.' },
          { title: 'Compare ratings', body: 'Outliers are highlighted so they can be discussed.' },
          { title: 'Lock the outcome', body: 'Agreed ratings are written back to the reviews.' },
        ],
      };

    case 'pip':
      return {
        icon: AlertTriangle,
        title: 'Improvement Plans',
        description: 'Structured support when performance is off track — clear expectations, check-in dates and a documented trail.',
        steps: [
          { title: 'Set the expectations', body: 'Be specific about what needs to change and by when.' },
          { title: 'Book regular check-ins', body: 'Weekly or fortnightly reviews of progress.' },
          { title: 'Close it out', body: 'Record the outcome — improved, extended or escalated.' },
        ],
      };

    case 'recognition':
      return {
        icon: Award,
        title: 'Recognition',
        description: 'Celebrate good work publicly — shout-outs, awards and nominations that the whole team can see.',
        steps: [
          { title: 'Give a shout-out', body: 'Anyone can recognise a colleague in a couple of clicks.' },
          { title: 'Add it to the wall', body: 'Recognition appears in the team feed and employee portal.' },
          { title: 'Reward the standouts', body: 'Turn repeat recognition into awards and nominations.' },
        ],
      };

    case 'happiness':
      return {
        icon: Smile,
        title: 'Happiness Score',
        description: 'A simple, regular read on how your team is feeling, tracked over time so you can spot dips early.',
      };

    case 'pulse':
      return {
        icon: Activity,
        title: 'Pulse Surveys',
        description: 'Short, frequent surveys — two or three questions — to check how people are going without survey fatigue.',
        steps: [
          { title: 'Write a short survey', body: 'Two or three questions is plenty.' },
          { title: 'Choose the audience', body: 'Everyone, or just one location or team.' },
          { title: 'Act on the results', body: 'Share what you heard and what will change.' },
        ],
      };

    case 'wellbeing':
      return {
        icon: HeartHandshake,
        title: 'Wellbeing',
        description: 'Workload, burnout risk and engagement signals in one place, so support can be offered before things escalate.',
      };

    case 'nominations':
      return {
        icon: Sparkles,
        title: 'Peer Nominations',
        description: 'Let staff nominate each other for awards, then shortlist and announce the winners.',
      };

    case 'mentorship':
      return {
        icon: UserCheck,
        title: 'Mentorship',
        description: 'Match people who want to learn with people who can teach, and keep track of how the pairing is going.',
        steps: [
          { title: 'Collect interest', body: 'Staff say whether they want to mentor, be mentored, or both.' },
          { title: 'Suggest matches', body: 'Pairings are proposed based on skills and goals.' },
          { title: 'Check in', body: 'Track meetings and outcomes over the mentorship period.' },
        ],
      };

    case 'budget':
      return {
        icon: Wallet,
        title: 'Development Budget',
        description: 'What has been set aside for training and development, what has been spent and what is left.',
      };

    case 'talent':
      return {
        icon: Grid3X3,
        title: 'Talent Grid',
        description: 'Plot people by performance and potential to see who is ready to step up and who needs more support.',
      };

    case 'skills':
      return {
        icon: Brain,
        title: 'Skills & Career',
        description: 'The skills your team has today, the gaps against their role, and what they need for the next one.',
      };

    case 'career-pathing':
      return {
        icon: TrendingUp,
        title: 'Career Paths',
        description: 'Show people the realistic next roles from where they are now, and what it takes to get there.',
      };

    case 'succession':
      return {
        icon: Briefcase,
        title: 'Succession Planning',
        description: 'Identify cover for your critical roles so a resignation never leaves you exposed.',
      };

    case 'team': {
      const overdueGoals = goals.filter((g) => g.status !== 'completed' && safePast(g.targetDate)).length;
      const upcoming = conversations.filter((c) => !c.completed).length;
      return {
        icon: Users,
        title: 'Team Overview',
        description: 'One screen per manager — goals, reviews, feedback and check-ins for everyone reporting to you.',
        kpis: [
          { label: 'Team members', value: staff.length, hint: 'in your view', icon: Users, tone: 'muted' },
          { label: 'Open goals', value: goals.filter((g) => g.status !== 'completed').length, hint: 'still in progress', icon: Target },
          { label: 'Check-ins due', value: upcoming, hint: 'not yet held', icon: MessageSquare, tone: 'warning' },
          { label: 'Overdue goals', value: overdueGoals, hint: 'need attention', icon: AlertTriangle, tone: 'danger' },
        ],
      };
    }

    case 'tasks':
      return {
        icon: ClipboardList,
        title: 'Performance Tasks',
        description: 'Everything performance-related that needs doing — self-reviews, sign-offs and follow-ups — in one to-do list.',
      };

    case 'conversations': {
      const held = conversations.filter((c) => c.completed).length;
      const upcoming = conversations.length - held;
      return {
        icon: MessageSquare,
        title: 'Check-ins & 1:1s',
        description: 'Schedule regular one-on-ones, keep shared notes and turn conversations into agreed actions.',
        kpis: [
          { label: 'Scheduled', value: conversations.length, hint: 'total booked', icon: CalendarDays },
          { label: 'Upcoming', value: upcoming, hint: 'still to happen', icon: Clock, tone: 'warning' },
          { label: 'Held', value: pct(held, conversations.length), hint: `${held} completed`, icon: CheckCircle2, tone: 'success' },
        ],
        steps: [
          { title: 'Book a regular slot', body: 'Fortnightly works for most teams.' },
          { title: 'Agree an agenda', body: 'Both sides can add notes before the meeting.' },
          { title: 'Capture actions', body: 'Actions carry over to the next check-in automatically.' },
        ],
      };
    }

    case 'calendar':
      return {
        icon: CalendarDays,
        title: 'Calendar Sync',
        description: 'Push reviews and check-ins into Outlook or Google Calendar so they show up where people already look.',
      };

    case 'summary':
      return {
        icon: Gauge,
        title: 'Executive Summary',
        description: 'The headline numbers for leadership — completion rates, ratings and where attention is needed.',
      };

    case 'analytics':
      return {
        icon: BarChart3,
        title: 'Analytics',
        description: 'Dig into trends across goals, reviews and feedback by team, location and time period.',
      };

    case 'sentiment':
      return {
        icon: LineChart,
        title: 'Sentiment',
        description: 'How the tone of written feedback is trending, so you can see morale shifting before it shows up elsewhere.',
      };

    case 'benchmarking':
      return {
        icon: Scale,
        title: 'Benchmarking',
        description: 'Compare your teams and locations against each other and against typical industry ranges.',
      };

    case 'compensation':
      return {
        icon: DollarSign,
        title: 'Compensation',
        description: 'Link performance outcomes to pay decisions — merit increases, bonuses and budget impact.',
      };

    case 'admin-config':
      return {
        icon: Settings,
        title: 'Performance Setup',
        description: 'Set the rules once — rating scales, competencies and review cycles — and every review follows them.',
        steps: [
          { title: 'Define a rating scale', body: 'For example 1 to 5, with a clear description for each level.' },
          { title: 'Build your competencies', body: 'The behaviours you assess, grouped and weighted.' },
          { title: 'Schedule review cycles', body: 'When reviews open, when they are due and who is included.' },
        ],
      };

    default:
      return null;
  }
}
