import {z} from 'zod';
export const tariffKeys=['basic1','basic12','basic24','allIn1','allIn12','allIn24','fifi1','fifi12','fifi24'] as const;
export const tariffLabels:Record<typeof tariffKeys[number],string>={basic1:'Basic 1 Monat',basic12:'Basic 12 Monate',basic24:'Basic 24 Monate',allIn1:'All-In 1 Monat',allIn12:'All-In 12 Monate',allIn24:'All-In 24 Monate',fifi1:'FiFi 1 Monat',fifi12:'FiFi 12 Monate',fifi24:'FiFi 24 Monate'};
const count=z.number().int().min(0).max(9999);
export const countsSchema=z.object({basic1:count,basic12:count,basic24:count,allIn1:count,allIn12:count,allIn24:count,fifi1:count,fifi12:count,fifi24:count}).strict();
export type TariffCounts=z.infer<typeof countsSchema>;
export const emptyCounts:TariffCounts={basic1:0,basic12:0,basic24:0,allIn1:0,allIn12:0,allIn24:0,fifi1:0,fifi12:0,fifi24:0};
export const reportSchema=z.object({id:z.string().uuid(),clubId:z.string().min(1).max(50),signedOn:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(s+'T12:00:00Z');return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===s},'Ungültiges Datum.'),counts:countsSchema,online:count,firstName:z.string().trim().min(1,'Bitte deinen Vornamen eingeben.').max(80),lastName:z.string().trim().min(1,'Bitte deinen Nachnamen eingeben.').max(80),confirmed:z.literal(true)}).strict().refine(v=>v.online<=reportTotal(v.counts),{message:'Online darf nicht höher als die Gesamtzahl sein.',path:['online']});
export function reportTotal(counts:TariffCounts){return tariffKeys.reduce((sum,key)=>sum+counts[key],0)}
