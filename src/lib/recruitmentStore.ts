import { useEffect, useState } from 'react';
import { JobPosting, Applicant, Interview, ApplicationStatus, PipelineStageConfig, defaultPipelineStages } from '@/types/recruitment';
import { mockJobs, mockApplicants, mockInterviews } from '@/data/mockRecruitmentData';

const KEY = 'rai.recruitment.v1';

interface State { jobs: JobPosting[]; applicants: Applicant[]; interviews: Interview[]; pipeline: PipelineStageConfig[] }

const now = () => new Date().toISOString();
const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

let cache: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      // Migration: convert string[] screeningQuestions to ScreeningQuestion[]
      parsed.jobs = (parsed.jobs || []).map(j => {
        if (Array.isArray(j.screeningQuestions) && j.screeningQuestions.length > 0 && typeof j.screeningQuestions[0] === "string") {
          return {
            ...j,
            screeningQuestions: (j.screeningQuestions as unknown as string[]).map(q => ({
              id: uid("q"),
              text: q,
              type: "text" as const,
              isRequired: false,
              isCustom: true
            }))
          };
        }
        return j;
      });
      if (!Array.isArray(parsed.pipeline) || parsed.pipeline.length === 0) {
        parsed.pipeline = [...defaultPipelineStages];
      }
      cache = parsed;
      return cache!;
    }
  } catch { /* ignore */ }
  cache = { jobs: [...mockJobs], applicants: [...mockApplicants], interviews: [...mockInterviews], pipeline: [...defaultPipelineStages] };
  return cache;
}

function save(next: State) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach(l => l());
}

export const recruitmentStore = {
  get: load,
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },

  saveJob(job: Partial<JobPosting> & { title: string }): JobPosting {
    const s = load();
    const existing = job.id ? s.jobs.find(j => j.id === job.id) : undefined;
    const merged: JobPosting = existing
      ? { ...existing, ...job, updatedAt: now() } as JobPosting
      : {
          department: '', location: '', employmentType: 'full_time', description: '',
          requirements: [], responsibilities: [], benefits: [], status: 'draft',
          hiringManagerId: '', applicantCount: 0, ...job,
          id: uid('job'), createdAt: now(), updatedAt: now(),
        } as JobPosting;
    if (merged.status === 'open' && !merged.postedAt) merged.postedAt = now();
    save({ ...s, jobs: existing ? s.jobs.map(j => j.id === merged.id ? merged : j) : [merged, ...s.jobs] });
    return merged;
  },

  setJobStatus(id: string, status: JobPosting['status']) {
    const s = load();
    const job = s.jobs.find(j => j.id === id);
    if (job) this.saveJob({ ...job, status });
  },

  deleteJob(id: string) {
    const s = load();
    save({
      jobs: s.jobs.filter(j => j.id !== id),
      applicants: s.applicants.filter(a => a.jobId !== id),
      interviews: s.interviews.filter(i => i.jobId !== id),
    });
  },

  addApplicant(a: Omit<Applicant, 'id' | 'appliedAt' | 'updatedAt' | 'notes' | 'status' | 'rating'> & Partial<Applicant>): Applicant {
    const s = load();
    const app: Applicant = { notes: [], status: 'new', rating: 0, ...a, id: uid('app'), appliedAt: now(), updatedAt: now() } as Applicant;
    save({ ...s, applicants: [app, ...s.applicants] });
    return app;
  },

  updateApplicant(id: string, updates: Partial<Applicant>) {
    const s = load();
    save({ ...s, applicants: s.applicants.map(a => a.id === id ? { ...a, ...updates, updatedAt: now() } : a) });
  },

  moveApplicant(id: string, status: string, note?: string) {
    const s = load();
    const app = s.applicants.find(a => a.id === id);
    if (!app) return;
    const notes = note ? [...app.notes, { id: uid('n'), content: note, createdBy: 'admin-1', createdAt: now() }] : app.notes;
    this.updateApplicant(id, { status, notes });
  },

  addNote(id: string, content: string) {
    const app = load().applicants.find(a => a.id === id);
    if (!app) return;
    this.updateApplicant(id, { notes: [...app.notes, { id: uid('n'), content, createdBy: 'admin-1', createdAt: now() }] });
  },

  scheduleInterview(data: Omit<Interview, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
    const s = load();
    const iv: Interview = { ...data, status: 'scheduled', id: uid('int'), createdAt: now(), updatedAt: now() };
    const applicants = s.applicants.map(a =>
      a.id === data.applicantId && (a.status === 'new' || a.status === 'screening') ? { ...a, status: 'interview' as const, updatedAt: now() } : a);
    save({ ...s, interviews: [...s.interviews, iv], applicants });
  },

  updateInterview(id: string, updates: Partial<Interview>) {
    const s = load();
    save({ ...s, interviews: s.interviews.map(i => i.id === id ? { ...i, ...updates, updatedAt: now() } : i) });
  },

  // ----- Editable pipeline stages -----
  renameStage(id: string, label: string) {
    const s = load();
    const trimmed = label.trim();
    if (!trimmed) return;
    save({ ...s, pipeline: s.pipeline.map(p => p.id === id ? { ...p, label: trimmed } : p) });
  },

  addStage(label: string): PipelineStageConfig | null {
    const s = load();
    const trimmed = label.trim();
    if (!trimmed) return null;
    // Insert before 'hired' so hired stays last
    const stage: PipelineStageConfig = { id: uid('stage'), label: trimmed, builtIn: false };
    const idx = s.pipeline.findIndex(p => p.id === 'hired');
    const pipeline = [...s.pipeline];
    pipeline.splice(idx === -1 ? pipeline.length : idx, 0, stage);
    save({ ...s, pipeline });
    return stage;
  },

  /** Only stages with no applicants can be removed. Returns false if blocked. */
  removeStage(id: string): boolean {
    const s = load();
    if (s.applicants.some(a => a.status === id)) return false;
    save({ ...s, pipeline: s.pipeline.filter(p => p.id !== id) });
    return true;
  },

  moveStage(id: string, direction: -1 | 1) {
    const s = load();
    const idx = s.pipeline.findIndex(p => p.id === id);
    const target = idx + direction;
    if (idx === -1 || target < 0 || target >= s.pipeline.length) return;
    const pipeline = [...s.pipeline];
    [pipeline[idx], pipeline[target]] = [pipeline[target], pipeline[idx]];
    save({ ...s, pipeline });
  },

  reset() { localStorage.removeItem(KEY); cache = null; load(); listeners.forEach(l => l()); },
};

/** Applicant count is always derived from live applicants, never the stored number. */
export function applicantCountFor(jobId: string, applicants: Applicant[]) {
  return applicants.filter(a => a.jobId === jobId && a.status !== 'withdrawn').length;
}

export function useRecruitment() {
  const [state, setState] = useState(load());
  useEffect(() => recruitmentStore.subscribe(() => setState({ ...load() })), []);
  return state;
}
