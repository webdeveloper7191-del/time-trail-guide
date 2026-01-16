import { useState, useEffect, useCallback } from 'react';
import { 
  PerformanceReview, 
  Goal, 
  Feedback, 
  Conversation,
  ReviewRating 
} from '@/types/performance';
import { performanceApi } from '@/lib/api/performanceApi';
import { toast } from 'sonner';

interface UsePerformanceDataReturn {
  reviews: PerformanceReview[];
  goals: Goal[];
  feedback: Feedback[];
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  
  // Reviews
  fetchReviews: (staffId?: string) => Promise<void>;
  createReview: (data: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PerformanceReview | null>;
  submitSelfReview: (id: string, ratings: ReviewRating[], summary: string) => Promise<PerformanceReview | null>;
  completeManagerReview: (
    id: string, 
    ratings: ReviewRating[], 
    summary: string,
    strengths: string[],
    areasForImprovement: string[],
    developmentPlan: string
  ) => Promise<PerformanceReview | null>;
  
  // Goals
  fetchGoals: (staffId?: string) => Promise<void>;
  createGoal: (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Goal | null>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<Goal | null>;
  updateGoalProgress: (id: string, progress: number) => Promise<Goal | null>;
  deleteGoal: (id: string) => Promise<boolean>;
  
  // Feedback
  fetchFeedback: (staffId?: string, type?: 'given' | 'received') => Promise<void>;
  createFeedback: (data: Omit<Feedback, 'id' | 'createdAt'>) => Promise<Feedback | null>;
  
  // Conversations
  fetchConversations: (staffId?: string, managerId?: string) => Promise<void>;
  createConversation: (data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Conversation | null>;
  addConversationNote: (id: string, content: string, createdBy: string) => Promise<Conversation | null>;
  completeConversation: (id: string, actionItems: string[], nextMeetingDate?: string) => Promise<Conversation | null>;
}

export function usePerformanceData(): UsePerformanceDataReturn {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reviews
  const fetchReviews = useCallback(async (staffId?: string) => {
    setLoading(true);
    try {
      const response = await performanceApi.fetchReviews(staffId);
      if (response.data) {
        setReviews(response.data);
      }
    } catch (err) {
      setError('Failed to fetch reviews');
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  const createReview = useCallback(async (data: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceReview | null> => {
    try {
      const response = await performanceApi.createReview(data);
      if (response.data) {
        setReviews(prev => [...prev, response.data!]);
        toast.success('Review created successfully');
        return response.data;
      }
      return null;
    } catch (err) {
      toast.error('Failed to create review');
      return null;
    }
  }, []);

  const submitSelfReview = useCallback(async (id: string, ratings: ReviewRating[], summary: string): Promise<PerformanceReview | null> => {
    try {
      const response = await performanceApi.submitSelfReview(id, ratings, summary);
      if (response.data) {
        setReviews(prev => prev.map(r => r.id === id ? response.data! : r));
        toast.success('Self-review submitted successfully');
        return response.data;
      }
      return null;
    } catch (err) {
      toast.error('Failed to submit self-review');
      return null;
    }
  }, []);

  const completeManagerReview = useCallback(async (
    id: string, 
    ratings: ReviewRating[], 
    summary: string,
    strengths: string[],
    areasForImprovement: string[],
    developmentPlan: string
  ): Promise<PerformanceReview | null> => {
    try {
      const response = await performanceApi.completeManagerReview(id, ratings, summary, strengths, areasForImprovement, developmentPlan);
      if (response.data) {
        setReviews(prev => prev.map(r => r.id === id ? response.data! : r));
        toast.success('Review completed successfully');
        return response.data;
      }
      return null;
    } catch (err) {
      toast.error('Failed to complete review');
      return null;
    }
  }, []);

  // Goals
  const fetchGoals = useCallback(async (staffId?: string) => {
    setLoading(true);
    try {
      const response = await performanceApi.fetchGoals(staffId);
      if (response.data) {
        setGoals(response.data);
      }
    } catch (err) {
      setError('Failed to fetch goals');
      toast.error('Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, []);

  const createGoal = useCallback(async (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal | null> => {
    try {
      const response = await performanceApi.createGoal(data);
      if (response.data) {
        setGoals(prev => [...prev, response.data!]);
        toast.success('Goal created successfully');
        return response.data;
      }
      return null;
    } catch (err) {
      toast.error('Failed to create goal');
      return null;
    }
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>): Promise<Goal | null> => {
    try {
      const response = await performanceApi.updateGoal(id, updates);
      if (response.data) {
        setGoals(prev => prev.map(g => g.id === id ? response.data! : g));
        toast.success('Goal updated successfully');
        return response.data;
      }
      return null;
    } catch (err) {
      toast.error('Failed to update goal');
      return null;
    }
  }, []);

  const updateGoalProgress = useCallback(async (id: string, progress: number): Promise<Goal | null> => {
    try {
      const response = await performanceApi.updateGoalProgress(id, progress);
      if (response.data) {
        setGoals(prev => prev.map(g => g.id === id ? response.data! : g));
        if (progress >= 100) {
          toast.success('Goal completed! 🎉');
        }
        return response.data;
      }
      return null;
    } catch (err) {
      toast.error('Failed to update progress');
      return null;
    }
  }, []);

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      await performanceApi.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      toast.success('Goal deleted');
      return true;
    } catch (err) {
      toast.error('Failed to delete goal');
      return false;
    }
  }, []);

  // Feedback
  const fetchFeedback = useCallback(async (staffId?: string, type?: 'given' | 'received') => {
    setLoading(true);
    try {
      const response = await performanceApi.fetchFeedback(staffId, type);
      if (response.data) {
        setFeedback(response.data);
      }
    } catch (err) {
      setError('Failed to fetch feedback');
      toast.error('Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  }, []);

  const createFeedback = useCallback(async (data: Omit<Feedback, 'id' | 'createdAt'>): Promise<Feedback | null> => {
    try {
      const response = await performanceApi.createFeedback(data);
      if (response.data) {
        setFeedback(prev => [response.data!, ...prev]);
        toast.success('Feedback sent successfully');
        return response.data;
      }
      return null;
    } catch (err) {
      toast.error('Failed to send feedback');
      return null;
    }
  }, []);

  // Conversations
  const fetchConversations = useCallback(async (staffId?: string, managerId?: string) => {
    setLoading(true);
    try {
      const response = await performanceApi.fetchConversations(staffId, managerId);
      if (response.data) {
        setConversations(response.data);
      }
    } catch (err) {
      setError('Failed to fetch conversations');
      toast.error('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (data: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conversation | null> => {
    try {
      const response = await performanceApi.createConversation(data);
      if (response.data) {
        setConversations(prev => [...prev, response.data!]);
        toast.success('Meeting scheduled successfully');
        return response.data;
      }
      return null;
    } catch (err) {
      toast.error('Failed to schedule meeting');
      return null;
    }
  }, []);

  const addConversationNote = useCallback(async (id: string, content: string, createdBy: string): Promise<Conversation | null> => {
    try {
      const response = await performanceApi.addConversationNote(id, content, createdBy);
      if (response.data) {
        setConversations(prev => prev.map(c => c.id === id ? response.data! : c));
        toast.success('Note added');
        return response.data;
      }
      return null;
    } catch (err) {
      toast.error('Failed to add note');
      return null;
    }
  }, []);

  const completeConversation = useCallback(async (id: string, actionItems: string[], nextMeetingDate?: string): Promise<Conversation | null> => {
    try {
      const response = await performanceApi.completeConversation(id, actionItems, nextMeetingDate);
      if (response.data) {
        setConversations(prev => prev.map(c => c.id === id ? response.data! : c));
        toast.success('Meeting completed');
        return response.data;
      }
      return null;
    } catch (err) {
      toast.error('Failed to complete meeting');
      return null;
    }
  }, []);

  return {
    reviews,
    goals,
    feedback,
    conversations,
    loading,
    error,
    fetchReviews,
    createReview,
    submitSelfReview,
    completeManagerReview,
    fetchGoals,
    createGoal,
    updateGoal,
    updateGoalProgress,
    deleteGoal,
    fetchFeedback,
    createFeedback,
    fetchConversations,
    createConversation,
    addConversationNote,
    completeConversation,
  };
}
