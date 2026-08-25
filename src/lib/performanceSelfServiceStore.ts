/**
 * Employee self-service overlay for the Performance module.
 *
 * The admin-side performance data lives in mock fixtures. Employee actions
 * taken from the Employee Portal (goal progress updates, self-review
 * submissions, 1:1 prep notes, plan acknowledgements, feedback requests) are
 * captured here and merged over the fixtures at read time, so the portal
 * behaves like a real self-service surface without touching admin state.
 */
import { useEffect, useState } from 'react';
import type { Goal, PerformanceReview, ReviewRating, Conversation } from '@/types/performance';

const STORAGE_KEY = 'rostered.performance.selfService.v1';

export interface GoalProgressUpdate {
  progress: number;
  /** Milestone ids the employee has ticked off. */
  completedMilestoneIds: string[];
  note?: string;
  updatedAt: string;
}

export interface SelfReviewSubmission {
  ratings: ReviewRating[];
  summary: string;
  careerAspirations?: string;
  submittedAt: string;
}

export interface ConversationPrep {
  /** Talking points the employee wants to raise. */
  talkingPoints: string;
  /** Action items the employee has ticked off. */
  completedActionItems: string[];
  updatedAt: string;
}

export interface PlanAcknowledgement {
  acknowledgedAt: string;
  comment?: string;
}

export type FeedbackRequestStatus = 'pending' | 'completed' | 'declined';

export interface FeedbackRequest {
  id: string;
  fromStaffId: string;
  toStaffId: string;
  toStaffName: string;
  topic: string;
  message: string;
  status: FeedbackRequestStatus;
  createdAt: string;
}

interface SelfServiceState {
  goalProgress: Record<string, GoalProgressUpdate>;
  selfReviews: Record<string, SelfReviewSubmission>;
  conversationPrep: Record<string, ConversationPrep>;
  planAcknowledgements: Record<string, PlanAcknowledgement>;
  feedbackRequests: FeedbackRequest[];
}

const emptyState = (): SelfServiceState => ({
  goalProgress: {},
  selfReviews: {},
  conversationPrep: {},
  planAcknowledgements: {},
  feedbackRequests: [],
});

function load(): SelfServiceState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    /* ignore malformed cache */
  }
  return emptyState();
}

let state: SelfServiceState = load();
const listeners = new Set<(s: SelfServiceState) => void>();

function emit() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — keep in-memory state */
  }
  listeners.forEach(fn => fn(state));
}

export const performanceSelfService = {
  get: () => state,

  saveGoalProgress(goalId: string, update: Omit<GoalProgressUpdate, 'updatedAt'>) {
    state = {
      ...state,
      goalProgress: {
        ...state.goalProgress,
        [goalId]: { ...update, updatedAt: new Date().toISOString() },
      },
    };
    emit();
  },

  submitSelfReview(reviewId: string, submission: Omit<SelfReviewSubmission, 'submittedAt'>) {
    state = {
      ...state,
      selfReviews: {
        ...state.selfReviews,
        [reviewId]: { ...submission, submittedAt: new Date().toISOString() },
      },
    };
    emit();
  },

  saveConversationPrep(conversationId: string, prep: Omit<ConversationPrep, 'updatedAt'>) {
    state = {
      ...state,
      conversationPrep: {
        ...state.conversationPrep,
        [conversationId]: { ...prep, updatedAt: new Date().toISOString() },
      },
    };
    emit();
  },

  acknowledgePlan(planId: string, comment?: string) {
    state = {
      ...state,
      planAcknowledgements: {
        ...state.planAcknowledgements,
        [planId]: { acknowledgedAt: new Date().toISOString(), comment },
      },
    };
    emit();
  },

  requestFeedback(input: Omit<FeedbackRequest, 'id' | 'status' | 'createdAt'>) {
    const request: FeedbackRequest = {
      ...input,
      id: `freq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    state = { ...state, feedbackRequests: [request, ...state.feedbackRequests] };
    emit();
    return request;
  },

  cancelFeedbackRequest(id: string) {
    state = {
      ...state,
      feedbackRequests: state.feedbackRequests.filter(r => r.id !== id),
    };
    emit();
  },

  reset() {
    state = emptyState();
    emit();
  },
};

/** Subscribe a component to the self-service overlay. */
export function usePerformanceSelfService(): SelfServiceState {
  const [snapshot, setSnapshot] = useState(state);
  useEffect(() => {
    const fn = (s: SelfServiceState) => setSnapshot(s);
    listeners.add(fn);
    setSnapshot(state);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return snapshot;
}

// ---------------------------------------------------------------------------
// Merge helpers — apply employee edits over the admin fixtures.
// ---------------------------------------------------------------------------

export function applyGoalOverlay(goal: Goal, overlay: SelfServiceState): Goal {
  const update = overlay.goalProgress[goal.id];
  if (!update) return goal;
  const milestones = goal.milestones.map(m =>
    update.completedMilestoneIds.includes(m.id)
      ? { ...m, completed: true, completedAt: m.completedAt ?? update.updatedAt }
      : { ...m, completed: false, completedAt: undefined },
  );
  const status: Goal['status'] =
    update.progress >= 100 ? 'completed' : update.progress > 0 ? 'in_progress' : goal.status;
  return {
    ...goal,
    progress: update.progress,
    milestones,
    status,
    completedAt: update.progress >= 100 ? update.updatedAt : undefined,
    updatedAt: update.updatedAt,
  };
}

export function applyReviewOverlay(
  review: PerformanceReview,
  overlay: SelfServiceState,
): PerformanceReview {
  const submission = overlay.selfReviews[review.id];
  if (!submission) return review;
  const rated = submission.ratings.filter(r => typeof r.selfRating === 'number');
  const avg = rated.length
    ? rated.reduce((sum, r) => sum + (r.selfRating ?? 0), 0) / rated.length
    : undefined;
  return {
    ...review,
    ratings: submission.ratings,
    overallSelfRating: avg ? Math.round(avg * 10) / 10 : review.overallSelfRating,
    selfSummary: submission.summary,
    careerAspirations: submission.careerAspirations ?? review.careerAspirations,
    status: review.status === 'pending_self' ? 'pending_manager' : review.status,
    submittedAt: submission.submittedAt,
    updatedAt: submission.submittedAt,
  };
}

export function applyConversationOverlay(
  conversation: Conversation,
  overlay: SelfServiceState,
): Conversation & { talkingPoints?: string; completedActionItems: string[] } {
  const prep = overlay.conversationPrep[conversation.id];
  return {
    ...conversation,
    talkingPoints: prep?.talkingPoints,
    completedActionItems: prep?.completedActionItems ?? [],
  };
}
