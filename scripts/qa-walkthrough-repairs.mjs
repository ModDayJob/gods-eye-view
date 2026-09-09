import puppeteer from 'puppeteer';
import fs from 'node:fs';
const out='qa-results/walkthrough/repairs';fs.mkdirSync(out,{recursive:true});
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
let delayed=false, roadFailures=0;
await page.setRequestInterception(true);
page.on('request',r=>{
 if(r.url().includes('/api/overpass')){roadFailures++;void r.respond({status:503,contentType:'application/json',body:'{"error":"Test provider unavailable"}'}).catch(()=>{});}
 else if(r.url().includes('/api/opensky')){setTimeout(()=>void r.respond({status:200,contentType:'application/json',body:JSON.stringify({time:Math.floor(Date.now()/1000),states:[]})}).catch(()=>{}),delayed?3000:0);}
 else void r.continue().catch(()=>{});
});
try {
await page.goto('http://localhost:4173/#v=2&lat=30.2672&lon=-97.7431&alt=3000&pitch=-90&heading=0&roll=0&map=esri-imagery&l=',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>window.__godsEyeView&&document.getElementById('loading-screen')?.classList.contains('hidden'),{timeout:60000});

await step('Failed road provider is visible in traffic status',async()=>{
 await page.evaluate(()=>window.__godsEyeView.dataManager.setEnabled('traffic',true,{origin:'user'}));
 await page.waitForFunction(()=>window.__godsEyeView.dataManager.getAll().find(l=>l.id==='traffic').stats.error?.includes('Road network unavailable'),{timeout:30000});
 const state=await page.evaluate(()=>window.__godsEyeView.dataManager.getAll().find(l=>l.id==='traffic').stats);
 if(!roadFailures)throw Error('Failure fixture was not requested');await page.evaluate(()=>window.__godsEyeView.dataManager.setEnabled('traffic',false,{origin:'user'}));return state;
});
await step('Cancelling military-triggered flight refresh produces no uncaught rejection',async()=>{
 await page.evaluate(()=>window.__godsEyeView.dataManager.setEnabled('flights',true,{origin:'user'}));delayed=true;
 await page.evaluate(async()=>{const r=await import('/src/data/militaryRegistry.js');r.setMilitaryLayerActive(true);r.setMilitaryLayerActive(false);await window.__godsEyeView.dataManager.setEnabled('flights',false,{origin:'user'});});
 await sleep(3500);if(errors.length)throw Error(errors.join('; '));return 'Delayed request cancelled cleanly';
});
} finally {fs.writeFileSync(out+'/results.json',JSON.stringify({results,errors,network},null,2));await browser.close();process.exitCode=results.some(r=>!r.ok)?1:0;}
