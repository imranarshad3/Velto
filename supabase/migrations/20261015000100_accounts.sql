-- M07: quote status history and account wishlists. Same model: server-only access, no API-role grants.

create table if not exists public.quote_events (
  id bigint generated always as identity primary key,
  quote_id uuid not null references public.quote_requests (id) on delete cascade,
  status text not null check (status in ('submitted', 'reviewing', 'quoted', 'closed')),
  -- Customer-visible message (staff internal notes stay in quote_requests.internal_notes).
  note text check (note is null or length(note) <= 1000),
  actor text not null check (actor in ('customer', 'staff', 'system')),
  created_at timestamptz not null default now()
);
create index if not exists quote_events_quote_idx on public.quote_events (quote_id, created_at);

alter table public.quote_events enable row level security;
revoke all on table public.quote_events from public, anon, authenticated;

-- Backfill a "submitted" event for existing quotes.
insert into public.quote_events (quote_id, status, actor, created_at)
select q.id, 'submitted', 'customer', q.created_at
from public.quote_requests q
where not exists (select 1 from public.quote_events e where e.quote_id = q.id);

-- Recreate the atomic create function so every new quote gets its first event.
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

  insert into public.quote_events (quote_id, status, actor) values (v_id, 'submitted', 'customer');

  return query select q.reference, q.status, q.created_at from public.quote_requests q where q.id = v_id;
end;
$$;
revoke all on function public.create_quote_request(jsonb, jsonb) from public, anon, authenticated;

create table if not exists public.wishlist_items (
  clerk_user_id text not null check (length(clerk_user_id) between 1 and 64),
  product_slug text not null check (product_slug ~ '^[a-z0-9-]{1,80}$'),
  created_at timestamptz not null default now(),
  primary key (clerk_user_id, product_slug)
);

alter table public.wishlist_items enable row level security;
revoke all on table public.wishlist_items from public, anon, authenticated;

-- Atomically replace one user's wishlist (user id comes from the verified session on the server).
create or replace function public.replace_wishlist(p_user text, p_slugs text[])
returns setof text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if coalesce(array_length(p_slugs, 1), 0) > 100 then
    raise exception 'too many items' using errcode = '22023';
  end if;
  delete from public.wishlist_items where clerk_user_id = p_user and product_slug <> all (coalesce(p_slugs, '{}'));
  insert into public.wishlist_items (clerk_user_id, product_slug)
  select p_user, slug from unnest(coalesce(p_slugs, '{}')) as slug
  on conflict do nothing;
  return query select w.product_slug from public.wishlist_items w where w.clerk_user_id = p_user order by w.created_at desc, w.product_slug;
end;
$$;
revoke all on function public.replace_wishlist(text, text[]) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert on table public.quote_events to service_role;
    grant select, insert, delete on table public.wishlist_items to service_role;
    grant execute on function public.create_quote_request(jsonb, jsonb) to service_role;
    grant execute on function public.replace_wishlist(text, text[]) to service_role;
  end if;
end;
$$;
