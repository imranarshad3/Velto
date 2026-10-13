-- M09: database catalogue, admin membership, staff quote updates and audit log.
-- All tables are server-only (no anon/authenticated privileges, no policies). The public catalogue is
-- served by the API (published rows only); admin rights are checked server-side against admin_members.

create table if not exists public.admin_members (
  clerk_user_id text primary key check (length(clerk_user_id) between 1 and 64),
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now(),
  note text check (note is null or length(note) <= 200)
);
alter table public.admin_members enable row level security;
revoke all on table public.admin_members from public, anon, authenticated;
-- Grant the first admin manually (SQL editor):  insert into public.admin_members (clerk_user_id) values ('user_...');

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  name text not null check (length(name) between 2 and 120),
  category_slug text not null check (category_slug in ('tile-adhesives', 'waterproofing', 'grouts-sealants', 'concrete-repair', 'flooring-solutions', 'admixtures', 'surface-treatments', 'tools-accessories')),
  usage text not null check (length(usage) between 5 and 200),
  description text check (description is null or length(description) <= 4000),
  applications text[] not null default '{}' check (applications <@ array['bathrooms', 'kitchens', 'roofs', 'floors', 'pools', 'exterior-walls']::text[]),
  areas text[] not null default '{}' check (areas <@ array['interior', 'exterior']::text[]),
  benefits text[] not null default '{}' check (coalesce(array_length(benefits, 1), 0) <= 12),
  specifications jsonb not null default '[]' check (jsonb_typeof(specifications) = 'array'),
  pack_sizes text[] not null default '{}' check (coalesce(array_length(pack_sizes, 1), 0) <= 12),
  coverage text check (coverage is null or length(coverage) <= 500),
  documents jsonb not null default '[]' check (jsonb_typeof(documents) = 'array'),
  faq jsonb not null default '[]' check (jsonb_typeof(faq) = 'array'),
  image jsonb check (image is null or jsonb_typeof(image) = 'object'),
  price_amount numeric(12, 2) check (price_amount is null or price_amount > 0),
  price_currency text check (price_currency is null or price_currency ~ '^[A-Z]{3}$'),
  verified boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_with_currency check ((price_amount is null) = (price_currency is null))
);
create index if not exists products_listing_idx on public.products (published, sort_order, name);

create or replace function public.products_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.products_touch_updated_at();

alter table public.products enable row level security;
revoke all on table public.products from public, anon, authenticated;

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor text not null check (length(actor) between 1 and 64),
  action text not null check (length(action) <= 64),
  entity text not null check (entity in ('quote', 'product', 'message')),
  entity_key text not null check (length(entity_key) <= 120),
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_recent_idx on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;
revoke all on table public.admin_audit_log from public, anon, authenticated;

-- Staff update of a quote: status/notes, customer-visible history event and audit entry in one transaction.
create or replace function public.admin_update_quote(
  p_reference text, p_actor text, p_status text, p_note text, p_internal_notes text
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_old text;
begin
  select id, status into v_id, v_old from public.quote_requests where reference = p_reference for update;
  if v_id is null then
    return false;
  end if;

  update public.quote_requests
  set status = p_status,
      internal_notes = coalesce(p_internal_notes, internal_notes)
  where id = v_id;

  if p_status is distinct from v_old or p_note is not null then
    insert into public.quote_events (quote_id, status, note, actor) values (v_id, p_status, p_note, 'staff');
  end if;

  insert into public.admin_audit_log (actor, action, entity, entity_key, details)
  values (p_actor, 'quote.update', 'quote', p_reference,
          jsonb_build_object('from', v_old, 'to', p_status, 'note', p_note is not null, 'internal_notes', p_internal_notes is not null));
  return true;
end;
$$;

revoke all on function public.admin_update_quote(text, text, text, text, text) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select on table public.admin_members to service_role;
    grant select, insert, update on table public.products to service_role;
    grant select, insert on table public.admin_audit_log to service_role;
    grant update on table public.quote_requests to service_role;
    grant execute on function public.admin_update_quote(text, text, text, text, text) to service_role;
  end if;
end;
$$;

-- Create or update a product and record the audit entry atomically. p_product is validated by the API.
create or replace function public.admin_save_product(p_actor text, p_slug text, p_product jsonb, p_create boolean)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_found boolean;
begin
  if p_create then
    insert into public.products (
      slug, name, category_slug, usage, description, applications, areas, benefits, specifications, pack_sizes,
      coverage, documents, faq, image, price_amount, price_currency, verified, published, sort_order
    ) values (
      p_slug, p_product ->> 'name', p_product ->> 'category_slug', p_product ->> 'usage', p_product ->> 'description',
      array(select jsonb_array_elements_text(p_product -> 'applications')),
      array(select jsonb_array_elements_text(p_product -> 'areas')),
      array(select jsonb_array_elements_text(p_product -> 'benefits')),
      p_product -> 'specifications',
      array(select jsonb_array_elements_text(p_product -> 'pack_sizes')),
      p_product ->> 'coverage', p_product -> 'documents', p_product -> 'faq',
      nullif(p_product -> 'image', 'null'::jsonb),
      (p_product ->> 'price_amount')::numeric, p_product ->> 'price_currency',
      (p_product ->> 'verified')::boolean, (p_product ->> 'published')::boolean, (p_product ->> 'sort_order')::integer
    );
    v_found := true;
  else
    update public.products set
      name = p_product ->> 'name',
      category_slug = p_product ->> 'category_slug',
      usage = p_product ->> 'usage',
      description = p_product ->> 'description',
      applications = array(select jsonb_array_elements_text(p_product -> 'applications')),
      areas = array(select jsonb_array_elements_text(p_product -> 'areas')),
      benefits = array(select jsonb_array_elements_text(p_product -> 'benefits')),
      specifications = p_product -> 'specifications',
      pack_sizes = array(select jsonb_array_elements_text(p_product -> 'pack_sizes')),
      coverage = p_product ->> 'coverage',
      documents = p_product -> 'documents',
      faq = p_product -> 'faq',
      image = nullif(p_product -> 'image', 'null'::jsonb),
      price_amount = (p_product ->> 'price_amount')::numeric,
      price_currency = p_product ->> 'price_currency',
      verified = (p_product ->> 'verified')::boolean,
      published = (p_product ->> 'published')::boolean,
      sort_order = (p_product ->> 'sort_order')::integer
    where slug = p_slug;
    v_found := found;
  end if;

  if v_found then
    insert into public.admin_audit_log (actor, action, entity, entity_key, details)
    values (p_actor, case when p_create then 'product.create' else 'product.update' end, 'product', p_slug,
            jsonb_build_object('verified', (p_product ->> 'verified')::boolean, 'published', (p_product ->> 'published')::boolean));
  end if;
  return v_found;
end;
$$;

-- Customers = account holders seen in quotes or wishlists, with contact details from their latest quote.
create or replace function public.admin_customers()
returns table (clerk_user_id text, full_name text, email text, company text, quotes bigint, last_quote_at timestamptz, wishlist bigint)
language sql
security invoker
set search_path = ''
stable
as $$
  with ids as (
    select q.clerk_user_id from public.quote_requests q where q.clerk_user_id is not null
    union
    select w.clerk_user_id from public.wishlist_items w
  )
  select ids.clerk_user_id,
         latest.full_name, latest.email, latest.company,
         (select count(*) from public.quote_requests q where q.clerk_user_id = ids.clerk_user_id),
         (select max(q.created_at) from public.quote_requests q where q.clerk_user_id = ids.clerk_user_id),
         (select count(*) from public.wishlist_items w where w.clerk_user_id = ids.clerk_user_id)
  from ids
  left join lateral (
    select q.full_name, q.email, q.company from public.quote_requests q
    where q.clerk_user_id = ids.clerk_user_id order by q.created_at desc limit 1
  ) latest on true
  order by 6 desc nulls last
  limit 500;
$$;

create or replace function public.admin_overview()
returns jsonb
language sql
security invoker
set search_path = ''
stable
as $$
  select jsonb_build_object(
    'quotesByStatus', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from public.quote_requests group by status) s), '{}'::jsonb),
    'quotesLast7Days', (select count(*) from public.quote_requests where created_at > now() - interval '7 days'),
    'newMessages', (select count(*) from public.contact_messages where status = 'new'),
    'products', (select count(*) from public.products),
    'productsVerified', (select count(*) from public.products where verified),
    'productsPublished', (select count(*) from public.products where published),
    'customers', (select count(*) from (select clerk_user_id from public.quote_requests where clerk_user_id is not null union select clerk_user_id from public.wishlist_items) c)
  );
$$;

create or replace function public.admin_update_message(p_id uuid, p_actor text, p_status text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.contact_messages set status = p_status where id = p_id;
  if not found then
    return false;
  end if;
  insert into public.admin_audit_log (actor, action, entity, entity_key, details)
  values (p_actor, 'message.update', 'message', p_id::text, jsonb_build_object('status', p_status));
  return true;
end;
$$;

revoke all on function public.admin_save_product(text, text, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.admin_customers() from public, anon, authenticated;
revoke all on function public.admin_overview() from public, anon, authenticated;
revoke all on function public.admin_update_message(uuid, text, text) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.admin_save_product(text, text, jsonb, boolean) to service_role;
    grant execute on function public.admin_customers() to service_role;
    grant execute on function public.admin_overview() to service_role;
    grant execute on function public.admin_update_message(uuid, text, text) to service_role;
  end if;
end;
$$;
