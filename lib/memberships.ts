import {z} from 'zod';
import type {Config} from './dashboard';
export function todayBerlin(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
export const membershipSchema=z.object({
 id:z.string().uuid(),clubId:z.string().min(1).max(50),employee:z.string().trim().min(2,'Bitte deinen Namen eingeben.').max(80),
 reference:z.string().trim().min(1,'Bitte eine Vertragsreferenz eingeben.').max(60).regex(/^[A-Za-z0-9._\/-]+$/,'Vertragsreferenz: nur Buchstaben, Ziffern, Punkt, Strich oder Schrägstrich.').transform(s=>s.toUpperCase()),
 signedOn:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(s+'T12:00:00Z');return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===s},'Bitte ein gültiges Abschlussdatum wählen.'),
}).strict();
export type MembershipInput=z.input<typeof membershipSchema>;
export type MembershipEntry={id:string;clubId:string;employee:string;reference:string;signedOn:string;createdAt:string;cancelledAt:string|null};
export function entryDateError(config:Config,signedOn:string){
 if(signedOn.slice(0,7)!==config.period)return 'Bitte einen Abschluss im aktuellen Berichtsmonat erfassen.';
 if(signedOn>todayBerlin())return 'Das Abschlussdatum darf nicht in der Zukunft liegen.';
 if(signedOn<=config.asOf)return 'Dieser Tag ist bereits im Ausgangsstand enthalten. Bitte die Verwaltung kontaktieren.';
 return null;
}
export function countedConfig(config:Config,counts:Record<string,number>={}):Config{return {...config,clubs:config.clubs.map(c=>({...c,contracts:c.contracts+(counts[c.id]||0)}))}}
