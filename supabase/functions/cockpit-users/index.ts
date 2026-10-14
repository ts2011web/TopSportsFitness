import {createClient} from 'npm:@supabase/supabase-js@2.102.0';
const origin='https://ts2011web.github.io';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
Deno.serve(async(req:Request)=>{
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Methode nicht erlaubt.'},405);
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply({error:'Zugriff nicht erlaubt.'},403);
 const authorization=req.headers.get('Authorization')||'';
 if(!authorization.startsWith('Bearer '))return reply({error:'Bitte anmelden.'},401);
 const url=Deno.env.get('SUPABASE_URL')!;
 const client=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:authError}=await client.auth.getUser(authorization.slice(7));
 if(authError||!user)return reply({error:'Bitte erneut anmelden.'},401);
 // The RPC checks the current database role, including immediate revocation.
 const {data:accounts,error:roleError}=await client.rpc('cockpit_api',{action:'access.list',payload:{}});
 if(roleError)return reply({error:'Nur Admins dürfen Zugänge anlegen.'},403);
 try{
  const body=await req.text();if(body.length>2048)return reply({error:'Anfrage zu groß.'},413);
  const {email,password}=JSON.parse(body);
  if(typeof email!=='string'||typeof password!=='string'||password.length<16||password.length>128)return reply({error:'E-Mail und ein Startpasswort mit mindestens 16 Zeichen angeben.'},400);
  const approved=accounts.pending.find((a:{email:string})=>a.email===email.trim().toLowerCase());
  if(!approved)return reply({error:'Bitte zuerst den Zugang mit Rolle und Standorten freigeben.'},409);
  const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await admin.auth.admin.createUser({email:approved.email,password,email_confirm:true});
  if(error)return reply({error:'Zugang konnte nicht angelegt werden. Möglicherweise existiert er bereits.'},400);
  return reply({created:true});
 }catch{return reply({error:'Ungültige Anfrage.'},400)}
});
