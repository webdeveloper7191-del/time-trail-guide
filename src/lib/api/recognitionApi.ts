import { PraisePost, Survey } from '@/types/recognition';
import { mockPraisePosts, mockSurveys, mockMilestones } from '@/data/mockRecognitionData';
import { mockApiCall, ApiResponse } from './mockApi';
import { recognitionStore } from '@/lib/recognitionStore';

export const recognitionApi = {
  // Praise
  async fetchPraisePosts(): Promise<ApiResponse<PraisePost[]>> {
    return mockApiCall([...recognitionStore.get().posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  },

  async createPraisePost(data: Omit<PraisePost, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<ApiResponse<PraisePost>> {
    return mockApiCall(recognitionStore.createPost(data));
  },

  async likePraisePost(postId: string, staffId: string): Promise<ApiResponse<PraisePost>> {
    return mockApiCall(recognitionStore.like(postId, staffId));
  },

  async addComment(postId: string, staffId: string, content: string): Promise<ApiResponse<PraisePost>> {
    return mockApiCall(recognitionStore.comment(postId, staffId, content));
  },

  // Surveys
  async fetchSurveys(): Promise<ApiResponse<Survey[]>> {
    return mockApiCall([...recognitionStore.get().surveys]);
  },

  async getSurveyById(id: string): Promise<ApiResponse<Survey | null>> {
    return mockApiCall(recognitionStore.get().surveys.find(s => s.id === id) ?? null);
  },

  async createSurvey(data: Omit<Survey, 'id' | 'createdAt' | 'updatedAt' | 'responseCount'>): Promise<ApiResponse<Survey>> {
    const newSurvey: Survey = {
      ...data,
      id: `survey-${Date.now()}`,
      responseCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    recognitionStore.saveSurvey(newSurvey);
    return mockApiCall(newSurvey, { delay: 500 });
  },

  // Milestones
  async fetchMilestones(): Promise<ApiResponse<typeof mockMilestones>> {
    return mockApiCall([...mockMilestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  },
};
