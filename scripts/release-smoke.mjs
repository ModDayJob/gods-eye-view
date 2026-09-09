// Verify a clean, free-only local server without requiring live provider uptime.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
const root=fileURLToPath(new URL('../',import.meta.url));
const env={...process.env,GEV_FREE_ONLY:'1'};
for(const key of ['GOOGLE_MAPS_API_KEY','OPENAI_API_KEY','CESIUM_ION_TOKEN','AISSTREAM_API_KEY','FIRMS_MAP_KEY','TOMTOM_API_KEY','OPENSKY_CLIENT_ID','OPENSKY_CLIENT_SECRET','LL2_API_TOKEN'])env[key]='';
const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4179','--strictPort'],{cwd:root,env,stdio:['ignore','pipe','pipe']});
let exited=false;child.on('exit',()=>{exited=true});
// Drain logs without leaking configuration or upstream error URLs.
child.stdout.resume();child.stderr.resume();
const base='http://127.0.0.1:4179';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let ready=false;for(let i=0;i<100;i++){if(exited)throw Error('Local server exited during startup');try{ready=(await fetch(base,{signal:AbortSignal.timeout(500)})).ok}catch{}if(ready)break;await pause(200)}
 if(!ready)throw Error('Local server startup timed out');
 for(const route of ['/','/src/main.js','/style.css','/api/setup/status']){
  const r=await fetch(base+route,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(`Local route failed: ${route} (${r.status})`);
  if(route==='/api/setup/status'){const j=await r.json();if(!Array.isArray(j.keys)||j.keys.some(k=>k.set))throw Error('Expected clean keyless provider settings');}
 }
 console.log('PASS: keyless startup, application entry, stylesheet, and empty provider configuration');
} finally {
 if(!exited){const done=once(child,'exit');child.kill('SIGTERM');const timer=setTimeout(()=>child.kill('SIGKILL'),5000);await done;clearTimeout(timer);}
}
