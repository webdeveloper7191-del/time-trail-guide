/**
 * Generates the permission/plan seed SQL straight from the TypeScript
 * definitions so the database can never drift from the app.
 *
 *   bun run scripts/generate-permission-seed.ts
 *
 * Emits:
 *   db/004_seed_catalog.sql            modules + sub-permissions + plans
 *   db/005_seed_plan_entitlements.sql  what each tier sells
 *   db/006_seed_role_permissions.sql   baseline role grants (role_defaults)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PERMISSION_MODULES,
  SUB_PERMISSIONS,
  DEFAULT_ROLES,
  DEFAULT_MATRIX,
  subKey,
} from '../src/types/permissions';
import { PLANS, PLAN_ORDER, buildDefaultEntitlements } from '../src/types/plans';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'db');
mkdirSync(outDir, { recursive: true });

const q = (s: string) => `'${String(s).replace(/'/g, "''")}'`;
const arr = (items: string[]) => `array[${items.map(q).join(',')}]`;
const actionArr = (a: string[]) =>
  `array[${a.map(x => `${q(x)}::public.permission_action`).join(',')}]`;
const nullable = (v: string | null) => (v === null ? 'null' : q(v));
const num = (v: number | null) => (v === null ? 'null' : String(v));

const header = (title: string) =>
  `-- =====================================================================
-- rostered.ai — ${title}
-- GENERATED FILE — do not edit by hand.
-- Source: src/types/permissions.ts, src/types/plans.ts
-- Regenerate: bun run scripts/generate-permission-seed.ts
-- =====================================================================

begin;
`;

const scopeMap: Record<string, string> = {
  Tenant: 'tenant',
  Location: 'location',
  Self: 'self',
};

/* ------------------------------------------------------------------ */
/* 004 — catalog                                                       */
/* ------------------------------------------------------------------ */
{
  const lines: string[] = [header('004_seed_catalog.sql')];

  lines.push('-- Modules -----------------------------------------------------------');
  lines.push(
    'insert into public.permission_modules (key, label, module_group, description, default_scope, actions, sort_order) values',
  );
  lines.push(
    PERMISSION_MODULES.map(
      (m, i) =>
        `  (${q(m.id)}, ${q(m.label)}, ${q(m.group)}::public.module_group, ${q(m.description)}, ` +
        `${q(scopeMap[m.scope])}::public.permission_scope, ${actionArr(m.actions)}, ${i})`,
    ).join(',\n'),
  );
  lines.push(`on conflict (key) do update set
  label = excluded.label,
  module_group = excluded.module_group,
  description = excluded.description,
  default_scope = excluded.default_scope,
  actions = excluded.actions,
  sort_order = excluded.sort_order;
`);

  const subRows: string[] = [];
  PERMISSION_MODULES.forEach(m => {
    (SUB_PERMISSIONS[m.id] ?? []).forEach((s, i) => {
      subRows.push(
        `  (${q(subKey(m.id, s.id))}, ${q(m.id)}, ${q(s.id)}, ${q(s.label)}, ${q(s.description)}, ${actionArr(s.actions)}, ${i})`,
      );
    });
  });
  lines.push('-- Sub-permissions ---------------------------------------------------');
  lines.push(
    'insert into public.permission_sub_modules (key, module_key, sub_id, label, description, actions, sort_order) values',
  );
  lines.push(subRows.join(',\n'));
  lines.push(`on conflict (key) do update set
  label = excluded.label,
  description = excluded.description,
  actions = excluded.actions,
  sort_order = excluded.sort_order;
`);

  lines.push('-- Plans --------------------------------------------------------------');
  lines.push(
    'insert into public.plans (tier, label, tagline, rank, highlights, max_locations, max_staff, max_custom_roles, max_api_credentials) values',
  );
  lines.push(
    PLAN_ORDER.map((t, i) => {
      const p = PLANS[t];
      return (
        `  (${q(t)}::public.plan_tier, ${q(p.label)}, ${q(p.tagline)}, ${i}, ${arr(p.highlights)}, ` +
        `${num(p.limits.locations)}, ${num(p.limits.staff)}, ${num(p.limits.customRoles)}, ${num(p.limits.apiCredentials)})`
      );
    }).join(',\n'),
  );
  lines.push(`on conflict (tier) do update set
  label = excluded.label,
  tagline = excluded.tagline,
  rank = excluded.rank,
  highlights = excluded.highlights,
  max_locations = excluded.max_locations,
  max_staff = excluded.max_staff,
  max_custom_roles = excluded.max_custom_roles,
  max_api_credentials = excluded.max_api_credentials;
`);

  lines.push('commit;');
  writeFileSync(resolve(outDir, '004_seed_catalog.sql'), lines.join('\n') + '\n');
}

/* ------------------------------------------------------------------ */
/* 005 — plan entitlements                                             */
/* ------------------------------------------------------------------ */
{
  const matrix = buildDefaultEntitlements();
  const rows: string[] = [];

  PLAN_ORDER.forEach(tier => {
    Object.entries(matrix[tier]).forEach(([key, actions]) => {
      const isSub = key.includes('::');
      const moduleKey = isSub ? key.split('::')[0] : key;
      actions.forEach(a => {
        rows.push(
          `  (${q(tier)}::public.plan_tier, ${q(moduleKey)}, ${nullable(isSub ? key : null)}, ${q(a)}::public.permission_action)`,
        );
      });
    });
  });

  const body = [
    header('005_seed_plan_entitlements.sql'),
    '-- The cascade trigger enforces Essentials ⊆ Growth ⊆ Enterprise, so it is',
    '-- disabled here: the generated rows already satisfy the invariant.',
    "select set_config('rostered.cascade', 'on', true);",
    '',
    'truncate table public.plan_entitlements;',
    '',
    'insert into public.plan_entitlements (tier, module_key, sub_key, action) values',
    rows.join(',\n'),
    'on conflict do nothing;',
    '',
    "select set_config('rostered.cascade', 'off', true);",
    '',
    'commit;',
  ];
  writeFileSync(resolve(outDir, '005_seed_plan_entitlements.sql'), body.join('\n') + '\n');
}

/* ------------------------------------------------------------------ */
/* 006 — role defaults + baseline grants                               */
/* ------------------------------------------------------------------ */
{
  const roleRows = DEFAULT_ROLES.map(
    (r, i) => `  (${q(r.id)}, ${q(r.label)}, ${q(r.description)}, ${i})`,
  );

  const grantRows: string[] = [];
  Object.entries(DEFAULT_MATRIX).forEach(([roleKey, modules]) => {
    Object.entries(modules).forEach(([key, actions]) => {
      const isSub = key.includes('::');
      const moduleKey = isSub ? key.split('::')[0] : key;
      actions.forEach(a => {
        grantRows.push(
          `  (${q(roleKey)}, ${q(moduleKey)}, ${nullable(isSub ? key : null)}, ${q(a)}::public.permission_action)`,
        );
      });
    });
  });

  const body = [
    header('006_seed_role_permissions.sql'),
    '-- System role catalog ------------------------------------------------',
    'insert into public.role_defaults (key, label, description, sort_order) values',
    roleRows.join(',\n'),
    `on conflict (key) do update set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;`,
    '',
    '-- Baseline grants (SUB_DENY rules already applied by DEFAULT_MATRIX) --',
    'truncate table public.role_permission_defaults;',
    '',
    'insert into public.role_permission_defaults (role_key, module_key, sub_key, action) values',
    grantRows.join(',\n'),
    'on conflict do nothing;',
    '',
    '-- Apply to every existing tenant (safe to re-run).',
    'do $$ declare t record; begin',
    '  for t in select id from public.tenants loop',
    '    perform public.seed_tenant_roles(t.id, false);',
    '  end loop;',
    'end $$;',
    '',
    'commit;',
  ];
  writeFileSync(resolve(outDir, '006_seed_role_permissions.sql'), body.join('\n') + '\n');
}

console.log('Generated db/004_seed_catalog.sql, db/005_seed_plan_entitlements.sql, db/006_seed_role_permissions.sql');
