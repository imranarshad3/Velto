-- Categories regression (run in one transaction, always rolled back):
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f tests/sql/categories-regression.sql
begin;
insert into public.admin_members(clerk_user_id) values ('user_reg') on conflict do nothing;

do $$
declare
  p jsonb := '{"name":"Reg Sealer","category_slug":"reg-sealers","category_name":"Reg Sealers","images":[],"stock_quantity":3,
    "usage":"For regression testing only.","description":null,"applications":[],"areas":[],"benefits":[],"specifications":[],
    "pack_sizes":[],"coverage":null,"documents":[],"faq":[],"image":null,"price_amount":100,"price_currency":"PKR",
    "verified":true,"published":false,"sort_order":0}';
  r text;
begin
  -- Saving a product with an unknown category creates it and copies its name.
  perform public.admin_save_product('user_reg', 'reg-sealer', p, true);
  assert (select name from public.categories where slug = 'reg-sealers') = 'Reg Sealers', 'category auto-created';
  assert (select category_name from public.products where slug = 'reg-sealer') = 'Reg Sealers', 'product name synced';

  -- A product cannot override the canonical category name.
  update public.products set category_name = 'Spoofed' where slug = 'reg-sealer';
  assert (select category_name from public.products where slug = 'reg-sealer') = 'Reg Sealers', 'name stays canonical';

  -- Create / conflict / rename (propagates) / not found.
  assert public.admin_save_category('user_reg', 'reg-empty', '{"name":"Reg Empty","description":null,"image":null,"visible":true}', true) = 'ok';
  assert public.admin_save_category('user_reg', 'reg-empty', '{"name":"Again","description":null,"image":null,"visible":true}', true) = 'conflict';
  assert public.admin_save_category('user_reg', 'reg-sealers', '{"name":"Reg Renamed","description":"d","image":null,"visible":false}', false) = 'ok';
  assert (select category_name from public.products where slug = 'reg-sealer') = 'Reg Renamed', 'rename propagates';
  assert (select visible from public.categories where slug = 'reg-sealers') = false;
  assert public.admin_save_category('user_reg', 'reg-missing', '{"name":"Nope","description":null,"image":null,"visible":true}', false) = 'not_found';

  -- Reorder by array position.
  perform public.admin_reorder_categories('user_reg', array['reg-empty', 'reg-sealers']);
  assert (select sort_order from public.categories where slug = 'reg-empty') = 1;
  assert (select sort_order from public.categories where slug = 'reg-sealers') = 2;

  -- Delete: refused while products use it; invalid targets refused; move-then-delete works.
  assert public.admin_delete_category('user_reg', 'reg-sealers', null) = 'in_use';
  assert public.admin_delete_category('user_reg', 'reg-sealers', 'reg-sealers') = 'invalid_target';
  assert public.admin_delete_category('user_reg', 'reg-sealers', 'reg-nowhere') = 'invalid_target';
  assert public.admin_delete_category('user_reg', 'reg-sealers', 'reg-empty') = 'ok';
  assert (select category_slug || '|' || category_name from public.products where slug = 'reg-sealer') = 'reg-empty|Reg Empty', 'moved';
  assert not exists (select 1 from public.categories where slug = 'reg-sealers');
  assert public.admin_delete_category('user_reg', 'reg-sealers', null) = 'not_found';

  -- The foreign key blocks deleting a used category directly.
  begin
    delete from public.categories where slug = 'reg-empty';
    raise exception 'FK did not block delete';
  exception when foreign_key_violation then null;
  end;

  assert (select count(*) from public.admin_audit_log where actor = 'user_reg' and entity = 'category') = 4, 'create, rename, reorder and delete are audited';

  -- Non-admin actors are refused even with the server key.
  begin
    perform public.admin_delete_category('user_stranger', 'reg-empty', null);
    raise exception 'non-admin was allowed';
  exception when raise_exception then
    if sqlerrm <> 'forbidden' then raise; end if;
  end;
end;
$$;

-- No browser roles can read or write categories or call the functions.
select has_table_privilege('anon', 'public.categories', 'select') as anon_select,
       has_table_privilege('authenticated', 'public.categories', 'select') as auth_select,
       has_function_privilege('anon', 'public.admin_delete_category(text, text, text)', 'execute') as anon_exec,
       has_table_privilege('service_role', 'public.categories', 'select') as service_select;

rollback;
