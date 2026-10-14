'use client';
import {apiFetch} from '@/lib/cockpit-client';
import {useEffect,useState,type RefObject} from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {countedConfig} from '@/lib/memberships';
import type {Snapshot} from '@/lib/dashboard';
const month=(s:string)=>new Date(s+'-01T12:00:00').toLocaleDateString('de-DE',{month:'long',year:'numeric'});
const fmt=(n:number)=>n.toLocaleString('de-DE');
function shift(period:string,delta:number){const d=new Date(period+'-01T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+delta);return d.toISOString().slice(0,7)}
export default function ContractStats({snapshot,onClose,trigger}:{snapshot:Snapshot;onClose:()=>void;trigger:RefObject<HTMLElement|null>}){
 const [period,setPeriod]=useState(snapshot.config.period),[loaded,setLoaded]=useState<{period:string;snapshot:Snapshot|null}|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 const live=period===snapshot.config.period;
 useEffect(()=>{
  setError('');setLoaded(null);
  if(live||!period)return;
  const controller=new AbortController();
  (async()=>{try{
   const res=await apiFetch('/api/statistics?period='+encodeURIComponent(period),{cache:'no-store',signal:controller.signal});
   const data=await res.json() as {period:string;snapshot:Snapshot|null;error?:string};if(!res.ok)throw new Error(data.error);
   if(!controller.signal.aborted)setLoaded(data);
  }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Die Vertragszahlen konnten nicht geladen werden.')}})();
  return()=>controller.abort();
 },[period,live,attempt,snapshot.revision]);
 const selected=live?snapshot:loaded?.period===period?loaded.snapshot:null;
 const config=selected?countedConfig(selected.config,selected.entryCounts):null;
 return <Dialog open onOpenChange={open=>{if(!open)onClose()}}><DialogContent className="contract-stats-dialog" onCloseAutoFocus={e=>{e.preventDefault();trigger.current?.focus()}}>
  <DialogHeader><DialogTitle>Vertragszahlen</DialogTitle><DialogDescription>Alle Standorte · {period?month(period):'Monat auswählen'}</DialogDescription></DialogHeader>
  <div className="stats-month-controls"><button className="button secondary" aria-label="Vorheriger Monat" disabled={!period||period==='0001-01'} onClick={()=>setPeriod(shift(period,-1))}><ChevronLeft size={18}/></button><label>Berichtsmonat<input type="month" min="0001-01" max={snapshot.config.period} value={period} onChange={e=>{if(!e.target.value||e.target.value<=snapshot.config.period)setPeriod(e.target.value)}}/></label><button className="button secondary" aria-label="Nächster Monat" disabled={!period||period>=snapshot.config.period} onClick={()=>setPeriod(shift(period,1))}><ChevronRight size={18}/></button>{!live&&<button className="text-button" onClick={()=>setPeriod(snapshot.config.period)}>Aktueller Berichtsmonat</button>}</div>
  {config?<><div className="data-table"><Table><TableHeader><TableRow>{['Standort','Neuverträge','Monatsziel','Zielerreichung','Noch zum Ziel','Abgänge'].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{config.clubs.map(c=><TableRow key={c.id}><TableCell className="club-name">{c.name}</TableCell><TableCell>{fmt(c.contracts)}</TableCell><TableCell>{fmt(c.target)}</TableCell><TableCell>{c.target?Math.round(c.contracts/c.target*100)+' %':'Kein Ziel'}</TableCell><TableCell>{fmt(Math.max(0,c.target-c.contracts))}</TableCell><TableCell>{fmt(c.departures)}</TableCell></TableRow>)}</TableBody></Table></div><p className="section-note">Ausgangsstand bis {new Date(config.asOf+'T12:00:00').toLocaleDateString('de-DE')} plus spätere CÜ-Einträge im gewählten Monat. Neuverträge ohne GDH, Personal und Hansefit.</p></>:<div className="stats-month-state" aria-live="polite">{error?<><p role="alert">{error}</p><button className="button secondary" onClick={()=>setAttempt(x=>x+1)}>Erneut versuchen</button></>:!period?<p>Bitte einen Monat auswählen.</p>:loaded?.period===period?<><h3>Für {month(period)} sind keine Zahlen hinterlegt.</h3><p>Monatsstände werden ab jetzt beim Speichern in der Verwaltung aufbewahrt. Frühere Zahlen müssen zunächst nachgetragen werden.</p></>:<p>Vertragszahlen werden geladen …</p>}</div>}
  <button className="button secondary" onClick={onClose}>Schließen</button>
 </DialogContent></Dialog>;
}
