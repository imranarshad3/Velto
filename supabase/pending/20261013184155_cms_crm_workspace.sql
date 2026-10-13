-- REVIEW REQUIRED. Apply only after existing catalogue/team migrations, with owner approval.
-- Additive: does not delete or rewrite existing customers, products, quotes, or membership.
begin;
create table public.workspace_roles (
  clerk_user_id text primary key references public.admin_members(clerk_user_id) on delete cascade,
  role text not null check (role in ('admin','editor','sales'))
);
create table public.cms_pages (
  slug text primary key, draft jsonb not null, published jsonb,
  version integer not null default 0, updated_at timestamptz not null default now()
);
create table public.cms_revisions (
  id uuid primary key default gen_random_uuid(), slug text not null references public.cms_pages(slug),
  content jsonb not null, action text not null, actor text not null, created_at timestamptz not null default now()
);
create index cms_revision_page on public.cms_revisions(slug, created_at desc);
create table public.cms_media (
  id uuid primary key, path text not null unique, url text not null unique, name text not null,
  alt text not null default '', folder text not null default '', tags jsonb not null default '[]',
  size integer not null check (size between 20 and 2097152), deleted boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.crm_leads (
  id uuid primary key default gen_random_uuid(), data jsonb not null,
  updated_at timestamptz not null default now()
);
create index crm_lead_follow_up on public.crm_leads ((data->>'followUp'));
create index crm_lead_email on public.crm_leads ((data->>'email'));
create table public.crm_events (
  id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.crm_leads(id),
  actor text not null, action text not null, created_at timestamptz not null default now()
);
create index crm_events_lead on public.crm_events(lead_id, created_at desc);
create table public.workspace_audit (
  id uuid primary key default gen_random_uuid(), actor text not null, action text not null,
  entity_key text not null, created_at timestamptz not null default now()
);
-- Server-only access. Clerk identities are verified by the server on every call.
alter table public.workspace_roles enable row level security;
alter table public.cms_pages enable row level security;
alter table public.cms_revisions enable row level security;
alter table public.cms_media enable row level security;
alter table public.crm_leads enable row level security;
alter table public.crm_events enable row level security;
alter table public.workspace_audit enable row level security;
revoke all on public.workspace_roles, public.cms_pages, public.cms_revisions, public.cms_media, public.crm_leads, public.crm_events, public.workspace_audit from public, anon, authenticated;
grant select, insert, update, delete on public.workspace_roles, public.cms_pages, public.cms_revisions, public.cms_media, public.crm_leads, public.crm_events, public.workspace_audit to service_role;

create function public.workspace_require(p_actor text, p_roles text[]) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(select 1 from public.admin_members m left join public.workspace_roles r on r.clerk_user_id=m.clerk_user_id where m.clerk_user_id=p_actor and coalesce(r.role,'admin')=any(p_roles)) then
    raise exception 'Team permission denied';
  end if;
end $$;

create function public.workspace_set_role(p_actor text, p_user text, p_role text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(671092);
  perform public.workspace_require(p_actor, array['admin']);
  if p_actor=p_user then raise exception 'Another administrator must change your role'; end if;
  if p_role not in ('admin','editor','sales') then raise exception 'Invalid role'; end if;
  insert into public.workspace_roles values(p_user,p_role) on conflict(clerk_user_id) do update set role=excluded.role;
  insert into public.workspace_audit(actor,action,entity_key) values(p_actor,'role:'||p_role,p_user);
end $$;

create function public.cms_mutate_page(p_actor text,p_slug text,p_version integer,p_action text,p_content jsonb,p_revision uuid) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v public.cms_pages; restored jsonb;
begin
  perform public.workspace_require(p_actor,array['admin','editor']);
  -- Serializes publishing, saves and media deletion, including first-save races.
  perform pg_advisory_xact_lock(671091);
  if p_action not in ('save','publish','unpublish','restore') then raise exception 'Invalid action'; end if;
  select * into v from public.cms_pages where slug=p_slug for update;
  if not found then
    if p_version<>0 or p_action<>'save' then raise exception 'Save a draft first'; end if;
    insert into public.cms_pages(slug,draft) values(p_slug,p_content) returning * into v;
  end if;
  if v.version<>p_version then raise exception 'This page changed. Reload before saving.'; end if;
  if p_action='save' then v.draft=p_content; end if;
  if p_action='restore' then
    select content into restored from public.cms_revisions where id=p_revision and slug=p_slug;
    if not found then raise exception 'Revision not found'; end if;
    v.draft=restored;
  end if;
  if exists(select 1 from public.cms_media m where m.deleted and position(m.url in v.draft::text)>0) then raise exception 'This content references a deleted image'; end if;
  if p_action='publish' then v.published=v.draft; end if;
  if p_action='unpublish' then v.published=null; end if;
  update public.cms_pages set draft=v.draft,published=v.published,version=v.version+1,updated_at=now() where slug=p_slug returning * into v;
  insert into public.cms_revisions(slug,content,action,actor) values(p_slug,v.draft,p_action,p_actor);
  insert into public.workspace_audit(actor,action,entity_key) values(p_actor,'cms:'||p_action,p_slug);
  return to_jsonb(v);
end $$;

create function public.cms_save_media(p_actor text,p_media jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v public.cms_media;
begin
  perform public.workspace_require(p_actor,array['admin','editor']);
  insert into public.cms_media(id,path,url,name,alt,folder,tags,size) values((p_media->>'id')::uuid,p_media->>'path',p_media->>'url',p_media->>'name',p_media->>'alt',p_media->>'folder',p_media->'tags',(p_media->>'size')::integer) returning * into v;
  insert into public.workspace_audit(actor,action,entity_key) values(p_actor,'media:upload',v.id::text);
  return to_jsonb(v);
end $$;
create function public.cms_update_media(p_actor text,p_id uuid,p_metadata jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  perform public.workspace_require(p_actor,array['admin','editor']);
  update public.cms_media set name=p_metadata->>'name',alt=p_metadata->>'alt',folder=p_metadata->>'folder',tags=p_metadata->'tags' where id=p_id and not deleted;
  if not found then raise exception 'Image not found'; end if;
  insert into public.workspace_audit(actor,action,entity_key) values(p_actor,'media:metadata',p_id::text);
end $$;
create function public.cms_replace_media(p_actor text,p_id uuid,p_size integer) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v public.cms_media;
begin
  perform public.workspace_require(p_actor,array['admin','editor']);
  update public.cms_media set size=p_size where id=p_id and not deleted returning * into v;
  if not found then raise exception 'Image not found'; end if;
  insert into public.workspace_audit(actor,action,entity_key) values(p_actor,'media:replace',p_id::text);
  return to_jsonb(v);
end $$;
create function public.cms_delete_media(p_actor text,p_id uuid) returns text
language plpgsql security invoker set search_path = '' as $$
declare v public.cms_media;
begin
  perform public.workspace_require(p_actor,array['admin','editor']);
  perform pg_advisory_xact_lock(671091);
  select * into v from public.cms_media where id=p_id for update;
  if not found then raise exception 'Image not found'; end if;
  if exists(select 1 from public.cms_pages where position(v.url in draft::text)>0 or position(v.url in published::text)>0)
    or exists(select 1 from public.cms_revisions where position(v.url in content::text)>0)
    or exists(select 1 from public.products p where position(v.url in to_jsonb(p)::text)>0) then
    raise exception 'Image is referenced by a page, product or revision. Replace the reference before deletion.';
  end if;
  update public.cms_media set deleted=true where id=p_id;
  insert into public.workspace_audit(actor,action,entity_key) values(p_actor,'media:delete',p_id::text);
  return v.path;
end $$;

create function public.crm_save_lead(p_actor text,p_id uuid,p_data jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare v public.crm_leads; result jsonb; new_id uuid; old_stage text;
begin
  perform public.workspace_require(p_actor,array['admin','sales']);
  new_id=coalesce(p_id,gen_random_uuid());
  if p_id is not null then
    select * into v from public.crm_leads where id=p_id for update;
    if not found then raise exception 'Lead not found'; end if;
    if (v.data->>'version')::integer<>(p_data->>'version')::integer then raise exception 'This lead changed. Reload before saving.'; end if;
    old_stage=v.data->>'stage';
  elsif (p_data->>'version')::integer<>0 then raise exception 'Invalid new lead version'; end if;
  if p_data->>'stage' not in ('New','Contacted','Qualified','Negotiating','Won','Lost') then raise exception 'Invalid lead stage'; end if;
  if p_data->>'assignedTo' is not null then perform public.workspace_require(p_data->>'assignedTo',array['admin','sales']); end if;
  if p_data->>'quoteReference' is not null and not exists(select 1 from public.quote_requests where reference=p_data->>'quoteReference') then raise exception 'Quote not found'; end if;
  result=p_data||jsonb_build_object('id',new_id,'version',(p_data->>'version')::integer+1,'updatedAt',now());
  insert into public.crm_leads(id,data) values(new_id,result) on conflict(id) do update set data=excluded.data,updated_at=now();
  insert into public.crm_events(lead_id,actor,action) values(new_id,p_actor,case when p_id is null then 'Created lead' else 'Updated lead · '||old_stage||' → '||(p_data->>'stage') end);
  insert into public.workspace_audit(actor,action,entity_key) values(p_actor,'crm:save',new_id::text);
  -- Lead stages never mutate quote status or create a sale.
  return result;
end $$;

-- Image assets are intentionally public; every upload/delete remains server-only.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('website-media','website-media',true,2097152,array['image/webp']) on conflict(id) do nothing;
-- No write policies are added to storage.objects for browser roles.
revoke all on function public.workspace_require(text,text[]),public.workspace_set_role(text,text,text),public.cms_mutate_page(text,text,integer,text,jsonb,uuid),public.cms_save_media(text,jsonb),public.cms_update_media(text,uuid,jsonb),public.cms_replace_media(text,uuid,integer),public.cms_delete_media(text,uuid),public.crm_save_lead(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.workspace_require(text,text[]),public.workspace_set_role(text,text,text),public.cms_mutate_page(text,text,integer,text,jsonb,uuid),public.cms_save_media(text,jsonb),public.cms_update_media(text,uuid,jsonb),public.cms_replace_media(text,uuid,integer),public.cms_delete_media(text,uuid),public.crm_save_lead(text,uuid,jsonb) to service_role;
commit;
