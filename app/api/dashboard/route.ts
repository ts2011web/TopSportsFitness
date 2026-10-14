import {env} from 'cloudflare:workers';
import {dashboardSnapshot} from '@/db/memberships-store';
import { dashboardDb } from '@/db/dashboard-store';
import { configSchema, launchConfig } from '@/lib/dashboard';
import { z } from 'zod';
export const dynamic='force-dynamic';
type Row={config:string;owner:string;revision:number;updated_at:string};
function reply(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
const user=(r:Request)=>r.headers.get('oai-authenticated-user-id');
async function row(){return dashboardDb().prepare('SELECT config, owner, revision, updated_at FROM dashboard WHERE id = ?').bind(1).first<Row>()}
export async function GET(request:Request){
 const id=user(request)||'';
 try{
  let current=await row();
  // Public visitors can never claim administration by being first.
  const ownerEmail=env.DASHBOARD_OWNER_EMAIL?.trim().toLowerCase();
  const verifiedEmail=request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  const pendingOwner='__unclaimed_owner__';
  if(!current){await dashboardDb().prepare('INSERT OR IGNORE INTO dashboard (id,config,owner,revision,updated_at) VALUES (?,?,?,?,?)').bind(1,JSON.stringify(launchConfig),pendingOwner,1,new Date().toISOString()).run();current=await row();}
  if(current?.owner===pendingOwner&&id&&ownerEmail&&verifiedEmail===ownerEmail){await dashboardDb().prepare('UPDATE dashboard SET owner=? WHERE id=1 AND owner=?').bind(id,pendingOwner).run();current=await row();}
  if(!current)throw new Error('Initialization failed');
  return reply(await dashboardSnapshot(current,id));
 }catch(e){console.error('Dashboard read failed',e);return reply({error:'Die Club-Daten sind gerade nicht erreichbar. Bitte erneut versuchen.'},503)}
}
export async function PUT(request:Request){
 const id=user(request);if(!id)return reply({error:'Anmeldung erforderlich.'},401);
 const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return reply({error:'Ungültiger Ursprung.'},403);
 if(Number(request.headers.get('content-length')||0)>65536)return reply({error:'Die Daten sind zu groß.'},413);
 try{
  const current=await row();if(!current||current.owner!==id)return reply({error:'Nur die zentrale Verwaltung darf Änderungen speichern.'},403);
  const raw=await request.text();if(raw.length>65536)return reply({error:'Die Daten sind zu groß.'},413);
  let json;try{json=JSON.parse(raw)}catch{return reply({error:'Ungültige Daten.'},400)}
  const parsed=z.object({config:configSchema,revision:z.number().int().positive()}).safeParse(json);
  if(!parsed.success)return reply({error:parsed.error.issues[0]?.message||'Bitte Eingaben prüfen.'},400);
  const updatedAt=new Date().toISOString();
  // Archive both baselines atomically, guarded by the same optimistic revision.
  const db=dashboardDb(),serialized=JSON.stringify(parsed.data.config);
  const results=await db.batch([
   db.prepare("INSERT INTO monthly_stats (period,config,updated_at) SELECT json_extract(config,'$.period'),config,updated_at FROM dashboard WHERE id=1 AND owner=? AND revision=? ON CONFLICT(period) DO UPDATE SET config=excluded.config,updated_at=excluded.updated_at").bind(id,parsed.data.revision),
   db.prepare('INSERT INTO monthly_stats (period,config,updated_at) SELECT ?,?,? FROM dashboard WHERE id=1 AND owner=? AND revision=? ON CONFLICT(period) DO UPDATE SET config=excluded.config,updated_at=excluded.updated_at').bind(parsed.data.config.period,serialized,updatedAt,id,parsed.data.revision),
   db.prepare('UPDATE dashboard SET config = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND owner = ? AND revision = ?').bind(serialized,updatedAt,1,id,parsed.data.revision)
  ]);
  const result=results[2];
  if(!result.meta.changes)return reply({error:'Inzwischen wurde eine neuere Version gespeichert. Entwurf verwerfen und die aktuelle Version laden.'},409);
  return reply(await dashboardSnapshot({config:JSON.stringify(parsed.data.config),revision:parsed.data.revision+1,updated_at:updatedAt,owner:id},id));
 }catch(e){console.error('Dashboard write failed',e);return reply({error:'Speichern nicht möglich. Deine Änderungen bleiben geöffnet. Bitte erneut versuchen.'},503)}
}
