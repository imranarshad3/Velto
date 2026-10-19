-- Order tracking regression (run in one transaction, always rolled back):
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f tests/sql/order-tracking-regression.sql
begin;
insert into public.admin_members(clerk_user_id) values ('user_track_admin') on conflict do nothing;
insert into public.orders(id, clerk_user_id, request_key, customer, items, subtotal, total)
values ('c0000000-0000-4000-8000-0000000000aa', 'user_track_cust', gen_random_uuid(),
  '{"name":"Test","email":"t@example.test","phone":"+923000000000","address":"Test address 1","city":"Lahore","country":"Pakistan"}',
  '[{"slug":"no-stock-tracking","name":"X","quantity":1,"unitPrice":100}]', 100, 400);
set local role service_role;
do $$
declare id uuid := 'c0000000-0000-4000-8000-0000000000aa'; o public.orders;
begin
  begin perform public.admin_update_order('user_not_admin', id, 'placed', 'confirmed', null, null, null, null, null); raise exception 'non-admin allowed';
  exception when others then if sqlerrm <> 'forbidden' then raise; end if; end;
  assert public.admin_update_order('user_track_admin', id, 'shipped', 'confirmed', null, null, null, null, null) = 'conflict', 'stale expected status must conflict';
  assert public.admin_update_order('user_track_admin', id, 'placed', 'processing', 'Packing now', true, null, null, null) = 'ok', 'forward skip allowed';
  assert public.admin_update_order('user_track_admin', id, 'processing', 'confirmed', null, null, null, null, null) = 'invalid_transition', 'backwards blocked';
  assert public.admin_update_order('user_track_admin', id, 'processing', 'shipped', null, null, 'TCS', 'TCS-123456', current_date + 2) = 'ok', 'ship';
  select * into o from public.orders where orders.id = 'c0000000-0000-4000-8000-0000000000aa';
  assert o.tracking_number ~ '^VT[A-Z0-9]{10}$', 'tracking id generated on shipment';
  assert o.carrier = 'TCS' and o.carrier_reference = 'TCS-123456' and o.estimated_delivery = current_date + 2, 'shipment details saved';
  assert jsonb_array_length(o.status_history) = 2, 'one event per change';
  assert o.status_history->0->>'note' = 'Packing now' and (o.status_history->0->>'public')::boolean, 'note recorded';
  assert public.admin_update_order('user_track_admin', id, 'shipped', 'shipped', null, null, 'TCS', 'TCS-123456', current_date + 2) = 'ok', 'no-op ok';
  select * into o from public.orders where orders.id = 'c0000000-0000-4000-8000-0000000000aa';
  assert jsonb_array_length(o.status_history) = 2, 'no-op records nothing';
  assert public.admin_update_order('user_track_admin', id, 'shipped', 'delivered', null, null, 'TCS', 'TCS-123456', null) = 'ok', 'deliver';
  assert public.admin_update_order('user_track_admin', id, 'delivered', 'cancelled', null, null, null, null, null) = 'closed', 'delivered is terminal';
  assert public.admin_update_order('user_track_admin', gen_random_uuid(), 'placed', 'confirmed', null, null, null, null, null) = 'not_found', 'missing order';
  raise notice 'order tracking regression: all assertions passed';
end $$;
reset role;
set local role anon;
do $$ begin
  perform public.admin_update_order('user_track_admin', gen_random_uuid(), 'placed', 'confirmed', null, null, null, null, null);
  raise exception 'anon could execute';
exception when insufficient_privilege then null; end $$;
rollback;
