import { JobPosting, Applicant, Interview, ApplicationStatus } from '@/types/recruitment';
import { mockJobs, mockApplicants, mockInterviews } from '@/data/mockRecruitmentData';
import { mockApiCall, ApiResponse } from './mockApi';

export const recruitmentApi = {
  // Jobs
  async fetchJobs(status?: string): Promise<ApiResponse<JobPosting[]>> {
    let jobs = [...mockJobs];
    if (status) jobs = jobs.filter(j => j.status === status);
    return mockApiCall(jobs);
  },

  async getJobById(id: string): Promise<ApiResponse<JobPosting | null>> {
    return mockApiCall(mockJobs.find(j => j.id === id) ?? null);
  },

  async createJob(data: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt' | 'applicantCount'>): Promise<ApiResponse<JobPosting>> {
    const newJob: JobPosting = {
      ...data,
      id: `job-${Date.now()}`,
      applicantCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return mockApiCall(newJob, { delay: 500 });
  },

  async updateJob(id: string, updates: Partial<JobPosting>): Promise<ApiResponse<JobPosting>> {
    const job = mockJobs.find(j => j.id === id);
    if (!job) throw new Error('Job not found');
    return mockApiCall({ ...job, ...updates, updatedAt: new Date().toISOString() }, { delay: 400 });
  },

  // Applicants
  async fetchApplicants(jobId?: string): Promise<ApiResponse<Applicant[]>> {
    let applicants = [...mockApplicants];
    if (jobId) applicants = applicants.filter(a => a.jobId === jobId);
    return mockApiCall(applicants);
  },

  async getApplicantById(id: string): Promise<ApiResponse<Applicant | null>> {
    return mockApiCall(mockApplicants.find(a => a.id === id) ?? null);
  },

  async updateApplicantStatus(id: string, status: ApplicationStatus): Promise<ApiResponse<Applicant>> {
    const applicant = mockApplicants.find(a => a.id === id);
    if (!applicant) throw new Error('Applicant not found');
    return mockApiCall({ ...applicant, status, updatedAt: new Date().toISOString() }, { delay: 300 });
  },

  async addApplicantNote(id: string, content: string, createdBy: string): Promise<ApiResponse<Applicant>> {
    const applicant = mockApplicants.find(a => a.id === id);
    if (!applicant) throw new Error('Applicant not found');
    const newNote = { id: `n-${Date.now()}`, content, createdBy, createdAt: new Date().toISOString() };
    return mockApiCall({ ...applicant, notes: [...applicant.notes, newNote], updatedAt: new Date().toISOString() }, { delay: 300 });
  },

  // Interviews
  async fetchInterviews(applicantId?: string): Promise<ApiResponse<Interview[]>> {
    let interviews = [...mockInterviews];
    if (applicantId) interviews = interviews.filter(i => i.applicantId === applicantId);
    return mockApiCall(interviews);
  },

  async createInterview(data: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Interview>> {
    const newInterview: Interview = {
      ...data,
      id: `int-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return mockApiCall(newInterview, { delay: 500 });
  },

  async updateInterview(id: string, updates: Partial<Interview>): Promise<ApiResponse<Interview>> {
    const interview = mockInterviews.find(i => i.id === id);
    if (!interview) throw new Error('Interview not found');
    return mockApiCall({ ...interview, ...updates, updatedAt: new Date().toISOString() }, { delay: 400 });
  },
};
