# Database design — Permissions, Roles, Plans & Entitlements

SQL scripts for the `/settings/permissions` module (permission matrix, roles, user
assignment, subscription plans and the editable plan-entitlement matrix).

These are **standalone scripts** — nothing here has been applied to a live database.
Run them against any PostgreSQL 15+ / Supabase instance in numeric order.

## Files

| File | Purpose |
| --- | --- |
| `001_schema.sql` | Enums, tables, indexes, `GRANT`s, RLS enablement |
| `002_functions_rls.sql` | Resolution functions (`has_permission`, `can`, `can_sub`, `plan_allows`) and RLS policies |
| `003_triggers.sql` | Cumulative plan inheritance, parent/child cascade, audit logging, tenant bootstrap |
| `004_seed_catalog.sql` | *Generated* — modules, sub-permissions, plans |
| `005_seed_plan_entitlements.sql` | *Generated* — what each tier sells |
| `006_seed_role_permissions.sql` | *Generated* — 8 system roles and their baseline grants |

```bash
psql "$DATABASE_URL" \
  -f db/001_schema.sql \
  -f db/002_functions_rls.sql \
  -f db/003_triggers.sql \
  -f db/004_seed_catalog.sql \
  -f db/005_seed_plan_entitlements.sql \
  -f db/006_seed_role_permissions.sql
```

## Regenerating the seeds

The three seed files are produced from the TypeScript definitions so the database
can never drift from the app:

```bash
bun run scripts/generate-permission-seed.ts
```

Source of truth: `src/types/permissions.ts` (`PERMISSION_MODULES`, `SUB_PERMISSIONS`,
`DEFAULT_ROLES`, `DEFAULT_MATRIX` with `SUB_DENY` applied) and `src/types/plans.ts`
(`PLANS`, `buildDefaultEntitlements()`).

## The model in one line

> Effective access = **role grant** ∩ **plan entitlement** (± tenant override), scoped by location.

```text
tenants ──< tenant_members ──> auth.users
   │                               │
   │ plan_tier                     │
   ▼                               ▼
plans ──< plan_entitlements     user_roles >── roles ──< role_permissions
   ▲              ▲   (tier sells)   │ location_id        │  (role may)
   │              │                  └────────────────────┘
plan_entitlement_overrides                     │
   (per-tenant contract deviations)            ▼
                              permission_modules ──< permission_sub_modules
```

### Key decisions

- **Roles are never stored on `profiles`/`staff`.** `user_roles` is the only place,
  and it is read through `security definer` functions so RLS policies cannot recurse.
- **Presence = permission.** `role_permissions` and `plan_entitlements` hold only
  granted rows; absence is denial. `SUB_DENY` is baked into the generated seed rather
  than stored as negative rows.
- **`sub_key IS NULL` means module-level.** Uniqueness uses
  `coalesce(sub_key, '')` so a module row and its children can coexist.
- **Cumulative tiers.** A trigger enforces `Essentials ⊆ Growth ⊆ Enterprise`:
  inserting on a tier propagates up, deleting propagates down — the SQL twin of
  `planEntitlementsStore.applyKey()`.
- **Location scope is real.** A Location Manager gets one `user_roles` row per site;
  `location_id IS NULL` means tenant-wide.
- **Everything is audited.** `permission_audit_log` captures before/after JSON for
  every change to roles, grants, assignments and entitlements.

### Client hookup

`my_effective_permissions(tenant_id)` returns the signed-in user's full capability
list already intersected with the plan — call it once on load and feed it into the
existing permissions store, replacing the three localStorage keys:

| localStorage key | Table |
| --- | --- |
| permission matrix `v2` | `role_permissions` |
| `rai.plan.entitlements.v1` | `plan_entitlements` |
| active tier | `tenants.plan_tier` |

Resource caps come from `plan_limit(tenant_id, 'locations' \| 'staff' \| 'custom_roles' \| 'api_credentials')`
(`NULL` = unlimited) and `custom_role_slots_left(tenant_id)`, which the roles RLS
policy already enforces on insert.
