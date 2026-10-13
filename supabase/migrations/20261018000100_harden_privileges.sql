-- Hardening for Supabase default privileges. Supabase grants ALL on every new table, function and sequence in
-- public to anon, authenticated and service_role. Earlier migrations revoke the API roles from tables and RPCs
-- and add explicit service_role grants, but never remove service_role's default ALL. This migration:
--   1. removes API-role access from the identity sequences and trigger functions;
--   2. resets service_role (the server's secret key) to exactly the privileges the app needs, so the audit
--      log and quote history are append-only and admin membership is read-only at the database level.
-- Additive and idempotent: only REVOKE/GRANT, no data touched.

revoke all on sequence public.quote_events_id_seq from public, anon, authenticated;
revoke all on sequence public.admin_audit_log_id_seq from public, anon, authenticated;

revoke all on function public.quote_requests_touch_updated_at() from public, anon, authenticated;
revoke all on function public.products_touch_updated_at() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    revoke all on table
      public.quote_requests, public.quote_rate_limits, public.quote_request_items, public.quote_events,
      public.wishlist_items, public.contact_messages, public.admin_members, public.products, public.admin_audit_log
    from service_role;

    grant select, insert, update on table public.quote_requests to service_role;
    grant select, insert, update, delete on table public.quote_rate_limits to service_role;
    grant select, insert, update, delete on table public.quote_request_items to service_role;
    grant select, insert on table public.quote_events to service_role;
    grant select, insert, delete on table public.wishlist_items to service_role;
    grant select, insert, update on table public.contact_messages to service_role;
    -- Admins are granted by the project owner in the SQL editor, never through the API key.
    grant select on table public.admin_members to service_role;
    grant select, insert, update on table public.products to service_role;
    grant select, insert on table public.admin_audit_log to service_role;

    revoke all on sequence public.quote_events_id_seq, public.admin_audit_log_id_seq from service_role;
    grant usage on sequence public.quote_events_id_seq, public.admin_audit_log_id_seq to service_role;
  end if;
end;
$$;
