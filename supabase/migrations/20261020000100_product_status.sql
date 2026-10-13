-- M11: product lifecycle for the admin products table. `published` stays the storefront's source of truth;
-- `archived` marks retired products. Status is derived: published → Published, archived → Archived, otherwise
-- Draft. "Demo" is the existing `verified = false` flag, not a status. Existing rows keep their state.

alter table public.products add column if not exists archived boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_archived_not_published') then
    alter table public.products add constraint products_archived_not_published check (not (archived and published));
  end if;
end;
$$;

-- Publishing from the editor brings a product out of the archive (admin_save_product does not know `archived`).
create or replace function public.products_unarchive_on_publish() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.published then
    new.archived := false;
  end if;
  return new;
end;
$$;

drop trigger if exists products_unarchive on public.products;
create trigger products_unarchive before insert or update on public.products for each row execute function public.products_unarchive_on_publish();

create or replace function public.admin_set_product_status(p_actor text, p_slug text, p_status text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_status not in ('published', 'draft', 'archived') then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  update public.products
  set published = (p_status = 'published'), archived = (p_status = 'archived')
  where slug = p_slug;
  if not found then
    return false;
  end if;
  insert into public.admin_audit_log (actor, action, entity, entity_key, details)
  values (p_actor, 'product.status', 'product', p_slug, jsonb_build_object('status', p_status));
  return true;
end;
$$;

-- Permanent delete. Refused ('in_use') when quote requests reference the product, so customer quote
-- history never loses its products; archive those instead. Wishlist entries and view stats go with it.
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
  if exists (select 1 from public.quote_request_items where product_slug = p_slug) then
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

revoke all on function public.products_unarchive_on_publish() from public, anon, authenticated;
revoke all on function public.admin_set_product_status(text, text, text) from public, anon, authenticated;
revoke all on function public.admin_delete_product(text, text) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant delete on table public.products to service_role;
    grant delete on table public.product_view_daily to service_role;
    grant execute on function public.admin_set_product_status(text, text, text) to service_role;
    grant execute on function public.admin_delete_product(text, text) to service_role;
  end if;
end;
$$;
