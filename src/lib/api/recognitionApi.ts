import { PraisePost, Survey } from '@/types/recognition';
import { mockPraisePosts, mockSurveys, mockMilestones } from '@/data/mockRecognitionData';
import { mockApiCall, ApiResponse } from './mockApi';

export const recognitionApi = {
  // Praise
  async fetchPraisePosts(): Promise<ApiResponse<PraisePost[]>> {
    return mockApiCall([...mockPraisePosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  },

  async createPraisePost(data: Omit<PraisePost, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<ApiResponse<PraisePost>> {
    const newPost: PraisePost = {
      ...data,
      id: `praise-${Date.now()}`,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    return mockApiCall(newPost, { delay: 400 });
  },

  async likePraisePost(postId: string, staffId: string): Promise<ApiResponse<PraisePost>> {
    const post = mockPraisePosts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    const likes = post.likes.includes(staffId) ? post.likes.filter(id => id !== staffId) : [...post.likes, staffId];
    return mockApiCall({ ...post, likes }, { delay: 200 });
  },

  async addComment(postId: string, staffId: string, content: string): Promise<ApiResponse<PraisePost>> {
    const post = mockPraisePosts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    const newComment = { id: `c-${Date.now()}`, staffId, content, createdAt: new Date().toISOString() };
    return mockApiCall({ ...post, comments: [...post.comments, newComment] }, { delay: 300 });
  },

  // Surveys
  async fetchSurveys(): Promise<ApiResponse<Survey[]>> {
    return mockApiCall([...mockSurveys]);
  },

  async getSurveyById(id: string): Promise<ApiResponse<Survey | null>> {
    return mockApiCall(mockSurveys.find(s => s.id === id) ?? null);
  },

  async createSurvey(data: Omit<Survey, 'id' | 'createdAt' | 'updatedAt' | 'responseCount'>): Promise<ApiResponse<Survey>> {
    const newSurvey: Survey = {
      ...data,
      id: `survey-${Date.now()}`,
      responseCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return mockApiCall(newSurvey, { delay: 500 });
  },

  // Milestones
  async fetchMilestones(): Promise<ApiResponse<typeof mockMilestones>> {
    return mockApiCall([...mockMilestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  },
};
