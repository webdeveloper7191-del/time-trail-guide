import { Badge } from '@/components/ui/badge';
import { GenericMasterPanel, type FieldDef } from './GenericMasterPanel';
import { skillsStore, type SkillMaster } from '@/lib/masterData/skillsStore';
import type { MasterColumn } from '@/lib/masterData/types';

const columns: MasterColumn<SkillMaster>[] = [
  { key: 'label', header: 'Skill', render: i => <span className="font-medium">{i.label}</span> },
  { key: 'code', header: 'Code', render: i => <code className="text-xs">{i.code}</code> },
  { key: 'category', header: 'Category', render: i => <Badge variant="outline">{i.category}</Badge> },
  { key: 'weight', header: 'Match weight', render: i => `${i.matchWeight}` },
  { key: 'level', header: 'Min level', render: i => `L${i.defaultMinimumLevel}` },
  { key: 'mandatory', header: 'Mandatory', render: i => i.mandatoryForAssignment ? 'Yes' : '—' },
  { key: 'evidence', header: 'Evidence', render: i => i.requiresEvidence ? (i.expiryMonths ? `${i.expiryMonths} mo` : 'Yes') : '—' },
];

const fields: FieldDef<SkillMaster>[] = [
  { key: 'category', type: 'select', label: 'Category', help: 'Groups the skill in staff profiles and shift requirement pickers.',
    options: [
      { value: 'clinical', label: 'Clinical' }, { value: 'safety', label: 'Safety' },
      { value: 'compliance', label: 'Compliance' }, { value: 'technical', label: 'Technical' },
      { value: 'operational', label: 'Operational' }, { value: 'leadership', label: 'Leadership' },
      { value: 'language', label: 'Language' }, { value: 'other', label: 'Other' },
    ] },
  { key: 'matchWeight', type: 'number', label: 'Default match weight (0-100)', help: 'Weighting used by the roster skill-matching score when this skill is requested.' },
  { key: 'defaultMinimumLevel', type: 'number', label: 'Default minimum level (1-5)', help: 'Proficiency level assumed when a shift requires this skill.' },
  { key: 'expiryMonths', type: 'number', label: 'Evidence validity (months)', help: 'Leave blank if the skill never lapses.' },
  { key: 'mandatoryForAssignment', type: 'toggle', label: 'Mandatory for assignment', help: 'Blocks rostering staff who do not hold this skill.' },
  { key: 'requiresEvidence', type: 'toggle', label: 'Requires evidence', help: 'Staff must upload a certificate or record for this skill.' },
];

export function SkillsMasterPanel() {
  return (
    <GenericMasterPanel<SkillMaster>
      title="Skills"
      description="Competencies used by skill matching, shift requirements and staff profiles. Weights and minimum levels feed the roster matching score."
      store={skillsStore}
      columns={columns}
      fields={fields}
      newItem={() => ({
        id: `sk-${Date.now().toString(36)}`, code: '', label: '', category: 'operational',
        matchWeight: 50, defaultMinimumLevel: 3, mandatoryForAssignment: false, requiresEvidence: false,
        status: 'active', scope: 'tenant', isSystemDefault: false, usageCount: 0,
      })}
    />
  );
}
