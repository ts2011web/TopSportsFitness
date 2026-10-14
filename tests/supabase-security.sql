-- Run as project database administrator. All fixtures and changes roll back.
begin;
select set_config('test.employee',gen_random_uuid()::text,true);
select set_config('test.admin',gen_random_uuid()::text,true);
select set_config('test.outsider',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
values(current_setting('test.employee')::uuid,'cockpit-test-employee@example.invalid',now(),'{"role":"admin"}'),
 (current_setting('test.admin')::uuid,'cockpit-test-admin@example.invalid',now(),'{}'),
 (current_setting('test.outsider')::uuid,'cockpit-test-outsider@example.invalid',now(),'{"role":"admin"}');
insert into cockpit_private.access values(current_setting('test.employee')::uuid,'Test Employee','employee',array['reutlingen'],true),(current_setting('test.admin')::uuid,'Test Admin','admin','{}',true);
select set_config('test.report',gen_random_uuid()::text,true);
select set_config('test.payload',jsonb_build_object('id',current_setting('test.report'),'clubId','reutlingen','signedOn','2026-10-01','counts','{"basic1":1,"basic12":2,"basic24":0,"allIn1":0,"allIn12":0,"allIn24":0,"fifi1":0,"fifi12":0,"fifi24":0}'::jsonb,'online',2,'firstName','Test','lastName','Employee','confirmed',true)::text,true);

set local role anon;
do $$begin
 begin perform public.cockpit_api('dashboard'); raise exception 'FAIL anonymous access'; exception when insufficient_privilege then null; end;
end$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.outsider'),true);
set local role authenticated;
do $$begin
 begin perform public.cockpit_api('dashboard'); raise exception 'FAIL unapproved user'; exception when insufficient_privilege then null; end;
 begin perform 1 from cockpit_private.settings; raise exception 'FAIL direct table read'; exception when insufficient_privilege then null; end;
end$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.employee'),true);
set local role authenticated;
do $$declare s jsonb; p jsonb:=current_setting('test.payload')::jsonb; begin
 s:=public.cockpit_api('dashboard');
 if s->>'canEdit'<>'false' or jsonb_array_length(s->'config'->'clubs')<>1 or s->'config'->'clubs'->0->>'id'<>'reutlingen' then raise exception 'FAIL club isolation/metadata escalation'; end if;
 begin perform public.cockpit_api('config.save','{}'); raise exception 'FAIL staff config'; exception when insufficient_privilege then null; end;
 begin perform public.cockpit_api('access.save','{}'); raise exception 'FAIL staff grants'; exception when insufficient_privilege then null; end;
 begin perform public.cockpit_api('reports','{"clubId":"degerloch"}'); raise exception 'FAIL cross-club history'; exception when insufficient_privilege then null; end;
 begin perform public.cockpit_api('report.save',p||'{"clubId":"degerloch"}'); raise exception 'FAIL cross-club write'; exception when insufficient_privilege then null; end;
 s:=public.cockpit_api('report.save',p);
 if (s->'snapshot'->'entryCounts'->>'reutlingen')::integer<>3 then raise exception 'FAIL online double count'; end if;
 s:=public.cockpit_api('report.save',p);
 if s->>'replayed'<>'true' then raise exception 'FAIL retry idempotency'; end if;
 begin perform public.cockpit_api('report.save',p||jsonb_build_object('id',gen_random_uuid())); raise exception 'FAIL duplicate club/day'; exception when unique_violation then null; end;
 begin perform public.cockpit_api('report.correct',p||'{"version":1,"reason":"Correction test"}'); raise exception 'FAIL employee correction'; exception when insufficient_privilege then null; end;
 begin update cockpit_private.access set role='admin' where user_id=auth.uid(); raise exception 'FAIL direct privilege escalation'; exception when insufficient_privilege then null; end;
end$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('test.admin'),true);
set local role authenticated;
do $$declare s jsonb; p jsonb:=current_setting('test.payload')::jsonb; conf jsonb; rev integer; begin
 p:=p||'{"version":1,"reason":"Tarif falsch übertragen","online":1,"counts":{"basic1":1,"basic12":0,"basic24":0,"allIn1":0,"allIn12":0,"allIn24":0,"fifi1":0,"fifi12":0,"fifi24":0}}';
 s:=public.cockpit_api('report.correct',p);
 if (s->'snapshot'->'entryCounts'->>'reutlingen')::integer<>1 then raise exception 'FAIL corrected total'; end if;
 begin perform public.cockpit_api('report.correct',p); raise exception 'FAIL stale correction'; exception when serialization_failure then null; end;
 s:=public.cockpit_api('report.history',jsonb_build_object('id',current_setting('test.report')));
 if jsonb_array_length(s->'history')<>2 or s->'history'->0->'before_value'->>'total'<>'3' then raise exception 'FAIL audit history'; end if;
 s:=public.cockpit_api('dashboard');conf:=s->'config';rev:=(s->>'revision')::integer;
 perform public.cockpit_api('config.save',jsonb_build_object('config',conf,'revision',rev));
 begin perform public.cockpit_api('config.save',jsonb_build_object('config',conf,'revision',rev)); raise exception 'FAIL stale config'; exception when serialization_failure then null; end;
 s:=public.cockpit_api('report.cancel',jsonb_build_object('id',current_setting('test.report'),'version',2,'reason','Fehlerhafte Testmeldung'));
 if coalesce((s->'snapshot'->'entryCounts'->>'reutlingen')::integer,0)<>0 then raise exception 'FAIL cancelled count'; end if;
 perform public.cockpit_api('report.save',current_setting('test.payload')::jsonb||jsonb_build_object('id',gen_random_uuid()));
 s:=public.cockpit_api('statistics','{"period":"2025-01"}');
 if s->'snapshot'<>'null'::jsonb then raise exception 'FAIL empty historic month'; end if;
end$$;
reset role;
update cockpit_private.access set active=false where user_id=current_setting('test.employee')::uuid;
select set_config('request.jwt.claim.sub',current_setting('test.employee'),true);
set local role authenticated;
do $$begin
 begin perform public.cockpit_api('dashboard'); raise exception 'FAIL revoked access'; exception when insufficient_privilege then null; end;
end$$;
reset role;
rollback;
select 'PASS: anonymous, unapproved, metadata escalation, direct writes, club isolation, duplicate days, retries, online totals, corrections, audit, stale revisions, cancellation, history and revocation' as result;
