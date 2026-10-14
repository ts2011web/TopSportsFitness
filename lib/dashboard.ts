import { z } from 'zod';
export const toolSchema = z.object({
 id:z.string().min(1).max(80),name:z.string().trim().min(1).max(45),description:z.string().trim().max(100),
 url:z.string().max(2048).refine(v=>v===''||(v.startsWith('https://')&&(()=>{try{const u=new URL(v);return !!u.hostname&&!u.username&&!u.password}catch{return false}})()),'Bitte eine vollständige HTTPS-Adresse eingeben.'),
 icon:z.enum(['members','fitness','mail','chart','leads','office','link','tasks','contracts','files','payments','marketing','health','activity','cycling','awards','timer','clock','appointments','checkin','knowledge','training','ideas','help','security']),color:z.enum(['orange','blue','green','purple','slate']),kind:z.enum(['link','statistics','memberships','design-studio','partners']),
});
export const newsSchema=z.object({enabled:z.boolean(),mode:z.enum(['static','ticker']),title:z.string().trim().max(100),text:z.string().trim().max(1500)});
export type News=z.infer<typeof newsSchema>;
export const configSchema=z.object({
 news:newsSchema.default({enabled:false,mode:'static',title:'Aktuelles',text:''}),
 period:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),asOf:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/),
 tools:z.array(toolSchema).max(30).refine(t=>new Set(t.map(x=>x.id)).size===t.length,'Doppelte Kachel-ID'),
 clubs:z.array(z.object({id:z.string().min(1).max(50),name:z.string().min(1).max(50),contracts:z.number().int().min(0).max(999999),target:z.number().int().min(0).max(999999),departures:z.number().int().min(0).max(999999)})).min(1).max(30).refine(t=>new Set(t.map(x=>x.id)).size===t.length,'Doppelte Standort-ID'),
});
export type Tool=z.infer<typeof toolSchema>;export type Config=z.infer<typeof configSchema>;
export type Snapshot={config:Config,revision:number,updatedAt:string,canEdit:boolean,signedIn?:boolean,entryCounts?:Record<string,number>};
export const partnersTool:Tool={id:'partners',name:'Firmen- & Vereinsfitness',description:'Kooperationen suchen, Konditionen prüfen und Partner verwalten',url:'',icon:'members',color:'blue',kind:'partners'};
export const designStudioTool:Tool={id:'design-studio',name:'TOP SPORTS Editor',description:'Aushänge, Events und Gutscheine gestalten',url:'',icon:'ideas',color:'orange',kind:'design-studio'};
export const membershipTool:Tool={id:'club-overview',name:'CÜ (Clubübersicht)',description:'Mitgliedschaften erfassen und Club-Ziele verfolgen',url:'',icon:'contracts',color:'orange',kind:'memberships'};
export const initialConfig:Config={news:{enabled:false,mode:'static',title:'Aktuelles',text:''},period:'2026-09',asOf:'2026-09-15',tools:[
 membershipTool,designStudioTool,partnersTool,
 {id:'magicline',name:'Magicline',description:'Mitglieder, Verträge und Check-in',url:'',icon:'members',color:'orange',kind:'link'},
 {id:'mywellness',name:'Mywellness',description:'Trainingsbetreuung und Trainingspläne',url:'',icon:'fitness',color:'green',kind:'link'},
 {id:'outlook',name:'Outlook',description:'E-Mails und Kalender in Microsoft 365',url:'https://outlook.office.com/mail/',icon:'mail',color:'blue',kind:'link'},
 {id:'statistics',name:'Vertragszahlen',description:'Monatsziele und alle Standorte im Blick',url:'',icon:'chart',color:'slate',kind:'statistics'},
 {id:'leads',name:'Lead Management',description:'Interessenten, Termine und Nachfassaktionen',url:'',icon:'leads',color:'purple',kind:'link'},
 {id:'office',name:'Microsoft 365',description:'Word, Excel und gemeinsame Dokumente',url:'https://www.microsoft365.com/',icon:'office',color:'orange',kind:'link'},
 ],clubs:[
 {id:'echterdingen',name:'Echterdingen',contracts:28,target:60,departures:51},
 {id:'reutlingen',name:'Reutlingen',contracts:10,target:45,departures:35},
 {id:'leinfelden',name:'Leinfelden',contracts:24,target:50,departures:38},
 {id:'kornwestheim',name:'Kornwestheim',contracts:36,target:85,departures:75},
 {id:'nuertingen',name:'Nürtingen',contracts:73,target:90,departures:80},
 {id:'degerloch',name:'Degerloch',contracts:60,target:110,departures:95},
 ]};

// Current local configuration carried into the first private publication.
export const launchConfig:Config={
  "news": {
    "enabled": true,
    "mode": "ticker",
    "title": "Personio wird eingestellt.",
    "text": "Personio wird zum 30.09.2026 eingestellt. Alle Zeiten müssen an diesem Tag bis spätestens 12:00 Uhr vollständig erfasst sein.\n\nPersonaldokumente müssen bei Bedarf vorher heruntergeladen werden. Ruft Personio dazu am PC auf und geht auf „Dokumente“. Dort findet ihr eine Option, mit der ihr alle Dateien auf einmal herunterladen könnt."
  },
  "period": "2026-09",
  "asOf": "2026-09-15",
  "tools": [
    {
      "id": "magicline",
      "name": "Magicline",
      "description": "Mitglieder, Verträge und Check-in",
      "url": "",
      "icon": "members",
      "color": "orange",
      "kind": "link"
    },
    {
      "id": "mywellness",
      "name": "Mywellness",
      "description": "Trainingsbetreuung und Trainingspläne",
      "url": "",
      "icon": "fitness",
      "color": "green",
      "kind": "link"
    },
    {
      "id": "outlook",
      "name": "Outlook",
      "description": "E-Mails und Kalender in Microsoft 365",
      "url": "https://outlook.office.com/mail/",
      "icon": "mail",
      "color": "blue",
      "kind": "link"
    },
    {
      "id": "statistics",
      "name": "Vertragszahlen",
      "description": "Monatsziele und alle Standorte im Blick",
      "url": "",
      "icon": "chart",
      "color": "slate",
      "kind": "statistics"
    },
    {
      "id": "leads",
      "name": "Lead Management",
      "description": "Interessenten, Termine und Nachfassaktionen",
      "url": "",
      "icon": "leads",
      "color": "purple",
      "kind": "link"
    },
    {
      "id": "office",
      "name": "Microsoft 365",
      "description": "Word, Excel und gemeinsame Dokumente",
      "url": "https://www.microsoft365.com/",
      "icon": "office",
      "color": "orange",
      "kind": "link"
    },
    {
      "id": "club-overview",
      "name": "CÜ (Clubübersicht)",
      "description": "Mitgliedschaften erfassen und Club-Ziele verfolgen",
      "url": "",
      "icon": "contracts",
      "color": "orange",
      "kind": "memberships"
    },
    {
      "id": "design-studio",
      "name": "TOP SPORTS Editor",
      "description": "Aushänge, Events und Gutscheine gestalten",
      "url": "",
      "icon": "ideas",
      "color": "orange",
      "kind": "design-studio"
    },
    {
      "id": "partners",
      "name": "Firmen- & Vereinsfitness",
      "description": "Kooperationen suchen, Konditionen prüfen und Partner verwalten",
      "url": "",
      "icon": "members",
      "color": "blue",
      "kind": "partners"
    }
  ],
  "clubs": [
    {
      "id": "echterdingen",
      "name": "Echterdingen",
      "contracts": 28,
      "target": 60,
      "departures": 51
    },
    {
      "id": "reutlingen",
      "name": "Reutlingen",
      "contracts": 10,
      "target": 45,
      "departures": 35
    },
    {
      "id": "leinfelden",
      "name": "Leinfelden",
      "contracts": 24,
      "target": 50,
      "departures": 38
    },
    {
      "id": "kornwestheim",
      "name": "Kornwestheim",
      "contracts": 36,
      "target": 85,
      "departures": 75
    },
    {
      "id": "nuertingen",
      "name": "Nürtingen",
      "contracts": 73,
      "target": 90,
      "departures": 80
    },
    {
      "id": "degerloch",
      "name": "Degerloch",
      "contracts": 60,
      "target": 110,
      "departures": 95
    }
  ]
};
