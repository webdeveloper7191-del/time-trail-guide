import { useSyncExternalStore } from 'react';
import { performanceConfigStore } from '@/lib/performanceConfigStore';

export function usePerformanceConfig() {
  return useSyncExternalStore(
    performanceConfigStore.subscribe,
    performanceConfigStore.get,
    performanceConfigStore.get,
  );
}