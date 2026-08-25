import {
  LayoutDashboard, ClipboardCheck, Calendar, Clock, CalendarCheck,
  FileSignature, Sparkles, Target, TrendingUp, MessageSquare, Users,
  GraduationCap, Hourglass, CheckCircle2, DollarSign, FileText,
} from 'lucide-react';
import type { WorkspaceKpi, WorkspaceStep } from '@/components/performance/shared/ModuleWorkspace';

export interface EmployeeWorkspaceMeta {
  icon: React.ElementType;
  title: string;
  description: string;
  guideTitle?: string;
  steps?: WorkspaceStep[];
}

export const employeeWorkspaceConfig: Record<string, EmployeeWorkspaceMeta> = {
  dashboard: {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description: 'A single view of your hours, upcoming shifts and anything waiting on you.',
    steps: [
      { title: 'Check what needs action', body: 'Banners at the top flag onboarding steps, unsigned documents or timesheets to resubmit.' },
      { title: 'Review your week', body: 'The KPI strip shows hours worked, overtime, approvals and estimated pay for the current pay period.' },
      { title: 'Jump to a task', body: 'Use the left menu to open your schedule, timesheets, leave balances or learning.' },
    ],
  },
  onboarding: {
    icon: ClipboardCheck,
    title: 'Onboarding',
    description: 'Finish your profile, upload documents and sign your contract to get set up.',
    steps: [
      { title: 'Fill in your details', body: 'Personal, bank and tax details are collected once and reused across payroll.' },
      { title: 'Upload documents', body: 'Add qualifications, certifications and any compliance documents your role needs.' },
      { title: 'Sign and submit', body: 'Review your contract, sign digitally and submit — your manager is notified automatically.' },
    ],
  },
  schedule: {
    icon: Calendar,
    title: 'My Schedule',
    description: 'Your upcoming shifts, open shifts you can pick up and swap requests.',
    steps: [
      { title: 'Review upcoming shifts', body: 'See start and finish times, location and area for every shift assigned to you.' },
      { title: 'Pick up open shifts', body: 'Express interest in unfilled shifts — your manager confirms the assignment.' },
      { title: 'Request a swap', body: 'Send a swap request to an eligible colleague; both parties and the manager must approve.' },
    ],
  },
  current: {
    icon: Clock,
    title: 'My Timesheets',
    description: 'Clock in and out, review your recorded hours and submit timesheets for approval.',
    steps: [
      { title: 'Record your time', body: 'Clock in and out for the day, or add a manual entry if you forgot.' },
      { title: 'Check the detail', body: 'Confirm breaks, overtime and allowances are correct before submitting.' },
      { title: 'Submit for approval', body: 'Submitted timesheets go to your manager; you will be notified if anything needs a change.' },
    ],
  },
  'leave-balances': {
    icon: CalendarCheck,
    title: 'Leave Balances',
    description: 'Annual, personal, RDO, ADO and TOIL accruals with a running ledger.',
    steps: [
      { title: 'Check your balance', body: 'Balances update automatically as you accrue hours and take leave.' },
      { title: 'Review the ledger', body: 'Every accrual and deduction is listed with the shift or timesheet that caused it.' },
      { title: 'Request leave', body: 'Submit a request for the leave type you need — approvals route to your manager.' },
    ],
  },
  documents: {
    icon: FileSignature,
    title: 'Contracts & Documents',
    description: 'Review, sign and download your employment documents in one place.',
    steps: [
      { title: 'Open what is pending', body: 'Documents awaiting your signature are listed first.' },
      { title: 'Read and sign', body: 'Sign digitally — a timestamped copy is stored against your profile.' },
      { title: 'Download any time', body: 'Signed documents stay available for download whenever you need them.' },
    ],
  },
  recognition: {
    icon: Sparkles,
    title: 'Recognition',
    description: 'Give and receive praise across your team.',
  },
  performance: {
    icon: Target,
    title: 'Performance',
    description: 'Your reviews, goals, feedback and upcoming conversations.',
  },
  okrs: {
    icon: Target,
    title: 'My OKRs',
    description: 'Track your objectives and key results and how they align upward.',
  },
  career: {
    icon: TrendingUp,
    title: 'Career Path',
    description: 'Explore the roles ahead of you and the skills each one needs.',
  },
  surveys: {
    icon: MessageSquare,
    title: 'Surveys',
    description: 'Share your feedback through open pulse and engagement surveys.',
  },
  '360': {
    icon: Users,
    title: '360° Feedback',
    description: 'Feedback requested from you and feedback shared about you.',
  },
  learning: {
    icon: GraduationCap,
    title: 'Learning',
    description: 'Assigned courses, learning paths and your certifications.',
  },
};

export function getEmployeeWorkspaceMeta(tab: string): EmployeeWorkspaceMeta {
  return employeeWorkspaceConfig[tab] ?? employeeWorkspaceConfig.dashboard;
}

export function getDashboardKpis(stats: {
  totalHours: number | string;
  totalOvertime: number | string;
  approvedCount: number | string;
  estimatedPay: number | string;
}): WorkspaceKpi[] {
  return [
    { label: 'Total hours', value: `${stats.totalHours}h`, icon: Clock, tone: 'primary', hint: 'This pay period' },
    { label: 'Overtime', value: `${stats.totalOvertime}h`, icon: Hourglass, tone: 'warning' },
    { label: 'Approved', value: stats.approvedCount, icon: CheckCircle2, tone: 'success', hint: 'Timesheets' },
    { label: 'Est. pay', value: `$${stats.estimatedPay}`, icon: DollarSign, tone: 'muted' },
  ];
}

export const documentsIcon = FileText;
