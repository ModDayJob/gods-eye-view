import { WORLD_PLACES } from '../src/worldPlaces.js';
export const validPoint = (lat,lon) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat)<=90 && Math.abs(lon)<=180;
export function normalizeDisasters(data) {
  if (!Array.isArray(data?.features)) throw new Error('Invalid disaster feed');
  return data.features.flatMap(f => {
    let c = f.geometry?.coordinates; if (Array.isArray(c?.[0])) c=c[0];
    const p=f.properties||{};
    if (f.geometry?.type!=='Point' || !validPoint(c?.[1],c?.[0])) return [];
    return [{id:`${p.eventtype}-${p.eventid}`,lat:c[1],lon:c[0],name:String(p.title||'Disaster report'),
      type:p.eventtype,level:p.alertlevel,time:p.todate,description:String(p.description||'').slice(0,1500)}];
  }).filter(x=>['TC','FL','DR','WF','VO'].includes(x.type))
    .sort((a,b)=>Number(a.type==='WF')-Number(b.type==='WF'))
    .slice(0,300);
}
export function normalizeRadar(raw) {
  if(raw?.host!=='https://tilecache.rainviewer.com'||!Array.isArray(raw?.radar?.past))throw new Error('Invalid radar feed');
  const frames=raw.radar.past.filter(f=>Number.isInteger(f.time)&&f.time>0&&/^\/v2\/radar\/[a-zA-Z0-9_-]{1,64}$/.test(f.path))
    .sort((a,b)=>a.time-b.time).slice(-13).map(({time,path})=>({time,path}));
  if(!frames.length)throw new Error('Empty radar feed');
  return {source:'RainViewer',host:raw.host,frames};
}
export function normalizeTransit(data) {
  if (!Array.isArray(data?.data)) throw new Error('Invalid transit feed');
  return data.data.flatMap(v => {
    const a=v.attributes||{};
    if (!validPoint(a.latitude,a.longitude)) return [];
    return [{id:v.id,lat:a.latitude,lon:a.longitude,name:`${v.relationships?.route?.data?.id||'Transit'} · ${a.label||v.id}`,
      time:a.updated_at,status:a.current_status}];
  }).slice(0,200);
}
export function liveViewsPlugin({fetchJson}) {
  const cache=new Map(), pending=new Map();
  async function obtain(key,ttl,job) {
    const old=cache.get(key);
    if(old && Date.now()-old.receivedAt<ttl) return {...old,stale:false};
    if(pending.has(key)) return pending.get(key);
    if(pending.size>=4) throw new Error('Busy');
    const task=(async()=>{
      try {
        const result={...await job(),receivedAt:Date.now()};cache.set(key,result);
        while(cache.size>80) cache.delete(cache.keys().next().value);
        return {...result,stale:false};
      } catch(e) {
        if(old && Date.now()-old.receivedAt<3600000) return {...old,stale:true};
        throw e;
      } finally {pending.delete(key);}
    })();
    pending.set(key,task); return task;
  }
  const install=middlewares=>middlewares.use('/api/live-views',async(req,res)=>{
    const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
    if(req.method!=='GET') return send(405,{error:'GET only'});
    const u=new URL(req.url||'/','http://localhost');
    try {
      if(u.pathname==='/radar') return send(200,await obtain('radar',300000,async()=>normalizeRadar(await fetchJson('https://api.rainviewer.com/public/weather-maps.json',{timeoutMs:15000,maxBytes:100000}))));
      if(u.pathname==='/disasters') return send(200,await obtain('disasters',360000,async()=>({source:'GDACS',kind:'Published disaster reports · up to 300; cyclone/flood/drought/volcano reports prioritized over wildfire overflow',items:normalizeDisasters(await fetchJson('https://www.gdacs.org/contentdata/xml/gdacsAPP_Home.geojson',{timeoutMs:15000,maxBytes:2000000}))})));
      if(u.pathname==='/transit') return send(200,await obtain('transit',30000,async()=>({source:'MBTA',kind:'Reported vehicle positions · Boston only · up to 200 vehicles',items:normalizeTransit(await fetchJson('https://api-v3.mbta.com/vehicles?page%5Blimit%5D=200',{timeoutMs:15000,maxBytes:2000000}))})));
      if(u.pathname==='/weather') {
        const world=u.searchParams.get('world')==='1';
        const lat=Number(u.searchParams.get('lat')),lon=Number(u.searchParams.get('lon'));
        if(!world && (!u.searchParams.has('lat')||!u.searchParams.has('lon')||!validPoint(lat,lon))) return send(400,{error:'Valid coordinates required'});
        const points=world?WORLD_PLACES:[{name:'Selected location',lat:Math.round(lat*100)/100,lon:Math.round(lon*100)/100}];
        const key=world?'weather-world':`weather-${points[0].lat}-${points[0].lon}`;
        return send(200,await obtain(key,600000,async()=>{
          const q=new URLSearchParams({latitude:points.map(p=>p.lat).join(','),longitude:points.map(p=>p.lon).join(','),current:'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',daily:'temperature_2m_max,temperature_2m_min,precipitation_probability_max',forecast_days:'3',timezone:'GMT'});
          const raw=await fetchJson(`https://api.open-meteo.com/v1/forecast?${q}`,{timeoutMs:15000,maxBytes:1000000});
          const rows=Array.isArray(raw)?raw:[raw];
          if(rows.length!==points.length||rows.some(r=>!r.current)) throw new Error('Incomplete weather');
          return {source:'Open-Meteo · CC BY 4.0',kind:'Model-based current conditions and forecasts · not station observations',items:rows.map((r,i)=>({...points[i],current:r.current,daily:r.daily,units:r.current_units}))};
        }));
      }
      send(404,{error:'Unknown feed'});
    }catch{send(503,{error:'Provider unavailable. Retry later; no empty success substituted.'});}
  });
  return {name:'live-views',configureServer:s=>{install(s.middlewares);},configurePreviewServer:s=>{install(s.middlewares);}};
}
