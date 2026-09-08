import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDisasters,normalizeTransit,liveViewsPlugin} from './liveViews.js';
test('disaster parser accepts published nested points and rejects invalid coordinates',()=>{
  const feature={geometry:{type:'Point',coordinates:[[10,20]]},properties:{eventid:1,eventtype:'TC',title:'Storm'}};
  assert.equal(normalizeDisasters({features:[feature]})[0].lat,20);
  assert.equal(normalizeDisasters({features:[{...feature,geometry:{type:'Point',coordinates:[10,100]}}]}).length,0);
  assert.throws(()=>normalizeDisasters({}));
});
test('transit retains observation timestamp and rejects missing positions',()=>{
  const data={data:[{id:'1',attributes:{latitude:42,longitude:-71,updated_at:'2026-09-06T00:00:00Z'}},{id:'2',attributes:{}}]};
  const out=normalizeTransit(data);assert.equal(out.length,1);assert.equal(out[0].time,'2026-09-06T00:00:00Z');
});
function harness(fetchJson){let handler;liveViewsPlugin({fetchJson}).configureServer({middlewares:{use:(_,fn)=>handler=fn}});return(url,method='GET')=>new Promise(resolve=>{let status;handler({url,method},{writeHead:s=>status=s,end:s=>resolve({status,body:JSON.parse(s)})});});}
test('requests are validated, coalesced and cached without exposing raw failures',async()=>{
  let calls=0;const request=harness(async()=>{calls++;await new Promise(r=>setTimeout(r,5));return{data:[]};});
  assert.equal((await request('/weather?lat=999&lon=0')).status,400);
  assert.equal((await request('/weather')).status,400);
  assert.equal((await request('/transit','POST')).status,405);
  const results=await Promise.all([request('/transit'),request('/transit')]);
  assert.equal(calls,1);assert.equal(results[0].status,200);assert.equal(results[0].body.stale,false);
  await request('/transit');assert.equal(calls,1);
  const bad=harness(async()=>{throw new Error('secret upstream key');});
  const failure=await bad('/transit');assert.equal(failure.status,503);assert.ok(!JSON.stringify(failure).includes('secret'));
});
test('Vite setup returns no accidental post-install middleware hook',()=>{
  const connect=()=>{};
  const plugin=liveViewsPlugin({fetchJson:async()=>({})});
  assert.equal(plugin.configureServer({middlewares:{use:()=>connect}}),undefined);
  assert.equal(plugin.configurePreviewServer({middlewares:{use:()=>connect}}),undefined);
});
test('expired cache survives provider outage only with an explicit stale flag',async()=>{
  const realNow=Date.now;let now=100000,fail=false;
  Date.now=()=>now;
  try {
    const request=harness(async()=>{if(fail)throw new Error('offline');return{data:[]};});
    const first=await request('/transit');assert.equal(first.body.stale,false);
    now+=31000;fail=true;
    const old=await request('/transit');assert.equal(old.status,200);assert.equal(old.body.stale,true);assert.equal(old.body.receivedAt,100000);
    now+=3600001;assert.equal((await request('/transit')).status,503);
  }finally{Date.now=realNow;}
});
test('radar accepts only the documented host and frame paths',async()=>{
 const {normalizeRadar}=await import('./liveViews.js');
 const raw={host:'https://tilecache.rainviewer.com',radar:{past:[{time:100,path:'/v2/radar/100'}]}};
 assert.equal(normalizeRadar(raw).frames.length,1);
 assert.throws(()=>normalizeRadar({...raw,host:'https://example.com'}));
 assert.throws(()=>normalizeRadar({...raw,radar:{past:[{time:100,path:'/v2/radar/../200'}]}}));
 const request=harness(async()=>raw);assert.equal((await request('/radar')).status,200);
});
