import * as Cesium from 'cesium';
import {REGIONS,TOPICS,safeNewsUrl,headlineKeywords,mentionedCountries} from './situationModel.js';
const KEY='gev.situation-desk.v1';
export function initSituationDesk({viewer}){
 let prefs={watch:[],saved:[],notes:''};try{
  const p=JSON.parse(localStorage.getItem(KEY));
  if(p)prefs={watch:(Array.isArray(p.watch)?p.watch:[]).filter(id=>REGIONS.some(r=>r.id===id)).slice(0,8),
   saved:(Array.isArray(p.saved)?p.saved:[]).filter(a=>safeNewsUrl(a.url)&&typeof a.title==='string').slice(0,100),
   notes:typeof p.notes==='string'?p.notes.slice(0,6000):''};
 }catch{}
 const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 const button=el('button','Situation');button.id='situation-desk-button';button.title='Situation Desk · public news and regional context';
 document.getElementById('top-center-actions')?.append(button);
 const panel=el('section');panel.id='situation-desk';panel.hidden=true;panel.setAttribute('aria-label','Situation Desk');
 const header=el('header'),title=el('h2','Situation Desk'),close=el('button','Close');
 header.append(title,close,el('p','PUBLIC NEWS · REGIONAL CONTEXT'));
 const disclaimer=el('p','Headlines are publisher reports, not independently verified events. Map markers show selected regions or country names mentioned in headlines, not incident locations.');
 disclaimer.className='situation-disclaimer';
 const controls=el('div');controls.className='situation-controls';
 const select=(label,options)=>{
  const s=el('select');s.setAttribute('aria-label',label);for(const [v,t] of options){const o=el('option',t);o.value=v;s.append(o);}return s;
 };
 const region=select('Situation region',REGIONS.map(r=>[r.id,r.name]));
 const topic=select('Situation topic',Object.entries(TOPICS).map(([id,t])=>[id,t.name]));
 const hours=select('News time window',[['24','Past 24 hours'],['6','Past 6 hours'],['48','Past 48 hours']]);
 const refreshButton=el('button','Refresh'),watch=el('button','☆ Watch region'),fly=el('button','Show region');
 controls.append(region,topic,hours,refreshButton,watch,fly);
 const watches=el('div');watches.className='situation-watchlist';
 const search=el('input');search.placeholder='Filter loaded headlines…';search.setAttribute('aria-label','Filter headlines');
 const tabs=el('nav');tabs.setAttribute('aria-label','Situation sections');
 let tab='feed';const tabButtons={};
 for(const [id,name] of [['feed','Headlines'],['brief','Briefing'],['saved','Saved'],['notes','Scenario notes']]){
  const b=el('button',name);b.onclick=()=>{tab=id;render();};tabButtons[id]=b;tabs.append(b);
 }
 const status=el('p','Choose a region to load public news.');status.setAttribute('role','status');
 const content=el('div');content.className='situation-content';
 const footer=el('footer','Original globe: Bilawal Sidhu & Sameh Khamis / Halfpixel · Community edition: ModDayJob');
 panel.append(header,disclaimer,controls,watches,search,tabs,status,content,footer);document.body.append(panel);
 const mapData=new Cesium.CustomDataSource('Situation regional context');viewer.dataSources.add(mapData);
 let report=null,timer=null,controller=null,generation=0,lastKey='',latestSeen=0;
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{status.textContent='Browser storage unavailable; changes are only kept this session.';}};
 function renderWatches(){
  watches.replaceChildren();watch.textContent=prefs.watch.includes(region.value)?'★ Unwatch region':'☆ Watch region';
  for(const id of prefs.watch){const r=REGIONS.find(x=>x.id===id),b=el('button',r.name);b.onclick=()=>{region.value=id;load();};watches.append(b);}
 }
 function mapRegion(){
  mapData.entities.removeAll();const r=REGIONS.find(x=>x.id===region.value);if(r.id==='world'){
   for(const c of mentionedCountries(report?.items||[]))mapData.entities.add({position:Cesium.Cartesian3.fromDegrees(c.lon,c.lat,1000),name:c.name+' · '+c.count+' headline mentions',
    point:{pixelSize:Math.min(22,8+Math.sqrt(c.count)*2),color:Cesium.Color.CYAN,outlineWidth:2,outlineColor:Cesium.Color.BLACK},
    label:{text:c.name+' · '+c.count,font:'13px sans-serif',showBackground:true,pixelOffset:new Cesium.Cartesian2(0,-22),distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,10000000)}});
   viewer.scene.requestRender();return;
  }
  mapData.entities.add({position:Cesium.Cartesian3.fromDegrees(r.lon,r.lat,1000),name:r.name+' · region context, not incident location',
   point:{pixelSize:12,color:Cesium.Color.CYAN,outlineWidth:2,outlineColor:Cesium.Color.BLACK},
   label:{text:r.name+' · region',font:'14px sans-serif',showBackground:true,pixelOffset:new Cesium.Cartesian2(0,-24)}});
  viewer.scene.requestRender();
 }
 function filtered(items){const q=search.value.toLowerCase().trim();return items.filter(a=>!q||(a.title+' '+a.source).toLowerCase().includes(q));}
 function download(text,name){
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain'})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function cards(items){
  if(!items.length)content.append(el('p','No matching headlines. Try another region, topic or time window.'));
  for(const a of items){
   const card=el('article'),link=el('a',a.title);link.href=safeNewsUrl(a.url);link.target='_blank';link.rel='noopener noreferrer';card.append(link);
   card.append(el('p',(a.source||'Publisher')+' · '+new Date(a.publishedAt).toLocaleString()+' · Reported'));
   const saved=prefs.saved.some(x=>x.url===a.url),save=el('button',saved?'★ Remove saved':'☆ Save story');
   save.onclick=()=>{if(saved)prefs.saved=prefs.saved.filter(x=>x.url!==a.url);else{
    if(prefs.saved.length>=100){status.textContent='100 saved stories reached; remove one first.';return;}
    prefs.saved.push({...a,region:region.value});
   }persist();render();};card.append(save);content.append(card);
  }
 }
 function render(){
  content.replaceChildren();renderWatches();
  for(const [id,b] of Object.entries(tabButtons))b.setAttribute('aria-pressed',String(id===tab));
  const items=filtered(report?.items||[]),r=REGIONS.find(x=>x.id===region.value);
  if(tab==='feed'){if(report)cards(items);else content.append(el('p','No feed loaded yet.'));}
  if(tab==='saved'){content.append(el('p','Saved locally in this browser. These are archived headlines; they are not refreshed or re-verified.'));cards(filtered(prefs.saved));}
  if(tab==='notes'){
   content.append(el('h3','Your scenario notebook'),el('p','Write hypotheses, assumptions and evidence to check. These notes are yours, not predictions or live intelligence.'));
   const notes=el('textarea');notes.setAttribute('aria-label','Scenario notes');notes.maxLength=6000;notes.rows=12;notes.value=prefs.notes;
   notes.oninput=()=>{prefs.notes=notes.value;persist();};const exportNotes=el('button','Download notes');exportNotes.onclick=()=>download(prefs.notes,'situation-notes.txt');content.append(notes,exportNotes);
  }
  if(tab==='brief'){
   const sources=new Set(items.map(x=>x.source));
   const summary=[r.name+' — '+TOPICS[topic.value].name,items.length+' loaded headlines from '+sources.size+' publisher labels in the selected window.',
    'This summarizes the loaded sample, not all events. Multiple outlets do not establish independent corroboration.',
    'Keywords in loaded headlines: '+headlineKeywords(items).map(([w,n])=>w+' ('+n+')').join(', '),
    'Feed received: '+(report?new Date(report.receivedAt).toLocaleString():'not loaded')+(report?.stale?' · STALE':''),
    ...items.slice(0,10).map(a=>a.title+'\n'+a.source+' · '+a.publishedAt+'\n'+a.url)].join('\n\n');
   const pre=el('div',summary.replace(/^https?:\/\/\S+$/gm,''));pre.className='situation-brief';const exportBrief=el('button','Download briefing');exportBrief.onclick=()=>download(summary,'situation-briefing.txt');
   content.append(el('h3','Briefing from loaded headlines'),pre,exportBrief);
  }
 }
 async function load(){
  clearTimeout(timer);controller?.abort();controller=new AbortController();const token=++generation,request=controller;
  const key=region.value+':'+topic.value+':'+hours.value;
  if(key!==lastKey){report=null;lastKey=key;latestSeen=0;}render();mapRegion();
  refreshButton.disabled=true;status.textContent='Loading public headlines…';
  const deadline=setTimeout(()=>request.abort(),18000);
  try{
   const u=new URLSearchParams({region:region.value,topic:topic.value,hours:hours.value});
   const response=await fetch('/api/situation-news?'+u,{signal:request.signal});if(!response.ok)throw new Error('Unavailable');
   const next=await response.json();if(token!==generation||panel.hidden)return;
   const fresh=latestSeen?next.items.filter(x=>Date.parse(x.publishedAt)>latestSeen).length:0;
   report=next;mapRegion();latestSeen=Math.max(latestSeen,...next.items.map(x=>Date.parse(x.publishedAt)),0);
   status.textContent=(next.stale?'STALE · ':'')+next.items.length+' headlines · '+(fresh?fresh+' newly indexed · ':'')+'Received '+new Date(next.receivedAt).toLocaleTimeString()+' · '+next.source+' · refresh every 5 minutes';
   render();
  }catch{
   if(token!==generation||panel.hidden)return;if(report)report={...report,stale:true};
   status.textContent=report?'Refresh failed · previous headlines retained as STALE.':'News provider unavailable. Automatic retry in five minutes.';render();
  }finally{clearTimeout(deadline);if(token===generation){refreshButton.disabled=false;if(!panel.hidden)timer=setTimeout(load,300000);}}
 }
 region.onchange=topic.onchange=hours.onchange=load;refreshButton.onclick=load;search.oninput=render;
 watch.onclick=()=>{prefs.watch=prefs.watch.includes(region.value)?prefs.watch.filter(x=>x!==region.value):[...prefs.watch,region.value];persist();renderWatches();};
 fly.onclick=()=>{const r=REGIONS.find(x=>x.id===region.value);viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(r.lon,r.lat,r.id==='world'?22000000:3500000),duration:1.5});};
 button.onclick=()=>{if(!panel.hidden)return;panel.hidden=false;load();};
 close.onclick=()=>{panel.hidden=true;generation++;clearTimeout(timer);controller?.abort();mapData.entities.removeAll();viewer.scene.requestRender();};
 renderWatches();
}
