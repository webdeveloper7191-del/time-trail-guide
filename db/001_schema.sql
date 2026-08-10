-- =====================================================================
-- rostered.ai — Permissions, Roles, Plans & Entitlements
-- 001_schema.sql — types, tables, indexes, grants, RLS enablement
-- ---------------------------------------------------------------------
-- Run order:
--   001_schema.sql
--   002_functions_rls.sql
--   003_triggers.sql
--   004_seed_catalog.sql             (generated)
--   005_seed_plan_entitlements.sql   (generated)
--   006_seed_role_permissions.sql    (generated)
--
-- Target: PostgreSQL 15+ / Supabase. Idempotent where practical.
-- =====================================================================

begin;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------

do $$ begin
  create type public.permission_action as enum
    ('view','create','edit','delete','approve','export','assign','configure');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.permission_scope as enum ('tenant','location','self');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.module_group as enum
    ('Operations','People','Pay & Compliance','Insights','Administration');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.plan_tier as enum ('essentials','growth','enterprise');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. Tenancy
--    If you already have a tenants table, skip this block and just make
--    sure it exposes: id, plan_tier.
-- ---------------------------------------------------------------------

create table if not exists public.tenants (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  plan_tier         public.plan_tier not null default 'essentials',
  plan_started_at   timestamptz not null default now(),
  plan_expires_at   timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Every user belongs to one or more tenants. This is the anchor for all
-- RLS: "can this user see anything in this tenant at all?"
create table if not exists public.tenant_members (
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  is_owner    boolean not null default false,
  joined_at   timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists tenant_members_user_idx on public.tenant_members(user_id);

-- ---------------------------------------------------------------------
-- 3. Permission catalog (code-owned reference data, not user-editable)
-- ---------------------------------------------------------------------

create table if not exists public.permission_modules (
  key            text primary key,                    -- 'roster'
  label          text not null,                       -- 'Roster & Scheduling'
  module_group   public.module_group not null,
  description    text not null default '',
  default_scope  public.permission_scope not null default 'tenant',
  -- actions that are meaningful for this module; the editable universe
  actions        public.permission_action[] not null,
  sort_order     int not null default 0
);

create table if not exists public.permission_sub_modules (
  key            text primary key,                    -- 'roster::templates'
  module_key     text not null references public.permission_modules(key) on delete cascade,
  sub_id         text not null,                       -- 'templates'
  label          text not null,
  description    text not null default '',
  actions        public.permission_action[] not null,
  sort_order     int not null default 0,
  unique (module_key, sub_id)
);

create index if not exists permission_sub_modules_module_idx
  on public.permission_sub_modules(module_key);

-- ---------------------------------------------------------------------
-- 4. Plans and entitlements (what a subscription tier SELLS)
-- ---------------------------------------------------------------------

create table if not exists public.plans (
  tier                 public.plan_tier primary key,
  label                text not null,
  tagline              text not null default '',
  rank                 int not null unique,           -- 0,1,2 — drives cumulative logic
  highlights           text[] not null default '{}',
  max_locations        int,                           -- NULL = unlimited
  max_staff            int,
  max_custom_roles     int,
  max_api_credentials  int
);

-- Presence of a row = the tier includes that capability.
-- sub_key NULL  -> module-level entitlement
-- sub_key set   -> sub-permission entitlement
create table if not exists public.plan_entitlements (
  tier         public.plan_tier not null references public.plans(tier) on delete cascade,
  module_key   text not null references public.permission_modules(key) on delete cascade,
  sub_key      text references public.permission_sub_modules(key) on delete cascade,
  action       public.permission_action not null,
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users(id)
);

-- NULL-safe uniqueness (module-level rows vs sub-level rows).
create unique index if not exists plan_entitlements_key_uidx
  on public.plan_entitlements (tier, module_key, coalesce(sub_key, ''), action);

create index if not exists plan_entitlements_tier_idx
  on public.plan_entitlements(tier);

-- Per-tenant contract deviations ("sold Agency Partners on a Growth deal").
-- granted = true  -> add on top of the tier
-- granted = false -> remove from the tier for this tenant only
create table if not exists public.plan_entitlement_overrides (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  module_key   text not null references public.permission_modules(key) on delete cascade,
  sub_key      text references public.permission_sub_modules(key) on delete cascade,
  action       public.permission_action not null,
  granted      boolean not null,
  note         text,
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id)
);

create unique index if not exists plan_entitlement_overrides_uidx
  on public.plan_entitlement_overrides (tenant_id, module_key, coalesce(sub_key, ''), action);

-- ---------------------------------------------------------------------
-- 5. Roles and role grants (what a role MAY do)
-- ---------------------------------------------------------------------

create table if not exists public.roles (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  key           text not null,                        -- 'hr-manager'
  label         text not null,
  description   text not null default '',
  is_system     boolean not null default false,       -- cannot be deleted or renamed
  cloned_from   uuid references public.roles(id) on delete set null,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id),
  unique (tenant_id, key)
);

create index if not exists roles_tenant_idx on public.roles(tenant_id);

create table if not exists public.role_permissions (
  role_id      uuid not null references public.roles(id) on delete cascade,
  module_key   text not null references public.permission_modules(key) on delete cascade,
  sub_key      text references public.permission_sub_modules(key) on delete cascade,
  action       public.permission_action not null,
  scope        public.permission_scope not null default 'tenant',
  updated_at   timestamptz not null default now(),
  updated_by   uuid references auth.users(id)
);

create unique index if not exists role_permissions_key_uidx
  on public.role_permissions (role_id, module_key, coalesce(sub_key, ''), action);

create index if not exists role_permissions_role_idx on public.role_permissions(role_id);
create index if not exists role_permissions_lookup_idx
  on public.role_permissions(module_key, action);

-- ---------------------------------------------------------------------
-- 6. User assignment (who HOLDS a role, and where)
-- ---------------------------------------------------------------------
-- Roles live here and ONLY here — never on profiles/staff (privilege
-- escalation). location_id NULL = the role applies tenant-wide.

create table if not exists public.user_roles (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role_id      uuid not null references public.roles(id) on delete cascade,
  location_id  uuid,                                   -- FK to your locations table
  starts_on    date,
  ends_on      date,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id)
);

create unique index if not exists user_roles_uidx
  on public.user_roles (user_id, role_id, coalesce(location_id, '00000000-0000-0000-0000-000000000000'::uuid));

create index if not exists user_roles_user_idx   on public.user_roles(user_id);
create index if not exists user_roles_tenant_idx on public.user_roles(tenant_id);

-- ---------------------------------------------------------------------
-- 7. Audit trail — permission changes are what auditors ask for
-- ---------------------------------------------------------------------

create table if not exists public.permission_audit_log (
  id           bigserial primary key,
  tenant_id    uuid references public.tenants(id) on delete cascade,
  actor_id     uuid references auth.users(id),
  entity       text not null,          -- 'role_permissions' | 'plan_entitlements' | 'user_roles' | 'roles'
  entity_id    text,
  operation    text not null,          -- 'INSERT' | 'UPDATE' | 'DELETE'
  before_data  jsonb,
  after_data   jsonb,
  occurred_at  timestamptz not null default now()
);

create index if not exists permission_audit_log_tenant_idx
  on public.permission_audit_log(tenant_id, occurred_at desc);

-- ---------------------------------------------------------------------
-- 8. Grants — PostgREST needs these; RLS alone is not enough
-- ---------------------------------------------------------------------

-- Catalog: read-only for signed-in users, written only by migrations.
grant select on public.permission_modules      to authenticated;
grant select on public.permission_sub_modules  to authenticated;
grant select on public.plans                   to authenticated;
grant all    on public.permission_modules      to service_role;
grant all    on public.permission_sub_modules  to service_role;
grant all    on public.plans                   to service_role;

-- Configurable data: writes are further restricted by RLS policies.
grant select, insert, update, delete on public.plan_entitlements           to authenticated;
grant select, insert, update, delete on public.plan_entitlement_overrides  to authenticated;
grant select, insert, update, delete on public.roles                       to authenticated;
grant select, insert, update, delete on public.role_permissions            to authenticated;
grant select, insert, update, delete on public.user_roles                  to authenticated;
grant select                          on public.tenants                    to authenticated;
grant select                          on public.tenant_members             to authenticated;
grant select                          on public.permission_audit_log       to authenticated;

grant all on public.plan_entitlements          to service_role;
grant all on public.plan_entitlement_overrides to service_role;
grant all on public.roles                      to service_role;
grant all on public.role_permissions           to service_role;
grant all on public.user_roles                 to service_role;
grant all on public.tenants                    to service_role;
grant all on public.tenant_members             to service_role;
grant all on public.permission_audit_log       to service_role;

grant usage, select on sequence public.permission_audit_log_id_seq to authenticated, service_role;

-- No anon grants anywhere: every policy below scopes to auth.uid().

-- ---------------------------------------------------------------------
-- 9. Enable RLS (policies are created in 002_functions_rls.sql)
-- ---------------------------------------------------------------------

alter table public.tenants                    enable row level security;
alter table public.tenant_members             enable row level security;
alter table public.permission_modules         enable row level security;
alter table public.permission_sub_modules     enable row level security;
alter table public.plans                      enable row level security;
alter table public.plan_entitlements          enable row level security;
alter table public.plan_entitlement_overrides enable row level security;
alter table public.roles                      enable row level security;
alter table public.role_permissions           enable row level security;
alter table public.user_roles                 enable row level security;
alter table public.permission_audit_log       enable row level security;

commit;
