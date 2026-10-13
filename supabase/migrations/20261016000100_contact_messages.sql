-- M08: contact form messages. Server-only access, same model as quotes.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text check (clerk_user_id is null or length(clerk_user_id) between 1 and 64),
  full_name text not null check (length(full_name) between 2 and 150),
  email text not null check (length(email) between 3 and 254),
  phone text check (phone is null or length(phone) between 7 and 20),
  topic text not null check (topic in ('products', 'quote', 'account', 'partnership', 'other')),
  message text not null check (length(message) between 10 and 5000),
  consent_at timestamptz not null,
  status text not null default 'new' check (status in ('new', 'read', 'closed')),
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_status_idx on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;
revoke all on table public.contact_messages from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update on table public.contact_messages to service_role;
  end if;
end;
$$;
