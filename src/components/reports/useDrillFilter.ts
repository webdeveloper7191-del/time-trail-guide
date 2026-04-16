import { useState, useMemo, useCallback } from 'react';
import { DrillFilter } from './DrillFilterBadge';

export function useDrillFilter<T>(
  data: T[],
  filterFn: (item: T, drill: DrillFilter) => boolean
) {
  const [drill, setDrill] = useState<DrillFilter | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const drilled = useMemo(() => {
    if (!drill) return data;
    return data.filter(item => filterFn(item, drill));
  }, [data, drill, filterFn]);

  const applyDrill = useCallback((type: string, value: string, label?: string) => {
    setDrill(prev => {
      if (prev?.type === type && prev?.value === value) return null; // toggle off
      return { type, value, label };
    });
    setAnimKey(k => k + 1);
  }, []);

  const clearDrill = useCallback(() => {
    setDrill(null);
    setAnimKey(k => k + 1);
  }, []);

  return { drill, drilled, applyDrill, clearDrill, animKey };
}
