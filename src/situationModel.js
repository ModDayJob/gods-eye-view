export const REGIONS=[
 {id:'world',name:'Worldwide',query:'',lat:15,lon:0},
 {id:'united-states',name:'United States',query:'("United States" OR USA)',lat:39,lon:-98},
 {id:'russia',name:'Russia',query:'Russia',lat:60,lon:90},
 {id:'eu',name:'European Union (EU)',query:'"European Union"',lat:50.85,lon:4.35},
 {id:'ukraine',name:'Ukraine',query:'Ukraine',lat:49,lon:32},
 {id:'middle-east',name:'Middle East',query:'(Iran OR Israel OR Lebanon OR Yemen)',lat:29,lon:43},
 {id:'sudan',name:'Sudan',query:'Sudan',lat:15,lon:30},
 {id:'europe',name:'Europe',query:'Europe',lat:50,lon:12},
 {id:'asia',name:'East Asia',query:'(Taiwan OR China OR Korea)',lat:30,lon:120},
 {id:'africa',name:'Africa',query:'Africa',lat:3,lon:20},
 {id:'americas',name:'Americas',query:'(America OR Brazil OR Mexico)',lat:15,lon:-85}
];
const COUNTRIES=[
 ['canada','Canada',56,-106],['mexico','Mexico',23,-102],['brazil','Brazil',-10,-52],['argentina','Argentina',-34,-64],
 ['united-kingdom','United Kingdom',54,-2],['france','France',47,2],['germany','Germany',51,10],['italy','Italy',42,12],['spain','Spain',40,-4],
 ['poland','Poland',52,20],['norway','Norway',62,10],['sweden','Sweden',62,15],['finland','Finland',64,26],['turkey','Turkey',39,35],
 ['china','China',35,104],['taiwan','Taiwan',23.7,121],['japan','Japan',36,138],['south-korea','South Korea',36,128],['north-korea','North Korea',40,127],
 ['india','India',22,79],['pakistan','Pakistan',30,70],['bangladesh','Bangladesh',24,90],['indonesia','Indonesia',-2,118],['philippines','Philippines',12,122],
 ['australia','Australia',-25,134],['new-zealand','New Zealand',-41,174],['iran','Iran',32,54],['israel','Israel',31.5,34.8],['lebanon','Lebanon',33.9,35.9],
 ['syria','Syria',35,38],['iraq','Iraq',33,44],['yemen','Yemen',15.5,47.5],['saudi-arabia','Saudi Arabia',24,45],['uae','United Arab Emirates',24,54],
 ['egypt','Egypt',27,30],['south-africa','South Africa',-29,24],['nigeria','Nigeria',9,8],['kenya','Kenya',1,38],['ethiopia','Ethiopia',9,40],['somalia','Somalia',5,46]
];
REGIONS.push(...COUNTRIES.map(([id,name,lat,lon])=>({id,name,lat,lon,query:'"'+name+'"'})));

/** Literal place names only; no provider query syntax or arbitrary URLs. */
export function localNewsPlace(value){
 if(typeof value!=='string')return null;
 const name=value.trim().replace(/\s+/g,' ');
 if(name.length<2||name.length>120||!/[\p{L}]/u.test(name)||!/^[-\p{L}\p{N} ,.'’()]+$/u.test(name))return null;
 return {id:'local:'+name.toLowerCase(),name,query:name.split(',').map(s=>s.trim()).filter(Boolean).map(s=>'"'+s+'"').join(' ')};
}
export const TOPICS={
 conflict:{name:'Conflict & diplomacy',query:'(conflict OR ceasefire OR diplomacy OR sanctions)'},
 humanitarian:{name:'Humanitarian',query:'(humanitarian OR displacement OR refugees OR famine)'},
 disaster:{name:'Disasters',query:'(earthquake OR flood OR wildfire OR cyclone)'},
 all:{name:'All news',query:'(world OR international)'}
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
