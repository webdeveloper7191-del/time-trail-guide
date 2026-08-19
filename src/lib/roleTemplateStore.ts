import { useEffect, useState } from 'react';
import { RoleDefinition } from '@/types/permissions';
import { permissionsStore } from '@/lib/permissionsStore';
import { RoleGrants, grantTotal, mergeGrants, sanitiseGrants } from '@/lib/roleGrants';

/**
 * Portable role templates.
 *
 * A template is a named snapshot of one role's grant set that can be saved,
 * downloaded as JSON and re-applied to a role in another tenant. Import
 * sanitises unknown modules/actions so a file from an older build never
 * corrupts the matrix.
 */
export interface RoleTemplate {
  id: string;
  name: string;
  description?: string;
  /** The role this snapshot was taken from. */
  sourceRole?: string;
  /** Tenant / environment the snapshot came from, free text. */
  origin?: string;
  createdAt: string;
  grants: RoleGrants;
}

export const ROLE_TEMPLATE_FORMAT = 'rostered.ai/role-template';
export const ROLE_TEMPLATE_VERSION = 1;

export interface RoleTemplateFile {
  format: typeof ROLE_TEMPLATE_FORMAT;
  version: number;
  exportedAt: string;
  template: Omit<RoleTemplate, 'id'>;
}

const KEY = 'rai.permissions.roleTemplates.v1';
const listeners = new Set<() => void>();
let cache: RoleTemplate[] | null = null;

function read(): RoleTemplate[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as RoleTemplate[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: RoleTemplate[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach(l => l());
}

const id = () => `tpl_${Math.random().toString(36).slice(2, 10)}`;

export const roleTemplateStore = {
  all: read,
  get: (templateId: string) => read().find(t => t.id === templateId),

  /** Snapshot a role's current grants as a reusable template. */
  saveFromRole: (role: RoleDefinition, name: string, description?: string): RoleTemplate => {
    const grants = permissionsStore.getMatrix()[role.id] ?? {};
    const template: RoleTemplate = {
      id: id(),
      name,
      description,
      sourceRole: role.label,
      createdAt: new Date().toISOString(),
      grants: { ...grants },
    };
    write([template, ...read()]);
    return template;
  },

  add: (template: Omit<RoleTemplate, 'id'>): RoleTemplate => {
    const next: RoleTemplate = { ...template, id: id() };
    write([next, ...read()]);
    return next;
  },

  remove: (templateId: string) => write(read().filter(t => t.id !== templateId)),

  rename: (templateId: string, name: string, description?: string) =>
    write(read().map(t => (t.id === templateId ? { ...t, name, description } : t))),

  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useRoleTemplates(): RoleTemplate[] {
  const [, force] = useState(0);
  useEffect(() => roleTemplateStore.subscribe(() => force(n => n + 1)), []);
  return read();
}

/* ------------------------------------------------------------------ */
/* Import / export                                                      */
/* ------------------------------------------------------------------ */

export function templateFile(template: Omit<RoleTemplate, 'id'>): RoleTemplateFile {
  return {
    format: ROLE_TEMPLATE_FORMAT,
    version: ROLE_TEMPLATE_VERSION,
    exportedAt: new Date().toISOString(),
    template,
  };
}

export function downloadTemplate(template: Omit<RoleTemplate, 'id'>) {
  const blob = new Blob([JSON.stringify(templateFile(template), null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-role-template.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ParsedTemplate {
  ok: boolean
  error?: string;
  template?: Omit<RoleTemplate, 'id'>;
  /** Keys/actions dropped because this build doesn't know them. */
  skipped: number;
  grantCount: number;
}

export function parseTemplate(text: string): ParsedTemplate {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That is not valid JSON.', skipped: 0, grantCount: 0 };
  }
  const obj = raw as Partial<RoleTemplateFile> & Partial<RoleTemplate>;
  const body = (obj.template ?? obj) as Partial<RoleTemplate>;
  if (!body || typeof body !== 'object' || !body.grants) {
    return {
      ok: false,
      error: 'No role grants found in this file.',
      skipped: 0,
      grantCount: 0,
    };
  }
  const { grants, skipped } = sanitiseGrants(body.grants);
  return {
    ok: true,
    skipped,
    grantCount: grantTotal(grants),
    template: {
      name: body.name || 'Imported role',
      description: body.description,
      sourceRole: body.sourceRole,
      origin: body.origin,
      createdAt: new Date().toISOString(),
      grants,
    },
  };
}

export type ApplyMode = 'replace' | 'merge';

/** Apply a template's grants to an existing role. */
export function applyTemplateToRole(roleId: string, grants: RoleGrants, mode: ApplyMode) {
  const current = permissionsStore.getMatrix()[roleId] ?? {};
  permissionsStore.setRoleGrants(roleId, mode === 'replace' ? grants : mergeGrants(current, grants));
}
