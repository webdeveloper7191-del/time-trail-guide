// Recruitment & ATS Types

export type JobStatus = 'draft' | 'open' | 'paused' | 'closed' | 'filled';
export type ApplicationStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn';
export type InterviewType = 'phone' | 'video' | 'onsite' | 'technical' | 'panel';
export type EmploymentType = 'full_time' | 'part_time' | 'casual' | 'contract' | 'internship';

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
  status: ApplicationStatus;
  rating: number; // 1-5 stars
  notes: ApplicantNote[];
  tags: string[];
  source: string;
  appliedAt: string;
  updatedAt: string;
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
  full_time: 'Full Time',
  part_time: 'Part Time',
  casual: 'Casual',
  contract: 'Contract',
  internship: 'Internship',
};

export const pipelineStages: PipelineStage[] = [
  { id: 'new', label: 'New', color: 'bg-slate-100 text-slate-800' },
  { id: 'screening', label: 'Screening', color: 'bg-blue-100 text-blue-800' },
  { id: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800' },
  { id: 'offer', label: 'Offer', color: 'bg-amber-100 text-amber-800' },
  { id: 'hired', label: 'Hired', color: 'bg-green-100 text-green-800' },
];
