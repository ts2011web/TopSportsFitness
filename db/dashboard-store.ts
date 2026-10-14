import { env } from 'cloudflare:workers';
export function dashboardDb():D1Database {if(!env.DB)throw new Error('Database binding missing');return env.DB;}
