import { useSyncExternalStore } from 'react';
import type { AssignedPlan, PerformancePlanTemplate, PlanStatus } from '@/types/performancePlan';
import { mockAssignedPlans, performancePlanTemplates } from '@/data/mockPerformancePlanTemplates';

interface PlanState { assignedPlans: AssignedPlan[]; customTemplates: PerformancePlanTemplate[] }
const STORAGE_KEY = 'rostered.performance.plans.v1';
const defaults = (): PlanState => ({ assignedPlans: mockAssignedPlans, customTemplates: [] });
function load(): PlanState { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults(); } catch { return defaults(); } }
let state = load();
const listeners = new Set<() => void>();
function commit(next: PlanState) { state = next; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* memory fallback */ } listeners.forEach(listener => listener()); }
const now = () => new Date().toISOString();

export const performancePlanStore = {
  subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
  getSnapshot: () => state,
  createPlan(data: Omit<AssignedPlan, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) {
    const stamp = now();
    const plan: AssignedPlan = { ...data, id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, progress: 0, createdAt: stamp, updatedAt: stamp };
    commit({ ...state, assignedPlans: [...state.assignedPlans, plan] }); return plan;
  },
  updatePlan(id: string, updates: Partial<AssignedPlan>) { const existing = state.assignedPlans.find(item => item.id === id); if (!existing) return null; const updated = { ...existing, ...updates, id: existing.id, updatedAt: now() }; commit({ ...state, assignedPlans: state.assignedPlans.map(item => item.id === id ? updated : item) }); return updated; },
  updatePlanStatus(id: string, status: PlanStatus) { if (!state.assignedPlans.some(item => item.id === id)) return false; commit({ ...state, assignedPlans: state.assignedPlans.map(item => item.id === id ? { ...item, status, updatedAt: now() } : item) }); return true; },
  deletePlan(id: string) { if (!state.assignedPlans.some(item => item.id === id)) return false; commit({ ...state, assignedPlans: state.assignedPlans.filter(item => item.id !== id) }); return true; },
  extendPlan(id: string, endDate: string) { if (!state.assignedPlans.some(item => item.id === id)) return false; commit({ ...state, assignedPlans: state.assignedPlans.map(item => item.id === id ? { ...item, endDate, updatedAt: now() } : item) }); return true; },
  createTemplate(data: Omit<PerformancePlanTemplate, 'id' | 'createdAt' | 'updatedAt'>) { const stamp = now(); const item: PerformancePlanTemplate = { ...data, id: `tpl-custom-${Date.now()}`, createdAt: stamp, updatedAt: stamp }; commit({ ...state, customTemplates: [...state.customTemplates, item] }); return item; },
  updateTemplate(id: string, updates: Partial<PerformancePlanTemplate>) { const existing = state.customTemplates.find(item => item.id === id); if (!existing) return null; const updated = { ...existing, ...updates, updatedAt: now() }; commit({ ...state, customTemplates: state.customTemplates.map(item => item.id === id ? updated : item) }); return updated; },
  deleteTemplate(id: string) { if (performancePlanTemplates.some(item => item.id === id && item.isSystem) || !state.customTemplates.some(item => item.id === id)) return false; commit({ ...state, customTemplates: state.customTemplates.filter(item => item.id !== id) }); return true; },
  archiveTemplate(id: string) { return this.deleteTemplate(id); },
};

export function usePerformancePlanStore() { return useSyncExternalStore(performancePlanStore.subscribe, performancePlanStore.getSnapshot, performancePlanStore.getSnapshot); }