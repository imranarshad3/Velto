-- M13: Resource Center. Technical documents (PDFs) live in a PRIVATE storage bucket; the server issues
-- one-time signed upload URLs to admins and short-lived signed download URLs for published documents.
-- product_coverage holds manufacturer coverage rates used by the calculator (shown only for verified
-- products). Same access model as earlier migrations: RLS on, no anon/authenticated access, server key only.

create table if not exists public.technical_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 3 and 160),
  summary text check (summary is null or length(summary) <= 600),
  kind text not null check (kind in ('data_sheet', 'installation_guide', 'safety_data_sheet', 'certificate', 'brochure')),
  product_slugs text[] not null default '{}' check (coalesce(array_length(product_slugs, 1), 0) <= 50),
  storage_path text not null unique check (storage_path ~ '^[a-z0-9-]+/[a-z0-9._-]+\.pdf$'),
  file_name text not null check (length(file_name) between 1 and 200),
  file_size integer not null check (file_size > 0 and file_size <= 20971520),
  published boolean not null default false,
  created_by text not null check (length(created_by) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists technical_resources_published_idx on public.technical_resources (published, kind);
create index if not exists technical_resources_products_idx on public.technical_resources using gin (product_slugs);

create or replace function public.technical_resources_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists technical_resources_touch on public.technical_resources;
create trigger technical_resources_touch before update on public.technical_resources for each row execute function public.technical_resources_touch();

-- Manufacturer coverage per product: rate per m² per coat, and the pack it is sold in.
create table if not exists public.product_coverage (
  product_slug text primary key references public.products (slug) on update cascade on delete cascade,
  rate numeric(10, 3) not null check (rate > 0 and rate <= 1000),
  rate_unit text not null check (rate_unit in ('kg', 'L')),
  coats smallint not null default 1 check (coats between 1 and 10),
  pack_amount numeric(10, 3) not null check (pack_amount > 0 and pack_amount <= 10000),
  pack_container text not null check (pack_container in ('bags', 'buckets', 'units')),
  source_resource_id uuid references public.technical_resources (id) on delete set null,
  note text check (note is null or length(note) <= 300),
  updated_by text not null check (length(updated_by) between 1 and 64),
  updated_at timestamptz not null default now()
);

alter table public.technical_resources enable row level security;
alter table public.product_coverage enable row level security;
revoke all on table public.technical_resources, public.product_coverage from public, anon, authenticated;
revoke all on function public.technical_resources_touch() from public, anon, authenticated;

-- Private bucket: PDFs only, 20 MB max. No storage.objects policies are created, so only the server key
-- (service_role, which bypasses RLS) can read or write; browsers use server-issued signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('technical-resources', 'technical-resources', false, 20971520, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    revoke all on table public.technical_resources, public.product_coverage from service_role;
    grant select, insert, update, delete on table public.technical_resources to service_role;
    grant select, insert, update, delete on table public.product_coverage to service_role;
  end if;
end;
$$;
