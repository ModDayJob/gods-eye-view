import {test} from 'node:test';import assert from 'node:assert/strict';
import {situationNewsPlugin} from './situationNews.js';
function harness(fetchText){let handler;situationNewsPlugin({fetchText,parseArticles:()=>[]}).configureServer({middlewares:{use:(_,f)=>handler=f}});return url=>new Promise(resolve=>{let code;handler({method:'GET',url},{writeHead:value=>{code=value;},end:s=>resolve({code,body:JSON.parse(s)})});});}
test('news validates choices, coalesces requests and rejects upstream error pages',async()=>{
 let calls=0;const request=harness(async()=>{calls++;await new Promise(r=>setTimeout(r,5));return '<rss><channel></channel></rss>';});
 assert.equal((await request('/?region=unknown')).code,400);
 const out=await Promise.all([request('/'),request('/')]);assert.equal(calls,1);assert.equal(out[0].body.stale,false);
 const bad=harness(async()=>'<html>error</html>');assert.equal((await bad('/')).code,503);
});
test('local news uses literal place scope without world-only terms and isolates caches',async()=>{
 const urls=[];const request=harness(async url=>{urls.push(new URL(url));return '<rss><channel></channel></rss>';});
 assert.equal((await request('/?region=local&place=Boston%2C%20Massachusetts&topic=all')).code,200);
 assert.equal((await request('/?region=local&place=Portland%2C%20Maine&topic=all')).code,200);
 assert.equal(urls.length,2);
 assert.equal(urls[0].searchParams.get('q'),'"Boston" "Massachusetts" when:24h');
 assert.equal((await request('/?region=local&place=https://example.com')).code,400);
 assert.equal((await request('/?region=local')).code,400);
 for(const region of ['united-states','russia','eu'])assert.equal((await request('/?region='+region)).code,200);
});
