import { createBrowserState } from '@/lib/browserState';
import type { PulseSurvey, PulseResponse } from '@/types/advancedPerformance';
import { pulseResults } from '@/lib/engagementLogic';

export interface ReviewDraft {
  activeStep: number;
  ratings: Record<string, { rating: number; comments: string }>;
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  developmentPlan: string;
}
export const reviewDrafts = createBrowserState<Record<string, ReviewDraft>>('rostered.performance.review-drafts.v1', {});
export const reviewDraftKey = (userId: string, reviewId: string, stage: string) => `${userId}:${reviewId}:${stage}`;
export function clearReviewDraft(key: string) {
  reviewDrafts.set(previous => { const next = { ...previous }; delete next[key]; return next; });
}

// Aggregate-only exports do not expose respondent identities or row-level anonymous answers.
export function pulseResultsCsv(survey: PulseSurvey, responses: PulseResponse[], audience: number, minimum: number): string {
  const rows = responses.filter(r => r.surveyId === survey.id);
  if (survey.anonymousResponses && rows.length < minimum) throw new Error(`Results withheld until ${minimum} responses are received.`);
  const results = pulseResults(survey, rows, audience);
  const cells: (string | number)[][] = [['Survey', 'Question', 'Type', 'Responses', 'Average', 'Value', 'Count']];
  for (const question of results.questionResults) {
    const answers = rows.flatMap(row => row.responses.filter(a => a.questionId === question.questionId));
    cells.push([survey.title, question.questionText, question.questionType, answers.length, question.averageRating ?? '', '', '']);
    for (const bucket of question.ratingDistribution ?? []) cells.push([survey.title, question.questionText, question.questionType, '', '', bucket.rating, bucket.count]);
    // Free text is deliberately omitted from aggregate downloads to reduce re-identification risk.
  }
  return '\uFEFF' + cells.map(row => row.map(value => {
    const text = String(value);
    return '"' + (/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""') + '"';
  }).join(',')).join('\r\n');
}
export function downloadPerformanceCsv(content: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}