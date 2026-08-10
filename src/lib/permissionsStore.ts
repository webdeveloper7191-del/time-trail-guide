import { useEffect, useState } from 'react';
import {
  DEFAULT_MATRIX,
  DEFAULT_ROLES,
  PermissionAction,
  PermissionMatrix,
  RoleDefinition,
} from '@/types/permissions';

const ROLES_KEY = 'rai.permissions.roles.v1';
const MATRIX_KEY = 'rai.permissions.matrix.v1';
const ASSIGN_KEY = 'rai.permissions.assignments.v1';

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
  emit();
}

export const permissionsStore = {
  getRoles: (): RoleDefinition[] => read(ROLES_KEY, DEFAULT_ROLES),
  getMatrix: (): PermissionMatrix => read(MATRIX_KEY, DEFAULT_MATRIX),
  /** staffId -> roleId */
  getAssignments: (): Record<string, string> => read(ASSIGN_KEY, {}),

  saveRoles: (roles: RoleDefinition[]) => write(ROLES_KEY, roles),
  saveMatrix: (matrix: PermissionMatrix) => write(MATRIX_KEY, matrix),
  saveAssignments: (a: Record<string, string>) => write(ASSIGN_KEY, a),

  addRole: (role: RoleDefinition, copyFromRoleId?: string) => {
    const roles = permissionsStore.getRoles();
    permissionsStore.saveRoles([...roles, role]);
    const matrix = permissionsStore.getMatrix();
    permissionsStore.saveMatrix({
      ...matrix,
      [role.id]: copyFromRoleId ? { ...(matrix[copyFromRoleId] ?? {}) } : {},
    });
  },

  deleteRole: (roleId: string) => {
    permissionsStore.saveRoles(permissionsStore.getRoles().filter(r => r.id !== roleId));
    const matrix = { ...permissionsStore.getMatrix() };
    delete matrix[roleId];
    permissionsStore.saveMatrix(matrix);
  },

  toggleAction: (roleId: string, moduleId: string, action: PermissionAction) => {
    const matrix = permissionsStore.getMatrix();
    const current = matrix[roleId]?.[moduleId] ?? [];
    const has = current.includes(action);
    let next = has ? current.filter(a => a !== action) : [...current, action];
    // Any non-view grant implies view.
    if (!has && action !== 'view' && !next.includes('view')) next = ['view', ...next];
    if (has && action === 'view') next = [];
    permissionsStore.saveMatrix({
      ...matrix,
      [roleId]: { ...(matrix[roleId] ?? {}), [moduleId]: next },
    });
  },

  setModuleActions: (roleId: string, moduleId: string, actions: PermissionAction[]) => {
    const matrix = permissionsStore.getMatrix();
    permissionsStore.saveMatrix({
      ...matrix,
      [roleId]: { ...(matrix[roleId] ?? {}), [moduleId]: actions },
    });
  },

  resetToDefaults: () => {
    write(ROLES_KEY, DEFAULT_ROLES);
    write(MATRIX_KEY, DEFAULT_MATRIX);
  },

  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function usePermissionsStore() {
  const [, force] = useState(0);
  useEffect(() => permissionsStore.subscribe(() => force(n => n + 1)), []);
  return {
    roles: permissionsStore.getRoles(),
    matrix: permissionsStore.getMatrix(),
    assignments: permissionsStore.getAssignments(),
  };
}

export function can(
  matrix: PermissionMatrix,
  roleId: string,
  moduleId: string,
  action: PermissionAction,
) {
  return (matrix[roleId]?.[moduleId] ?? []).includes(action);
}
