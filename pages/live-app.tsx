import {useEffect,useState,type FormEvent} from 'react';
import type {Session} from '@supabase/supabase-js';
import {LogIn,ShieldCheck} from 'lucide-react';
import ClubDashboard from '../app/club-dashboard';
import {supabase,assetPath} from './live-client';

export default function LiveApp(){
 const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(true),[mode,setMode]=useState<'login'|'register'|'password'>('login');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[denied,setDenied]=useState('');
 useEffect(()=>{
  let active=true;
  supabase.auth.getSession().then(({data,error})=>{if(active){setSession(data.session);setLoading(false);if(error)setError('Anmeldung konnte nicht geladen werden. Bitte erneut anmelden.')}});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,next)=>{setSession(next);setLoading(false);if(event==='SIGNED_OUT')setDenied('');if(event==='PASSWORD_RECOVERY')setMode('password')});
  const logout=()=>{void supabase.auth.signOut().then(({error})=>{if(error)setError('Abmeldung fehlgeschlagen. Bitte erneut versuchen.')})};
  const changePassword=()=>{setMode('password');setError('');setMessage('')};
  const blocked=(e:Event)=>setDenied((e as CustomEvent).detail);
  window.addEventListener('cockpit-password',changePassword);window.addEventListener('cockpit-signout',logout);window.addEventListener('cockpit-access-denied',blocked);
  return()=>{active=false;subscription.unsubscribe();window.removeEventListener('cockpit-password',changePassword);window.removeEventListener('cockpit-signout',logout);window.removeEventListener('cockpit-access-denied',blocked)};
 },[]);
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setError('');setMessage('');
  try{
   if(mode==='password'){
    const {error}=await supabase.auth.updateUser({password});if(error)throw error;setPassword('');setMode('login');setMessage('Passwort gespeichert.');
   }else if(mode==='register'){
    const {error}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:window.location.origin+assetPath('/')}});if(error)throw error;
    setMessage('Bitte bestätige deine E-Mail-Adresse über die Nachricht in deinem Postfach. Zugriff erhältst du nur nach Freigabe durch die Verwaltung.');setPassword('');
   }else{
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;setDenied('');setPassword('');
   }
  }catch(e){const raw=e instanceof Error?e.message:'';setError(/invalid login/i.test(raw)?'E-Mail oder Passwort stimmen nicht.':/email not confirmed/i.test(raw)?'Bitte zuerst deine E-Mail-Adresse bestätigen.':/rate|too many/i.test(raw)?'Zu viele Versuche. Bitte warte etwas und versuche es erneut.':'Anmeldung nicht möglich. Prüfe deine Eingaben und die Verbindung.')}finally{setBusy(false)}
 }
 if(loading)return <main className="auth-shell"><p role="status">Anmeldung wird geprüft …</p></main>;
 if(session&&mode!=='password'&&!denied)return <ClubDashboard key={session.user.id}/>;
 return <main className="auth-shell"><section className="auth-panel" aria-labelledby="login-title"><img src={assetPath('/topsports-logo.svg')} alt="TOP SPORTS Fitnessclubs" width="145" height="78"/><h1 id="login-title">{denied?'Zugang noch nicht freigegeben':mode==='register'?'Zugang aktivieren':mode==='password'?'Neues Passwort festlegen':'Willkommen im Club-Cockpit'}</h1><p>{denied||'Melde dich mit deinem persönlichen TOP SPORTS Zugang an.'}</p>
 {denied?<button className="button secondary" onClick={()=>window.dispatchEvent(new Event('cockpit-signout'))}>Mit anderem Konto anmelden</button>:<form onSubmit={submit}>
 {mode!=='password'&&<label>E-Mail-Adresse<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required maxLength={254}/></label>}
 <label>{mode==='register'?'Passwort festlegen':'Passwort'}<input type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} required minLength={mode==='login'?1:12} maxLength={128}/></label>
 {mode!=='login'&&<p className="section-note">Verwende mindestens 12 Zeichen und ein eigenes Passwort für das Cockpit.</p>}
 {error&&<p role="alert" className="form-error">{error}</p>}{message&&<p role="status">{message}</p>}
 <button className="button primary full" disabled={busy}><LogIn size={18}/>{busy?'Bitte warten …':mode==='register'?'Zugang aktivieren':mode==='password'?'Passwort speichern':'Anmelden'}</button>
 {mode==='password'&&session&&<button type="button" className="text-button" onClick={()=>{setMode('login');setPassword('')}}>Abbrechen</button>}
 {mode!=='password'&&<button className="text-button" type="button" disabled={busy} onClick={()=>{setMode(mode==='login'?'register':'login');setError('');setMessage('');setPassword('')}}>{mode==='login'?'Zum ersten Mal hier? Zugang aktivieren':'Zur Anmeldung'}</button>}
 {mode==='login'&&<button className="text-button" type="button" disabled={busy||!email.trim()} onClick={async()=>{setBusy(true);const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+assetPath('/')});setBusy(false);setMessage(error?'E-Mail konnte nicht gesendet werden. Bitte die Verwaltung kontaktieren.':'Falls ein Zugang existiert, erhältst du eine Nachricht zum Zurücksetzen.')}}>Passwort vergessen</button>}
 </form>}
 <p className="auth-note"><ShieldCheck size={17}/>Nur freigegebene Mitarbeiter erhalten Zugriff auf Clubdaten.</p></section></main>;
}
