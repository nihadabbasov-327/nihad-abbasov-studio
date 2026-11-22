-- Nihad Abbasov Studio — Supabase schema v1
-- Supabase SQL Editor-də yalnız bir dəfə icra edin.
create extension if not exists pgcrypto;

create table if not exists public.studio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.studio_public (
  id integer primary key default 1 check (id=1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.studio_private (
  id integer primary key default 1 check (id=1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.studio_orders (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.studio_invoices (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.studio_leads (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.studio_is_admin()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.studio_admins where user_id=(select auth.uid()));
$$;
revoke all on function public.studio_is_admin() from public, anon;
grant execute on function public.studio_is_admin() to authenticated;

alter table public.studio_admins enable row level security;
alter table public.studio_public enable row level security;
alter table public.studio_private enable row level security;
alter table public.studio_orders enable row level security;
alter table public.studio_invoices enable row level security;
alter table public.studio_leads enable row level security;

-- Explicit grants (RLS still enforces per-row permissions).
revoke all on public.studio_admins, public.studio_public, public.studio_private, public.studio_orders, public.studio_invoices, public.studio_leads from anon, authenticated;
grant select on public.studio_public to anon, authenticated;
grant insert,update,delete on public.studio_public to authenticated;
grant select,insert,update,delete on public.studio_private, public.studio_orders, public.studio_invoices, public.studio_leads to authenticated;

create policy "Anyone can read published studio content" on public.studio_public for select to anon, authenticated using (true);
create policy "Admin can add published content" on public.studio_public for insert to authenticated with check (public.studio_is_admin());
create policy "Admin can edit published content" on public.studio_public for update to authenticated using (public.studio_is_admin()) with check (public.studio_is_admin());
create policy "Admin can remove published content" on public.studio_public for delete to authenticated using (public.studio_is_admin());
create policy "Admin can read private state" on public.studio_private for select to authenticated using (public.studio_is_admin());
create policy "Admin can add private state" on public.studio_private for insert to authenticated with check (public.studio_is_admin());
create policy "Admin can update private state" on public.studio_private for update to authenticated using (public.studio_is_admin()) with check (public.studio_is_admin());
create policy "Admin can delete private state" on public.studio_private for delete to authenticated using (public.studio_is_admin());
create policy "Admin can manage orders" on public.studio_orders for all to authenticated using (public.studio_is_admin()) with check (public.studio_is_admin());
create policy "Admin can manage invoices" on public.studio_invoices for all to authenticated using (public.studio_is_admin()) with check (public.studio_is_admin());
create policy "Admin can manage leads" on public.studio_leads for all to authenticated using (public.studio_is_admin()) with check (public.studio_is_admin());

-- Never expose raw order rows to unauthenticated site visitors.
-- RPC looks up public catalog on the server and derives price from published service.
create or replace function public.studio_submit_order(
  p_service_id text, p_name text, p_surname text, p_phone text,
  p_brief text default '', p_ref text default '', p_due text default ''
) returns text
language plpgsql security definer set search_path='' as $$
declare v_service jsonb; v_code text; v_order jsonb; v_catalog jsonb;
begin
  if length(trim(coalesce(p_name,''))) not between 2 and 100
    or length(trim(coalesce(p_phone,''))) not between 7 and 30
    or length(coalesce(p_brief,'')) > 5000
    or length(coalesce(p_ref,'')) > 500
    or length(coalesce(p_due,'')) > 100 then
    raise exception 'Sifariş məlumatları düzgün deyil';
  end if;
  select data into v_catalog from public.studio_public where id=1;
  select s.value into v_service
  from jsonb_array_elements(coalesce(v_catalog->'services','[]'::jsonb)) s(value)
  where s.value->>'id'=p_service_id and s.value->>'published'='true' limit 1;
  if v_service is null then raise exception 'Xidmət tapılmadı'; end if;
  loop
    v_code:='NA-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
    exit when not exists(select 1 from public.studio_orders where id=v_code)
      and not exists(select 1 from public.studio_invoices where id=v_code);
  end loop;
  v_order=jsonb_build_object('id',v_code,'serviceId',p_service_id,
    'service',v_service->>'name',
    'price', coalesce(nullif(v_service->>'discount','')::numeric,nullif(v_service->>'price','')::numeric,0),
    'name',trim(p_name),'surname',left(coalesce(p_surname,''),100),
    'phone',trim(p_phone),'brief',p_brief,'ref',p_ref,'due',p_due,
    'created',to_char(now() at time zone 'Asia/Baku','DD.MM.YYYY HH24:MI'),
    'createdISO',now()::text,'status','Qəbul edildi','payment','Gözləyir',
    'paidAmount',0,'priority',false,'archived',false,'cancelled',false,
    'approved',false,'preview','','notes','',
    'history',jsonb_build_array(jsonb_build_object('at',now()::text,'text','Sifariş yaradıldı')));
  insert into public.studio_orders(id,data) values(v_code,v_order);
  return v_code;
end $$;

create or replace function public.studio_submit_lead(
 p_name text,p_phone text,p_brief text,p_cat text default '',p_budget text default '',p_due text default ''
) returns text language plpgsql security definer set search_path='' as $$
declare v_code text;
begin
  if length(trim(coalesce(p_name,''))) not between 2 and 100
    or length(trim(coalesce(p_phone,''))) not between 7 and 30
    or length(trim(coalesce(p_brief,''))) not between 10 and 5000 then
    raise exception 'Sorğu məlumatları düzgün deyil';
  end if;
  loop
    v_code:='BR-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
    exit when not exists(select 1 from public.studio_leads where id=v_code);
  end loop;
  insert into public.studio_leads(id,data) values(v_code,
    jsonb_build_object('id',v_code,'name',trim(p_name),'phone',trim(p_phone),'brief',p_brief,
      'cat',left(coalesce(p_cat,''),100),'budget',left(coalesce(p_budget,''),100),
      'due',left(coalesce(p_due,''),100),'status','Yeni','notes','','created',now()::text));
  return v_code;
end $$;

create or replace function public.studio_track(p_code text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_data jsonb;
begin
  if length(coalesce(p_code,''))>35 then return null; end if;
  select data into v_data from public.studio_orders where id=upper(trim(p_code));
  if v_data is not null then
    return jsonb_build_object('kind','order','id',v_data->>'id',
      'service',v_data->>'service','status',v_data->>'status',
      'cancelled',v_data->'cancelled','approved',v_data->'approved',
      'created',v_data->>'created');
  end if;
  select data into v_data from public.studio_invoices where id=upper(trim(p_code));
  if v_data is not null then
    return jsonb_build_object('kind','invoice','code',v_data->>'code',
      'product',v_data->>'product','date',v_data->>'date');
  end if;
  return null;
end $$;

revoke all on function public.studio_submit_order(text,text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.studio_submit_lead(text,text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.studio_track(text) from public, anon, authenticated;
grant execute on function public.studio_submit_order(text,text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.studio_submit_lead(text,text,text,text,text,text) to anon, authenticated;
grant execute on function public.studio_track(text) to anon, authenticated;

-- PUBLIC assets: only authenticated designated admin can upload.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('studio-media','studio-media',true,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
create policy "Anyone can view studio media" on storage.objects for select to anon, authenticated using (bucket_id='studio-media');
create policy "Admin can upload studio media" on storage.objects for insert to authenticated
  with check (bucket_id='studio-media' and public.studio_is_admin());
create policy "Admin can update studio media" on storage.objects for update to authenticated
  using (bucket_id='studio-media' and public.studio_is_admin()) with check (bucket_id='studio-media' and public.studio_is_admin());
create policy "Admin can delete studio media" on storage.objects for delete to authenticated
  using (bucket_id='studio-media' and public.studio_is_admin());

-- IMPORTANT: Once you created an Auth account, run manually in SQL editor:
-- insert into public.studio_admins(user_id) values ('YOUR-AUTH-USER-UUID');
-- Never put service_role or secret API key into browser HTML.
