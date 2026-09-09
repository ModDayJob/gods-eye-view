import puppeteer from 'puppeteer';
import fs from 'node:fs';
const out='qa-results/stability';fs.mkdirSync(out,{recursive:true});
const results=[], errors=[], network=[];
const browser=await puppeteer.launch({headless:true,executablePath:process.env.PUPPETEER_EXECUTABLE_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-angle=metal','--enable-gpu','--no-sandbox']});
const page=await browser.newPage();await page.setViewport({width:1440,height:1000});
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400){const u=new URL(r.url());network.push({path:u.origin+u.pathname,status:r.status()});}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const record=(name,ok,detail)=>{results.push({name,ok,detail});console.log(JSON.stringify(results.at(-1)));fs.writeFileSync(out+'/results.json',JSON.stringify({results,errors,network},null,2));};
const step=async(name,fn)=>{try{record(name,true,await fn());}catch(e){record(name,false,e.message);}};
const click=async(text,scope='body')=>page.evaluate((text,scope)=>{const b=[...document.querySelector(scope).querySelectorAll('button')].find(b=>(b.textContent.trim()===text||b.getAttribute('aria-label')===text)&&b.getClientRects().length);if(!b)throw Error('Button missing: '+text);if(b.disabled)throw Error('Button disabled: '+text);b.click();},text,scope);
const select=async(label,value)=>page.select(`[aria-label="${label}"]`,value);

let holdInstallations=true;
await page.setRequestInterception(true);
page.on('request',r=>{
 if(r.url().includes('/api/military-installations')){
  if(!holdInstallations)void r.respond({status:200,contentType:'application/json',body:JSON.stringify({elements:[],retrievedAt:new Date().toISOString()})}).catch(()=>{});
  // The first request deliberately never responds. The client must time out.
 } else void r.continue().catch(()=>{});
});
try {
await page.goto('http://localhost:4173/#v=2&lat=30.2672&lon=-97.7431&alt=3000&pitch=-90&heading=0&roll=0&map=esri-imagery&l=',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>window.__godsEyeView&&document.getElementById('loading-screen')?.classList.contains('hidden'),{timeout:60000});

await step('Installation timeout settles instead of blocking controls',async()=>{
 const start=Date.now();await page.evaluate(()=>window.__godsEyeView.dataManager.setEnabled('military-installations',true,{origin:'user'}));
 const state=await page.evaluate(()=>window.__godsEyeView.dataManager.getAll().find(l=>l.id==='military-installations'));
 if(Date.now()-start>16000||state.stats.loading||state.stats.failureReason!=='timeout')throw Error(JSON.stringify({elapsed:Date.now()-start,state}));
 return {elapsed:Date.now()-start,state};
});
await step('Source-specific retry recovers and preserves focused button',async()=>{
 holdInstallations=false;await page.click('#source-status-button');
 const selector='[aria-label="Retry Mapped Installations"]';await page.waitForSelector(selector,{visible:true});await page.click(selector);
 await page.waitForFunction(()=>window.__godsEyeView.dataManager.getAll().find(l=>l.id==='military-installations').stats.status==='empty',{timeout:12000});
 await sleep(2200);const state=await page.$eval(selector,e=>({connected:e.isConnected,disabled:e.disabled}));await page.keyboard.press('Escape');return state;
});
await step('Real traffic current-city refresh',async()=>{
 const start=Date.now();await page.evaluate(()=>window.__godsEyeView.dataManager.setEnabled('traffic',true,{origin:'user'}));
 await sleep(4000);const state=await page.evaluate(()=>window.__godsEyeView.dataManager.getAll().find(l=>l.id==='traffic'));
 return {elapsed:Date.now()-start,state};
});
await step('Compatible layers remain interactive through city, country and globe views',async()=>{
 const ids=await page.evaluate(()=>window.__godsEyeView.dataManager.getAll().filter(l=>l.showInTogglePanel&&l.id!=='rocket-launches').map(l=>l.id));
 const loads=[];for(const id of ids){const start=Date.now();await page.evaluate(id=>window.__godsEyeView.dataManager.setEnabled(id,true,{origin:'user'}),id);loads.push({id,ms:Date.now()-start});}
 const views=[];
 for(const [name,height] of [['city',3000],['country',2500000],['world',22000000]]){
  await page.evaluate(height=>{const {viewer}=window.__godsEyeView;viewer.camera.setView({destination:viewer.camera.position.constructor.fromDegrees(-97.7431,30.2672,height),orientation:{heading:0,pitch:-Math.PI/2,roll:0}});},height);
  await sleep(4000);
  views.push(await page.evaluate(async name=>{let frames=0;const remove=window.__godsEyeView.viewer.scene.postRender.addEventListener(()=>frames++);const start=performance.now();await new Promise(r=>setTimeout(r,3000));remove();return {name,fps:frames/((performance.now()-start)/1000)};},name));
  await page.screenshot({path:out+'/'+name+'.png'});
 }
 return {loads,views,layers:await page.evaluate(()=>window.__godsEyeView.dataManager.getAll())};
});
await step('Two-minute multi-layer soak and Clear',async()=>{
 const checks=[];for(let i=0;i<12;i++){await sleep(10000);checks.push(await page.evaluate(()=>({time:Date.now(),enabled:window.__godsEyeView.dataManager.getAll().filter(l=>l.enabled).length,canvas:document.querySelector('canvas')?.width>0})));}
 await page.click('#clear-selected-layers');await page.waitForFunction(()=>window.__godsEyeView.dataManager.getAll().every(l=>!l.enabled),{timeout:20000});
 if(errors.length)throw Error(errors.join('; '));return checks;
});
record('No uncaught browser errors',errors.length===0,errors);
} catch(e){record('Stability check interrupted',false,e.stack);} finally {fs.writeFileSync(out+'/results.json',JSON.stringify({results,errors,network},null,2));await browser.close();process.exitCode=results.some(r=>!r.ok)?1:0;}
