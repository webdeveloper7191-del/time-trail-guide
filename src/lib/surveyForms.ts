import type { FormTemplate, FormField } from '@/types/forms';
import type { Survey, SurveyQuestion, SurveyResponse } from '@/types/recognition';

export function surveyToFormTemplate(survey: Survey): FormTemplate {
  return {
    id: survey.formTemplateId ?? `recognition-survey:${survey.id}`, name: survey.title,
    description: survey.description, category: 'custom', version: 1,
    status: survey.status === 'active' ? 'published' : survey.status === 'closed' ? 'archived' : 'draft',
    scope: 'tenant', isEnabled: survey.status !== 'closed', sections: [],
    fields: survey.questions.map((q, order): FormField => ({
      id: q.id, label: q.text, required: q.required, order,
      type: q.type === 'text' ? 'long_text' : q.type === 'rating' || q.type === 'enps' ? 'number' : 'radio',
      settings: q.type === 'rating' || q.type === 'enps' ? { min: q.type === 'enps' ? 0 : 1, max: q.type === 'enps' ? 10 : 5, step: 1 } : undefined,
      options: (q.type === 'yes_no' ? ['Yes', 'No'] : q.options)?.map((value, i) => ({ id: `${q.id}:${i}`, label: value, value })),
    })),
    createdAt: survey.createdAt, updatedAt: survey.updatedAt, createdBy: survey.createdBy,
  };
}

export function formTemplateToSurveyQuestions(template: FormTemplate): SurveyQuestion[] {
  return [...template.fields].sort((a, b) => a.order - b.order).map(field => {
    const base = { id: field.id, text: field.label, required: field.required };
    if (field.type === 'short_text' || field.type === 'long_text') return { ...base, type: 'text' };
    if (field.type === 'number' && field.settings?.min === 0 && field.settings.max === 10) return { ...base, type: 'enps' };
    if (field.type === 'number' && field.settings?.min === 1 && field.settings.max === 5) return { ...base, type: 'rating' };
    if (field.type === 'radio' || field.type === 'dropdown') {
      const options = field.options?.map(o => o.value) ?? [];
      return { ...base, type: options.length === 2 && options.includes('Yes') && options.includes('No') ? 'yes_no' : 'multiple_choice', options };
    }
    throw new Error(`“${field.label}” is not a supported survey question. Use text, choices or a number from 1–5 or 0–10.`);
  });
}

export function formAnswersToSurvey(survey: Survey, data: Record<string, unknown>): SurveyResponse['answers'] {
  return survey.questions.flatMap(q => {
    const value = data[q.id];
    if (value === undefined || value === null || value === '') return [];
    if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Choose a valid answer.');
    return [{ questionId: q.id, value: q.type === 'rating' || q.type === 'enps' ? Number(value) : value }];
  });
}