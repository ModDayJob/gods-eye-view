import * as Cesium from 'cesium';
import { WORLD_PLACES } from './worldPlaces.js';
import { findFreePlace } from './freeGeocode.js';
import { cleanPreferences, PREFERENCES_KEY, temperature } from './liveViewPreferences.js';
import { createWeatherRadar } from './weatherRadar.js';

export function initLiveViews({viewer,dataManager}) {
  const data=new Cesium.CustomDataSource('Live views'); viewer.dataSources.add(data);
  const button=document.createElement('button');button.textContent='◈';button.id='live-views-button';
  button.title='City Pulse, Storm Watch & World Weather';button.setAttribute('aria-label',button.title);
  document.getElementById('top-center-actions').append(button);
  const panel=document.createElement('section');panel.id='live-views-panel';panel.hidden=true;
  panel.setAttribute('aria-label','Live map views');
  const title=document.createElement('h2');title.textContent='Live map views';
  const close=document.createElement('button');close.textContent='Stop & close';
  const focus=document.createElement('button');focus.textContent='Focus map';
  let pausedLayers=[];
  focus.onclick=async()=>{
    focus.disabled=true;close.disabled=true;
    if(pausedLayers.length){await Promise.allSettled(pausedLayers.map(id=>dataManager.setEnabled(id,true,{origin:'user'})));pausedLayers=[];focus.textContent='Focus map';}
    else{pausedLayers=dataManager.getAll().filter(l=>l.enabled).map(l=>l.id);await Promise.allSettled(pausedLayers.map(id=>dataManager.setEnabled(id,false,{origin:'user'})));focus.textContent='Restore other layers';}
    focus.disabled=false;close.disabled=false;
  };
  const mode=document.createElement('select');mode.setAttribute('aria-label','Live view');
  for(const [value,label] of [['city','City Pulse'],['storm','Storm Watch'],['weather','Weather around the world']]) {const o=document.createElement('option');o.value=value;o.textContent=label;mode.append(o);}
  let prefs;try{prefs=cleanPreferences(JSON.parse(localStorage.getItem(PREFERENCES_KEY)));}catch{prefs=cleanPreferences();}
  const persist=()=>{try{localStorage.setItem(PREFERENCES_KEY,JSON.stringify(prefs));}catch{status.textContent='Browser storage unavailable; changes last for this session only.';}};
  let custom=null;
  const places=()=>[...prefs.favorites,...WORLD_PLACES.filter(p=>!prefs.favorites.some(f=>f.name===p.name)),...(custom&&!prefs.favorites.some(f=>f.name===custom.name)&&!WORLD_PLACES.some(f=>f.name===custom.name)?[custom]:[])];
  const selected=()=>places().find(p=>p.name===city.value)||WORLD_PLACES.find(p=>p.name==='Boston');
  const city=document.createElement('select');city.setAttribute('aria-label','View city');
  function populate(name=prefs.selected){city.replaceChildren();for(const p of places()){const o=document.createElement('option');o.value=p.name;o.textContent=(prefs.favorites.some(f=>f.name===p.name)?'★ ':'')+p.name;city.append(o);}city.value=places().some(p=>p.name===name)?name:'Boston';}
  populate();
  const favorite=document.createElement('button');
  const favoriteLabel=()=>{favorite.textContent=prefs.favorites.some(p=>p.name===city.value)?'★ Remove favorite':'☆ Save favorite city';};
  favoriteLabel();
  favorite.onclick=()=>{const p=selected();if(prefs.favorites.some(f=>f.name===p.name)){prefs.favorites=prefs.favorites.filter(f=>f.name!==p.name);custom=p;}else{if(prefs.favorites.length>=50){status.textContent='You can save up to 50 cities. Remove a favorite first.';return;}prefs.favorites.push(p);}prefs.selected=p.name;persist();populate(p.name);favoriteLabel();};
  const units=document.createElement('select');units.setAttribute('aria-label','Temperature units');
  for(const [value,label] of [['F','Fahrenheit (°F)'],['C','Celsius (°C)']]){const o=document.createElement('option');o.value=value;o.textContent=label;units.append(o);}units.value=prefs.unit;
  units.onchange=()=>{prefs.unit=units.value;persist();if(lastReport)render(lastReport);};
  const hazard=document.createElement('select');hazard.setAttribute('aria-label','Hazard filter');
  const hazardNames={TC:'Cyclones',FL:'Floods',DR:'Droughts',WF:'Wildfires',VO:'Volcanoes'};
  for(const [value,label] of [['all','All hazards'],...Object.entries(hazardNames)]){const o=document.createElement('option');o.value=value;o.textContent=label;hazard.append(o);}
  hazard.onchange=()=>{if(lastReport)render(lastReport);};
  const legend=document.createElement('p');legend.textContent='Alert level: red · orange · green. Symbols mark report locations, not affected boundaries. Zoom in for labels.';
  const go=document.createElement('button');go.textContent='Go to city';
  const cameras=document.createElement('button');cameras.textContent='Browse cameras';cameras.onclick=()=>document.getElementById('camera-browser-button')?.click();
  const layers=document.createElement('button');layers.textContent='Enable city layers';
  layers.onclick=async()=>{
    layers.disabled=true;
    const result=await Promise.allSettled(['traffic','cctv','bikeshare'].map(id=>dataManager.setEnabled(id,true,{origin:'user'})));
    status.textContent=result.every(r=>r.status==='fulfilled'&&r.value!==false)?'City layers enabled; local coverage varies.':'Some city layers did not enable; check Source Status.';
    layers.disabled=false;
  };
  const form=document.createElement('form');const query=document.createElement('input');query.placeholder='Find any city or place';query.setAttribute('aria-label','Find city or place');
  const search=document.createElement('button');search.textContent='Find place';form.append(query,search);
  const reset=document.createElement('button');reset.textContent='World overview';
  const status=document.createElement('p');status.setAttribute('role','status');
  const note=document.createElement('p');const list=document.createElement('div');
  const radar=createWeatherRadar(viewer);
  panel.append(title,close,focus,mode,city,go,favorite,form,layers,cameras,units,hazard,legend,radar.element,reset,status,note,list);document.body.append(panel);
  let timer=null,abort=null,generation=0,point=null,lastReport=null,lastKey=null;
  const fly=p=>viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(p.lon,p.lat,mode.value==='city'?18000:300000),duration:1.5});
  function clear(){clearTimeout(timer);abort?.abort();generation++;data.entities.removeAll();viewer.scene.requestRender();}
  function render(report) {
    data.entities.removeAll();list.replaceChildren();
    note.textContent=`${report.source}. ${report.kind}. Received ${new Date(report.receivedAt).toLocaleTimeString()}.${report.stale?' STALE — latest refresh failed.':''}`;
    let items=report.items;
    if(mode.value==='storm') items=items.filter(x=>['TC','FL','DR','WF','VO'].includes(x.type)&&(hazard.value==='all'||x.type===hazard.value));
    status.textContent=`${report.stale?'STALE · ':''}${items.length} ${mode.value==='weather'?'weather locations':mode.value==='city'?'reported transit vehicles':'published hazard reports'}. Select a row to fly there.`;
    if(mode.value==='storm') note.textContent+=' Cyclones, floods, droughts, wildfires and volcanoes. Reports can describe ongoing events, not a complete local warning service.';
    if(mode.value==='weather') note.textContent+=' Global overview samples 18 cities. Search any place for local weather. Times are UTC.';
    const weatherValue=(value,unit)=>value==null?'unavailable':`${value}${unit}`;
    for(const [index,item] of items.entries()) {
      const text=mode.value==='weather'?`${item.name}: ${temperature(item.current.temperature_2m,prefs.unit)} · wind ${weatherValue(item.current.wind_speed_10m,' km/h')}`:item.name;
      const color=mode.value==='weather'?Cesium.Color.SKYBLUE:mode.value==='city'?Cesium.Color.LIME: item.level==='Red'?Cesium.Color.RED:item.level==='Orange'?Cesium.Color.ORANGE:item.level==='Green'?Cesium.Color.GREEN:Cesium.Color.GRAY;
      const symbol={TC:'🌀',FL:'≋',DR:'☀',WF:'♨',VO:'▲'}[item.type]||'!';
      const icon='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="17" fill="#101c30" stroke="${color.toCssColorString()}" stroke-width="3"/><text x="20" y="27" font-size="24" font-family="sans-serif" text-anchor="middle" fill="white">${symbol}</text></svg>`);
      data.entities.add({id:`view-${index}`,name:text,position:Cesium.Cartesian3.fromDegrees(item.lon,item.lat,100),
        point:mode.value==='storm'?undefined:{pixelSize:mode.value==='city'?7:10,color,outlineColor:Cesium.Color.BLACK,outlineWidth:1},
        billboard:mode.value==='storm'?{image:icon,width:32,height:32,scaleByDistance:new Cesium.NearFarScalar(100000,1,20000000,.65)}:undefined,
        label:mode.value==='city'?undefined:{text:mode.value==='weather'?`${item.name} ${temperature(item.current.temperature_2m,prefs.unit)}`:hazardNames[item.type],font:'13px sans-serif',fillColor:Cesium.Color.WHITE,showBackground:true,pixelOffset:new Cesium.Cartesian2(0,-25),distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,mode.value==='storm'?1800000:25000000)}});

      const row=document.createElement('section');const action=document.createElement('button');action.textContent=text;action.onclick=()=>fly(item);row.append(action);
      const details=document.createElement('p');
      if(mode.value==='weather') {
        const daily=item.daily||{};
        details.textContent=`Model time: ${item.current.time} UTC · precipitation ${weatherValue(item.current.precipitation,' mm')}. `+(daily.time||[]).map((t,i)=>`${t}: ${temperature(daily.temperature_2m_min?.[i],prefs.unit)}–${temperature(daily.temperature_2m_max?.[i],prefs.unit)}, precipitation chance ${weatherValue(daily.precipitation_probability_max?.[i],'%')}`).join(' | ');
      } else details.textContent=mode.value==='storm'?`${item.level} · ${item.time} UTC · ${item.description}`:`Observed ${item.time||'time unavailable'} · ${item.status||''}`;
      row.append(details);list.append(row);
    }
    viewer.scene.requestRender();
  }
  async function refresh() {
    clearTimeout(timer);abort?.abort();const token=++generation;abort=new AbortController();
    if(mode.value==='city'&&city.value!=='Boston'){data.entities.removeAll();list.replaceChildren();note.textContent='Cameras, traffic and bikeshare depend on local coverage. The new transit connection currently covers Boston only.';status.textContent='Choose Enable city layers or Browse cameras.';return;}
    const key=mode.value==='city'?'/transit':mode.value==='storm'?'/disasters':point?`/weather?lat=${point.lat}&lon=${point.lon}`:'/weather?world=1';
    status.textContent='Loading public feed…';
    if(lastKey!==key){data.entities.removeAll();list.replaceChildren();lastReport=null;lastKey=key;}
    const request=abort;
    const timeout=setTimeout(()=>request.abort(),20000);
    try {
      const r=await fetch(`/api/live-views${key}`,{signal:request.signal});if(!r.ok)throw new Error('Unavailable');
      const report=await r.json();if(token!==generation||panel.hidden)return;
      if(point&&mode.value==='weather'&&report.items[0])report.items[0].name=point.name;
      lastReport=report;render(report);
    }catch{
      if(token!==generation||panel.hidden)return;
      if(lastReport){render({...lastReport,stale:true});status.textContent='Refresh failed · retained previous data marked STALE.';}
      else{status.textContent='Provider unavailable. Automatic retry will continue while this view is open.';note.textContent='No current data verified.';}
    }finally{
      clearTimeout(timeout);
      if(token===generation&&!panel.hidden)timer=setTimeout(refresh,mode.value==='city'?30000:mode.value==='storm'?360000:600000);
    }
  }
  function switchMode(){clear();point=null;lastReport=null;lastKey=null;note.textContent='';form.hidden=mode.value==='storm';units.hidden=mode.value!=='weather';hazard.hidden=legend.hidden=mode.value!=='storm';radar.setActive(mode.value!=='city');layers.hidden=cameras.hidden=mode.value!=='city';reset.hidden=mode.value==='city';if(mode.value!=='city')viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(0,15,22000000),duration:1.5});else fly(selected());refresh();}
  mode.onchange=switchMode;
  go.onclick=()=>{const p=selected();prefs.selected=p.name;persist();favoriteLabel();fly(p);if(mode.value==='weather'){point=p;refresh();}else if(mode.value==='city')refresh();};
  city.onchange=()=>go.click();
  reset.onclick=()=>{point=null;viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(0,15,22000000),duration:1.5});refresh();};
  form.onsubmit=async e=>{e.preventDefault();if(!query.value.trim())return;clear();const token=generation;search.disabled=true;status.textContent='Finding place…';try{const p=await findFreePlace(query.value.trim());if(token!==generation||panel.hidden)return;if(!p){status.textContent='Place not found.';return;}custom={name:p.primaryName||p.label,lat:p.lat,lon:p.lon};populate(custom.name);favoriteLabel();point=custom;fly(point);refresh();}catch{if(token===generation)status.textContent='Place search unavailable.';}finally{search.disabled=false;}};
  button.onclick=()=>{if(!panel.hidden)return;panel.hidden=false;switchMode();};
  close.onclick=()=>{panel.hidden=true;radar.setActive(false);clear();lastReport=null;lastKey=null;if(pausedLayers.length)focus.click();};
}
