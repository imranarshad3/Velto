-- M12: admins invite other admins by email. An invitation is accepted only when a signed-in Clerk user's
-- VERIFIED email address (looked up server-side through the Clerk Backend API) matches it exactly, before it
-- expires. Membership still cannot be written with the server key directly: service_role keeps SELECT-only on
-- admin_members, and every grant/removal goes through the audited SECURITY DEFINER functions below.

create table if not exists public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  invited_by text not null check (length(invited_by) between 1 and 64),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by text check (accepted_by is null or length(accepted_by) between 1 and 64),
  revoked_at timestamptz,
  constraint invitation_single_outcome check (accepted_at is null or revoked_at is null)
);

-- At most one open invitation per address.
create unique index if not exists admin_invitations_open_email_idx on public.admin_invitations (email) where accepted_at is null and revoked_at is null;

alter table public.admin_invitations enable row level security;
revoke all on table public.admin_invitations from public, anon, authenticated;

-- Creates (or renews) the open invitation for an address. Returns the invitation id.
create or replace function public.admin_create_invitation(p_actor text, p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from public.admin_members where clerk_user_id = p_actor) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  update public.admin_invitations
  set expires_at = now() + interval '7 days', invited_by = p_actor
  where email = lower(p_email) and accepted_at is null and revoked_at is null
  returning id into v_id;
  if v_id is null then
    insert into public.admin_invitations (email, invited_by) values (lower(p_email), p_actor) returning id into v_id;
  end if;
  insert into public.admin_audit_log (actor, action, entity, entity_key, details)
  values (p_actor, 'admin.invite', 'admin_invitation', v_id::text, jsonb_build_object('email', lower(p_email)));
  return v_id;
end;
$$;

create or replace function public.admin_revoke_invitation(p_actor text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admin_members where clerk_user_id = p_actor) then
    raise exception 'not an admin' using errcode = '42501';
  end if;
  update public.admin_invitations set revoked_at = now() where id = p_id and accepted_at is null and revoked_at is null;
  if not found then
    return false;
  end if;
  insert into public.admin_audit_log (actor, action, entity, entity_key, details)
  values (p_actor, 'admin.invite.revoke', 'admin_invitation', p_id::text, '{}'::jsonb);
  return true;
end;
$$;

-- Accepts the newest open, unexpired invitation matching one of the user's verified emails.
create or replace function public.accept_admin_invitation(p_user text, p_emails text[])
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.admin_invitations;
begin
  select * into v_invite from public.admin_invitations
  where email = any (select lower(e) from unnest(p_emails) e)
    and accepted_at is null and revoked_at is null and expires_at > now()
  order by created_at desc
  limit 1
  for update;
  if v_invite.id is null then
    return false;
  end if;
  insert into public.admin_members (clerk_user_id, note) values (p_user, v_invite.email) on conflict (clerk_user_id) do nothing;
  update public.admin_invitations set accepted_at = now(), accepted_by = p_user where id = v_invite.id;
  insert into public.admin_audit_log (actor, action, entity, entity_key, details)
  values (p_user, 'admin.invite.accept', 'admin_invitation', v_invite.id::text, jsonb_build_object('invited_by', v_invite.invited_by));
  return true;
end;
$$;

-- Removes another admin. Never yourself and never the last admin. Returns ok | not_found | self | last_admin.
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

revoke all on function public.admin_create_invitation(text, text) from public, anon, authenticated;
revoke all on function public.admin_revoke_invitation(text, uuid) from public, anon, authenticated;
revoke all on function public.accept_admin_invitation(text, text[]) from public, anon, authenticated;
revoke all on function public.admin_remove_member(text, text) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    revoke all on table public.admin_invitations from service_role;
    grant select on table public.admin_invitations to service_role;
    grant execute on function public.admin_create_invitation(text, text) to service_role;
    grant execute on function public.admin_revoke_invitation(text, uuid) to service_role;
    grant execute on function public.accept_admin_invitation(text, text[]) to service_role;
    grant execute on function public.admin_remove_member(text, text) to service_role;
  end if;
end;
$$;
