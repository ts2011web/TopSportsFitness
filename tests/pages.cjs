const ts=require('typescript'),fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
function load(file,imports={}){
 const exports={};
 const code=fs.readFileSync(file,'utf8').replace('import.meta.env.BASE_URL',JSON.stringify('/TS-Cockpit/'));
 vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:k=>imports[k]??require(k),Response,Request,URL,DOMException,window:{location:{origin:'https://rewitzerts.github.io'}},fetch:()=>{throw Error('Preview must never contact a backend')}});
 return exports;
}
const config=load('lib/dashboard.ts');
const demo=load('pages/demo-client.ts',{'../lib/dashboard':config});
(async()=>{
 const data=await (await demo.apiFetch('/api/dashboard')).json();
 assert.equal(data.canEdit,false);assert.equal(data.signedIn,false);
 assert.equal(demo.assetPath('/modules/design-studio/index.html'),'/TS-Cockpit/modules/design-studio/index.html');
 assert.equal((await demo.apiFetch('/api/dashboard',{method:'PUT',body:'{}'})).status,403);
 assert.equal((await demo.apiFetch('/api/club-reports',{method:'POST',body:'{}'})).status,403);
 assert.equal((await (await demo.apiFetch('/api/statistics?period=2020-01')).json()).snapshot,null);
 const historical=await (await demo.apiFetch('/api/statistics?period='+data.config.period)).json();
 assert.equal(historical.snapshot.config.period,data.config.period);
 const controller=new AbortController();controller.abort();
 await assert.rejects(()=>demo.apiFetch('/api/dashboard',{signal:controller.signal}),{name:'AbortError'});
 console.log('Pages preview: no backend calls, no admin/write access, correct base paths and monthly fallback.');
})().catch(error=>{console.error(error);process.exitCode=1});
