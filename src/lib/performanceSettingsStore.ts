import { useSyncExternalStore } from 'react';
import { createBrowserState } from '@/lib/browserState';
import { performanceTaxonomyStore } from '@/lib/performanceTaxonomyStore';
import { rewardsStore } from '@/lib/rewardsStore';

export interface PerformanceSettings {
  recognition: {
    visibleInEmployeePortal: boolean;
    hideIndependentPraise: boolean;
    employeesCanAwardPoints: boolean;
    maxPointsPerPraise: number;
    requireApprovalForRewards: boolean;
  };
  surveys: { anonymousByDefault: boolean };
  goals: { allowSelfCreation: boolean };
}

const defaultSettings: PerformanceSettings = {
  recognition: { visibleInEmployeePortal: true, hideIndependentPraise: false, employeesCanAwardPoints: true, maxPointsPerPraise: 50, requireApprovalForRewards: false },
  surveys: { anonymousByDefault: true }, goals: { allowSelfCreation: true },
};
const store = createBrowserState<PerformanceSettings>('rostered.performance.settings.v1', defaultSettings);
export const performanceSettingsStore = {
  ...store,
  save(settings: PerformanceSettings) {
    store.set(settings);
    performanceTaxonomyStore.updateRules('goals', { allowSelfCreatedGoals: settings.goals.allowSelfCreation });
    performanceTaxonomyStore.updateRules('surveys', { anonymousByDefault: settings.surveys.anonymousByDefault });
    rewardsStore.saveSettings({ requireApprovalForRedemption: settings.recognition.requireApprovalForRewards });
  },
};
export function usePerformanceSettings() {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}