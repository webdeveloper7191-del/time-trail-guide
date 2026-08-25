import { useSyncExternalStore } from 'react';
import type {
  Feedback360Request,
  Feedback360Response,
  FeedbackSourceType,
  PulseResponse,
  PulseSurvey,
  TalentAssessment,
  WellbeingCheckIn,
  WellbeingIndicator,
  CalibrationSession,
  CalibrationRating,
} from '@/types/advancedPerformance';
import type { PerformanceImprovementPlan, PIPCheckIn, PIPOutcome, PIPStatus } from '@/types/compensation';
import type { Objective } from '@/types/okr';
import {
  mock360Requests,
  mock360Responses,
  mockPulseResponses,
  mockPulseSurveys,
  mockTalentAssessments,
  mockWellbeingCheckIns,
  mockWellbeingIndicators,
  mockCalibrationSessions,
  mockCalibrationRatings,
} from '@/data/mockAdvancedPerformanceData';
import { mockPIPs } from '@/data/mockCompensationData';
import { mockObjectives } from '@/data/mockOKRData';

export interface HappinessEntry {
  id: string;
  staffId: string;
  score: number;
  comment?: string;
  date: string;
}

interface PerformanceOperationsState {
  feedback360Requests: Feedback360Request[];
  feedback360Responses: Feedback360Response[];
  happinessEntries: HappinessEntry[];
  wellbeingIndicators: WellbeingIndicator[];
  wellbeingCheckIns: WellbeingCheckIn[];
  pulseSurveys: PulseSurvey[];
  pulseResponses: PulseResponse[];
  pips: PerformanceImprovementPlan[];
  objectives: Objective[];
  talentAssessments: TalentAssessment[];
  calibrationSessions: CalibrationSession[];
  calibrationRatings: CalibrationRating[];
}

const STORAGE_KEY = 'rostered.performance.operations.v1';
const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaults = (): PerformanceOperationsState => ({
  feedback360Requests: mock360Requests,
  feedback360Responses: mock360Responses,
  happinessEntries: [],
  wellbeingIndicators: mockWellbeingIndicators,
  wellbeingCheckIns: mockWellbeingCheckIns,
  pulseSurveys: mockPulseSurveys,
  pulseResponses: mockPulseResponses,
  pips: mockPIPs,
  objectives: mockObjectives,
  talentAssessments: mockTalentAssessments,
  calibrationSessions: mockCalibrationSessions,
  calibrationRatings: mockCalibrationRatings,
});

function load(): PerformanceOperationsState {
  if (typeof window === 'undefined') return defaults();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaults(), ...JSON.parse(saved) } : defaults();
  } catch {
    return defaults();
  }
}

let state = load();
const listeners = new Set<() => void>();
function commit(next: PerformanceOperationsState) {
  state = next;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* retain memory state */ }
  listeners.forEach(listener => listener());
}

export const performanceOperationsStore = {
  subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
  getSnapshot: () => state,
  create360Request(data: {
    subjectStaffId: string; requesterId: string; title: string; description?: string; dueDate: string;
    anonymousResponses: boolean; includeSelfAssessment: boolean; selectedCompetencies: string[];
    responders: { staffId: string; sourceType: FeedbackSourceType }[];
  }) {
    const timestamp = now();
    const requestId = uid('360-request');
    const request: Feedback360Request = {
      id: requestId, subjectStaffId: data.subjectStaffId, requesterId: data.requesterId,
      title: data.title, description: data.description, dueDate: data.dueDate, status: 'pending',
      anonymousResponses: data.anonymousResponses, selfAssessmentCompleted: false,
      createdAt: timestamp, updatedAt: timestamp,
    };
    const responders = [...data.responders];
    if (data.includeSelfAssessment && !responders.some(item => item.staffId === data.subjectStaffId)) {
      responders.unshift({ staffId: data.subjectStaffId, sourceType: 'self' });
    }
    const responses: Feedback360Response[] = responders.map(responder => ({
      id: uid('360-response'), requestId, responderId: responder.staffId, sourceType: responder.sourceType,
      isAnonymous: data.anonymousResponses && responder.sourceType !== 'self', status: 'pending',
      ratings: data.selectedCompetencies.map(competencyId => ({ competencyId, rating: 0 })), createdAt: timestamp,
    }));
    commit({ ...state, feedback360Requests: [request, ...state.feedback360Requests], feedback360Responses: [...responses, ...state.feedback360Responses] });
    return request;
  },
  submit360Response(id: string, updates: Partial<Feedback360Response>) {
    const exists = state.feedback360Responses.some(item => item.id === id);
    if (!exists) return false;
    commit({ ...state, feedback360Responses: state.feedback360Responses.map(item => item.id === id ? { ...item, ...updates, status: 'completed', submittedAt: now() } : item) });
    return true;
  },
  submitHappiness(data: Omit<HappinessEntry, 'id' | 'date'>) {
    const entry: HappinessEntry = { ...data, id: uid('happiness'), date: now() };
    commit({ ...state, happinessEntries: [entry, ...state.happinessEntries] });
    return entry;
  },
  saveWellbeingIndicator(indicator: WellbeingIndicator) {
    const exists = state.wellbeingIndicators.some(item => item.id === indicator.id);
    commit({ ...state, wellbeingIndicators: exists ? state.wellbeingIndicators.map(item => item.id === indicator.id ? indicator : item) : [indicator, ...state.wellbeingIndicators] });
  },
  addWellbeingCheckIn(data: Omit<WellbeingCheckIn, 'id' | 'createdAt'>) {
    const item: WellbeingCheckIn = { ...data, id: uid('wellbeing-checkin'), createdAt: now() };
    commit({ ...state, wellbeingCheckIns: [item, ...state.wellbeingCheckIns] });
    return item;
  },
  savePulseSurvey(survey: PulseSurvey) {
    const exists = state.pulseSurveys.some(item => item.id === survey.id);
    commit({ ...state, pulseSurveys: exists ? state.pulseSurveys.map(item => item.id === survey.id ? survey : item) : [survey, ...state.pulseSurveys] });
  },
  addPulseResponse(data: Omit<PulseResponse, 'id' | 'submittedAt'>) {
    const item: PulseResponse = { ...data, id: uid('pulse-response'), submittedAt: now() };
    commit({ ...state, pulseResponses: [item, ...state.pulseResponses] });
    return item;
  },
  savePip(pip: PerformanceImprovementPlan) {
    const exists = state.pips.some(item => item.id === pip.id);
    commit({ ...state, pips: exists ? state.pips.map(item => item.id === pip.id ? pip : item) : [pip, ...state.pips] });
  },
  cancelPips(ids: string[]) {
    const timestamp = now();
    commit({ ...state, pips: state.pips.map(item => ids.includes(item.id) ? { ...item, status: 'cancelled', updatedAt: timestamp } : item) });
  },
  addPipCheckIn(pipId: string, checkIn: Omit<PIPCheckIn, 'id'>) {
    const timestamp = now();
    commit({ ...state, pips: state.pips.map(item => item.id === pipId ? { ...item, checkIns: [...item.checkIns, { ...checkIn, id: uid('pip-checkin') }], updatedAt: timestamp } : item) });
  },
  recordPipOutcome(pipId: string, outcome: PIPOutcome, notes: string, effectiveDate?: string) {
    const status: PIPStatus = outcome === 'improved' ? 'completed_success' : outcome === 'extended' ? 'extended' : outcome === 'terminated' || outcome === 'resigned' ? 'completed_failure' : 'active';
    commit({ ...state, pips: state.pips.map(item => item.id === pipId ? { ...item, status, outcome, outcomeNotes: notes, outcomeDate: effectiveDate ?? now(), currentEndDate: outcome === 'extended' && effectiveDate ? effectiveDate : item.currentEndDate, extensionCount: outcome === 'extended' ? item.extensionCount + 1 : item.extensionCount, updatedAt: now() } : item) });
  },
  saveObjective(objective: Objective) {
    const exists = state.objectives.some(item => item.id === objective.id);
    commit({ ...state, objectives: exists ? state.objectives.map(item => item.id === objective.id ? objective : item) : [objective, ...state.objectives] });
  },
  updateKeyResult(objectiveId: string, keyResultId: string, currentValue: number) {
    commit({ ...state, objectives: state.objectives.map(objective => {
      if (objective.id !== objectiveId) return objective;
      const keyResults = objective.keyResults.map(result => result.id === keyResultId ? { ...result, currentValue, progress: Math.max(0, Math.min(100, Math.round(((currentValue - result.startValue) / Math.max(1, result.targetValue - result.startValue)) * 100))), updatedAt: now() } : result);
      return { ...objective, keyResults, progress: keyResults.length ? Math.round(keyResults.reduce((sum, item) => sum + item.progress, 0) / keyResults.length) : 0, updatedAt: now() };
    }) });
  },
  saveTalentAssessment(assessment: TalentAssessment) {
    const exists = state.talentAssessments.some(item => item.id === assessment.id);
    commit({ ...state, talentAssessments: exists ? state.talentAssessments.map(item => item.id === assessment.id ? assessment : item) : [assessment, ...state.talentAssessments] });
  },
  saveCalibrationSession(session: CalibrationSession) {
    const exists = state.calibrationSessions.some(item => item.id === session.id);
    commit({ ...state, calibrationSessions: exists ? state.calibrationSessions.map(item => item.id === session.id ? session : item) : [session, ...state.calibrationSessions] });
    return session;
  },
  updateCalibrationSession(id: string, updates: Partial<CalibrationSession>) {
    const existing = state.calibrationSessions.find(item => item.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: now() };
    commit({ ...state, calibrationSessions: state.calibrationSessions.map(item => item.id === id ? updated : item) });
    return updated;
  },
  saveCalibrationRating(rating: CalibrationRating) {
    const exists = state.calibrationRatings.some(item => item.id === rating.id);
    commit({ ...state, calibrationRatings: exists ? state.calibrationRatings.map(item => item.id === rating.id ? rating : item) : [rating, ...state.calibrationRatings] });
    return rating;
  },
};

export function usePerformanceOperations() {
  return useSyncExternalStore(performanceOperationsStore.subscribe, performanceOperationsStore.getSnapshot, performanceOperationsStore.getSnapshot);
}