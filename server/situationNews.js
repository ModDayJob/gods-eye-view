import {REGIONS,TOPICS,cleanArticles,localNewsPlace} from '../src/situationModel.js';
export function situationNewsPlugin({fetchText,parseArticles}){
 const cache=new Map(),pending=new Map();
 async function obtain(region,topic,hours){
  const key=region.id+':'+topic+':'+hours,old=cache.get(key);
  if(old&&Date.now()-old.receivedAt<300000)return {...old,stale:false};
  if(pending.has(key))return pending.get(key);
  if(pending.size>=4)throw new Error('Busy');
  const task=(async()=>{
   try{
    const query=[region.query,(region.id.startsWith('local:')&&topic==='all'?'':TOPICS[topic].query),'when:'+hours+'h'].filter(Boolean).join(' ');
    const params=new URLSearchParams({q:query,hl:'en-US',gl:'US',ceid:'US:en'});
    const xml=await fetchText('https://news.google.com/rss/search?'+params,{timeoutMs:12000,maxBytes:1000000});
    // A valid empty channel is distinct from an upstream error page.
    if(!/<rss[\s>]/i.test(xml)||!/<channel[\s>]/i.test(xml))throw new Error('Invalid feed');
    const result={region:region.id,topic,hours,receivedAt:Date.now(),source:'Google News RSS · publisher headlines',items:cleanArticles(parseArticles(xml,100),Date.now(),hours)};
    cache.set(key,result);while(cache.size>48)cache.delete(cache.keys().next().value);
    return {...result,stale:false};
   }catch(e){if(old&&Date.now()-old.receivedAt<3600000)return {...old,stale:true};throw e;}
   finally{pending.delete(key);}
  })();pending.set(key,task);return task;
 }
 const install=m=>m.use('/api/situation-news',async(req,res)=>{
  const send=(code,body)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  if(req.method!=='GET')return send(405,{error:'GET only'});
  const u=new URL(req.url||'/','http://localhost'),region=u.searchParams.get('region')==='local'?localNewsPlace(u.searchParams.get('place')):REGIONS.find(r=>r.id===(u.searchParams.get('region')||'world')),topic=u.searchParams.get('topic')||'conflict',hours=Number(u.searchParams.get('hours')||24);
  if(!region||!Object.hasOwn(TOPICS,topic)||![6,24,48].includes(hours))return send(400,{error:'Choose a supported region, topic and time window.'});
  try{send(200,await obtain(region,topic,hours));}catch{send(503,{error:'News provider unavailable; retry later.'});}
 });
 return {name:'situation-news',configureServer:s=>{install(s.middlewares);},configurePreviewServer:s=>{install(s.middlewares);}};
}
