-- M10: product view analytics. Views are counted server-side only (POST /api/track/view), deduplicated per
-- visitor, product and UTC day, and stored as daily aggregates. The visitor key is an HMAC computed on the
-- server (never a raw IP or user agent). Same access model as earlier migrations: RLS on, no anon/
-- authenticated privileges or policies, server secret key only.

create table if not exists public.product_view_daily (
  product_slug text not null check (product_slug ~ '^[a-z0-9-]{1,80}$'),
  day date not null,
  views integer not null default 0 check (views >= 0),
  primary key (product_slug, day)
);

create index if not exists product_view_daily_day_idx on public.product_view_daily (day);

-- Short-lived dedup ledger: one row per (visitor, product, day). Pruned after two days.
create table if not exists public.product_view_dedup (
  visitor_key text not null check (length(visitor_key) = 64),
  product_slug text not null check (product_slug ~ '^[a-z0-9-]{1,80}$'),
  day date not null,
  primary key (visitor_key, product_slug, day)
);

create index if not exists product_view_dedup_day_idx on public.product_view_dedup (day);

-- Analytics reads quote items by product and quote date.
create index if not exists quote_request_items_product_idx on public.quote_request_items (product_slug);
create index if not exists quote_requests_created_idx on public.quote_requests (created_at);

alter table public.product_view_daily enable row level security;
alter table public.product_view_dedup enable row level security;
revoke all on table public.product_view_daily, public.product_view_dedup from public, anon, authenticated;

-- Records one view. Returns true when counted, false for a duplicate or an unknown/unpublished product.
create or replace function public.record_product_view(p_slug text, p_visitor_key text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'utc')::date;
begin
  if not exists (select 1 from public.products where slug = p_slug and published) then
    return false;
  end if;

  insert into public.product_view_dedup (visitor_key, product_slug, day)
  values (p_visitor_key, p_slug, v_day)
  on conflict do nothing;
  if not found then
    return false;
  end if;

  insert into public.product_view_daily (product_slug, day, views)
  values (p_slug, v_day, 1)
  on conflict (product_slug, day) do update set views = public.product_view_daily.views + 1;

  -- Opportunistic pruning keeps the ledger small without a cron job.
  if random() < 0.02 then
    delete from public.product_view_dedup where day < v_day - 1;
  end if;
  return true;
end;
$$;

-- Daily activity per product since p_since (null = all time), plus all-time view totals.
-- Quote rows are demand signals only; they are never reported as sales.
create or replace function public.admin_product_activity(p_since date)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'views', coalesce((
      select jsonb_agg(jsonb_build_object('slug', product_slug, 'day', day, 'n', views))
      from public.product_view_daily
      where p_since is null or day >= p_since
    ), '[]'::jsonb),
    'quotes', coalesce((
      select jsonb_agg(jsonb_build_object('slug', slug, 'day', day, 'unit', unit, 'requests', requests, 'quantity', quantity))
      from (
        select i.product_slug as slug, (q.created_at at time zone 'utc')::date as day, i.quantity_unit as unit,
               count(*) as requests, sum(i.quantity) as quantity
        from public.quote_request_items i
        join public.quote_requests q on q.id = i.quote_id
        where p_since is null or q.created_at >= p_since::timestamp at time zone 'utc'
        group by 1, 2, 3
      ) agg
    ), '[]'::jsonb),
    'viewTotals', coalesce((
      select jsonb_agg(jsonb_build_object('slug', product_slug, 'n', total))
      from (select product_slug, sum(views) as total from public.product_view_daily group by 1) t
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.record_product_view(text, text) from public, anon, authenticated;
revoke all on function public.admin_product_activity(date) from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    revoke all on table public.product_view_daily, public.product_view_dedup from service_role;
    grant select, insert, update on table public.product_view_daily to service_role;
    grant select, insert, delete on table public.product_view_dedup to service_role;
    grant execute on function public.record_product_view(text, text) to service_role;
    grant execute on function public.admin_product_activity(date) to service_role;
  end if;
end;
$$;
