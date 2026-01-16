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

export const performanceApi = {
  // Reviews
  async fetchReviews(staffId?: string): Promise<ApiResponse<PerformanceReview[]>> {
    let reviews = [...mockReviews];
    if (staffId) {
      reviews = reviews.filter(r => r.staffId === staffId);
    }
    return mockApiCall(reviews);
  },

  async getReviewById(id: string): Promise<ApiResponse<PerformanceReview | null>> {
    const review = mockReviews.find(r => r.id === id);
    return mockApiCall(review ?? null);
  },

  async createReview(data: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<PerformanceReview>> {
    const newReview: PerformanceReview = {
      ...data,
      id: `review-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return mockApiCall(newReview, { delay: 500 });
  },

  async updateReview(id: string, updates: Partial<PerformanceReview>): Promise<ApiResponse<PerformanceReview>> {
    const review = mockReviews.find(r => r.id === id);
    if (!review) throw new Error('Review not found');
    const updated = { ...review, ...updates, updatedAt: new Date().toISOString() };
    return mockApiCall(updated, { delay: 400 });
  },

  async submitSelfReview(id: string, ratings: ReviewRating[], summary: string): Promise<ApiResponse<PerformanceReview>> {
    const review = mockReviews.find(r => r.id === id);
    if (!review) throw new Error('Review not found');
    
    const selfRatingAvg = ratings.reduce((sum, r) => sum + (r.selfRating || 0), 0) / ratings.length;
    
    const updated: PerformanceReview = {
      ...review,
      ratings,
      overallSelfRating: Math.round(selfRatingAvg * 10) / 10,
      selfSummary: summary,
      status: 'pending_manager',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
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
    const review = mockReviews.find(r => r.id === id);
    if (!review) throw new Error('Review not found');
    
    const managerRatingAvg = ratings.reduce((sum, r) => sum + (r.managerRating || 0), 0) / ratings.filter(r => r.managerRating).length;
    
    const updated: PerformanceReview = {
      ...review,
      ratings,
      overallManagerRating: Math.round(managerRatingAvg * 10) / 10,
      managerSummary: summary,
      strengths,
      areasForImprovement,
      developmentPlan,
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return mockApiCall(updated, { delay: 500 });
  },

  // Goals
  async fetchGoals(staffId?: string): Promise<ApiResponse<Goal[]>> {
    let goals = [...mockGoals];
    if (staffId) {
      goals = goals.filter(g => g.staffId === staffId);
    }
    return mockApiCall(goals);
  },

  async getGoalById(id: string): Promise<ApiResponse<Goal | null>> {
    const goal = mockGoals.find(g => g.id === id);
    return mockApiCall(goal ?? null);
  },

  async createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Goal>> {
    const newGoal: Goal = {
      ...data,
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return mockApiCall(newGoal, { delay: 500 });
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<ApiResponse<Goal>> {
    const goal = mockGoals.find(g => g.id === id);
    if (!goal) throw new Error('Goal not found');
    const updated = { ...goal, ...updates, updatedAt: new Date().toISOString() };
    return mockApiCall(updated, { delay: 400 });
  },

  async updateGoalProgress(id: string, progress: number): Promise<ApiResponse<Goal>> {
    const goal = mockGoals.find(g => g.id === id);
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
    return mockApiCall(updated, { delay: 300 });
  },

  async deleteGoal(id: string): Promise<ApiResponse<{ id: string }>> {
    return mockApiCall({ id }, { delay: 400 });
  },

  // Feedback
  async fetchFeedback(staffId?: string, type?: 'given' | 'received'): Promise<ApiResponse<Feedback[]>> {
    let feedback = [...mockFeedback];
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
    return mockApiCall(newFeedback, { delay: 400 });
  },

  // Conversations
  async fetchConversations(staffId?: string, managerId?: string): Promise<ApiResponse<Conversation[]>> {
    let conversations = [...mockConversations];
    if (staffId) {
      conversations = conversations.filter(c => c.staffId === staffId);
    }
    if (managerId) {
      conversations = conversations.filter(c => c.managerId === managerId);
    }
    return mockApiCall(conversations);
  },

  async getConversationById(id: string): Promise<ApiResponse<Conversation | null>> {
    const conversation = mockConversations.find(c => c.id === id);
    return mockApiCall(conversation ?? null);
  },

  async createConversation(data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Conversation>> {
    const newConversation: Conversation = {
      ...data,
      id: `conv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return mockApiCall(newConversation, { delay: 500 });
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<ApiResponse<Conversation>> {
    const conversation = mockConversations.find(c => c.id === id);
    if (!conversation) throw new Error('Conversation not found');
    const updated = { ...conversation, ...updates, updatedAt: new Date().toISOString() };
    return mockApiCall(updated, { delay: 400 });
  },

  async addConversationNote(id: string, content: string, createdBy: string): Promise<ApiResponse<Conversation>> {
    const conversation = mockConversations.find(c => c.id === id);
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
    return mockApiCall(updated, { delay: 300 });
  },

  async completeConversation(id: string, actionItems: string[], nextMeetingDate?: string): Promise<ApiResponse<Conversation>> {
    const conversation = mockConversations.find(c => c.id === id);
    if (!conversation) throw new Error('Conversation not found');
    
    const updated = {
      ...conversation,
      completed: true,
      actionItems,
      nextMeetingDate,
      updatedAt: new Date().toISOString(),
    };
    return mockApiCall(updated, { delay: 400 });
  },
};
