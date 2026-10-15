-- Run with psql -v ON_ERROR_STOP=1 as the migration owner. All fixtures roll back.
begin;
select set_config('velto_test.actor', 'test_' || replace(gen_random_uuid()::text, '-', ''), true) as actor \gset
select set_config('velto_test.member', 'test_' || replace(gen_random_uuid()::text, '-', ''), true) as member \gset
insert into public.admin_members (clerk_user_id) values (current_setting('velto_test.actor'));
set local role service_role;
do $$
declare
  actor text := current_setting('velto_test.actor');
  member text := current_setting('velto_test.member');
  email text := member || '@example.invalid';
  invitation uuid;
begin
  invitation := public.admin_create_invitation(actor, email);
  assert invitation is not null, 'invitation not created';
  assert public.admin_create_invitation(actor, email) = invitation, 'resend duplicated invite';
  assert not public.accept_admin_invitation(member, array['wrong@example.invalid']), 'wrong email accepted';
  assert public.accept_admin_invitation(member, array[email]), 'invite acceptance failed';
  assert exists (select 1 from public.admin_members where clerk_user_id = member), 'membership not created';
  assert public.admin_remove_member(actor, actor) = 'self', 'self-removal allowed';
  assert public.admin_remove_member(actor, member) = 'ok', 'member removal failed';
  assert not exists (select 1 from public.admin_members where clerk_user_id = member), 'member retained access';
  invitation := public.admin_create_invitation(actor, email);
  assert public.admin_revoke_invitation(actor, invitation), 'revoke failed';
  assert not public.accept_admin_invitation(member, array[email]), 'revoked invite accepted';
  assert (select count(*) from public.admin_audit_log where admin_audit_log.actor in (current_setting('velto_test.actor'), member)) >= 6, 'audit events missing';
  assert not has_function_privilege('anon', 'public.admin_create_invitation(text,text)', 'execute'), 'anon can invite';
  assert not has_function_privilege('authenticated', 'public.admin_remove_member(text,text)', 'execute'), 'browser role can remove admins';
  assert not has_table_privilege('service_role', 'public.admin_members', 'insert'), 'server can bypass membership RPCs';
  assert not has_table_privilege('service_role', 'public.admin_audit_log', 'delete'), 'audit log is mutable';
end $$;
rollback;
