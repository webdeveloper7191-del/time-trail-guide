-- =====================================================================
-- rostered.ai — 003_triggers.sql
-- Cumulative plan inheritance, parent/child cascade, tenant bootstrap,
-- audit logging.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Cumulative plan inheritance
-- ---------------------------------------------------------------------
-- Invariant: Essentials ⊆ Growth ⊆ Enterprise.
--   INSERT on a tier  -> propagate UP to every higher-ranked tier.
--   DELETE on a tier  -> propagate DOWN to every lower-ranked tier.
-- This is the SQL twin of planEntitlementsStore.applyKey().
-- A guard flag stops the trigger recursing into itself.

create or replace function public.plan_entitlements_cascade()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_rank int;
begin
  if coalesce(current_setting('rostered.cascade', true), 'off') = 'on' then
    return coalesce(new, old);
  end if;

  perform set_config('rostered.cascade', 'on', true);

  if tg_op = 'INSERT' then
    select rank into v_rank from public.plans where tier = new.tier;

    insert into public.plan_entitlements (tier, module_key, sub_key, action, updated_by)
    select p.tier, new.module_key, new.sub_key, new.action, new.updated_by
    from public.plans p
    where p.rank > v_rank
    on conflict do nothing;

    -- Granting a sub-permission implies the parent module action.
    if new.sub_key is not null then
      insert into public.plan_entitlements (tier, module_key, sub_key, action, updated_by)
      select p.tier, new.module_key, null, new.action, new.updated_by
      from public.plans p
      where p.rank >= v_rank
      on conflict do nothing;
    end if;

  elsif tg_op = 'DELETE' then
    select rank into v_rank from public.plans where tier = old.tier;

    delete from public.plan_entitlements pe
    using public.plans p
    where pe.tier = p.tier
      and p.rank < v_rank
      and pe.module_key = old.module_key
      and coalesce(pe.sub_key, '') = coalesce(old.sub_key, '')
      and pe.action = old.action;

    -- Removing a module action removes every child sub-permission action.
    if old.sub_key is null then
      delete from public.plan_entitlements pe
      using public.plans p
      where pe.tier = p.tier
        and p.rank <= v_rank
        and pe.module_key = old.module_key
        and pe.sub_key is not null
        and pe.action = old.action;
    end if;
  end if;

  perform set_config('rostered.cascade', 'off', true);
  return coalesce(new, old);
end;
$$;

drop trigger if exists plan_entitlements_cascade_ins on public.plan_entitlements;
create trigger plan_entitlements_cascade_ins
  after insert on public.plan_entitlements
  for each row execute function public.plan_entitlements_cascade();

drop trigger if exists plan_entitlements_cascade_del on public.plan_entitlements;
create trigger plan_entitlements_cascade_del
  after delete on public.plan_entitlements
  for each row execute function public.plan_entitlements_cascade();

-- ---------------------------------------------------------------------
-- 2. Role grant integrity
-- ---------------------------------------------------------------------
-- a) the action must be in the module's / sub's declared universe
-- b) granting a sub implies the parent module action (child -> parent)
-- c) revoking a module action revokes its children (parent -> child)

create or replace function public.role_permissions_validate()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_universe public.permission_action[];
begin
  if new.sub_key is null then
    select actions into v_universe from public.permission_modules where key = new.module_key;
  else
    select actions into v_universe from public.permission_sub_modules where key = new.sub_key;
    if not exists (select 1 from public.permission_sub_modules
                   where key = new.sub_key and module_key = new.module_key) then
      raise exception 'sub_key % does not belong to module %', new.sub_key, new.module_key;
    end if;
  end if;

  if v_universe is null or not (new.action = any(v_universe)) then
    raise exception 'action % is not valid for %',
      new.action, coalesce(new.sub_key, new.module_key);
  end if;

  return new;
end;
$$;

drop trigger if exists role_permissions_validate_trg on public.role_permissions;
create trigger role_permissions_validate_trg
  before insert or update on public.role_permissions
  for each row execute function public.role_permissions_validate();

create or replace function public.role_permissions_cascade()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if coalesce(current_setting('rostered.rp_cascade', true), 'off') = 'on' then
    return coalesce(new, old);
  end if;
  perform set_config('rostered.rp_cascade', 'on', true);

  if tg_op = 'INSERT' and new.sub_key is not null then
    -- child granted -> imply the parent module action
    insert into public.role_permissions (role_id, module_key, sub_key, action, scope, updated_by)
    values (new.role_id, new.module_key, null, new.action, new.scope, new.updated_by)
    on conflict do nothing;

  elsif tg_op = 'DELETE' and old.sub_key is null then
    -- parent revoked -> revoke every child holding that action
    delete from public.role_permissions rp
    where rp.role_id = old.role_id
      and rp.module_key = old.module_key
      and rp.sub_key is not null
      and rp.action = old.action;
  end if;

  perform set_config('rostered.rp_cascade', 'off', true);
  return coalesce(new, old);
end;
$$;

drop trigger if exists role_permissions_cascade_ins on public.role_permissions;
create trigger role_permissions_cascade_ins
  after insert on public.role_permissions
  for each row execute function public.role_permissions_cascade();

drop trigger if exists role_permissions_cascade_del on public.role_permissions;
create trigger role_permissions_cascade_del
  after delete on public.role_permissions
  for each row execute function public.role_permissions_cascade();

-- ---------------------------------------------------------------------
-- 3. Audit logging
-- ---------------------------------------------------------------------

create or replace function public.log_permission_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_tenant uuid;
begin
  v_tenant := case
    when tg_table_name in ('user_roles', 'roles', 'plan_entitlement_overrides')
      then coalesce((to_jsonb(new) ->> 'tenant_id')::uuid, (to_jsonb(old) ->> 'tenant_id')::uuid)
    when tg_table_name = 'role_permissions'
      then (select r.tenant_id from public.roles r
            where r.id = coalesce((to_jsonb(new) ->> 'role_id')::uuid,
                                  (to_jsonb(old) ->> 'role_id')::uuid))
    else null
  end;

  insert into public.permission_audit_log
    (tenant_id, actor_id, entity, entity_id, operation, before_data, after_data)
  values (
    v_tenant,
    auth.uid(),
    tg_table_name,
    coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id'),
    tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );

  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['roles','role_permissions','user_roles','plan_entitlements','plan_entitlement_overrides']
  loop
    execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
    execute format(
      'create trigger audit_%1$s after insert or update or delete on public.%1$I
         for each row execute function public.log_permission_change()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4. Tenant bootstrap — seed the 8 system roles and their grants
-- ---------------------------------------------------------------------
-- Baseline grants live in role_permission_defaults (populated by
-- 006_seed_role_permissions.sql). "Reset to defaults" = re-run this.

create table if not exists public.role_permission_defaults (
  role_key     text not null,
  module_key   text not null,
  sub_key      text,
  action       public.permission_action not null
);
create unique index if not exists role_permission_defaults_uidx
  on public.role_permission_defaults (role_key, module_key, coalesce(sub_key,''), action);
grant select on public.role_permission_defaults to authenticated;
grant all    on public.role_permission_defaults to service_role;

create table if not exists public.role_defaults (
  key         text primary key,
  label       text not null,
  description text not null default '',
  sort_order  int not null default 0
);
grant select on public.role_defaults to authenticated;
grant all    on public.role_defaults to service_role;

create or replace function public.seed_tenant_roles(_tenant_id uuid, _reset boolean default false)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.roles (tenant_id, key, label, description, is_system)
  select _tenant_id, d.key, d.label, d.description, true
  from public.role_defaults d
  on conflict (tenant_id, key) do update
    set label = excluded.label, description = excluded.description;

  if _reset then
    delete from public.role_permissions rp
    using public.roles r
    where rp.role_id = r.id and r.tenant_id = _tenant_id and r.is_system;
  end if;

  insert into public.role_permissions (role_id, module_key, sub_key, action, scope)
  select r.id, d.module_key, d.sub_key, d.action, m.default_scope
  from public.role_permission_defaults d
  join public.roles r
    on r.tenant_id = _tenant_id and r.key = d.role_key and r.is_system
  join public.permission_modules m on m.key = d.module_key
  on conflict do nothing;
end;
$$;

create or replace function public.on_tenant_created()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.seed_tenant_roles(new.id, false);
  return new;
end;
$$;

drop trigger if exists tenants_seed_roles on public.tenants;
create trigger tenants_seed_roles
  after insert on public.tenants
  for each row execute function public.on_tenant_created();

commit;
