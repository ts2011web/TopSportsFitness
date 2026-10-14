import {dashboardDb} from './dashboard-store';
import {configSchema,type Snapshot} from '@/lib/dashboard';
export type DashboardRow={config:string;owner:string;revision:number;updated_at:string};
export async function readDashboard(){return dashboardDb().prepare('SELECT config,owner,revision,updated_at FROM dashboard WHERE id=1').first<DashboardRow>()}
export async function dashboardSnapshot(current:DashboardRow,userId:string):Promise<Snapshot>{
 const config=configSchema.parse(JSON.parse(current.config));
 const result=await dashboardDb().prepare("SELECT club_id,SUM(amount) AS total FROM (SELECT club_id,signed_on,1 AS amount FROM memberships WHERE cancelled_at IS NULL UNION ALL SELECT club_id,signed_on,total AS amount FROM club_reports WHERE cancelled_at IS NULL) WHERE substr(signed_on,1,7)=? AND signed_on>? GROUP BY club_id").bind(config.period,config.asOf).all<{club_id:string;total:number}>();
 return {config,revision:current.revision,updatedAt:current.updated_at,canEdit:!!userId&&current.owner===userId,signedIn:!!userId,entryCounts:Object.fromEntries(result.results.map(r=>[r.club_id,r.total]))};
}
