import puppeteer from 'puppeteer';
import fs from 'node:fs';
const out='qa-results/walkthrough/flows';fs.mkdirSync(out,{recursive:true});
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
await step('Camera catalogue and first snapshot',async()=>{await page.click('#camera-browser-button');await page.waitForFunction(()=>document.querySelector('[aria-label="Camera location"]')?.options.length>0,{timeout:35000});await sleep(3500);return page.$eval('#camera-browser-dialog',e=>({text:e.innerText.slice(0,1600),imageLoaded:e.querySelector('img').naturalWidth>0,cities:e.querySelector('[aria-label="Camera city"]').options.length}));});
await step('Camera cities and video playback',async()=>{const cities=await page.$$eval('[aria-label="Camera city"] option',es=>es.map(e=>({v:e.value,t:e.textContent})));const videoCity=cities.find(c=>/Los Angeles|San Francisco/.test(c.t));if(!videoCity)throw Error('Video city missing');await select('Camera city',videoCity.v);const opts=await page.$$eval('[aria-label="Camera location"] option',es=>es.map(e=>({v:e.value,t:e.textContent})));const video=opts.find(c=>c.t.startsWith('VIDEO'));if(!video)throw Error('Video camera missing');await select('Camera location',video.v);await click('Play live video','#camera-browser-dialog');await sleep(8000);const state=await page.$eval('#camera-browser-dialog',e=>({status:e.querySelector('[role="status"]').textContent,readyState:e.querySelector('video').readyState,time:e.querySelector('video').currentTime}));return state;});
await page.keyboard.press('Escape');

await step('News region, evidence, saved story and history replay',async()=>{
 await page.click('#situation-desk-button');await select('Situation region','united-states');
 await page.waitForFunction(()=>/headlines.*Received/.test(document.querySelector('#situation-desk').innerText),{timeout:25000});
 await click('Reports','#situation-desk');await click('☆ Save story','#situation-desk');await click('Saved','#situation-desk');
 if(!await page.$eval('#situation-desk',e=>e.innerText.includes('★ Remove saved')))throw Error('Saved story not shown');
 await click('Ask','#situation-desk');await page.type('[aria-label="Briefing question"]','United States');await click('Find evidence','#situation-desk');
 const answer=await page.$eval('#situation-desk',e=>e.innerText.includes('Evidence for: United States'));if(!answer)throw Error('Evidence answer missing');
 await click('History','#situation-desk');await click('Save current snapshot','#situation-desk');
 await page.evaluate(()=>[...document.querySelectorAll('#situation-desk article button')].find(b=>b.textContent.startsWith('United States ·')).click());
 if(!await page.$eval('#situation-desk',e=>e.innerText.includes('HISTORY ·')))throw Error('History banner missing');
 await click('History','#situation-desk');await click('Return to live','#situation-desk');
 await page.waitForFunction(()=>/headlines.*Received/.test(document.querySelector('#situation-desk').innerText)&&!document.querySelector('.briefing-archive'),{timeout:25000});
 return 'Country reports, story save, evidence search, snapshot and return to live';
});
await step('Town geocoding and local news',async()=>{
 await page.type('[aria-label="City or town news"]','Portland, Maine, United States');await click('Find place','#situation-desk');
 await page.waitForFunction(()=>[...document.querySelectorAll('#situation-desk button')].some(b=>b.textContent==='Use this place'),{timeout:25000});
 await click('Use this place','#situation-desk');
 await page.waitForFunction(()=>/headlines.*Received/.test(document.querySelector('#situation-desk').innerText),{timeout:25000});
 return page.$eval('#situation-desk',e=>e.innerText.slice(-1600));
});
await step('Notes persist and exports download',async()=>{
 const client=await page.createCDPSession();await client.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:process.cwd()+'/'+out});
 await click('Notes','#situation-desk');await page.type('[aria-label="Scenario notes"]','QA walkthrough note: verify sources before drawing conclusions.');await click('Download notes','#situation-desk');
 await click('Briefing','#situation-desk');await click('Download briefing','#situation-desk');await sleep(1500);
 if(!fs.existsSync(out+'/situation-notes.txt')||!fs.existsSync(out+'/situation-briefing.txt'))throw Error('Export file missing');
 await click('Notes','#situation-desk');if(!await page.$eval('[aria-label="Scenario notes"]',e=>e.value.includes('QA walkthrough')))throw Error('Note disappeared');
 return 'Notes retained and both exports downloaded in test browser';
});
await click('Explore map','#situation-desk');
await step('City favorites, search and local weather',async()=>{
 await page.click('#live-views-button');await select('View city','Seattle');await click('☆ Save favorite city','#live-views-panel');
 await page.type('[aria-label="Find city or place"]','Portland, Maine');await click('Find place','#live-views-panel');
 await sleep(5000);const city=await page.$eval('[aria-label="View city"]',e=>e.value);
 if(!city.includes('Portland'))throw Error('Place search did not select Portland: '+city);
 await select('Live view','weather');await click('Go to city','#live-views-panel');await page.waitForFunction(()=>!document.querySelector('#live-views-panel [role="status"]').textContent.includes('Loading'),{timeout:25000});
 return page.$eval('#live-views-panel',e=>e.innerText.slice(-1800));
});
await click('Stop & close','#live-views-panel');
await step('Local traffic, bikeshare and installation coverage',async()=>{
 await page.evaluate(async()=>{const {applyOpeningView}=await import('/src/viewPreferences.js');applyOpeningView(window.__godsEyeView.viewer);});
 await sleep(5500);const states=[];for(const id of ['traffic','bikeshare','military-installations']){
 await page.evaluate(id=>window.__godsEyeView.dataManager.setEnabled(id,true,{origin:'user'}),id);await sleep(18000);
 states.push(await page.evaluate(id=>window.__godsEyeView.dataManager.getAll().find(l=>l.id===id),id));
 await page.evaluate(id=>window.__godsEyeView.dataManager.setEnabled(id,false,{origin:'user'}),id);}
 return states;
});
record('No uncaught browser errors',errors.length===0,errors);
} catch(e){record('Flow interrupted',false,e.stack);} finally{fs.writeFileSync(out+'/results.json',JSON.stringify({results,errors,network},null,2));await browser.close();}
