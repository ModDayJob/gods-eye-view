export const REGIONS=[
 {id:'world',name:'Worldwide',query:'',lat:15,lon:0},
 {id:'ukraine',name:'Ukraine',query:'Ukraine',lat:49,lon:32},
 {id:'middle-east',name:'Middle East',query:'(Iran OR Israel OR Lebanon OR Yemen)',lat:29,lon:43},
 {id:'sudan',name:'Sudan',query:'Sudan',lat:15,lon:30},
 {id:'europe',name:'Europe',query:'Europe',lat:50,lon:12},
 {id:'asia',name:'East Asia',query:'(Taiwan OR China OR Korea)',lat:30,lon:120},
 {id:'africa',name:'Africa',query:'Africa',lat:3,lon:20},
 {id:'americas',name:'Americas',query:'(America OR Brazil OR Mexico)',lat:15,lon:-85}
];
export const TOPICS={
 conflict:{name:'Conflict & diplomacy',query:'(conflict OR ceasefire OR diplomacy OR sanctions)'},
 humanitarian:{name:'Humanitarian',query:'(humanitarian OR displacement OR refugees OR famine)'},
 disaster:{name:'Disasters',query:'(earthquake OR flood OR wildfire OR cyclone)'},
 all:{name:'World headlines',query:'(world OR international)'}
};
export function safeNewsUrl(value){
 try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
export function cleanArticles(rows,now=Date.now(),hours=24){
 const seen=new Set();return (Array.isArray(rows)?rows:[]).flatMap(a=>{
  const url=safeNewsUrl(a.url),time=Date.parse(a.publishedAt);
  if(!url||typeof a.title!=='string'||!a.title.trim()||!Number.isFinite(time)||time>now+300000||time<now-hours*3600000)return [];
  const key=a.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
  if(seen.has(key))return [];seen.add(key);
  return [{id:url,title:a.title.trim().slice(0,240),url,publishedAt:new Date(time).toISOString(),source:String(a.domain||new URL(url).hostname).slice(0,120)}];
 }).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,60);
}
export function headlineKeywords(items){
 const stop=new Set('about after amid been before between could from have into more over says said than that their there these they this through under were what when where which while will with would world news live'.split(' '));
 const counts=new Map();
 for(const item of items)for(const word of new Set(item.title.toLowerCase().match(/[a-z]{4,}/g)||[]))if(!stop.has(word))counts.set(word,(counts.get(word)||0)+1);
 return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,8);
}
export const COUNTRY_CONTEXT=[
 ['Ukraine',49,32],['Russia',60,90],['Iran',32,54],['Israel',31.5,34.8],
 ['Lebanon',33.9,35.9],['Yemen',15.5,47.5],['Sudan',15,30],['Taiwan',23.7,121],
 ['China',35,104],['Japan',36,138],['Jordan',31,36],['Bahrain',26,50.5],
 ['Saudi Arabia',24,45],['United States',39,-98],['France',47,2],['Germany',51,10],
 ['India',22,79],['Pakistan',30,70],['Myanmar',21,96],['Nigeria',9,8],
 ['Ethiopia',9,40],['Somalia',5,46],['Mexico',23,-102],['Brazil',-10,-52]
].map(([name,lat,lon])=>({name,lat,lon}));
export function mentionedCountries(items){
 return COUNTRY_CONTEXT.map(c=>({...c,count:items.filter(a=>new RegExp('\\b'+c.name+'\\b','i').test(a.title)).length})).filter(c=>c.count>0).sort((a,b)=>b.count-a.count);
}
