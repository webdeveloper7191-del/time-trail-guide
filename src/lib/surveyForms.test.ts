import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formAnswersToSurvey, formTemplateToSurveyQuestions, surveyToFormTemplate } from './surveyForms';
import type { Survey } from '@/types/recognition';

const survey: Survey = { id: 'forms-survey', title: 'Team feedback', description: '', status: 'active', anonymous: true,
  questions: [{ id: 'enps', type: 'enps', text: 'Recommend us?', required: true }, { id: 'rating', type: 'rating', text: 'Score', required: true }, { id: 'yes', type: 'yes_no', text: 'Supported?', required: false }],
  startDate: '2026-10-01', endDate: '2026-10-31', responseCount: 0, targetAudience: 'all', createdBy: 'staff-1', createdAt: '2026-10-01', updatedAt: '2026-10-01' };
beforeEach(() => { localStorage.clear(); vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-18')); });
describe('Surveys connected to Forms', () => {
  it('preserves question identity and rating ranges through Forms', () => {
    const template = surveyToFormTemplate(survey);
    expect(template.fields[0].settings).toEqual({ min: 0, max: 10, step: 1 });
    expect(template.fields[1].settings).toEqual({ min: 1, max: 5, step: 1 });
    expect(formTemplateToSurveyQuestions(template).map(q => [q.id, q.type])).toEqual([['enps', 'enps'], ['rating', 'rating'], ['yes', 'yes_no']]);
  });
  it('saves one linked template and survey through a refresh', async () => {
    const { recognitionStore } = await import('./recognitionStore');
    recognitionStore.saveSurvey(survey);
    recognitionStore.saveSurvey({ ...survey, title: 'Updated feedback' });
    vi.resetModules();
    const { formTemplatesStore } = await import('./formTemplatesStore');
    const matching = formTemplatesStore.get().filter(t => t.id === 'recognition-survey:forms-survey');
    expect(matching).toHaveLength(1);
    expect(matching[0].name).toBe('Updated feedback');
  });
  it('submits Forms answers into survey results without anonymous identity', async () => {
    const { recognitionStore } = await import('./recognitionStore');
    recognitionStore.saveSurvey(survey);
    const answers = formAnswersToSurvey(survey, { enps: '9', rating: 5, yes: 'Yes' });
    const response = recognitionStore.submit(survey, 'staff-2', answers);
    expect(response.answers).toEqual([{ questionId: 'enps', value: 9 }, { questionId: 'rating', value: 5 }, { questionId: 'yes', value: 'Yes' }]);
    expect(response.staffId).toBeUndefined();
    expect(recognitionStore.get().surveys.find(s => s.id === survey.id)?.responseCount).toBe(1);
  });
});