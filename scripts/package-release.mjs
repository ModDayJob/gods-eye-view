// Build a source release, never a bundle containing the operator's API tokens.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const directories=new Set(['.github','config','docs','pinokio','public','scripts','server','src','tools']);
const files=new Set(['.env.example','.gitattributes','.gitignore','package.json','package-lock.json','index.html','style.css','vite.config.js','LICENSE','Start Gods Eye.command']);
const blocked=new Set(['.git','.codex','.agents','node_modules','dist','output','qa-results','qa-shots','screenshots','.gev-cache','.gev-logs','.DS_Store','ENVIRONMENT','.installed']);
const secrets=[];
for(const entry of fs.readdirSync(root)) {
  if(!entry.startsWith('.env')||entry==='.env.example'||!fs.statSync(path.join(root,entry)).isFile())continue;
  for(const line of fs.readFileSync(path.join(root,entry),'utf8').split('\n')) {
    const m=line.match(/^\s*(?:export\s+)?([A-Z_][A-Z_0-9]*)\s*=\s*(.*?)\s*$/);
    if(!m||!/(KEY|TOKEN|SECRET|PASSWORD|PASSCODE)/.test(m[1]))continue;
    const value=m[2].replace(/^["']|["']$/g,'');if(value.length>=12)secrets.push(Buffer.from(value));
  }
}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gev-source-'));
const stage=path.join(temp,'gods-eye-view');fs.mkdirSync(stage);
const manifest=[];
function copy(relative) {
 const base=path.basename(relative);if(base.startsWith('._')||blocked.has(base)||base.endsWith('.log')||/\.(pem|key)$/.test(base)||(base.startsWith('.env')&&base!=='.env.example'))return;
 const source=path.join(root,relative),stat=fs.lstatSync(source);
 if(stat.isSymbolicLink())throw Error('Release symlinks require review: '+relative);
 if(stat.isDirectory()){for(const name of fs.readdirSync(source).sort())copy(path.join(relative,name));return;}
 const data=fs.readFileSync(source);
 if(secrets.some(secret=>data.includes(secret)))throw Error('Private configuration value found in release file: '+relative);
 const target=path.join(stage,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);fs.chmodSync(target,stat.mode&0o777);
 manifest.push({path:relative.split(path.sep).join('/'),sha256:createHash('sha256').update(data).digest('hex')});
}
try {
 for(const entry of fs.readdirSync(root).sort())if(directories.has(entry)||files.has(entry)||entry.endsWith('.md'))copy(entry);
 for(const required of ['package-lock.json','.env.example','LICENSE'])if(!manifest.some(f=>f.path===required))throw Error('Missing release file: '+required);
 fs.writeFileSync(path.join(stage,'RELEASE-MANIFEST.json'),JSON.stringify({version:pkg.version,files:manifest},null,2)+'\n');
 const out=path.join(root,'output');fs.mkdirSync(out,{recursive:true});
 const archive=path.join(out,`gods-eye-view-community-${pkg.version}.tar.gz`);
 execFileSync('tar',['-czf',archive,'-C',temp,'gods-eye-view'], { env: { ...process.env, COPYFILE_DISABLE: '1' } });
 const hash=createHash('sha256').update(fs.readFileSync(archive)).digest('hex');fs.writeFileSync(archive+'.sha256',`${hash}  ${path.basename(archive)}\n`);
 console.log(`Packaged ${manifest.length} source files; private configuration excluded.\n${archive}`);
} finally {fs.rmSync(temp,{recursive:true,force:true});}
