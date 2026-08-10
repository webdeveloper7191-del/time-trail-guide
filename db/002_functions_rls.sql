-- =====================================================================
-- rostered.ai — 002_functions_rls.sql
-- Resolution functions (the SQL twin of `can` / `canSub`) + RLS policies
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Tenant membership helpers (security definer -> no RLS recursion)
-- ---------------------------------------------------------------------

create or replace function public.is_tenant_member(_tenant_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.tenant_members tm
    where tm.tenant_id = _tenant_id and tm.user_id = auth.uid()
  );
$$;

create or replace function public.current_tenant_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select tm.tenant_id from public.tenant_members tm where tm.user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 2. Plan resolution — the editable entitlement matrix, per tenant
-- ---------------------------------------------------------------------
-- Effective plan entitlement =
--     plan_entitlements for the tenant's tier
--   + tenant overrides where granted = true
--   - tenant overrides where granted = false
-- Overrides with a past expires_at are ignored.

create or replace function public.plan_allows(
  _tenant_id  uuid,
  _module_key text,
  _sub_key    text,
  _action     public.permission_action
)
returns boolean
language sql stable security definer set search_path = public
as $$
  with tier as (
    select t.plan_tier from public.tenants t where t.id = _tenant_id
  ),
  ovr as (
    select o.granted
    from public.plan_entitlement_overrides o
    where o.tenant_id = _tenant_id
      and o.module_key = _module_key
      and coalesce(o.sub_key, '') = coalesce(_sub_key, '')
      and o.action = _action
      and (o.expires_at is null or o.expires_at > now())
    limit 1
  ),
  base as (
    select exists (
      select 1
      from public.plan_entitlements pe, tier
      where pe.tier = tier.plan_tier
        and pe.module_key = _module_key
        and coalesce(pe.sub_key, '') = coalesce(_sub_key, '')
        and pe.action = _action
    ) as ok
  )
  select coalesce((select granted from ovr), (select ok from base), false);
$$;

-- Lowest tier that includes a capability — powers the "needs Growth plan"
-- tooltips in the matrix UI.
create or replace function public.required_tier(
  _module_key text,
  _sub_key    text,
  _action     public.permission_action
)
returns public.plan_tier
language sql stable security definer set search_path = public
as $$
  select pe.tier
  from public.plan_entitlements pe
  join public.plans p on p.tier = pe.tier
  where pe.module_key = _module_key
    and coalesce(pe.sub_key, '') = coalesce(_sub_key, '')
    and pe.action = _action
  order by p.rank asc
  limit 1;
$$;

-- ---------------------------------------------------------------------
-- 3. The core check — role grant  ∩  plan entitlement
-- ---------------------------------------------------------------------
-- _sub_key NULL      -> module-level check  (the `can` equivalent)
-- _sub_key 'a::b'    -> sub-permission check (the `canSub` equivalent)
-- _location_id NULL  -> ignore location scoping (tenant-wide question)

create or replace function public.has_permission(
  _user_id     uuid,
  _tenant_id   uuid,
  _module_key  text,
  _sub_key     text,
  _action      public.permission_action,
  _location_id uuid default null
)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    where ur.user_id   = _user_id
      and ur.tenant_id = _tenant_id
      and rp.module_key = _module_key
      and coalesce(rp.sub_key, '') = coalesce(_sub_key, '')
      and rp.action = _action
      -- assignment window
      and (ur.starts_on is null or ur.starts_on <= current_date)
      and (ur.ends_on   is null or ur.ends_on   >= current_date)
      -- location scoping: tenant-wide rows match everything
      and (
        rp.scope = 'tenant'
        or ur.location_id is null
        or _location_id is null
        or ur.location_id = _location_id
      )
      -- the subscription must also sell it
      and public.plan_allows(_tenant_id, rp.module_key, rp.sub_key, rp.action)
  );
$$;

-- Convenience wrapper for policies: current user, current tenant.
create or replace function public.can(
  _tenant_id   uuid,
  _module_key  text,
  _action      public.permission_action,
  _location_id uuid default null
)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.has_permission(auth.uid(), _tenant_id, _module_key, null, _action, _location_id);
$$;

create or replace function public.can_sub(
  _tenant_id   uuid,
  _module_key  text,
  _sub_id      text,
  _action      public.permission_action,
  _location_id uuid default null
)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.has_permission(
    auth.uid(), _tenant_id, _module_key,
    _module_key || '::' || _sub_id, _action, _location_id
  );
$$;

-- One-shot hydration for the client: everything the signed-in user may do
-- in a tenant, already intersected with the plan. Feed this straight into
-- the permissions store instead of the localStorage matrix.
create or replace function public.my_effective_permissions(_tenant_id uuid)
returns table (
  module_key text,
  sub_key    text,
  action     public.permission_action,
  scope      public.permission_scope,
  locations  uuid[]
)
language sql stable security definer set search_path = public
as $$
  select
    rp.module_key,
    rp.sub_key,
    rp.action,
    min(rp.scope::text)::public.permission_scope as scope,
    case when bool_or(ur.location_id is null)
         then null::uuid[]
         else array_agg(distinct ur.location_id) end as locations
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  where ur.user_id = auth.uid()
    and ur.tenant_id = _tenant_id
    and (ur.starts_on is null or ur.starts_on <= current_date)
    and (ur.ends_on   is null or ur.ends_on   >= current_date)
    and public.plan_allows(_tenant_id, rp.module_key, rp.sub_key, rp.action)
  group by rp.module_key, rp.sub_key, rp.action;
$$;

-- Resource caps (locations, staff, custom roles, API credentials).
create or replace function public.plan_limit(_tenant_id uuid, _limit text)
returns int
language sql stable security definer set search_path = public
as $$
  select case _limit
    when 'locations'       then p.max_locations
    when 'staff'           then p.max_staff
    when 'custom_roles'    then p.max_custom_roles
    when 'api_credentials' then p.max_api_credentials
  end
  from public.tenants t join public.plans p on p.tier = t.plan_tier
  where t.id = _tenant_id;
$$;  -- NULL result = unlimited

-- ---------------------------------------------------------------------
-- 4. RLS policies
-- ---------------------------------------------------------------------
-- Administering permissions requires: permissions module + 'configure'.
-- Administering plans requires:       permissions module + 'configure'
--                                     (restrict further to owners if you
--                                      resell tiers from a control plane).

-- Catalog: readable by any signed-in user, written only by migrations.
drop policy if exists "catalog modules readable" on public.permission_modules;
create policy "catalog modules readable" on public.permission_modules
  for select to authenticated using (true);

drop policy if exists "catalog subs readable" on public.permission_sub_modules;
create policy "catalog subs readable" on public.permission_sub_modules
  for select to authenticated using (true);

drop policy if exists "plans readable" on public.plans;
create policy "plans readable" on public.plans
  for select to authenticated using (true);

-- Tenants / membership
drop policy if exists "tenants readable by members" on public.tenants;
create policy "tenants readable by members" on public.tenants
  for select to authenticated using (public.is_tenant_member(id));

drop policy if exists "members readable by tenant" on public.tenant_members;
create policy "members readable by tenant" on public.tenant_members
  for select to authenticated using (public.is_tenant_member(tenant_id));

-- Plan entitlements are global reference data: readable by all signed-in
-- users (the UI renders the comparison table), editable only by staff of
-- the control plane. Swap `false` for a super-admin check if you expose
-- the editable matrix to tenants.
drop policy if exists "plan entitlements readable" on public.plan_entitlements;
create policy "plan entitlements readable" on public.plan_entitlements
  for select to authenticated using (true);

drop policy if exists "plan entitlements not tenant-writable" on public.plan_entitlements;
create policy "plan entitlements not tenant-writable" on public.plan_entitlements
  for all to authenticated using (false) with check (false);

-- Tenant-specific contract deviations
drop policy if exists "overrides readable" on public.plan_entitlement_overrides;
create policy "overrides readable" on public.plan_entitlement_overrides
  for select to authenticated using (public.is_tenant_member(tenant_id));

drop policy if exists "overrides not tenant-writable" on public.plan_entitlement_overrides;
create policy "overrides not tenant-writable" on public.plan_entitlement_overrides
  for all to authenticated using (false) with check (false);

-- Roles
drop policy if exists "roles readable" on public.roles;
create policy "roles readable" on public.roles
  for select to authenticated using (public.is_tenant_member(tenant_id));

drop policy if exists "roles insertable" on public.roles;
create policy "roles insertable" on public.roles
  for insert to authenticated
  with check (
    public.can(tenant_id, 'permissions', 'create')
    and is_system = false
    and public.custom_role_slots_left(tenant_id) > 0
  );

drop policy if exists "roles updatable" on public.roles;
create policy "roles updatable" on public.roles
  for update to authenticated
  using (public.can(tenant_id, 'permissions', 'edit'))
  with check (public.can(tenant_id, 'permissions', 'edit'));

drop policy if exists "roles deletable" on public.roles;
create policy "roles deletable" on public.roles
  for delete to authenticated
  using (public.can(tenant_id, 'permissions', 'delete') and is_system = false);

-- Role grants (the matrix itself)
drop policy if exists "role permissions readable" on public.role_permissions;
create policy "role permissions readable" on public.role_permissions
  for select to authenticated
  using (exists (
    select 1 from public.roles r
    where r.id = role_id and public.is_tenant_member(r.tenant_id)
  ));

drop policy if exists "role permissions writable" on public.role_permissions;
create policy "role permissions writable" on public.role_permissions
  for all to authenticated
  using (exists (
    select 1 from public.roles r
    where r.id = role_id and public.can(r.tenant_id, 'permissions', 'configure')
  ))
  with check (exists (
    select 1 from public.roles r
    where r.id = role_id
      and public.can(r.tenant_id, 'permissions', 'configure')
      -- cannot grant what the plan does not sell
      and public.plan_allows(r.tenant_id, module_key, sub_key, action)
  ));

-- User assignment
drop policy if exists "user roles readable" on public.user_roles;
create policy "user roles readable" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.can(tenant_id, 'permissions', 'view'));

drop policy if exists "user roles writable" on public.user_roles;
create policy "user roles writable" on public.user_roles
  for all to authenticated
  using (public.can(tenant_id, 'permissions', 'assign'))
  with check (public.can(tenant_id, 'permissions', 'assign'));

-- Audit log: readable by permission admins, written by triggers only.
drop policy if exists "audit readable" on public.permission_audit_log;
create policy "audit readable" on public.permission_audit_log
  for select to authenticated
  using (public.can(tenant_id, 'permissions', 'view'));

commit;
