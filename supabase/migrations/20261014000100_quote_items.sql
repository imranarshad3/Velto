-- M06: multi-product quote requests (quote basket). Items live in their own table; quotes and
-- items are created atomically by a server-only function. Same access model as M05: no anon/
-- authenticated privileges, no RLS policies, server secret key only.

create table if not exists public.quote_request_items (
  quote_id uuid not null references public.quote_requests (id) on delete cascade,
  position smallint not null check (position between 0 and 19),
  product_slug text not null check (product_slug ~ '^[a-z0-9-]{1,80}$'),
  quantity numeric check (quantity is null or (quantity > 0 and quantity <= 1000000)),
  quantity_unit text check (quantity_unit is null or quantity_unit in ('bags', 'buckets', 'kg', 'litres', 'units')),
  primary key (quote_id, position),
  unique (quote_id, product_slug),
  constraint item_unit_with_quantity check (quantity is null or quantity_unit is not null)
);

alter table public.quote_request_items enable row level security;
revoke all on table public.quote_request_items from public, anon, authenticated;

-- Carry M05 single-product rows over, then retire the old columns (never deployed with data,
-- but kept safe for any environment that applied M05).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quote_requests' and column_name = 'product_slug'
  ) then
    insert into public.quote_request_items (quote_id, position, product_slug, quantity, quantity_unit)
    select id, 0, product_slug, quantity, quantity_unit
    from public.quote_requests
    where product_slug is not null
    on conflict do nothing;

    alter table public.quote_requests drop column product_slug;
    alter table public.quote_requests drop column quantity;
    alter table public.quote_requests drop column quantity_unit;
  end if;
end;
$$;

-- Atomic create. Input is validated by the API first; constraints re-check everything here.
create or replace function public.create_quote_request(p_quote jsonb, p_items jsonb)
returns table (reference text, status text, created_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) > 20 then
    raise exception 'invalid items' using errcode = '22023';
  end if;

  insert into public.quote_requests (
    clerk_user_id, guest_token_hash, full_name, email, phone, company, project_type,
    city, delivery_location, description, consent_at
  ) values (
    p_quote ->> 'clerk_user_id', p_quote ->> 'guest_token_hash', p_quote ->> 'full_name', p_quote ->> 'email',
    p_quote ->> 'phone', p_quote ->> 'company', p_quote ->> 'project_type', p_quote ->> 'city',
    p_quote ->> 'delivery_location', p_quote ->> 'description', (p_quote ->> 'consent_at')::timestamptz
  )
  returning id into v_id;

  insert into public.quote_request_items (quote_id, position, product_slug, quantity, quantity_unit)
  select v_id, (item.ordinality - 1)::smallint, item.value ->> 'product_slug',
         (item.value ->> 'quantity')::numeric, item.value ->> 'quantity_unit'
  from jsonb_array_elements(p_items) with ordinality as item;

  return query select q.reference, q.status, q.created_at from public.quote_requests q where q.id = v_id;
end;
$$;

revoke all on function public.create_quote_request(jsonb, jsonb) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update, delete on table public.quote_request_items to service_role;
    grant execute on function public.create_quote_request(jsonb, jsonb) to service_role;
  end if;
end;
$$;
