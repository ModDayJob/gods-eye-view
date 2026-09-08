import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const vite=fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url));
const [major,minor]=process.versions.node.split('.').map(Number);
if(!((major===24&&minor>=14)||major===26)){
  console.error('Install Node 24.14+ (24.x) or Node 26 before starting Gods Eye.');
  process.exit(1);
}
if(!existsSync(vite)){
  console.error('Run npm ci first to install dependencies.');
  process.exit(1);
}
const child=spawn(process.execPath,[vite,'--host','localhost','--port','4173','--strictPort','--open'],{
  cwd:root,stdio:'inherit',
  env:{...process.env,GEV_FREE_ONLY:'1',GOOGLE_MAPS_API_KEY:'',OPENAI_API_KEY:'',HOST:'localhost',PORT:'4173'}
});
child.on('error',()=>{console.error('Unable to start the local server.');process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
