import puppeteer from 'puppeteer';
import fs from 'node:fs';
const out='qa-results/walkthrough/followup';fs.mkdirSync(out,{recursive:true});
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
} finally {fs.writeFileSync(out+'/results.json',JSON.stringify({results,errors,network},null,2));await browser.close();}
