-- TOP SPORTS: narrow authenticated RPC; no table is exposed to browser roles.
create schema if not exists cockpit_private;
revoke all on schema cockpit_private from public, anon, authenticated;
grant usage on schema cockpit_private to authenticated;

create table cockpit_private.access (
 user_id uuid primary key references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 160),
 role text not null check(role in ('admin','employee')),
 club_ids text[] not null default '{}', active boolean not null default true
);
create table cockpit_private.approvals (
 email text primary key, name text not null, role text not null check(role in ('admin','employee')),
 club_ids text[] not null default '{}', created_at timestamptz not null default now()
);
create table cockpit_private.settings (
 id integer primary key check(id=1), config jsonb not null,
 revision integer not null default 1, updated_at timestamptz not null default now()
);
create table cockpit_private.months (period text primary key, config jsonb not null, updated_at timestamptz not null default now());
create table cockpit_private.reports (
 id uuid primary key, club_id text not null, signed_on date not null, counts jsonb not null,
 online integer not null check(online>=0), total integer not null check(total>=0 and online<=total),
 first_name text not null, last_name text not null, created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), version integer not null default 1,
 updated_at timestamptz not null default now(), cancelled_at timestamptz
);
create unique index one_active_cu_per_club_day on cockpit_private.reports(club_id,signed_on) where cancelled_at is null;
create index reports_period_club on cockpit_private.reports(signed_on,club_id);
create table cockpit_private.audit (
 id bigint generated always as identity primary key, actor uuid not null, action text not null,
 report_id uuid, reason text, before_value jsonb, after_value jsonb, created_at timestamptz not null default now()
);
alter table cockpit_private.access enable row level security;
alter table cockpit_private.approvals enable row level security;
alter table cockpit_private.settings enable row level security;
alter table cockpit_private.months enable row level security;
alter table cockpit_private.reports enable row level security;
alter table cockpit_private.audit enable row level security;
revoke all on all tables in schema cockpit_private from public,anon,authenticated;
revoke all on all sequences in schema cockpit_private from public,anon,authenticated;

-- This trigger only consumes an administrator-approved email after verification.
-- No role is ever read from user-editable metadata.
create function cockpit_private.activate_approved_user() returns trigger language plpgsql security definer set search_path='' as $$
declare a cockpit_private.approvals;
begin
 if new.email_confirmed_at is null then return new; end if;
 if TG_OP='UPDATE' and old.email_confirmed_at is not null then return new; end if;
 delete from cockpit_private.approvals where email=lower(new.email) returning * into a;
 if found then
  insert into cockpit_private.access(user_id,name,role,club_ids) values(new.id,a.name,a.role,a.club_ids) on conflict do nothing;
 end if;
 return new;
end $$;
revoke all on function cockpit_private.activate_approved_user() from public,anon,authenticated;
create trigger cockpit_activate_user after insert or update of email_confirmed_at on auth.users for each row execute function cockpit_private.activate_approved_user();

create function cockpit_private.validate_config(c jsonb) returns void language plpgsql set search_path='' as $$
declare x jsonb; k text; v date;
begin
 if jsonb_typeof(c) is distinct from 'object' or octet_length(c::text)>65536 or not(c ?& array['period','asOf','clubs','tools','news']) then raise exception 'Ungültige Konfiguration.'; end if;
 if jsonb_typeof(c->'period') is distinct from 'string' or jsonb_typeof(c->'asOf') is distinct from 'string' then raise exception 'Berichtsmonat und Ausgangsdatum fehlen.'; end if;
 if c->>'period' !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' or c->>'asOf' !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' then raise exception 'Ungültiger Berichtsmonat.'; end if;
 v:=(c->>'asOf')::date;
 if v < (c->>'period'||'-01')::date-1 or v >= ((c->>'period'||'-01')::date+interval '1 month')::date then raise exception 'Ausgangsstand muss im Berichtsmonat oder am Vortag liegen.'; end if;
 if jsonb_typeof(c->'tools')<>'array' or jsonb_array_length(c->'tools')>30 or jsonb_typeof(c->'clubs')<>'array' or jsonb_array_length(c->'clubs') not between 1 and 30 then raise exception 'Ungültige Kacheln oder Standorte.'; end if;
 if (select count(*)<>count(distinct a->>'id') from jsonb_array_elements(c->'clubs') a) or (select count(*)<>count(distinct a->>'id') from jsonb_array_elements(c->'tools') a) then raise exception 'Doppelte Kennung.'; end if;
 for x in select * from jsonb_array_elements(c->'clubs') loop
  if jsonb_typeof(x->'id') is distinct from 'string' or jsonb_typeof(x->'name') is distinct from 'string' then raise exception 'Standortkennung und Name fehlen.'; end if;
  if not(x ?& array['id','name','contracts','target','departures']) or length(x->>'id') not between 1 and 50 or length(x->>'name') not between 1 and 50 then raise exception 'Ungültiger Standort.'; end if;
  foreach k in array array['contracts','target','departures'] loop
   if jsonb_typeof(x->k)<>'number' or x->>k !~ '^[0-9]{1,6}$' then raise exception 'Ungültige Vertragszahlen.'; end if;
  end loop;
 end loop;
 for x in select * from jsonb_array_elements(c->'tools') loop
  foreach k in array array['id','name','description','url','icon','color','kind'] loop
   if jsonb_typeof(x->k) is distinct from 'string' then raise exception 'Kachelfelder müssen Text enthalten.'; end if;
  end loop;
  if not(x ?& array['id','name','description','url','icon','color','kind']) or length(x->>'id') not between 1 and 80 or length(trim(x->>'name')) not between 1 and 45 or length(x->>'description')>100 or length(x->>'url')>2048 then raise exception 'Ungültige Kachel.'; end if;
  if x->>'url'<>'' and (x->>'url' !~ '^https://[^/@[:space:]]+([/?#]|$)' or x->>'url' ~ '[[:cntrl:]]') then raise exception 'Nur vollständige HTTPS-Links sind erlaubt.'; end if;
  if x->>'kind' not in ('link','statistics','memberships','design-studio','partners') or x->>'color' not in ('orange','blue','green','purple','slate') or x->>'icon' not in ('members','fitness','mail','chart','leads','office','link','tasks','contracts','files','payments','marketing','health','activity','cycling','awards','timer','clock','appointments','checkin','knowledge','training','ideas','help','security') then raise exception 'Ungültige Kacheleigenschaften.'; end if;
 end loop;
 x:=c->'news';
 foreach k in array array['mode','title','text'] loop
  if jsonb_typeof(x->k) is distinct from 'string' then raise exception 'News-Felder müssen Text enthalten.'; end if;
 end loop;
 if not(x ?& array['enabled','mode','title','text']) or jsonb_typeof(x->'enabled')<>'boolean' or x->>'mode' not in ('static','ticker') or length(x->>'title')>100 or length(x->>'text')>1500 then raise exception 'Ungültige News.'; end if;
end $$;

-- Atomic operations deliberately live in a non-exposed schema. The definer
-- checks auth.uid(), a current access row and club ownership on every call.
create function cockpit_private.api(action text, payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); a cockpit_private.access; s cockpit_private.settings; c jsonb; cs jsonb;
 r cockpit_private.reports; oldr cockpit_private.reports; result jsonb; entries jsonb;
 p text; k text; n integer:=0; online_n integer; report_date date; cid text; rid uuid;
 reason text; target_uid uuid; role_name text; email_value text; ids text[];
begin
 if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null and (banned_until is null or banned_until<now())) then raise exception 'Bitte anmelden.' using errcode='42501'; end if;
 select * into a from cockpit_private.access where user_id=uid and active;
 if not found then raise exception 'Dein Zugang wurde noch nicht freigegeben. Bitte die Verwaltung kontaktieren.' using errcode='42501'; end if;
 if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>70000 then raise exception 'Ungültige Anfrage.'; end if;
 if action in ('config.save','report.save','report.correct','report.cancel','access.save') then
  select * into s from cockpit_private.settings where id=1 for update;
 else select * into s from cockpit_private.settings where id=1; end if;
 if s.id is null then raise exception 'Cockpit wird eingerichtet.'; end if;
 if action='access.list' then
  if a.role<>'admin' then raise exception 'Nur für Admins.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',x.user_id,'name',x.name,'role',x.role,'clubIds',x.club_ids,'active',x.active,'email',u.email) order by x.name),'[]') into result from cockpit_private.access x join auth.users u on u.id=x.user_id;
  return jsonb_build_object('users',result,'pending',(select coalesce(jsonb_agg(to_jsonb(v)),'[]') from cockpit_private.approvals v));
 elsif action='access.save' then
  if a.role<>'admin' then raise exception 'Nur für Admins.' using errcode='42501'; end if;
  email_value:=lower(trim(payload->>'email')); role_name:=payload->>'role';
  if email_value is null or email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(email_value)>254 or length(trim(payload->>'name')) not between 1 and 160 or role_name not in ('admin','employee') or jsonb_typeof(payload->'clubIds')<>'array' or jsonb_typeof(payload->'active')<>'boolean' then raise exception 'Zugangsdaten prüfen.'; end if;
  select coalesce(array_agg(value),'{}') into ids from jsonb_array_elements_text(payload->'clubIds');
  if cardinality(ids)>30 or exists(select 1 from unnest(ids) i where not exists(select 1 from jsonb_array_elements(s.config->'clubs') v where v->>'id'=i)) or (role_name='employee' and cardinality(ids)=0) then raise exception 'Mindestens einen gültigen Standort zuweisen.'; end if;
  select id into target_uid from auth.users where lower(email)=email_value;
  if target_uid=uid and (role_name<>'admin' or not(payload->>'active')::boolean) then raise exception 'Den eigenen Adminzugang kannst du nicht sperren.'; end if;
  if target_uid is not null then
   insert into cockpit_private.access values(target_uid,trim(payload->>'name'),role_name,ids,(payload->>'active')::boolean) on conflict(user_id) do update set name=excluded.name,role=excluded.role,club_ids=excluded.club_ids,active=excluded.active;
  elsif (payload->>'active')::boolean then
   insert into cockpit_private.approvals(email,name,role,club_ids) values(email_value,trim(payload->>'name'),role_name,ids) on conflict(email) do update set name=excluded.name,role=excluded.role,club_ids=excluded.club_ids;
  else delete from cockpit_private.approvals where email=email_value; end if;
  insert into cockpit_private.audit(actor,action,after_value) values(uid,action,payload);
  return jsonb_build_object('saved',true);
 elsif action='config.save' then
  if a.role<>'admin' then raise exception 'Nur für Admins.' using errcode='42501'; end if;
  if (payload->>'revision')::integer is distinct from s.revision then raise exception 'Zwischenzeitlich geändert. Bitte neu laden.' using errcode='40001'; end if;
  c:=payload->'config'; perform cockpit_private.validate_config(c);
  if (select array_agg(v->>'id' order by v->>'id') from jsonb_array_elements(c->'clubs') v) is distinct from (select array_agg(v->>'id' order by v->>'id') from jsonb_array_elements(s.config->'clubs') v) then raise exception 'Standortkennungen dürfen nicht verändert werden.'; end if;
  insert into cockpit_private.months values(s.config->>'period',s.config,now()) on conflict(period) do update set config=excluded.config,updated_at=excluded.updated_at;
  insert into cockpit_private.months values(c->>'period',c,now()) on conflict(period) do update set config=excluded.config,updated_at=excluded.updated_at;
  insert into cockpit_private.audit(actor,action,before_value,after_value) values(uid,action,s.config,c);
  update cockpit_private.settings set config=c,revision=revision+1,updated_at=now() where id=1 returning * into s;
 elsif action in ('report.save','report.correct','report.cancel') then
  rid:=(payload->>'id')::uuid;
  if rid is null then raise exception 'Meldungskennung fehlt.'; end if;
  select * into oldr from cockpit_private.reports where id=rid for update;
  if action<>'report.save' then
   if a.role<>'admin' then raise exception 'Korrekturen sind nur für Admins möglich.' using errcode='42501'; end if;
   if oldr.id is null or oldr.cancelled_at is not null then raise exception 'Aktive Tagesmeldung nicht gefunden.'; end if;
   if (payload->>'version')::integer is distinct from oldr.version then raise exception 'Die Meldung wurde inzwischen geändert. Bitte neu laden.' using errcode='40001'; end if;
   reason:=trim(payload->>'reason');
   if reason is null or length(reason) not between 5 and 500 then raise exception 'Bitte einen Korrekturgrund mit mindestens 5 Zeichen angeben.'; end if;
   cid:=oldr.club_id; report_date:=oldr.signed_on;
  else cid:=payload->>'clubId'; report_date:=(payload->>'signedOn')::date; end if;
  if cid is null or report_date is null or not exists(select 1 from jsonb_array_elements(s.config->'clubs') v where v->>'id'=cid) or (a.role<>'admin' and not(cid=any(a.club_ids))) then raise exception 'Für diesen Standort fehlt die Berechtigung.' using errcode='42501'; end if;
  if action='report.save' and oldr.id is not null then
   if oldr.created_by=uid and oldr.club_id=cid and oldr.signed_on=report_date and oldr.counts=payload->'counts' and oldr.online=(payload->>'online')::integer and oldr.first_name=trim(payload->>'firstName') and oldr.last_name=trim(payload->>'lastName') and oldr.cancelled_at is null then
    return jsonb_build_object('snapshot',cockpit_private.api('dashboard','{}'),'replayed',true);
   end if;
   raise exception 'Diese Meldungskennung wird bereits verwendet.' using errcode='23505';
  end if;
  if to_char(report_date,'YYYY-MM')<>s.config->>'period' or report_date<=(s.config->>'asOf')::date or report_date>(now() at time zone 'Europe/Berlin')::date then raise exception 'Tag liegt außerhalb des offenen Berichtszeitraums.'; end if;
  if action='report.cancel' then
   update cockpit_private.reports set cancelled_at=now(),updated_at=now(),version=version+1 where id=rid returning * into r;
  else
   if payload->>'confirmed' is distinct from 'true' or length(trim(payload->>'firstName')) not between 1 and 80 or length(trim(payload->>'lastName')) not between 1 and 80 or payload->>'firstName' is null or payload->>'lastName' is null then raise exception 'Gesamtzahl bestätigen und Namen angeben.'; end if;
   cs:=payload->'counts';
   if jsonb_typeof(cs)<>'object' or cs is null or (select count(*) from jsonb_object_keys(cs))<>9 then raise exception 'Neun Tarife sind erforderlich.'; end if;
   foreach k in array array['basic1','basic12','basic24','allIn1','allIn12','allIn24','fifi1','fifi12','fifi24'] loop
    if not(cs ? k) or jsonb_typeof(cs->k)<>'number' or cs->>k !~ '^[0-9]{1,4}$' then raise exception 'Tarifzahlen müssen ganze Zahlen zwischen 0 und 9999 sein.'; end if;
    n:=n+(cs->>k)::integer;
   end loop;
   if jsonb_typeof(payload->'online') is distinct from 'number' or payload->>'online' !~ '^[0-9]{1,5}$' then raise exception 'Online-Anteil prüfen.'; end if;
   online_n:=(payload->>'online')::integer;
   if online_n>n then raise exception 'Online ist bereits in der Gesamtzahl enthalten.'; end if;
   if action='report.save' then
    insert into cockpit_private.reports(id,club_id,signed_on,counts,online,total,first_name,last_name,created_by) values(rid,cid,report_date,cs,online_n,n,trim(payload->>'firstName'),trim(payload->>'lastName'),uid) returning * into r;
   else
    if payload->>'clubId' is distinct from cid or (payload->>'signedOn')::date is distinct from report_date then raise exception 'Standort und Tag einer Korrektur bleiben unverändert.'; end if;
    update cockpit_private.reports set counts=cs,online=online_n,total=n,first_name=trim(payload->>'firstName'),last_name=trim(payload->>'lastName'),updated_at=now(),version=version+1 where id=rid returning * into r;
   end if;
  end if;
  insert into cockpit_private.audit(actor,action,report_id,reason,before_value,after_value) values(uid,action,rid,reason,case when oldr.id is not null then to_jsonb(oldr) end,to_jsonb(r));
  update cockpit_private.settings set revision=revision+1,updated_at=now() where id=1 returning * into s;
  return jsonb_build_object('snapshot',cockpit_private.api('dashboard','{}'));
 elsif action='report.history' then
  if a.role<>'admin' then raise exception 'Nur für Admins.' using errcode='42501'; end if;
  return jsonb_build_object('history',(select coalesce(jsonb_agg(to_jsonb(v) order by v.created_at desc),'[]') from cockpit_private.audit v where report_id=(payload->>'id')::uuid));
 elsif action='reports' then
  cid:=payload->>'clubId';
  if cid is null or (a.role<>'admin' and not(cid=any(a.club_ids))) then raise exception 'Für diesen Standort fehlt die Berechtigung.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'signedOn',signed_on,'total',total,'online',online,'cancelledAt',cancelled_at,'version',version,'counts',case when a.role='admin' then counts end,'firstName',case when a.role='admin' then first_name end,'lastName',case when a.role='admin' then last_name end) order by signed_on desc,created_at desc),'[]') into entries from cockpit_private.reports where club_id=cid and to_char(signed_on,'YYYY-MM')=s.config->>'period';
  return jsonb_build_object('entries',entries);
 elsif action not in ('dashboard','statistics') then raise exception 'Unbekannte Aktion.'; end if;
 c:=s.config;
 if action='statistics' then
  p:=payload->>'period';
  if p is null or p !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' then raise exception 'Ungültiger Monat.'; end if;
  if p<>s.config->>'period' then select config into c from cockpit_private.months where period=p; end if;
  if c is null then return jsonb_build_object('period',p,'snapshot',null); end if;
 end if;
 if a.role<>'admin' then c:=jsonb_set(c,'{clubs}',(select coalesce(jsonb_agg(v),'[]') from jsonb_array_elements(c->'clubs') v where v->>'id'=any(a.club_ids))); end if;
 select coalesce(jsonb_object_agg(club_id,amount),'{}') into result from (select club_id,sum(total) amount from cockpit_private.reports where cancelled_at is null and to_char(signed_on,'YYYY-MM')=c->>'period' and signed_on>(c->>'asOf')::date and (a.role='admin' or club_id=any(a.club_ids)) group by club_id) t;
 result:=jsonb_build_object('config',c,'revision',s.revision,'updatedAt',s.updated_at,'canEdit',a.role='admin','signedIn',true,'entryCounts',result,'userName',a.name);
 if action='statistics' then return jsonb_build_object('period',p,'snapshot',result); end if;
 return result;
end $$;

revoke all on all functions in schema cockpit_private from public,anon,authenticated;
grant execute on function cockpit_private.api(text,jsonb) to authenticated;
create function public.cockpit_api(action text,payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$ select cockpit_private.api(action,payload); $$;
revoke all on function public.cockpit_api(text,jsonb) from public,anon;
grant execute on function public.cockpit_api(text,jsonb) to authenticated;

-- Only this verified email may activate the initial administrator.
insert into cockpit_private.approvals(email,name,role) values('ts2011web@gmail.com','TOP SPORTS Verwaltung','admin');
