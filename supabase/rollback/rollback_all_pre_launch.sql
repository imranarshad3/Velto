-- PRE-LAUNCH ROLLBACK ONLY. Removes every object created by supabase/migrations/*.sql.
-- Refuses to run if any customer, staff or admin data exists (seeded DEMO products are allowed), so it can never
-- delete real quotes, messages, wishlists, admins or audit history. After launch, fix forward with a new migration.
-- Run as one transaction:  psql "$SUPABASE_DB_URL" -1 -v ON_ERROR_STOP=1 -f supabase/rollback/rollback_all_pre_launch.sql

do $$
declare
  t text;
  n bigint;
begin
  foreach t in array array['quote_requests', 'quote_request_items', 'quote_events', 'wishlist_items', 'contact_messages', 'admin_members', 'admin_audit_log'] loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into n;
      if n > 0 then
        raise exception 'Rollback refused: public.% has % row(s). Back up and fix forward instead.', t, n;
      end if;
    end if;
  end loop;
end;
$$;

drop function if exists public.admin_remove_member(text, text);
drop function if exists public.accept_admin_invitation(text, text[]);
drop function if exists public.admin_revoke_invitation(text, uuid);
drop function if exists public.admin_create_invitation(text, text);
drop function if exists public.admin_delete_product(text, text);
drop function if exists public.admin_set_product_status(text, text, text);
drop function if exists public.admin_product_activity(date);
drop function if exists public.record_product_view(text, text);
drop function if exists public.admin_update_message(uuid, text, text);
drop function if exists public.admin_overview();
drop function if exists public.admin_customers();
drop function if exists public.admin_save_product(text, text, jsonb, boolean);
drop function if exists public.admin_update_quote(text, text, text, text, text);
drop function if exists public.replace_wishlist(text, text[]);
drop function if exists public.create_quote_request(jsonb, jsonb);
drop function if exists public.quote_rate_limit_hit(text, integer, integer);

drop table if exists public.product_coverage;
drop table if exists public.technical_resources;
drop table if exists public.admin_invitations;
drop table if exists public.product_view_dedup;
drop table if exists public.product_view_daily;
drop table if exists public.admin_audit_log;
drop table if exists public.products;
drop table if exists public.admin_members;
drop table if exists public.contact_messages;
drop table if exists public.wishlist_items;
drop table if exists public.quote_events;
drop table if exists public.quote_request_items;
drop table if exists public.quote_requests;
drop table if exists public.quote_rate_limits;

drop function if exists public.technical_resources_touch();
drop function if exists public.products_unarchive_on_publish();
drop function if exists public.products_touch_updated_at();
drop function if exists public.quote_requests_touch_updated_at();

-- Storage bucket for technical resources (empty it first in the dashboard if it holds files).
delete from storage.buckets where id = 'technical-resources';
