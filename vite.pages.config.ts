import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
const path=(value:string)=>fileURLToPath(new URL(value,import.meta.url));
export default defineConfig({
 root:path('./pages'),
 base:process.env.COCKPIT_BASE_PATH||'/TopSportsFitness/',
 publicDir:path('./public'),
 plugins:[react()],
 resolve:{alias:[
  {find:'@/lib/cockpit-client',replacement:path(process.env.VITE_COCKPIT_MODE==='live'?'./pages/live-client.ts':'./pages/demo-client.ts')},
  {find:'@',replacement:path('./')},
 ]},
 css:{postcss:path('./')},
 build:{outDir:path('./dist-pages'),emptyOutDir:true},
});
