import { createMasterStore } from './factory';
import type { MasterItem } from './types';

export type TaskTypeCategory = 'operations' | 'compliance' | 'maintenance' | 'people' | 'other';
export type TaskTypeDefaultPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskTypeMaster extends MasterItem {
  category: TaskTypeCategory;
  /** Colour chip used on Kanban cards and task lists. */
  color: string;
  defaultPriority: TaskTypeDefaultPriority;
  /** Working days added to "today" to pre-fill the due date. 0 = no default. */
  defaultDueInDays: number;
  requiresLocation: boolean;
  requiresAssignee: boolean;
  requiresEvidence: boolean;
  /** Task cannot be closed until a reviewer approves it. */
  requiresApproval: boolean;
  /** Default pipeline id applied when this type is chosen (optional). */
  defaultPipelineId?: string;
}

const seed = (): TaskTypeMaster[] => ([
  {
    id: 'work_order', code: 'WO', label: 'Work Order',
    description: 'Planned operational job raised against a location or area.',
    category: 'operations', color: '#2563eb', defaultPriority: 'medium', defaultDueInDays: 3,
    requiresLocation: true, requiresAssignee: true, requiresEvidence: false, requiresApproval: false,
    status: 'active', scope: 'tenant', isSystemDefault: true,
  },
  {
    id: 'corrective_action', code: 'CA', label: 'Corrective Action',
    description: 'Follow-up raised from an incident, audit or form submission.',
    category: 'compliance', color: '#dc2626', defaultPriority: 'high', defaultDueInDays: 2,
    requiresLocation: true, requiresAssignee: true, requiresEvidence: true, requiresApproval: true,
    status: 'active', scope: 'tenant', isSystemDefault: true,
  },
  {
    id: 'maintenance_request', code: 'MR', label: 'Maintenance Request',
    description: 'Repair or servicing request for equipment or facilities.',
    category: 'maintenance', color: '#d97706', defaultPriority: 'medium', defaultDueInDays: 5,
    requiresLocation: true, requiresAssignee: false, requiresEvidence: false, requiresApproval: false,
    status: 'active', scope: 'tenant', isSystemDefault: true,
  },
]);

export const taskTypesStore = createMasterStore<TaskTypeMaster>({
  masterKey: 'taskTypes',
  storageKey: 'rai.masterData.taskTypes',
  seed,
});

/** Active task types, ready for a dropdown. */
export function getActiveTaskTypeOptions() {
  return taskTypesStore.get()
    .filter(t => t.status === 'active')
    .map(t => ({ value: t.id, label: t.label, color: t.color }));
}
