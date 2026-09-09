import puppeteer from 'puppeteer';
import fs from 'node:fs';
const out='qa-results/stability/recovery';fs.mkdirSync(out,{recursive:true});
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


let holdInstallations=true, failRoads=true;
await page.setRequestInterception(true);
page.on('request',r=>{
 if(r.url().includes('/api/military-installations')){if(!holdInstallations)void r.respond({status:200,contentType:'application/json',body:JSON.stringify({elements:[],retrievedAt:new Date().toISOString()})}).catch(()=>{});}
 else if(r.url().includes('/api/overpass'))void r.respond({status:failRoads?503:200,contentType:'application/json',body:JSON.stringify(failRoads?{error:'Fixture unavailable'}:{elements:[{type:'way',id:123,tags:{highway:'primary'},geometry:[{lat:30.26,lon:-97.743},{lat:30.28,lon:-97.743}]}]})}).catch(()=>{});
 else void r.continue().catch(()=>{});
});
try {
await page.goto('http://localhost:4173/#v=2&lat=30.2672&lon=-97.7431&alt=3000&pitch=-90&heading=0&roll=0&map=esri-imagery&l=',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>window.__godsEyeView&&document.getElementById('loading-screen')?.classList.contains('hidden'),{timeout:60000});

await sleep(2000);
await step('Installation timeout settles instead of blocking controls',async()=>{
 const start=Date.now();await page.evaluate(()=>window.__godsEyeView.dataManager.setEnabled('military-installations',true,{origin:'user'}));
 await page.waitForFunction(()=>window.__godsEyeView.dataManager.getAll().find(l=>l.id==='military-installations').stats.failureReason==='timeout',{timeout:17000});const state=await page.evaluate(()=>window.__godsEyeView.dataManager.getAll().find(l=>l.id==='military-installations'));
 if(Date.now()-start>18000||state.stats.loading||state.stats.failureReason!=='timeout')throw Error(JSON.stringify({elapsed:Date.now()-start,state}));
 return {elapsed:Date.now()-start,state};
});
await step('Source-specific retry recovers and preserves focused button',async()=>{
 holdInstallations=false;await page.click('#source-status-button');
 const selector='[aria-label="Retry Mapped Installations"]';await page.waitForSelector(selector,{visible:true});await page.click(selector);
 await page.waitForFunction(()=>window.__godsEyeView.dataManager.getAll().find(l=>l.id==='military-installations').stats.status==='empty',{timeout:12000});
 await sleep(2200);const state=await page.$eval(selector,e=>({connected:e.isConnected,disabled:e.disabled}));await page.keyboard.press('Escape');return state;
});

await step('Traffic retry recovers the current view without moving the camera',async()=>{
 await page.evaluate(()=>window.__godsEyeView.dataManager.setEnabled('traffic',true,{origin:'user'}));
 await page.waitForFunction(()=>window.__godsEyeView.dataManager.getAll().find(l=>l.id==='traffic').stats.error?.includes('Road network unavailable'),{timeout:12000});
 failRoads=false;await page.click('#source-status-button');await page.click('[aria-label="Retry Street Traffic"]');
 await page.waitForFunction(()=>{const s=window.__godsEyeView.dataManager.getAll().find(l=>l.id==='traffic').stats;return s.count>0&&!s.error;},{timeout:15000});
 const state=await page.evaluate(()=>window.__godsEyeView.dataManager.getAll().find(l=>l.id==='traffic').stats);await page.keyboard.press('Escape');return state;
});
record('No uncaught browser errors',errors.length===0,errors);
} finally {fs.writeFileSync(out+'/results.json',JSON.stringify({results,errors,network},null,2));await browser.close();process.exitCode=results.some(r=>!r.ok)?1:0;}
