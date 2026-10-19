-- Product delete depends on quote status: only open quote requests (not closed or cancelled) block a
-- permanent delete. Finished quotes keep their item rows; customer and admin quote views already show
-- "Product no longer listed" / the slug for products that no longer exist. Orders store their own snapshots.
create or replace function public.admin_delete_product(p_actor text, p_slug text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.products where slug = p_slug) then
    return 'not_found';
  end if;
  if exists (
    select 1
    from public.quote_request_items i
    join public.quote_requests q on q.id = i.quote_id
    where i.product_slug = p_slug and q.status not in ('closed', 'cancelled')
  ) then
    return 'in_use';
  end if;
  delete from public.wishlist_items where product_slug = p_slug;
  delete from public.product_view_daily where product_slug = p_slug;
  delete from public.product_view_dedup where product_slug = p_slug;
  delete from public.products where slug = p_slug;
  insert into public.admin_audit_log (actor, action, entity, entity_key, details)
  values (p_actor, 'product.delete', 'product', p_slug, '{}'::jsonb);
  return 'ok';
end;
$$;

revoke all on function public.admin_delete_product(text, text) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.admin_delete_product(text, text) to service_role;
  end if;
end;
$$;
