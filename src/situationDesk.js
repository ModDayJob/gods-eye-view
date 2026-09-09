import {findFreePlace} from './freeGeocode.js';
import * as Cesium from 'cesium';
import {REGIONS as BASE_REGIONS,TOPICS,safeNewsUrl,headlineKeywords,mentionedCountries,localNewsPlace} from './situationModel.js';
import {readSnapshots,compareSnapshots,findEvidence} from './briefingAnalysis.js';
const KEY='gev.situation-desk.v1';
const HISTORY_KEY='gev.briefing-history.v1';
const PLACES_KEY='gev.briefing-places.v1';
export function initSituationDesk({viewer}){
 const REGIONS=[...BASE_REGIONS];
 try{const rows=JSON.parse(localStorage.getItem(PLACES_KEY));if(Array.isArray(rows))for(const p of rows.slice(0,30)){
  const place=localNewsPlace(p?.name);if(place&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180&&!REGIONS.some(r=>r.id===place.id))REGIONS.push({...place,lat:p.lat,lon:p.lon,local:true});
 }}catch{}

 let prefs={watch:[],saved:[],notes:''};try{
  const p=JSON.parse(localStorage.getItem(KEY));
  if(p)prefs={watch:(Array.isArray(p.watch)?p.watch:[]).filter(id=>REGIONS.some(r=>r.id===id)).slice(0,20),
   saved:(Array.isArray(p.saved)?p.saved:[]).filter(a=>safeNewsUrl(a.url)&&typeof a.title==='string').slice(0,100),
   notes:typeof p.notes==='string'?p.notes.slice(0,6000):''};
 }catch{}
 const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 const button=el('button','Briefing Room');button.id='situation-desk-button';button.title='Situation Desk · public news and regional context';
 document.getElementById('top-center-actions')?.append(button);
 const panel=el('section');panel.id='situation-desk';panel.hidden=true;panel.setAttribute('aria-label','Situation Desk');
 const header=el('header'),title=el('h2','Your world, in focus.'),close=el('button','Explore map');
 header.append(close,el('p','BRIEFING ROOM · COMMUNITY PREVIEW'),title);
 let history=[];try{history=readSnapshots(JSON.parse(localStorage.getItem(HISTORY_KEY))).filter(s=>REGIONS.some(r=>r.id===s.region)&&TOPICS[s.topic]&&['6','24','48'].includes(String(s.hours))); }catch{}
 let archive=null,question='',overlayEnabled=true;
 const layerMirrors=new Map();
 const current=()=>archive||report;
 const scope=()=>({region:region.value,topic:topic.value,hours:hours.value});
 const snapshot=()=>report?{...report,...scope(),id:String(Date.now()),capturedAt:new Date().toISOString()}:null;
 const previous=()=>history.filter(s=>s.id!==archive?.id&&s.region===region.value&&s.topic===topic.value&&String(s.hours)===hours.value&&(!archive||Date.parse(s.capturedAt)<Date.parse(archive.capturedAt))).at(-1);
 const saveSnapshot=()=>{const s=snapshot();if(!s||s.stale){status.textContent='Refresh successfully before saving a snapshot.';return;}history=[...history,s].slice(-30);try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history));status.textContent='Snapshot saved on this browser. History keeps the latest 30 snapshots.';}catch{status.textContent='Storage is full or unavailable. Snapshot is only retained in this session.';}render();};
 const disclaimer=el('p','Headlines are publisher reports, not independently verified events. Map markers show selected regions or country names mentioned in headlines, not incident locations.');
 disclaimer.className='situation-disclaimer';
 const controls=el('div');controls.className='situation-controls';
 const select=(label,options)=>{
  const s=el('select');s.setAttribute('aria-label',label);for(const [v,t] of options){const o=el('option',t);o.value=v;s.append(o);}return s;
 };
 const region=select('Situation region',REGIONS.map(r=>[r.id,r.name]));
 const placeForm=el('form');placeForm.className='briefing-place-search';
 const placeInput=el('input');placeInput.setAttribute('aria-label','City or town news');placeInput.placeholder='City or town + state/country';placeInput.maxLength=120;
 const placeSubmit=el('button','Find place');placeSubmit.type='submit';placeForm.append(placeInput,placeSubmit);
 const placeResult=el('div');placeResult.setAttribute('role','status');let placeRequest=null;
 placeForm.onsubmit=async e=>{
  e.preventDefault();const query=placeInput.value.trim();if(query.length<2){placeResult.textContent='Enter a city or town, preferably with its state or country.';return;}
  placeRequest?.abort();const request=new AbortController();placeRequest=request;placeSubmit.disabled=true;placeResult.textContent='Finding the place…';
  try{const found=await findFreePlace(query,{signal:request.signal});if(request!==placeRequest||request.signal.aborted)return;
   const place=localNewsPlace(found?.label);
   if(!found||!place){placeResult.textContent='No usable place found. Try the town name with its state and country.';return;}
   placeResult.replaceChildren(el('p','Match: '+place.name));const use=el('button','Use this place');use.type='button';
   use.onclick=()=>{
    let r=REGIONS.find(r=>r.id===place.id);
    if(!r){if(REGIONS.filter(r=>r.local).length>=30){placeResult.textContent='30 saved places reached.';return;}
     r={...place,lat:found.lat,lon:found.lon,local:true};REGIONS.push(r);const option=el('option',r.name);option.value=r.id;region.append(option);
     try{localStorage.setItem(PLACES_KEY,JSON.stringify(REGIONS.filter(r=>r.local)));}catch{placeResult.textContent='Place is available this session; browser storage is unavailable.';}
    }
    region.value=r.id;topic.value='all';search.value='';tab='overview';load();fly.onclick();placeResult.replaceChildren(el('p','Local news for '+r.name+'. Select ☆ Watch region to keep it on your overview.'));
   };placeResult.append(use);
  }catch{if(request===placeRequest&&!request.signal.aborted)placeResult.textContent='Place search unavailable. Try again shortly.';}
  finally{if(request===placeRequest)placeSubmit.disabled=false;}
 };
 const topic=select('Situation topic',Object.entries(TOPICS).map(([id,t])=>[id,t.name]));
 const hours=select('News time window',[['24','Past 24 hours'],['6','Past 6 hours'],['48','Past 48 hours']]);
 const refreshButton=el('button','Refresh'),watch=el('button','☆ Watch region'),fly=el('button','Show region');
 controls.append(topic,hours);
 const filters=el('details'),filterTitle=el('summary','Worldwide · filters');filters.className='briefing-filters';filters.append(filterTitle,controls);
 const actions=el('div');actions.className='briefing-actions';actions.append(refreshButton,watch,fly);
 const watches=el('div');watches.className='situation-watchlist';
 const search=el('input');search.placeholder='Filter loaded headlines…';search.setAttribute('aria-label','Filter headlines');
 const tabs=el('nav');tabs.setAttribute('aria-label','Situation sections');
 let tab='overview';const tabButtons={};
 for(const [id,name] of [['overview','Overview'],['feed','Reports'],['brief','Briefing'],['ask','Ask'],['history','History'],['layers','Map layers'],['saved','Saved'],['notes','Notes']]){
  const b=el('button',name);b.onclick=()=>{tab=id;render();};tabButtons[id]=b;tabs.append(b);
 }
 const status=el('p','Choose a region to load public news.');status.setAttribute('role','status');
 const content=el('div');content.className='situation-content';
 const footer=el('footer','Original globe: Bilawal Sidhu & Sameh Khamis / Halfpixel · Community edition: ModDayJob');
 filters.append(search);
 const sourceNote=el('details'),sourceTitle=el('summary','About the evidence & map');sourceNote.append(sourceTitle,disclaimer);
 panel.append(header,region,placeForm,placeResult,filters,actions,watches,tabs,status,content,sourceNote,footer);document.body.append(panel);
 const mapData=new Cesium.CustomDataSource('Situation regional context');viewer.dataSources.add(mapData);
 let report=null,timer=null,controller=null,generation=0,lastKey='',latestSeen=0;
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{status.textContent='Browser storage unavailable; changes are only kept this session.';}};
 function renderWatches(){
  watches.replaceChildren();watch.textContent=prefs.watch.includes(region.value)?'★ Unwatch region':'☆ Watch region';
  for(const id of prefs.watch){const r=REGIONS.find(x=>x.id===id),b=el('button',r.name);b.onclick=()=>{region.value=id;load();};watches.append(b);}
 }
 function mapRegion(){
  mapData.entities.removeAll();mapData.show=overlayEnabled;const r=REGIONS.find(x=>x.id===region.value);if(r.id==='world'){
   for(const c of mentionedCountries(current()?.items||[]))mapData.entities.add({position:Cesium.Cartesian3.fromDegrees(c.lon,c.lat,1000),name:c.name+' · '+c.count+' headline mentions',
    point:{pixelSize:Math.min(22,8+Math.sqrt(c.count)*2),color:Cesium.Color.CYAN,outlineWidth:2,outlineColor:Cesium.Color.BLACK},
    label:{text:c.name+' · '+c.count,font:'13px sans-serif',showBackground:true,pixelOffset:new Cesium.Cartesian2(0,-22),distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,10000000)}});
   viewer.scene.requestRender();return;
  }
  mapData.entities.add({position:Cesium.Cartesian3.fromDegrees(r.lon,r.lat,1000),name:r.name+' · place context, not incident location',
   point:{pixelSize:12,color:Cesium.Color.CYAN,outlineWidth:2,outlineColor:Cesium.Color.BLACK},
   label:{text:r.name+' · context',font:'14px sans-serif',showBackground:true,pixelOffset:new Cesium.Cartesian2(0,-24)}});
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
 function evidenceCards(rows){cards(rows);}
 function focusCountry(c){
  search.value=c.name;tab='feed';render();
  viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(c.lon,c.lat,3500000),duration:1.2});
 }
 const selectionListener=viewer.selectedEntityChanged.addEventListener(entity=>{
  if(!entity||!mapData.entities.contains(entity))return;
  const country=mentionedCountries(current()?.items||[]).find(c=>entity.name.startsWith(c.name+' ·'));
  if(country){search.value=country.name;tab='feed';render();}
 });
 window.addEventListener('pagehide',()=>selectionListener(),{once:true});
 function render(){
  layerMirrors.clear();content.replaceChildren();renderWatches();filterTitle.textContent=(REGIONS.find(r=>r.id===region.value)?.name||'Region')+' · '+(archive?'History':'Live')+' · Filters';
  for(const [id,b] of Object.entries(tabButtons))b.setAttribute('aria-pressed',String(id===tab));
  const items=filtered(current()?.items||[]),r=REGIONS.find(x=>x.id===region.value);
  if(archive){const banner=el('div','HISTORY · '+new Date(archive.capturedAt).toLocaleString()+' · News overlay uses this snapshot. Other map feeds remain live.');banner.className='briefing-archive';content.append(banner);}
  const active=current()?{...current(),...scope()}:null,diff=compareSnapshots(active,previous());
  if(tab==='overview'){
   const metrics=el('div');metrics.className='briefing-metrics';
   for(const [n,label] of [[items.length,'reports in sample'],[new Set(items.map(a=>a.source)).size,'publisher labels'],[prefs.watch.length,'watched regions']]){
    const box=el('div');box.append(el('strong',String(n)),el('span',label));metrics.append(box);
   }content.append(metrics,el('h3','Your watched places'));
   if(!prefs.watch.length)content.append(el('p','Choose a country, region or town above and select ☆ Watch region to make this space yours.'));
   const grid=el('div');grid.className='briefing-region-grid';
   for(const id of (prefs.watch.length?prefs.watch:['united-states','russia','eu','world'])){
    const place=REGIONS.find(x=>x.id===id),b=el('button',place.name+' ↗');b.onclick=()=>{region.value=id;search.value='';load();fly.onclick();};grid.append(b);
   }content.append(grid,el('h3','What changed in the collected reports'));
   content.append(el('p',diff?diff.added.length+' headlines added; '+diff.absent.length+' no longer in this sample, compared with '+new Date(previous().capturedAt).toLocaleString()+'. Absence may reflect the rolling window or result limit.':'Save a snapshot to establish a comparison. We have not collected an earlier baseline for this selection.'));
   const capture=el('button','Save snapshot');capture.disabled=!report||!!archive;capture.onclick=saveSnapshot;content.append(capture);
   content.append(el('h3','On the map · country mentions'));
   const countries=el('div');countries.className='briefing-region-grid';
   for(const c of mentionedCountries(items).slice(0,8)){const b=el('button',c.name+' · '+c.count);b.onclick=()=>focusCountry(c);countries.append(b);}content.append(countries);
   content.append(el('h3','Latest reports'));evidenceCards(items.slice(0,4));
  }
  if(tab==='ask'){
   content.append(el('h3','Ask the evidence'),el('p','Free local headline search with citations. This does not read full articles or generate causal analysis. Ask about a place or topic; use Notes to record your assessment.'));
   const form=el('form'),input=el('input');input.setAttribute('aria-label','Briefing question');input.placeholder='What reports mention Sudan or displacement?';input.value=question;input.maxLength=500;
   const ask=el('button','Find evidence');ask.type='submit';form.append(input,ask);
   form.onsubmit=e=>{e.preventDefault();question=input.value.trim();render();};content.append(form);
   if(question){const matches=findEvidence(question,items);content.append(el('h3','Evidence for: '+question),el('p',matches.length?matches.length+' matching reports in the selected sample. Read the sources before drawing conclusions.':'No supporting headlines found in this sample. That does not establish that nothing happened.'));evidenceCards(matches);}
  }
  if(tab==='history'){
   content.append(el('h3','Your history shelf'),el('p','Manual snapshots stored on this browser: up to 30 collections of 60 headlines. Nothing is collected while the app is closed. This replays news context only, not past aircraft, weather or camera imagery.'));
   const capture=el('button','Save current snapshot');capture.onclick=saveSnapshot;capture.disabled=!report||!!archive;
   const live=el('button','Return to live');live.onclick=()=>{search.value='';load();};content.append(capture,live);
   if(!history.length)content.append(el('p','No snapshots yet. Save one now and compare after the feed changes.'));
   for(const saved of [...history].reverse()){
    const row=el('article'),label=el('button',(REGIONS.find(r=>r.id===saved.region)?.name||saved.region)+' · '+new Date(saved.capturedAt).toLocaleString());
    label.onclick=()=>{generation++;controller?.abort();clearTimeout(timer);refreshButton.disabled=false;archive=saved;region.value=saved.region;topic.value=saved.topic;hours.value=String(saved.hours);search.value='';tab='overview';status.textContent='Historical snapshot selected · automatic news refresh paused';mapRegion();render();};
    const remove=el('button','Delete snapshot');remove.onclick=()=>{history=history.filter(s=>s.id!==saved.id);try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history));}catch{}if(archive?.id===saved.id){archive=null;load();}render();};
    row.append(label,el('p',saved.items.length+' reports · '+(TOPICS[saved.topic]?.name||saved.topic)),remove);content.append(row);
   }
  }
  if(tab==='layers'){
   content.append(el('h3','Build your map'),el('p','News context follows the selected live feed or historical snapshot. Other overlays show their own latest data and update schedules.'));
   const context=el('button',(overlayEnabled?'✓ ':'')+'News country context');context.setAttribute('aria-pressed',String(overlayEnabled));context.onclick=()=>{overlayEnabled=!overlayEnabled;mapRegion();render();};content.append(context);
   const layers=document.querySelectorAll('#data-toggles .data-toggle-btn');
   for(const original of layers){
    const b=el('button',original.getAttribute('aria-label')||original.textContent);b.className='briefing-layer';b.disabled=original.disabled;layerMirrors.set(original,b);b.setAttribute('aria-pressed',String(original.classList.contains('active')));
    b.onclick=()=>original.click();content.append(b);
   }
   const clean=el('button','Clear live layers');clean.onclick=()=>document.getElementById('clear-selected-layers')?.click();content.append(clean);
   const health=el('button','Inspect source health');health.onclick=()=>document.getElementById('source-status-button')?.click();
   const weather=el('button','City Pulse / Storm / Weather');weather.onclick=()=>document.getElementById('live-views-button')?.click();content.append(health,weather);
  }
  if(tab==='feed'){if(current())cards(items);else content.append(el('p','No feed loaded yet.'));}
  if(tab==='saved'){content.append(el('p','Saved locally in this browser. These are archived headlines; they are not refreshed or re-verified.'));cards(filtered(prefs.saved));}
  if(tab==='notes'){
   content.append(el('h3','Your analyst notebook'),el('p','Write hypotheses, assumptions and evidence to check. These notes are yours, not predictions or live intelligence.'));
   const notes=el('textarea');notes.setAttribute('aria-label','Scenario notes');notes.maxLength=6000;notes.rows=12;notes.placeholder='Assessment:\nSupporting sources:\nAlternative explanations:\nUncertainties:\nWhat would change my assessment:\nQuestions for the next briefing:';notes.value=prefs.notes;
   notes.oninput=()=>{prefs.notes=notes.value;persist();};const exportNotes=el('button','Download notes');exportNotes.onclick=()=>download(prefs.notes,'situation-notes.txt');content.append(notes,exportNotes);
  }
  if(tab==='brief'){
   const sources=new Set(items.map(x=>x.source));
   const summary=[r.name+' — '+TOPICS[topic.value].name,items.length+' loaded headlines from '+sources.size+' publisher labels in the selected window.',
    'This summarizes the loaded sample, not all events. Multiple outlets do not establish independent corroboration.',
    'Keywords in loaded headlines: '+headlineKeywords(items).map(([w,n])=>w+' ('+n+')').join(', '),
    'Feed received: '+(current()?new Date(current().receivedAt).toLocaleString():'not loaded')+(current()?.stale?' · STALE':'')+(archive?' · ARCHIVED SNAPSHOT':''),
    ...items.slice(0,10).map(a=>a.title+'\n'+a.source+' · '+a.publishedAt+'\n'+a.url)].join('\n\n');
   const pre=el('div',summary.replace(/^https?:\/\/\S+$/gm,''));pre.className='situation-brief';const exportBrief=el('button','Download briefing');exportBrief.onclick=()=>download(summary+'\n\nCHANGE ASSESSMENT\n'+(diff?diff.added.length+' added headlines; '+diff.absent.length+' absent from this sample. Absence is not resolution.':'No previous matching snapshot.')+'\n\nINFORMATION GAPS\nHeadlines do not establish incident coordinates, severity, causation or independent corroboration. Publication time may differ from event time.\n\nANALYST NOTES (USER AUTHORED)\n'+(prefs.notes||'No assessment recorded.'),'situation-briefing.txt');
   content.append(el('h3','Source briefing'),pre,exportBrief,el('h3','Change assessment'),el('p',diff?diff.added.length+' new headlines compared with the previous matching snapshot. '+diff.absent.length+' absent from this sample; absence is not resolution.':'No earlier matching snapshot available.'),el('h3','Information gaps'),el('p','Headlines do not establish incident coordinates, severity, causation or independent corroboration. Publication time is not necessarily event time. This briefing cannot determine intent or predict outcomes.'),el('h3','Analyst assessment'),el('p',prefs.notes||'Add your assessment, alternatives and evidence to verify in Notes.'));
  }
 }
 async function load(){
  clearTimeout(timer);controller?.abort();controller=new AbortController();const token=++generation,request=controller;
  archive=null;const key=region.value+':'+topic.value+':'+hours.value;
  if(key!==lastKey){report=null;lastKey=key;latestSeen=0;}render();mapRegion();
  refreshButton.disabled=true;status.textContent='Loading public headlines…';
  const deadline=setTimeout(()=>request.abort(),18000);
  try{
   const selected=REGIONS.find(r=>r.id===region.value);
   const u=new URLSearchParams({region:selected.local?'local':region.value,topic:topic.value,hours:hours.value});if(selected.local)u.set('place',selected.name);
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
 watch.onclick=()=>{if(!prefs.watch.includes(region.value)&&prefs.watch.length>=20){status.textContent='20 watched places reached; remove one first.';return;}prefs.watch=prefs.watch.includes(region.value)?prefs.watch.filter(x=>x!==region.value):[...prefs.watch,region.value];persist();renderWatches();};
 fly.onclick=()=>{const r=REGIONS.find(x=>x.id===region.value);viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(r.lon,r.lat,r.id==='world'?22000000:r.local?35000:3500000),duration:1.5});};
 button.onclick=()=>{if(!panel.hidden)return;panel.hidden=false;document.body.classList.add('briefing-room-open');load();};
 close.onclick=()=>{panel.hidden=true;placeRequest?.abort();placeSubmit.disabled=false;document.body.classList.remove('briefing-room-open');generation++;clearTimeout(timer);controller?.abort();mapData.entities.removeAll();viewer.scene.requestRender();};
 const layerObserver=new MutationObserver(()=>{for(const [original,b] of layerMirrors){b.textContent=original.getAttribute('aria-label')||original.textContent;b.disabled=original.disabled;b.setAttribute('aria-pressed',String(original.classList.contains('active')));}});
 const layerPanel=document.getElementById('data-toggles');if(layerPanel)layerObserver.observe(layerPanel,{subtree:true,attributes:true,attributeFilter:['aria-label','disabled','class']});
 window.addEventListener('pagehide',()=>layerObserver.disconnect(),{once:true});
 renderWatches();
 document.addEventListener('gev:open-briefing',()=>button.click());
 if(!location.hash&&!new URLSearchParams(location.search).has('welcome'))button.click();
}
