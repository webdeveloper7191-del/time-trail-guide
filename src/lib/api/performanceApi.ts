import { 
  PerformanceReview, 
  Goal, 
  Feedback, 
  Conversation,
  ReviewRating,
  ConversationNote 
} from '@/types/performance';
import { mockReviews, mockGoals, mockFeedback, mockConversations } from '@/data/mockPerformanceData';
import { mockApiCall, ApiResponse } from './mockApi';
import { useSyncExternalStore } from 'react';
import { snapshotReview, mergeReviewRatings, weightedReviewRating } from '@/lib/performanceReviewRules';

// Shared change channel so manager and staff screens stay in sync.
const recordListeners = new Set<() => void>();
let recordVersion = 0;
const notifyRecords = () => { recordVersion++; recordListeners.forEach(fn => fn()); };
export function subscribePerformanceRecords(fn: () => void) {
  recordListeners.add(fn);
  return () => { recordListeners.delete(fn); };
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key?.startsWith('rostered.performance.')) window.location.reload();
  });
}

const GOALS_STORAGE_KEY = 'rostered.performance.goals.v1';
const loadGoals = (): Goal[] => {
  if (typeof window === 'undefined') return [...mockGoals];
  try {
    const saved = window.localStorage.getItem(GOALS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [...mockGoals];
  } catch {
    return [...mockGoals];
  }
};
let persistedGoals = loadGoals();
const saveGoals = (goals: Goal[]) => {
  window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  persistedGoals = goals;
  notifyRecords();
};

function persisted<T>(key: string, seed: T[]) {
  let items: T[] = [...seed];
  try { const raw = window.localStorage.getItem(key); if (raw) items = JSON.parse(raw); } catch { /* use seed */ }
  return {
    get: () => items,
    set: (next: T[]) => { window.localStorage.setItem(key, JSON.stringify(next)); items = next; notifyRecords(); },
    upsert: (item: T & { id: string }) => {
      const exists = items.some((i: any) => i.id === item.id);
      const next = exists ? items.map((i: any) => i.id === item.id ? item : i) : [...items, item];
      window.localStorage.setItem(key, JSON.stringify(next)); items = next;
      notifyRecords();
      return item;
    },
  };
}
const reviewsDb = persisted<PerformanceReview>('rostered.performance.reviews.v1', mockReviews);
const feedbackDb = persisted<Feedback>('rostered.performance.feedback.v1', mockFeedback);
const convDb = persisted<Conversation>('rostered.performance.conversations.v1', mockConversations);

export const performanceApi = {
  // Reviews
  async fetchReviews(staffId?: string): Promise<ApiResponse<PerformanceReview[]>> {
    let reviews = [...reviewsDb.get()];
    if (staffId) {
      reviews = reviews.filter(r => r.staffId === staffId);
    }
    return mockApiCall(reviews);
  },

  async getReviewById(id: string): Promise<ApiResponse<PerformanceReview | null>> {
    const review = reviewsDb.get().find(r => r.id === id);
    return mockApiCall(review ?? null);
  },

  async createReview(data: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>, stableId?: string): Promise<ApiResponse<PerformanceReview>> {
    const existing = stableId ? reviewsDb.get().find(r=>r.id===stableId) : undefined;
    if (existing) return mockApiCall(existing);
    const newReview: PerformanceReview = {
      ...snapshotReview(data),
      id: stableId ?? crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reviewsDb.upsert(newReview);
    return mockApiCall(newReview, { delay: 500 });
  },

  async updateReview(id: string, updates: Partial<PerformanceReview>): Promise<ApiResponse<PerformanceReview>> {
    const review = reviewsDb.get().find(r => r.id === id);
    if (!review) throw new Error('Review not found');
    const updated = { ...review, ...updates, updatedAt: new Date().toISOString() };
    reviewsDb.upsert(updated);
    return mockApiCall(updated, { delay: 400 });
  },

  async submitSelfReview(id: string, ratings: ReviewRating[], summary: string): Promise<ApiResponse<PerformanceReview>> {
    const review = reviewsDb.get().find(r => r.id === id);
    if (!review) throw new Error('Review not found');
    
    const frozen = snapshotReview(review);
    const merged = mergeReviewRatings(review.ratings, ratings, 'self');
    const selfRatingAvg = weightedReviewRating({ ...frozen, ratings: merged }, 'self');
    if (selfRatingAvg === undefined) throw new Error('Rate every weighted criterion using the review scale');
    
    const updated: PerformanceReview = {
      ...frozen,
      ratings: merged,
      overallSelfRating: selfRatingAvg,
      selfSummary: summary,
      status: 'pending_manager',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reviewsDb.upsert(updated);
    return mockApiCall(updated, { delay: 500 });
  },

  async completeManagerReview(
    id: string, 
    ratings: ReviewRating[], 
    summary: string,
    strengths: string[],
    areasForImprovement: string[],
    developmentPlan: string
  ): Promise<ApiResponse<PerformanceReview>> {
    const review = reviewsDb.get().find(r => r.id === id);
    if (!review) throw new Error('Review not found');
    
    const frozen = snapshotReview(review);
    const merged = mergeReviewRatings(review.ratings, ratings, 'manager');
    const managerRatingAvg = weightedReviewRating({ ...frozen, ratings: merged }, 'manager');
    if (managerRatingAvg === undefined) throw new Error('Rate every weighted criterion using the review scale');
    
    const updated: PerformanceReview = {
      ...frozen,
      ratings: merged,
      overallManagerRating: managerRatingAvg,
      managerSummary: summary,
      strengths,
      areasForImprovement,
      developmentPlan,
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reviewsDb.upsert(updated);
    return mockApiCall(updated, { delay: 500 });
  },

  // Goals
  async fetchGoals(staffId?: string): Promise<ApiResponse<Goal[]>> {
    let goals = [...persistedGoals];
    if (staffId) {
      goals = goals.filter(g => g.staffId === staffId);
    }
    return mockApiCall(goals);
  },

  async getGoalById(id: string): Promise<ApiResponse<Goal | null>> {
    const goal = persistedGoals.find(g => g.id === id);
    return mockApiCall(goal ?? null);
  },

  async createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>, stableId?: string): Promise<ApiResponse<Goal>> {
    const existing = stableId ? persistedGoals.find(g=>g.id===stableId) : undefined;
    if (existing) return mockApiCall(existing);
    const newGoal: Goal = {
      ...data,
      id: stableId ?? crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveGoals([...persistedGoals, newGoal]);
    return mockApiCall(newGoal, { delay: 500 });
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<ApiResponse<Goal>> {
    const goal = persistedGoals.find(g => g.id === id);
    if (!goal) throw new Error('Goal not found');
    const updated = { ...goal, ...updates, updatedAt: new Date().toISOString() };
    saveGoals(persistedGoals.map(item => item.id === id ? updated : item));
    return mockApiCall(updated, { delay: 400 });
  },

  async updateGoalProgress(id: string, progress: number): Promise<ApiResponse<Goal>> {
    const goal = persistedGoals.find(g => g.id === id);
    if (!goal) throw new Error('Goal not found');
    
    const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : goal.status;
    const completedAt = progress >= 100 ? new Date().toISOString() : undefined;
    
    const updated = { 
      ...goal, 
      progress: Math.min(100, Math.max(0, progress)),
      status,
      completedAt,
      updatedAt: new Date().toISOString() 
    };
    saveGoals(persistedGoals.map(item => item.id === id ? updated : item));
    return mockApiCall(updated, { delay: 300 });
  },

  async deleteGoal(id: string): Promise<ApiResponse<{ id: string }>> {
    saveGoals(persistedGoals.filter(goal => goal.id !== id));
    return mockApiCall({ id }, { delay: 400 });
  },

  // Feedback
  async fetchFeedback(staffId?: string, type?: 'given' | 'received'): Promise<ApiResponse<Feedback[]>> {
    let feedback = [...feedbackDb.get()];
    if (staffId && type === 'given') {
      feedback = feedback.filter(f => f.fromStaffId === staffId);
    } else if (staffId && type === 'received') {
      feedback = feedback.filter(f => f.toStaffId === staffId);
    } else if (staffId) {
      feedback = feedback.filter(f => f.fromStaffId === staffId || f.toStaffId === staffId);
    }
    return mockApiCall(feedback);
  },

  async createFeedback(data: Omit<Feedback, 'id' | 'createdAt'>): Promise<ApiResponse<Feedback>> {
    const newFeedback: Feedback = {
      ...data,
      id: `feedback-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    feedbackDb.upsert(newFeedback);
    return mockApiCall(newFeedback, { delay: 400 });
  },

  // Conversations
  async fetchConversations(staffId?: string, managerId?: string): Promise<ApiResponse<Conversation[]>> {
    let conversations = [...convDb.get()];
    if (staffId) {
      conversations = conversations.filter(c => c.staffId === staffId);
    }
    if (managerId) {
      conversations = conversations.filter(c => c.managerId === managerId);
    }
    return mockApiCall(conversations);
  },

  async getConversationById(id: string): Promise<ApiResponse<Conversation | null>> {
    const conversation = convDb.get().find(c => c.id === id);
    return mockApiCall(conversation ?? null);
  },

  async createConversation(data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Conversation>> {
    const newConversation: Conversation = {
      ...data,
      id: `conv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    convDb.upsert(newConversation);
    return mockApiCall(newConversation, { delay: 500 });
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<ApiResponse<Conversation>> {
    const conversation = convDb.get().find(c => c.id === id);
    if (!conversation) throw new Error('Conversation not found');
    const updated = { ...conversation, ...updates, updatedAt: new Date().toISOString() };
    convDb.upsert(updated as Conversation);
    return mockApiCall(updated, { delay: 400 });
  },

  async addConversationNote(id: string, content: string, createdBy: string): Promise<ApiResponse<Conversation>> {
    const conversation = convDb.get().find(c => c.id === id);
    if (!conversation) throw new Error('Conversation not found');
    
    const newNote: ConversationNote = {
      id: `note-${Date.now()}`,
      content,
      createdBy,
      createdAt: new Date().toISOString(),
    };
    
    const updated = {
      ...conversation,
      notes: [...conversation.notes, newNote],
      updatedAt: new Date().toISOString(),
    };
    convDb.upsert(updated as Conversation);
    return mockApiCall(updated, { delay: 300 });
  },

  async completeConversation(id: string, actionItems: string[], nextMeetingDate?: string): Promise<ApiResponse<Conversation>> {
    const conversation = convDb.get().find(c => c.id === id);
    if (!conversation) throw new Error('Conversation not found');
    
    const updated = {
      ...conversation,
      completed: true,
      actionItems,
      nextMeetingDate,
      updatedAt: new Date().toISOString(),
    };
    convDb.upsert(updated as Conversation);
    return mockApiCall(updated, { delay: 400 });
  },
};

/** Synchronous access to the shared records (used by staff self-service). */
export const performanceRecords = {
  goals: () => persistedGoals,
  reviews: () => reviewsDb.get(),
  feedback: () => feedbackDb.get(),
  conversations: () => convDb.get(),
  saveGoal: (goal: Goal) => saveGoals(persistedGoals.some(g => g.id === goal.id) ? persistedGoals.map(g => g.id === goal.id ? goal : g) : [...persistedGoals, goal]),
  saveReview: (review: PerformanceReview) => reviewsDb.upsert(review),
};

/** Re-renders whenever any shared performance record changes. */
export function usePerformanceRecordsVersion() {
  return useSyncExternalStore(subscribePerformanceRecords, () => recordVersion);
}
