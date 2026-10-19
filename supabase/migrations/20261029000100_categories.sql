-- Product categories as first-class rows managed from /admin/categories. Products reference a category by
-- slug (FK, cascades slug changes, blocks deleting a category that still has products). products.category_name
-- is kept as a denormalised copy that a trigger always syncs from categories.name, so existing reads keep working.
-- Saving a product with an unknown category slug creates that category (the product editor's "+ New category").
-- Same access model as earlier migrations: RLS on, no anon/authenticated access, server key only.

create table if not exists public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  name text not null check (length(name) between 2 and 80),
  description text check (description is null or length(description) <= 300),
  image jsonb check (image is null or jsonb_typeof(image) = 'object'),
  visible boolean not null default true,
  sort_order integer not null default 0 check (sort_order between -10000 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_order_idx on public.categories (sort_order, name);

alter table public.admin_audit_log drop constraint if exists admin_audit_log_entity_check;
alter table public.admin_audit_log
  add constraint admin_audit_log_entity_check
  check (entity in ('quote', 'product', 'message', 'admin_invitation', 'admin_member', 'resource', 'category'));

-- Built-in categories (images ship in /public/images/categories), then any custom categories already in use.
insert into public.categories (slug, name, image, sort_order) values
  ('tile-adhesives', 'Tile Adhesives', '{"src":"/images/categories/tile-adhesives.webp","width":366,"height":234,"alt":"Notched trowel spreading adhesive between floor tiles"}', 1),
  ('waterproofing', 'Waterproofing', '{"src":"/images/categories/waterproofing.webp","width":420,"height":234,"alt":"Roller applying blue waterproofing coating"}', 2),
  ('grouts-sealants', 'Grouts & Sealants', '{"src":"/images/categories/grouts-sealants.webp","width":351,"height":234,"alt":"Gloved hand pressing grout into tile joints"}', 3),
  ('concrete-repair', 'Concrete Repair', '{"src":"/images/categories/concrete-repair.webp","width":357,"height":234,"alt":"Trowel patching a damaged concrete surface"}', 4),
  ('flooring-solutions', 'Flooring Solutions', '{"src":"/images/categories/flooring-solutions.webp","width":363,"height":234,"alt":"Glossy seamless floor in an industrial hall"}', 5),
  ('admixtures', 'Admixtures', '{"src":"/images/categories/admixtures.webp","width":351,"height":234,"alt":"Concrete mix being poured on site"}', 6),
  ('surface-treatments', 'Surface Treatments', '{"src":"/images/categories/surface-treatments.webp","width":582,"height":234,"alt":"Roller applying a coating to a wall"}', 7),
  ('tools-accessories', 'Tools & Accessories', '{"src":"/images/categories/tools-accessories.webp","width":405,"height":234,"alt":"Trowels, level and hand tools laid on concrete"}', 8)
on conflict (slug) do nothing;

insert into public.categories (slug, name, sort_order)
select distinct on (p.category_slug)
  p.category_slug,
  coalesce(nullif(p.category_name, ''), initcap(replace(p.category_slug, '-', ' '))),
  100
from public.products p
order by p.category_slug, p.updated_at desc
on conflict (slug) do nothing;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_category_fk') then
    alter table public.products
      add constraint products_category_fk foreign key (category_slug) references public.categories (slug) on update cascade;
  end if;
end;
$$;
create index if not exists products_category_slug_idx on public.products (category_slug);

create or replace function public.categories_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists categories_touch on public.categories;
create trigger categories_touch before update on public.categories for each row execute function public.categories_touch();

-- Unknown category on a product save → create it (appended to the end); then copy the canonical name.
create or replace function public.products_sync_category() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_name text;
begin
  insert into public.categories (slug, name, sort_order)
  values (
    new.category_slug,
    coalesce(nullif(new.category_name, ''), initcap(replace(new.category_slug, '-', ' '))),
    (select coalesce(max(sort_order), 0) + 1 from public.categories)
  )
  on conflict (slug) do nothing;
  select c.name into v_name from public.categories c where c.slug = new.category_slug;
  new.category_name := v_name;
  return new;
end;
$$;

drop trigger if exists products_sync_category on public.products;
create trigger products_sync_category before insert or update of category_slug, category_name on public.products
for each row execute function public.products_sync_category();

update public.products p set category_name = c.name from public.categories c where c.slug = p.category_slug and p.category_name is distinct from c.name;

-- Create or update a category. Slugs are fixed after creation. Renames propagate to products.
create or replace function public.admin_save_category(p_actor text, p_slug text, p_category jsonb, p_create boolean)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admin_members where clerk_user_id = p_actor) then raise exception 'forbidden'; end if;
  if p_create then
    if exists (select 1 from public.categories where slug = p_slug) then
      return 'conflict';
    end if;
    insert into public.categories (slug, name, description, image, visible, sort_order)
    values (
      p_slug, p_category ->> 'name', p_category ->> 'description', nullif(p_category -> 'image', 'null'::jsonb),
      coalesce((p_category ->> 'visible')::boolean, true),
      (select coalesce(max(sort_order), 0) + 1 from public.categories)
    );
  else
    update public.categories
    set name = p_category ->> 'name',
        description = p_category ->> 'description',
        image = nullif(p_category -> 'image', 'null'::jsonb),
        visible = coalesce((p_category ->> 'visible')::boolean, true)
    where slug = p_slug;
    if not found then
      return 'not_found';
    end if;
    update public.products set category_name = p_category ->> 'name' where category_slug = p_slug and category_name is distinct from p_category ->> 'name';
  end if;
  insert into public.admin_audit_log (actor, action, entity, entity_key, details)
  values (p_actor, case when p_create then 'category.create' else 'category.update' end, 'category', p_slug, jsonb_build_object('name', p_category ->> 'name'));
  return 'ok';
end;
$$;

-- Display order: position in the array. Unlisted categories keep their order after the listed ones.
create or replace function public.admin_reorder_categories(p_actor text, p_slugs text[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.admin_members where clerk_user_id = p_actor) then raise exception 'forbidden'; end if;
  update public.categories c set sort_order = o.pos
  from unnest(p_slugs) with ordinality as o(slug, pos)
  where c.slug = o.slug and c.sort_order is distinct from o.pos;
  insert into public.admin_audit_log (actor, action, entity, entity_key, details)
  values (p_actor, 'category.reorder', 'category', 'all', jsonb_build_object('count', coalesce(array_length(p_slugs, 1), 0)));
end;
$$;

-- Delete a category. With p_move_to, its products are first moved to that category; without it, a category
-- that still has products is refused ('in_use').
create or replace function public.admin_delete_category(p_actor text, p_slug text, p_move_to text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_moved integer := 0;
begin
  if not exists (select 1 from public.admin_members where clerk_user_id = p_actor) then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.categories where slug = p_slug) then
    return 'not_found';
  end if;
  if p_move_to is not null then
    if p_move_to = p_slug or not exists (select 1 from public.categories where slug = p_move_to) then
      return 'invalid_target';
    end if;
    update public.products set category_slug = p_move_to, category_name = null where category_slug = p_slug;
    get diagnostics v_moved = row_count;
  elsif exists (select 1 from public.products where category_slug = p_slug) then
    return 'in_use';
  end if;
  delete from public.categories where slug = p_slug;
  insert into public.admin_audit_log (actor, action, entity, entity_key, details)
  values (p_actor, 'category.delete', 'category', p_slug, jsonb_build_object('movedTo', p_move_to, 'moved', v_moved));
  return 'ok';
end;
$$;

alter table public.categories enable row level security;
revoke all on table public.categories from public, anon, authenticated;
revoke all on function public.categories_touch() from public, anon, authenticated;
revoke all on function public.products_sync_category() from public, anon, authenticated;
revoke all on function public.admin_save_category(text, text, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.admin_reorder_categories(text, text[]) from public, anon, authenticated;
revoke all on function public.admin_delete_category(text, text, text) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.categories to service_role;
    grant execute on function public.admin_save_category(text, text, jsonb, boolean) to service_role;
    grant execute on function public.admin_reorder_categories(text, text[]) to service_role;
    grant execute on function public.admin_delete_category(text, text, text) to service_role;
  end if;
end;
$$;
