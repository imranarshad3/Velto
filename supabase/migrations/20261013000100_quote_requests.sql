-- M05: private quote requests. All access goes through trusted server functions using the
-- server-held secret key; anon/authenticated roles get no table access and no RLS policies.
-- Based on the M05 kit baseline (reviewed): pgcrypto dependency removed, length checks added,
-- rate-limit table/function added.

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  -- 48 random bits; a reference alone never grants access (guests also need the secret token).
  reference text not null unique default ('NQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  clerk_user_id text check (clerk_user_id is null or length(clerk_user_id) between 1 and 64),
  -- HMAC-SHA-256 (hex) of the guest tracking token; the raw token is never stored.
  guest_token_hash text unique check (guest_token_hash is null or guest_token_hash ~ '^[0-9a-f]{64}$'),
  full_name text not null check (length(full_name) between 2 and 150),
  email text not null check (length(email) between 3 and 254),
  phone text not null check (length(phone) between 7 and 20),
  company text check (company is null or length(company) <= 150),
  product_slug text check (product_slug is null or product_slug ~ '^[a-z0-9-]{1,80}$'),
  quantity numeric check (quantity is null or (quantity > 0 and quantity <= 1000000)),
  quantity_unit text check (quantity_unit is null or quantity_unit in ('bags', 'buckets', 'kg', 'litres', 'units')),
  project_type text check (project_type is null or project_type in ('residential', 'commercial', 'industrial', 'infrastructure', 'renovation', 'other')),
  city text not null check (length(city) between 2 and 100),
  delivery_location text check (delivery_location is null or length(delivery_location) <= 200),
  description text not null check (length(description) between 10 and 5000),
  consent_at timestamptz not null,
  status text not null default 'submitted' check (status in ('submitted', 'reviewing', 'quoted', 'closed')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_quote_owner check (clerk_user_id is not null or guest_token_hash is not null)
);

create index if not exists quote_requests_owner_recent_idx
  on public.quote_requests (clerk_user_id, created_at desc) where clerk_user_id is not null;
create index if not exists quote_requests_status_recent_idx on public.quote_requests (status, created_at desc);

create or replace function public.quote_requests_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quote_requests_touch on public.quote_requests;
create trigger quote_requests_touch before update on public.quote_requests
  for each row execute function public.quote_requests_touch_updated_at();

alter table public.quote_requests enable row level security;
revoke all on table public.quote_requests from public, anon, authenticated;

-- Fixed-window rate limiting shared by all serverless instances.
-- Keys are HMACs of IP/user identifiers computed on the server; raw IPs are not stored.
create table if not exists public.quote_rate_limits (
  bucket_key text not null check (length(bucket_key) <= 128),
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket_key, window_start)
);

alter table public.quote_rate_limits enable row level security;
revoke all on table public.quote_rate_limits from public, anon, authenticated;

-- Returns true when the request is allowed.
create or replace function public.quote_rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  if p_window_seconds < 1 or p_window_seconds > 86400 or p_max < 1 then
    raise exception 'invalid rate limit arguments';
  end if;

  insert into public.quote_rate_limits as r (bucket_key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (bucket_key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;

  -- Opportunistic cleanup of expired windows.
  if random() < 0.02 then
    delete from public.quote_rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;

revoke all on function public.quote_rate_limit_hit(text, integer, integer) from public, anon, authenticated;

-- Supabase's service_role (used by the server secret key) needs explicit grants on new objects
-- when default privileges are tightened. Guarded so the migration also runs on plain Postgres.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update on table public.quote_requests to service_role;
    grant select, insert, update, delete on table public.quote_rate_limits to service_role;
    grant execute on function public.quote_rate_limit_hit(text, integer, integer) to service_role;
  end if;
end;
$$;
