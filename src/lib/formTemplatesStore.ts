import { useSyncExternalStore } from 'react';
import { createBrowserState } from '@/lib/browserState';
import { mockFormTemplates } from '@/data/mockFormData';
import type { FormTemplate } from '@/types/forms';

const db = createBrowserState<FormTemplate[]>('rostered.formTemplates.v1', mockFormTemplates.map(t => ({
  ...t, scope: t.scope || 'tenant', isEnabled: t.isEnabled ?? true,
  isIndustryTemplate: t.isIndustryTemplate ?? (t.scope === 'system'),
})));
export const formTemplatesStore = {
  ...db,
  save(template: FormTemplate) {
    db.set(templates => templates.some(t => t.id === template.id)
      ? templates.map(t => t.id === template.id ? template : t) : [template, ...templates]);
  },
};
export function useFormTemplates() {
  return useSyncExternalStore(db.subscribe, db.get, db.get);
}