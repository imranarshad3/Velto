-- M05 baseline: server-only quote write/read access. Review before deployment.
create extension if not exists pgcrypto;
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('NQ-' || upper(substr(encode(gen_random_bytes(9), 'hex'), 1, 12))),
  clerk_user_id text,
  guest_token_hash text unique,
  full_name text not null check (length(full_name) between 2 and 150),
  email text not null,
  phone text not null,
  company text,
  product_slug text,
  quantity numeric check (quantity is null or quantity > 0),
  quantity_unit text,
  project_type text,
  city text not null,
  delivery_location text,
  description text not null check (length(description) between 10 and 5000),
  consent_at timestamptz not null,
  status text not null default 'submitted' check (status in ('submitted', 'reviewing', 'quoted', 'closed')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_quote_owner check (clerk_user_id is not null or guest_token_hash is not null)
);
create index if not exists quote_requests_owner_recent_idx on public.quote_requests (clerk_user_id, created_at desc) where clerk_user_id is not null;
create index if not exists quote_requests_status_recent_idx on public.quote_requests (status, created_at desc);
create or replace function public.quote_requests_touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists quote_requests_touch on public.quote_requests;
create trigger quote_requests_touch before update on public.quote_requests for each row execute function public.quote_requests_touch_updated_at();
alter table public.quote_requests enable row level security;
revoke all on table public.quote_requests from anon, authenticated;
-- No public INSERT/SELECT/UPDATE/DELETE policies. All operations go via trusted server endpoint.
