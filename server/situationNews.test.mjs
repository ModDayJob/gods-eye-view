import {test} from 'node:test';import assert from 'node:assert/strict';
import {situationNewsPlugin} from './situationNews.js';
function harness(fetchText){let handler;situationNewsPlugin({fetchText,parseArticles:()=>[]}).configureServer({middlewares:{use:(_,f)=>handler=f}});return url=>new Promise(resolve=>{let code;handler({method:'GET',url},{writeHead:value=>{code=value;},end:s=>resolve({code,body:JSON.parse(s)})});});}
test('news validates choices, coalesces requests and rejects upstream error pages',async()=>{
 let calls=0;const request=harness(async()=>{calls++;await new Promise(r=>setTimeout(r,5));return '<rss><channel></channel></rss>';});
 assert.equal((await request('/?region=unknown')).code,400);
 const out=await Promise.all([request('/'),request('/')]);assert.equal(calls,1);assert.equal(out[0].body.stale,false);
 const bad=harness(async()=>'<html>error</html>');assert.equal((await bad('/')).code,503);
});
