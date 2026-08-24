import { FormTemplate } from '@/types/forms';

export interface FormIndustry {
  id: string;
  label: string;
  /** substring matched against the template id for legacy mock data */
  pattern?: string;
}

export const FORM_INDUSTRIES: FormIndustry[] = [
  { id: 'childcare', label: 'Childcare & Early Learning', pattern: '-childcare-' },
  { id: 'agedcare', label: 'Aged Care & Disability', pattern: '-agedcare-' },
  { id: 'healthcare', label: 'Healthcare & Hospital', pattern: '-hospital-' },
  { id: 'retail', label: 'Retail', pattern: '-retail-' },
  { id: 'cleaning', label: 'Cleaning & Facilities', pattern: '-cleaning-' },
  { id: 'hospitality', label: 'Hospitality', pattern: '-hospitality-' },
  { id: 'construction', label: 'Construction', pattern: '-construction-' },
  { id: 'security', label: 'Security', pattern: '-security-' },
  { id: 'manufacturing', label: 'Manufacturing & Logistics', pattern: '-manufacturing-' },
  { id: 'general', label: 'General / Any industry' },
];

export function getTemplateIndustry(template: FormTemplate): string {
  if (template.industry) return template.industry;
  const match = FORM_INDUSTRIES.find(i => i.pattern && template.id.includes(i.pattern));
  return match?.id ?? 'general';
}

export function getIndustryLabel(id: string): string {
  return FORM_INDUSTRIES.find(i => i.id === id)?.label ?? 'General / Any industry';
}
