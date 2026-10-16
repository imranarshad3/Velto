-- Cash-on-delivery orders. Server-mediated Clerk identity; no browser database access.
create table public.orders (
 id uuid primary key default gen_random_uuid(),
 reference text not null unique default ('VEL-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
 clerk_user_id text not null,
 request_key uuid not null,
 customer jsonb not null,
 items jsonb not null,
 subtotal numeric(12,2) not null check(subtotal>0),
 delivery numeric(12,2) not null default 300 check(delivery=300),
 total numeric(12,2) not null check(total=subtotal+delivery),
 currency text not null default 'PKR' check(currency='PKR'),
 payment_method text not null default 'cod' check(payment_method='cod'),
 status text not null default 'placed' check(status in ('placed','confirmed','shipped','delivered','cancelled')),
 created_at timestamptz not null default now(),
 unique(clerk_user_id,request_key)
);
create index orders_customer_created on public.orders(clerk_user_id,created_at desc);
alter table public.orders enable row level security;
revoke all on public.orders from public,anon,authenticated;
grant select,insert,update on public.orders to service_role;

create function public.place_cod_order(p_user text,p_key uuid,p_customer jsonb,p_items jsonb,p_expected numeric)
returns public.orders language plpgsql security invoker set search_path='' as $$
declare r public.orders; line jsonb; product public.products; qty integer; subtotal numeric:=0; snapshots jsonb:='[]';
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user,0));
 select * into r from public.orders where clerk_user_id=p_user and request_key=p_key;
 if found then return r; end if;
 if (select count(*) from public.orders where clerk_user_id=p_user and created_at>now()-interval '1 day')>=20 then raise exception 'order_limit'; end if;
 if jsonb_array_length(p_items) not between 1 and 20 then raise exception 'invalid_items'; end if;
 if (select count(distinct x->>'slug') from jsonb_array_elements(p_items) x)<>jsonb_array_length(p_items) then raise exception 'invalid_items'; end if;
 for line in select * from jsonb_array_elements(p_items) loop
  qty:=(line->>'quantity')::integer;
  if qty not between 1 and 999 then raise exception 'invalid_quantity'; end if;
  select * into product from public.products where slug=line->>'slug' and published and not coalesce(archived,false) and verified and price_amount>0 and price_currency='PKR' for share;
  if not found then raise exception 'product_unavailable'; end if;
  subtotal:=subtotal+product.price_amount*qty;
  snapshots:=snapshots||jsonb_build_array(jsonb_build_object('slug',product.slug,'name',product.name,'quantity',qty,'unitPrice',product.price_amount,'image',product.image));
 end loop;
 if subtotal+300<>p_expected then raise exception 'price_changed'; end if;
 insert into public.orders(clerk_user_id,request_key,customer,items,subtotal,total) values(p_user,p_key,p_customer,snapshots,subtotal,subtotal+300) returning * into r;
 return r;
end; $$;
revoke all on function public.place_cod_order(text,uuid,jsonb,jsonb,numeric) from public,anon,authenticated;
grant execute on function public.place_cod_order(text,uuid,jsonb,jsonb,numeric) to service_role;

alter table public.orders add column status_history jsonb not null default '[]';
create function public.update_cod_order(p_actor text,p_id uuid,p_status text) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.admin_members where clerk_user_id=p_actor) then raise exception 'forbidden'; end if;
 update public.orders set status=p_status,status_history=status_history||jsonb_build_array(jsonb_build_object('actor',p_actor,'from',status,'to',p_status,'at',now())) where id=p_id;
 return found;
end; $$;
revoke all on function public.update_cod_order(text,uuid,text) from public,anon,authenticated;
grant execute on function public.update_cod_order(text,uuid,text) to service_role;
