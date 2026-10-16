alter table public.admin_members add column super_admin boolean not null default false;
create function public.protect_superadmin() returns trigger language plpgsql set search_path = '' as $$
begin
 if old.super_admin then
  if tg_op = 'DELETE' then raise exception 'protected_superadmin'; end if;
  if not new.super_admin or new.clerk_user_id <> old.clerk_user_id then raise exception 'protected_superadmin'; end if;
 end if;
 if tg_op = 'DELETE' then return old; end if;
 return new;
end; $$;
create trigger protect_superadmin before update or delete on public.admin_members for each row execute function public.protect_superadmin();
create function public.protect_superadmin_role() returns trigger language plpgsql set search_path = '' as $$
begin
 if new.role <> 'admin' and exists(select 1 from public.admin_members where clerk_user_id=new.clerk_user_id and super_admin) then raise exception 'Protected Superadmins cannot be downgraded.'; end if;
 return new;
end; $$;
create trigger protect_superadmin_role before insert or update on public.workspace_roles for each row execute function public.protect_superadmin_role();
revoke all on function public.protect_superadmin() from public, anon, authenticated;
revoke all on function public.protect_superadmin_role() from public, anon, authenticated;
create or replace function public.admin_remove_member(p_actor text, p_user text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admin_members where clerk_user_id = p_actor) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  if exists(select 1 from public.admin_members where clerk_user_id=p_user and super_admin) then return 'protected'; end if;
  if p_actor = p_user then
    return 'self';
  end if;
  if not exists (select 1 from public.admin_members where clerk_user_id = p_user) then
    return 'not_found';
  end if;
  if (select count(*) from public.admin_members) <= 1 then
    return 'last_admin';
  end if;
  delete from public.admin_members where clerk_user_id = p_user;
  insert into public.admin_audit_log (actor, action, entity, entity_key, details)
  values (p_actor, 'admin.remove', 'admin_member', p_user, '{}'::jsonb);
  return 'ok';
end;
$$;

alter table public.quote_requests drop constraint quote_requests_status_check;
alter table public.quote_requests add constraint quote_requests_status_check check(status in ('submitted','reviewing','quoted','closed','cancelled'));
alter table public.quote_events drop constraint quote_events_status_check;
alter table public.quote_events add constraint quote_events_status_check check(status in ('submitted','reviewing','quoted','closed','cancelled'));
