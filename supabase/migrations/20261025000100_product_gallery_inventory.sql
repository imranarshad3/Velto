-- Gallery and explicit inventory. Legacy stock stays unknown until the owner enters it.
alter table public.products add column images jsonb not null default '[]' check(jsonb_typeof(images)='array' and jsonb_array_length(images)<=8);
alter table public.products add column stock_quantity integer check(stock_quantity between 0 and 10000000);
alter table public.products add column category_name text check(length(category_name) between 2 and 80);
alter table public.products drop constraint products_category_slug_check;
alter table public.products add constraint products_category_slug_check check(category_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(category_slug)<=80);
create or replace function public.admin_save_product(p_actor text, p_slug text, p_product jsonb, p_create boolean)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_found boolean;
begin
  if not exists(select 1 from public.admin_members where clerk_user_id=p_actor) then raise exception 'forbidden'; end if;
  if p_create then
    insert into public.products (
      slug, name, category_slug, usage, description, applications, areas, benefits, specifications, pack_sizes,
      coverage, documents, faq, image, price_amount, price_currency, verified, published, sort_order, category_name, images, stock_quantity
    ) values (
      p_slug, p_product ->> 'name', p_product ->> 'category_slug', p_product ->> 'usage', p_product ->> 'description',
      array(select jsonb_array_elements_text(p_product -> 'applications')),
      array(select jsonb_array_elements_text(p_product -> 'areas')),
      array(select jsonb_array_elements_text(p_product -> 'benefits')),
      p_product -> 'specifications',
      array(select jsonb_array_elements_text(p_product -> 'pack_sizes')),
      p_product ->> 'coverage', p_product -> 'documents', p_product -> 'faq',
      nullif(p_product -> 'image', 'null'::jsonb),
      (p_product ->> 'price_amount')::numeric, p_product ->> 'price_currency',
      (p_product ->> 'verified')::boolean, (p_product ->> 'published')::boolean, (p_product ->> 'sort_order')::integer, p_product ->> 'category_name', coalesce(p_product -> 'images','[]'::jsonb), (p_product ->> 'stock_quantity')::integer
    );
    v_found := true;
  else
    update public.products set
      name = p_product ->> 'name',
      category_slug = p_product ->> 'category_slug',
      usage = p_product ->> 'usage',
      description = p_product ->> 'description',
      applications = array(select jsonb_array_elements_text(p_product -> 'applications')),
      areas = array(select jsonb_array_elements_text(p_product -> 'areas')),
      benefits = array(select jsonb_array_elements_text(p_product -> 'benefits')),
      specifications = p_product -> 'specifications',
      pack_sizes = array(select jsonb_array_elements_text(p_product -> 'pack_sizes')),
      coverage = p_product ->> 'coverage',
      documents = p_product -> 'documents',
      faq = p_product -> 'faq',
      image = nullif(p_product -> 'image', 'null'::jsonb),
      price_amount = (p_product ->> 'price_amount')::numeric,
      price_currency = p_product ->> 'price_currency',
      verified = (p_product ->> 'verified')::boolean,
      published = (p_product ->> 'published')::boolean,
      category_name = p_product ->> 'category_name',
      images = coalesce(p_product -> 'images','[]'::jsonb),
      stock_quantity = (p_product ->> 'stock_quantity')::integer,
      sort_order = (p_product ->> 'sort_order')::integer
    where slug = p_slug;
    v_found := found;
  end if;

  if v_found then
    insert into public.admin_audit_log (actor, action, entity, entity_key, details)
    values (p_actor, case when p_create then 'product.create' else 'product.update' end, 'product', p_slug,
            jsonb_build_object('verified', (p_product ->> 'verified')::boolean, 'published', (p_product ->> 'published')::boolean));
  end if;
  return v_found;
end;
$$;

create or replace function public.place_cod_order(p_user text,p_key uuid,p_customer jsonb,p_items jsonb,p_expected numeric)
returns public.orders language plpgsql security invoker set search_path='' as $$
declare r public.orders; line jsonb; product public.products; qty integer; subtotal numeric:=0; snapshots jsonb:='[]';
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user,0));
 select * into r from public.orders where clerk_user_id=p_user and request_key=p_key;
 if found then return r; end if;
 if (select count(*) from public.orders where clerk_user_id=p_user and created_at>now()-interval '1 day')>=20 then raise exception 'order_limit'; end if;
 if jsonb_array_length(p_items) not between 1 and 20 then raise exception 'invalid_items'; end if;
 if (select count(distinct x->>'slug') from jsonb_array_elements(p_items) x)<>jsonb_array_length(p_items) then raise exception 'invalid_items'; end if;
 for line in select * from jsonb_array_elements(p_items) order by value->>'slug' loop
  qty:=(line->>'quantity')::integer;
  if qty not between 1 and 999 then raise exception 'invalid_quantity'; end if;
  select * into product from public.products where slug=line->>'slug' and published and not coalesce(archived,false) and verified and price_amount>0 and price_currency='PKR' for update;
  if not found then raise exception 'product_unavailable'; end if;
  if product.stock_quantity is not null and product.stock_quantity<qty then raise exception 'insufficient_stock'; end if;
  subtotal:=subtotal+product.price_amount*qty;
  snapshots:=snapshots||jsonb_build_array(jsonb_build_object('slug',product.slug,'name',product.name,'quantity',qty,'unitPrice',product.price_amount,'image',product.image));
 end loop;
 if subtotal+300<>p_expected then raise exception 'price_changed'; end if;
 insert into public.orders(clerk_user_id,request_key,customer,items,subtotal,total) values(p_user,p_key,p_customer,snapshots,subtotal,subtotal+300) returning * into r;
 return r;
end; $$;

-- Reserve known inventory atomically with the order. Retries return the existing order, never reserve twice.
alter table public.orders add column reserved_inventory jsonb not null default '[]';
create function public.sync_order_inventory() returns trigger
language plpgsql security invoker set search_path='' as $$
declare item jsonb; available integer;
begin
 if TG_OP='INSERT' then
   new.reserved_inventory := '[]';
   for item in select * from jsonb_array_elements(new.items) order by value->>'slug' loop
     select stock_quantity into available from public.products where slug=item->>'slug' for update;
     if available is not null then
       if available<(item->>'quantity')::integer then raise exception 'insufficient_stock'; end if;
       update public.products set stock_quantity=stock_quantity-(item->>'quantity')::integer where slug=item->>'slug';
       new.reserved_inventory:=new.reserved_inventory||jsonb_build_array(jsonb_build_object('slug',item->>'slug','quantity',(item->>'quantity')::integer));
     end if;
   end loop;
 elsif old.status='cancelled' and new.status<>'cancelled' then
   raise exception 'cancelled_order_closed';
 elsif new.status='cancelled' and old.status<>'cancelled' then
   for item in select * from jsonb_array_elements(old.reserved_inventory) order by value->>'slug' loop
     update public.products set stock_quantity=stock_quantity+(item->>'quantity')::integer where slug=item->>'slug';
   end loop;
   new.reserved_inventory := '[]';
 end if;
 return new;
end; $$;
revoke all on function public.sync_order_inventory() from public,anon,authenticated;
grant execute on function public.sync_order_inventory() to service_role;
create trigger order_inventory before insert or update of status on public.orders for each row execute function public.sync_order_inventory();
