-- Order tracking: richer fulfilment statuses, shipment details and an append-only activity history.
-- All writes go through admin_update_order (service_role only); the server checks admin membership and team role first.

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('placed','confirmed','processing','shipped','out_for_delivery','delivered','cancelled'));

alter table public.orders
  add column tracking_number text,
  add column carrier text check (carrier is null or char_length(carrier) between 2 and 60),
  add column carrier_reference text check (carrier_reference is null or carrier_reference ~ '^[A-Za-z0-9-]{3,40}$'),
  add column estimated_delivery date,
  add column updated_at timestamptz not null default now();
alter table public.orders add constraint orders_tracking_number_format check (tracking_number is null or tracking_number ~ '^VT[A-Z0-9]{10}$');
create unique index orders_tracking_number_key on public.orders(tracking_number) where tracking_number is not null;
create index orders_status_created on public.orders(status, created_at desc);

-- Status order for forward-only transitions; cancelled and delivered are terminal.
create function public.order_status_rank(p_status text) returns integer
language sql immutable set search_path = '' as $$
  select array_position(array['placed','confirmed','processing','shipped','out_for_delivery','delivered'], p_status)
$$;
revoke all on function public.order_status_rank(text) from public, anon, authenticated;
grant execute on function public.order_status_rank(text) to service_role;

-- Returns: ok | not_found | conflict (status changed since the admin loaded it) | invalid_transition | closed.
create function public.admin_update_order(
  p_actor text, p_id uuid, p_expected text, p_status text,
  p_note text, p_note_public boolean, p_carrier text, p_carrier_ref text, p_eta date
) returns text
language plpgsql security invoker set search_path = '' as $$
declare o public.orders; v_tracking text; v_event jsonb; v_changed boolean;
begin
  if not exists (select 1 from public.admin_members where clerk_user_id = p_actor) then raise exception 'forbidden'; end if;
  select * into o from public.orders where id = p_id for update;
  if not found then return 'not_found'; end if;
  if o.status <> p_expected then return 'conflict'; end if;
  if o.status in ('delivered','cancelled') then return 'closed'; end if;
  if p_status <> o.status and p_status <> 'cancelled'
     and coalesce(public.order_status_rank(p_status), 0) <= public.order_status_rank(o.status) then
    return 'invalid_transition';
  end if;

  v_tracking := o.tracking_number;
  -- A shipment always carries a VELTO tracking ID customers can quote; the courier's own consignment number is optional.
  if v_tracking is null and public.order_status_rank(p_status) >= public.order_status_rank('shipped') then
    loop
      v_tracking := 'VT' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      exit when not exists (select 1 from public.orders where tracking_number = v_tracking);
    end loop;
  end if;

  v_changed := p_status <> o.status
    or v_tracking is distinct from o.tracking_number
    or nullif(btrim(p_carrier), '') is distinct from o.carrier
    or nullif(btrim(p_carrier_ref), '') is distinct from o.carrier_reference
    or p_eta is distinct from o.estimated_delivery
    or nullif(btrim(p_note), '') is not null;
  if not v_changed then return 'ok'; end if;

  v_event := jsonb_strip_nulls(jsonb_build_object(
    'kind', case when p_status <> o.status then 'status' else 'update' end,
    'actor', p_actor, 'from', o.status, 'to', p_status, 'at', now(),
    'note', nullif(btrim(p_note), ''),
    'public', case when nullif(btrim(p_note), '') is null then null else coalesce(p_note_public, false) end,
    'carrier', nullif(btrim(p_carrier), ''), 'carrierReference', nullif(btrim(p_carrier_ref), ''),
    'tracking', v_tracking, 'eta', p_eta
  ));

  update public.orders set
    status = p_status,
    tracking_number = v_tracking,
    carrier = nullif(btrim(p_carrier), ''),
    carrier_reference = nullif(btrim(p_carrier_ref), ''),
    estimated_delivery = p_eta,
    updated_at = now(),
    status_history = status_history || jsonb_build_array(v_event)
  where id = p_id;
  return 'ok';
end; $$;
revoke all on function public.admin_update_order(text,uuid,text,text,text,boolean,text,text,date) from public, anon, authenticated;
grant execute on function public.admin_update_order(text,uuid,text,text,text,boolean,text,text,date) to service_role;

-- Backfill: orders already shipped or delivered get a tracking ID (status unchanged, so no inventory trigger).
update public.orders set tracking_number = 'VT' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
where tracking_number is null and status in ('shipped','out_for_delivery','delivered');

-- Superseded: status changes without transition rules or concurrency checks.
drop function if exists public.update_cod_order(text, uuid, text);
