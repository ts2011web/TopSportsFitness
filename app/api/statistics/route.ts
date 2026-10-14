import {dashboardDb} from '@/db/dashboard-store';
import {readDashboard,dashboardSnapshot} from '@/db/memberships-store';
import {configSchema} from '@/lib/dashboard';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request){
 const user=request.headers.get('oai-authenticated-user-id')||'';
 const period=new URL(request.url).searchParams.get('period')||'';
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))return reply({error:'Bitte einen gültigen Monat auswählen.'},400);
 try{
  const current=await readDashboard();
  if(!current)return reply({error:'Die Club-Daten sind noch nicht verfügbar.'},503);
  const archive=period===configSchema.parse(JSON.parse(current.config)).period?current:
   await dashboardDb().prepare('SELECT config,updated_at FROM monthly_stats WHERE period=?').bind(period).first<{config:string;updated_at:string}>();
  if(!archive)return reply({period,snapshot:null});
  return reply({period,snapshot:await dashboardSnapshot({...current,...archive},user)});
 }catch{return reply({error:'Die Vertragszahlen konnten nicht geladen werden. Bitte erneut versuchen.'},503)}
}
