import puppeteer from 'puppeteer';
import fs from 'node:fs';
const out='qa-results/walkthrough/combined';fs.mkdirSync(out,{recursive:true});
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
try {
await page.goto('http://localhost:4173/#v=2&lat=30.2672&lon=-97.7431&alt=18000&pitch=-90&heading=0&roll=0&map=esri-imagery&l=',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>window.__godsEyeView&&document.getElementById('loading-screen')?.classList.contains('hidden'),{timeout:60000});

await step('All compatible map layers enabled together',async()=>{
 const ids=await page.evaluate(()=>window.__godsEyeView.dataManager.getAll().filter(l=>l.showInTogglePanel&&l.id!=='rocket-launches').map(l=>l.id));
 for(const id of ids)await page.evaluate(id=>Promise.race([window.__godsEyeView.dataManager.setEnabled(id,true,{origin:'user'}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Enable timeout: '+id)),40000))]),id);
 await sleep(10000);await page.screenshot({path:out+'/combined.png'});
 const sample=await page.evaluate(async()=>{const app=window.__godsEyeView;let frames=0;const remove=app.viewer.scene.postRender.addEventListener(()=>frames++);const start=performance.now();await new Promise(r=>setTimeout(r,10000));remove();return {framesPerSecond:frames/((performance.now()-start)/1000),layers:app.dataManager.getAll(),heapBytes:performance.memory?.usedJSHeapSize};});
 if(sample.layers.filter(l=>l.showInTogglePanel&&l.id!=='rocket-launches').some(l=>!l.enabled))throw Error('A requested map layer did not remain enabled');return sample;
});
await step('Street traffic extended live check',async()=>{
 let state;for(let i=0;i<18;i++){state=await page.evaluate(()=>window.__godsEyeView.dataManager.getAll().find(l=>l.id==='traffic'));if(state.stats.count>0||state.stats.error)break;await sleep(5000);}
 return state;
});
await step('Clear all layers',async()=>{await page.click('#clear-selected-layers');await page.waitForFunction(()=>window.__godsEyeView.dataManager.getAll().every(l=>!l.enabled),{timeout:30000});return 'All layers off';});
for(const label of ['DATA LAYERS','SCENES','DISPLAY','CCTV','CONTEXT','VISUAL PRESETS'])await step('Panel controls: '+label,async()=>{
 const sel=`[aria-label="Expand ${label}"]`;await page.waitForSelector(sel,{visible:true,timeout:5000});await page.click(sel);await sleep(600);
 const close=`[aria-label="Collapse ${label}"]`;await page.waitForSelector(close,{visible:true,timeout:5000});await page.click(close);await sleep(600);return 'Opened and closed';});
await step('Scene playback start and stop',async()=>{
 await page.click('[aria-label="Expand SCENES"]');await page.select('[aria-label="Scene recipe"]','flights-radar');
 await click('START','#scene-panel');await sleep(3500);const during=await page.$eval('#scene-panel',e=>e.innerText);await click('STOP','#scene-panel');await sleep(1000);
 return {during,after:await page.$eval('#scene-panel',e=>e.innerText)};
});
record('No uncaught browser errors',errors.length===0,errors);
} catch(e){record('Combined check interrupted',false,e.stack);} finally {fs.writeFileSync(out+'/results.json',JSON.stringify({results,errors,network},null,2));await browser.close();}
