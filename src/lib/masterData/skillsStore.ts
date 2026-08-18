import { createMasterStore } from './factory';
import type { MasterItem } from './types';

export type SkillCategory = 'clinical' | 'safety' | 'compliance' | 'technical' | 'operational' | 'leadership' | 'language' | 'other';

export interface SkillMaster extends MasterItem {
  category: SkillCategory;
  /** Default weight (0-100) used by the roster skill-matching engine. */
  matchWeight: number;
  /** Minimum proficiency level (1-5) expected when this skill is required. */
  defaultMinimumLevel: number;
  /** Blocks assignment when the staff member does not hold this skill. */
  mandatoryForAssignment: boolean;
  /** Skill is backed by a certificate that can lapse. */
  requiresEvidence: boolean;
  expiryMonths?: number;
}

const seed = (): SkillMaster[] => ([
  { id: 'sk-first-aid',   code: 'FA',    label: 'First Aid',            category: 'safety',      matchWeight: 90, defaultMinimumLevel: 3, mandatoryForAssignment: true,  requiresEvidence: true,  expiryMonths: 36, status: 'active', scope: 'tenant', isSystemDefault: true, description: 'Current first aid certification.' },
  { id: 'sk-cpr',         code: 'CPR',   label: 'CPR',                  category: 'safety',      matchWeight: 90, defaultMinimumLevel: 3, mandatoryForAssignment: true,  requiresEvidence: true,  expiryMonths: 12, status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'sk-food-safety', code: 'FDS',   label: 'Food Safety',          category: 'compliance',  matchWeight: 60, defaultMinimumLevel: 3, mandatoryForAssignment: false, requiresEvidence: true,  expiryMonths: 24, status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'sk-manual-hand', code: 'MH',    label: 'Manual Handling',      category: 'safety',      matchWeight: 50, defaultMinimumLevel: 2, mandatoryForAssignment: false, requiresEvidence: true,  expiryMonths: 24, status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'sk-leadership',  code: 'LEAD',  label: 'Leadership',           category: 'leadership',  matchWeight: 40, defaultMinimumLevel: 3, mandatoryForAssignment: false, requiresEvidence: false, status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'sk-comms',       code: 'COMM',  label: 'Client Communication', category: 'operational', matchWeight: 40, defaultMinimumLevel: 3, mandatoryForAssignment: false, requiresEvidence: false, status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'sk-med-admin',   code: 'MEDA',  label: 'Medication Administration', category: 'clinical', matchWeight: 85, defaultMinimumLevel: 4, mandatoryForAssignment: true, requiresEvidence: true, expiryMonths: 12, status: 'active', scope: 'tenant', isSystemDefault: true },
  { id: 'sk-systems',     code: 'SYS',   label: 'Systems / Rostering Tools', category: 'technical', matchWeight: 25, defaultMinimumLevel: 2, mandatoryForAssignment: false, requiresEvidence: false, status: 'active', scope: 'tenant', isSystemDefault: true },
]);

export const skillsStore = createMasterStore<SkillMaster>({
  masterKey: 'skills',
  storageKey: 'rai.masterData.skills',
  seed,
});
