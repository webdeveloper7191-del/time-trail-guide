// Recruitment & ATS Types

export type JobStatus = 'draft' | 'open' | 'paused' | 'closed' | 'filled';
export type ApplicationStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
export type InterviewType = 'phone' | 'video' | 'onsite' | 'technical' | 'panel';
export type EmploymentType = 'full_time' | 'part_time' | 'casual' | 'contract' | 'internship';

export type WorkplaceOption = 'on_site' | 'hybrid' | 'remote';
export type PayType = 'hourly' | 'monthly' | 'annual' | 'annual_commission';
export type AdType = 'classic' | 'standout' | 'premium';

export const seekWorkTypes: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'contract', label: 'Contract/Temp' },
  { value: 'casual', label: 'Casual/Vacation' },
];
export const workplaceOptionLabels: Record<WorkplaceOption, string> = { on_site: 'On-site', hybrid: 'Hybrid', remote: 'Remote' };
export const payTypeLabels: Record<PayType, string> = {
  hourly: 'Hourly rate', monthly: 'Monthly salary', annual: 'Annual salary', annual_commission: 'Annual plus commission',
};
export const adTypeLabels: Record<AdType, string> = { classic: 'Classic', standout: 'StandOut', premium: 'Premium' };
export const seekCategories = [
  'Accounting', 'Administration & Office Support', 'Advertising, Arts & Media', 'Banking & Financial Services',
  'Call Centre & Customer Service', 'CEO & General Management', 'Community Services & Development', 'Construction',
  'Consulting & Strategy', 'Design & Architecture', 'Education & Training', 'Engineering', 'Farming, Animals & Conservation',
  'Government & Defence', 'Healthcare & Medical', 'Hospitality & Tourism', 'Human Resources & Recruitment',
  'Information & Communication Technology', 'Insurance & Superannuation', 'Legal', 'Manufacturing, Transport & Logistics',
  'Marketing & Communications', 'Mining, Resources & Energy', 'Real Estate & Property', 'Retail & Consumer Products',
  'Sales', 'Science & Technology', 'Self Employment', 'Sport & Recreation', 'Trades & Services',
];

export type QuestionType = "yes_no" | "number" | "single_choice" | "text";

export interface ScreeningQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  preferredAnswer?: string | number | boolean;
  isRequired: boolean;
  isCustom?: boolean;
}

export interface ApplicantAnswer {
  questionId: string;
  questionText: string;
  answer: string | number | boolean;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  status: JobStatus;
  hiringManagerId: string;
  postedAt?: string;
  closingDate?: string;
  applicantCount: number;
  // SEEK-aligned ad fields
  category?: string;
  subCategory?: string;
  workplaceOption?: WorkplaceOption;
  payType?: PayType;
  currency?: string;
  showSalary?: boolean;
  payDetails?: string;
  jobSummary?: string;
  keySellingPoints?: string[];
  screeningQuestions?: ScreeningQuestion[];
  internalReference?: string;
  videoUrl?: string;
  applicationMethod?: 'internal' | 'external';
  externalApplyUrl?: string;
  contactEmail?: string;
  adType?: AdType;
  createdAt: string;
  updatedAt: string;
}

export interface Applicant {
  id: string;
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  coverLetter?: string;
  status: string; // ApplicationStatus or a custom pipeline stage id
  rating: number; // 1-5 stars
  notes: ApplicantNote[];
  screeningAnswers?: ApplicantAnswer[];
  tags: string[];
  source: string;
  appliedAt: string;
  updatedAt: string;
  /** Staff record created when the applicant was converted. */
  staffId?: string;
}

export interface ApplicantNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface Interview {
  id: string;
  applicantId: string;
  jobId: string;
  type: InterviewType;
  scheduledAt: string;
  duration: number;
  location?: string;
  meetingLink?: string;
  interviewers: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  feedback?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStage {
  id: ApplicationStatus;
  label: string;
  color: string;
}

/** Editable pipeline stage. Built-in stages use ApplicationStatus ids; custom stages get `custom-*` ids. */
export interface PipelineStageConfig {
  id: string;
  label: string;
  builtIn: boolean;
}

export const defaultPipelineStages: PipelineStageConfig[] = [
  { id: 'new', label: 'New', builtIn: true },
  { id: 'screening', label: 'Screening', builtIn: true },
  { id: 'interview', label: 'Interview', builtIn: true },
  { id: 'offer', label: 'Offer', builtIn: true },
  { id: 'hired', label: 'Hired', builtIn: true },
];

/** Terminal statuses that never appear as pipeline columns. */
export const terminalStatuses: { id: ApplicationStatus; label: string }[] = [
  { id: 'rejected', label: 'Rejected' },
  { id: 'withdrawn', label: 'Withdrawn' },
];

export function stageLabel(status: string, stages: PipelineStageConfig[]): string {
  const custom = stages.find(s => s.id === status);
  if (custom) return custom.label;
  return applicationStatusLabels[status as ApplicationStatus] ?? status;
}

// Label mappings
export const jobStatusLabels: Record<JobStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  paused: 'Paused',
  closed: 'Closed',
  filled: 'Filled',
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  new: 'New',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const interviewTypeLabels: Record<InterviewType, string> = {
  phone: 'Phone Screen',
  video: 'Video Call',
  onsite: 'On-site',
  technical: 'Technical',
  panel: 'Panel Interview',
};

export const employmentTypeLabels: Record<EmploymentType, string> = {
  full_time: 'Full time',
  part_time: 'Part time',
  casual: 'Casual/Vacation',
  contract: 'Contract/Temp',
  internship: 'Internship',
};

export const pipelineStages: PipelineStage[] = [
  { id: 'new', label: 'New', color: 'bg-slate-100 text-slate-800' },
  { id: 'screening', label: 'Screening', color: 'bg-blue-100 text-blue-800' },
  { id: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800' },
  { id: 'offer', label: 'Offer', color: 'bg-amber-100 text-amber-800' },
  { id: 'hired', label: 'Hired', color: 'bg-green-100 text-green-800' },
];
