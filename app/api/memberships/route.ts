import {dashboardDb} from '@/db/dashboard-store';
import {readDashboard,dashboardSnapshot} from '@/db/memberships-store';
import {membershipSchema,entryDateError} from '@/lib/memberships';
import type {Config} from '@/lib/dashboard';
import {z} from 'zod';
export const dynamic='force-dynamic';
function reply(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
function actor(r:Request){return r.headers.get('oai-authenticated-user-id')}
function originOk(r:Request){return r.headers.get('origin')===new URL(r.url).origin}
export async function GET(request:Request){
 const id=actor(request);if(!id)return reply({error:'Anmeldung erforderlich.'},401);
 try{
  const current=await readDashboard();if(!current)return reply({error:'Dashboard noch nicht eingerichtet.'},503);
  const config=JSON.parse(current.config) as Config;
  const clubId=new URL(request.url).searchParams.get('clubId');
  if(!config.clubs.some(c=>c.id===clubId))return reply({error:'Bitte einen gültigen Standort wählen.'},400);
  const result=await dashboardDb().prepare(`SELECT id,club_id AS clubId,employee,reference,signed_on AS signedOn,created_at AS createdAt,cancelled_at AS cancelledAt FROM memberships WHERE club_id=? AND substr(signed_on,1,7)=? AND (?=1 OR created_by=?) ORDER BY created_at DESC,id DESC LIMIT 100`).bind(clubId,config.period,current.owner===id?1:0,id).all();
  return reply({entries:result.results});
 }catch(e){console.error('Membership read failed',e);return reply({error:'Einträge konnten nicht geladen werden.'},503)}
}
export async function POST(request:Request){
 const id=actor(request);if(!id)return reply({error:'Anmeldung erforderlich.'},401);
 if(!originOk(request))return reply({error:'Ungültiger Ursprung.'},403);
 try{
  const raw=await request.text();if(raw.length>4096)return reply({error:'Die Eingabe ist zu groß.'},413);
  let json;try{json=JSON.parse(raw)}catch{return reply({error:'Ungültige Eingabe.'},400)}
  const parsed=membershipSchema.safeParse(json);if(!parsed.success)return reply({error:parsed.error.issues[0].message},400);
  const entry=parsed.data,current=await readDashboard();if(!current)return reply({error:'Dashboard noch nicht eingerichtet.'},503);
  const config=JSON.parse(current.config) as Config;
  if(!config.clubs.some(c=>c.id===entry.clubId))return reply({error:'Unbekannter Standort. Bitte neu auswählen.'},400);
  const existing=await dashboardDb().prepare('SELECT * FROM memberships WHERE id=? OR (club_id=? AND reference=?)').bind(entry.id,entry.clubId,entry.reference).first<Record<string,unknown>>();
  if(existing){
   if(existing.id===entry.id&&existing.created_by===id&&existing.club_id===entry.clubId&&existing.reference===entry.reference&&existing.employee===entry.employee&&existing.signed_on===entry.signedOn&&!existing.cancelled_at)return reply({snapshot:await dashboardSnapshot(current,id),alreadySaved:true});
   return reply({error:'Diese Vertragsreferenz wurde für diesen Standort bereits erfasst. Bitte den vorhandenen Eintrag prüfen.'},409);
  }
  const dateError=entryDateError(config,entry.signedOn);if(dateError)return reply({error:dateError},400);
  // The revision guard prevents saving against a reporting period changed during entry.
  const result=await dashboardDb().prepare('INSERT OR IGNORE INTO memberships (id,club_id,employee,reference,signed_on,created_by,created_at) SELECT ?,?,?,?,?,?,? FROM dashboard WHERE id=1 AND revision=? AND NOT EXISTS(SELECT 1 FROM club_reports WHERE club_id=? AND signed_on=? AND cancelled_at IS NULL)').bind(entry.id,entry.clubId,entry.employee,entry.reference,entry.signedOn,id,new Date().toISOString(),current.revision,entry.clubId,entry.signedOn).run();
  if(!result.meta.changes)return reply({error:'Der Eintrag existiert bereits oder der Berichtsstand wurde geändert. Bitte Übersicht neu laden.'},409);
  return reply({snapshot:await dashboardSnapshot(current,id)},201);
 }catch(e){console.error('Membership write failed',e);return reply({error:'Speichern nicht bestätigt. Bitte erneut versuchen; dieselbe Eingabe wird nur einmal gezählt.'},503)}
}
export async function PATCH(request:Request){
 const id=actor(request);if(!id)return reply({error:'Anmeldung erforderlich.'},401);
 if(!originOk(request))return reply({error:'Ungültiger Ursprung.'},403);
 try{
  const current=await readDashboard();if(!current||current.owner!==id)return reply({error:'Nur der Admin darf Fehleinträge stornieren.'},403);
  const raw=await request.text();if(raw.length>1024)return reply({error:'Die Eingabe ist zu groß.'},413);
  let json;try{json=JSON.parse(raw)}catch{return reply({error:'Ungültige Eingabe.'},400)}
  const parsed=z.object({id:z.string().uuid()}).strict().safeParse(json);if(!parsed.success)return reply({error:'Ungültiger Eintrag.'},400);
  const config=JSON.parse(current.config) as Config;
  const result=await dashboardDb().prepare("UPDATE memberships SET cancelled_at=?,cancelled_by=? WHERE id=? AND cancelled_at IS NULL AND substr(signed_on,1,7)=? AND signed_on>? AND EXISTS (SELECT 1 FROM dashboard WHERE id=1 AND revision=? AND owner=?)").bind(new Date().toISOString(),id,parsed.data.id,config.period,config.asOf,current.revision,id).run();
  if(!result.meta.changes)return reply({error:'Nicht stornierbar: bereits storniert, nicht gefunden oder im Ausgangsstand enthalten. Bitte Übersicht prüfen.'},409);
  return reply({snapshot:await dashboardSnapshot(current,id)});
 }catch(e){console.error('Membership cancel failed',e);return reply({error:'Stornieren fehlgeschlagen. Bitte erneut versuchen.'},503)}
}
