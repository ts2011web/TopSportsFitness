import {createClient} from '@supabase/supabase-js';
import {supabaseUrl,publishableKey} from './live-settings';
export const supabase=createClient(supabaseUrl,publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
export const isStaticPreview=false;
export const isLiveBackend=true;
export const assetPath=(path:string)=>import.meta.env.BASE_URL+path.replace(/^\//,'');

export async function apiFetch(input:RequestInfo|URL,init:RequestInit={}){
 const url=new URL(String(input),window.location.origin),method=init.method||'GET';
 let action='',payload:Record<string,unknown>={};
 if(init.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
 if(init.body)payload=JSON.parse(String(init.body));
 if(url.pathname==='/api/create-user'&&method==='POST'){
  const {data,error}=await supabase.functions.invoke('cockpit-users',{body:payload});
  return Response.json(error?{error:'Zugang noch nicht angelegt. Prüfe, ob er bereits existiert und das Startpasswort mindestens 16 Zeichen hat.'}:data,{status:error?400:200});
 }
 if(url.pathname==='/api/dashboard')action=method==='PUT'?'config.save':'dashboard';
 if(url.pathname==='/api/statistics'){action='statistics';payload={period:url.searchParams.get('period')}}
 if(url.pathname==='/api/club-reports'){
  action=method==='POST'?'report.save':method==='PUT'?'report.correct':method==='PATCH'?'report.cancel':'reports';
  if(method==='GET')payload={clubId:url.searchParams.get('clubId')};
 }
 if(url.pathname==='/api/report-history'){action='report.history';payload={id:url.searchParams.get('id')}}
 if(url.pathname==='/api/access')action=method==='POST'?'access.save':'access.list';
 if(!action)return Response.json({error:'Diese Funktion ist nicht verfügbar.'},{status:404});
 let query=supabase.rpc('cockpit_api',{action,payload});
 if(init.signal)query=query.abortSignal(init.signal);
 const {data,error}=await query;
 if(init.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
 if(error){
  if(error.code==='42501')window.dispatchEvent(new CustomEvent('cockpit-access-denied',{detail:error.message}));
  const message=error.code==='23505'?'Für diesen Standort und Tag gibt es bereits eine Tagesmeldung. Bitte die bestehende Meldung korrigieren.':error.message;
  return Response.json({error:message},{status:error.code==='42501'?403:error.code==='40001'||error.code==='23505'?409:400});
 }
 return Response.json(data);
}
