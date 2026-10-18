import { useSyncExternalStore } from 'react';
import { createBrowserState } from '@/lib/browserState';
import { mockPraisePosts, mockSurveys } from '@/data/mockRecognitionData';
import type { PraisePost, Survey, SurveyResponse } from '@/types/recognition';

interface RecognitionState { posts: PraisePost[]; surveys: Survey[]; responses: SurveyResponse[]; submitted: string[] }
const db = createBrowserState<RecognitionState>('rostered.recognition.v1', {
  posts: mockPraisePosts, surveys: mockSurveys.map(s => ({ ...s, responseCount: 0 })), responses: [], submitted: [],
});
export const recognitionStore = {
  ...db,
  createPost(data: Omit<PraisePost, 'id' | 'createdAt' | 'likes' | 'comments'>) {
    if (!data.message.trim() || !data.toStaffId || data.fromStaffId === data.toStaffId) throw new Error('Choose a colleague and enter a message.');
    const post = { ...data, message: data.message.trim(), id: crypto.randomUUID(), createdAt: new Date().toISOString(), likes: [], comments: [] };
    db.set(s => ({ ...s, posts: [post, ...s.posts] }));
    return post;
  },
  like(id: string, staffId: string) {
    const post = db.get().posts.find(p => p.id === id);
    if (!post) throw new Error('Post not found');
    const updated = { ...post, likes: post.likes.includes(staffId) ? post.likes.filter(i => i !== staffId) : [...post.likes, staffId] };
    db.set(s => ({ ...s, posts: s.posts.map(p => p.id === id ? updated : p) }));
    return updated;
  },
  comment(id: string, staffId: string, content: string) {
    const post = db.get().posts.find(p => p.id === id);
    if (!post || !content.trim()) throw new Error('Enter a comment.');
    const updated = { ...post, comments: [...post.comments, { id: crypto.randomUUID(), staffId, content: content.trim(), createdAt: new Date().toISOString() }] };
    db.set(s => ({ ...s, posts: s.posts.map(p => p.id === id ? updated : p) }));
    return updated;
  },
  saveSurvey(survey: Survey) {
    db.set(s => ({ ...s, surveys: s.surveys.some(i => i.id === survey.id) ? s.surveys.map(i => i.id === survey.id ? survey : i) : [survey, ...s.surveys] }));
  },
  submit(survey: Survey, staffId: string, answers: SurveyResponse['answers']) {
    const key = `${survey.id}:${staffId}`;
    if (db.get().submitted.includes(key)) throw new Error('You have already answered this survey.');
    validateSurveyAnswers(survey, answers);
    const response: SurveyResponse = { id: crypto.randomUUID(), surveyId: survey.id, ...(survey.anonymous ? {} : { staffId }), answers, submittedAt: new Date().toISOString() };
    db.set(s => ({ ...s, responses: [...s.responses, response], submitted: [...s.submitted, key], surveys: s.surveys.map(i => i.id === survey.id ? { ...i, responseCount: i.responseCount + 1 } : i) }));
    return response;
  },
};
export function validateSurveyAnswers(survey: Survey, answers: SurveyResponse['answers']) {
  if (survey.status !== 'active') throw new Error('This survey is not accepting responses.');
  const today = new Date().toISOString().slice(0, 10);
  if (today < survey.startDate || today > survey.endDate) throw new Error('This survey is outside its response dates.');
  for (const q of survey.questions) {
    const value = answers.find(a => a.questionId === q.id)?.value;
    if (q.required && (value === undefined || String(value).trim() === '')) throw new Error(`Answer: ${q.text}`);
    if (value === undefined || value === '') continue;
    if ((q.type === 'rating' || q.type === 'enps') && (typeof value !== 'number' || !Number.isInteger(value) || value < (q.type === 'enps' ? 0 : 1) || value > (q.type === 'enps' ? 10 : 5))) throw new Error('Choose a valid rating.');
    if (q.type === 'multiple_choice' && !q.options?.includes(String(value))) throw new Error('Choose a listed answer.');
    if (q.type === 'yes_no' && !['Yes', 'No'].includes(String(value))) throw new Error('Choose Yes or No.');
  }
}
export function useRecognitionState() { return useSyncExternalStore(db.subscribe, db.get, db.get); }