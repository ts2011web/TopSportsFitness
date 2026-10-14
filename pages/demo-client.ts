import {launchConfig,type Snapshot} from '../lib/dashboard';

export const isStaticPreview=true;
export const isLiveBackend=false;
export const assetPath=(path:string)=>import.meta.env.BASE_URL+path.replace(/^\//,'');
const snapshot:Snapshot={config:launchConfig,revision:1,updatedAt:launchConfig.asOf+'T12:00:00Z',canEdit:false,signedIn:false,entryCounts:{}};
// No API requests, authentication, shared writes, or simulated admin privileges.
export const apiFetch:typeof fetch=async(input,init)=>{
 if(init?.signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,window.location.origin);
 const method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
 const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
 if(method!=='GET')return response({error:'Dieser Entwurf speichert keine zentralen Daten.'},403);
 if(url.pathname==='/api/dashboard')return response(snapshot);
 if(url.pathname==='/api/statistics'){
  const period=url.searchParams.get('period');
  return response({period,snapshot:period===snapshot.config.period?snapshot:null});
 }
 if(url.pathname==='/api/club-reports')return response({entries:[]});
 return response({error:'Im Entwurf nicht verfügbar.'},404);
};
