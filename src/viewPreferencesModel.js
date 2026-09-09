/** Reject corrupt coordinates before applying stored camera state. */
export function validLastView(v){
 if(!v||!['lat','lon','height','heading','pitch','roll'].every(k=>Number.isFinite(v[k]))||Math.abs(v.lat)>90||Math.abs(v.lon)>180||v.height<50||v.height>250000)return null;
 if(Math.abs(v.heading)>Math.PI*2||Math.abs(v.pitch)>Math.PI||Math.abs(v.roll)>Math.PI*2)return null;
 return {...v,label:typeof v.label==='string'?v.label.slice(0,120):'last map view'};
}
export function renderingProfile(value){return value==='detail'?{fps:60,scale:1}:value==='light'?{fps:20,scale:0.7}:{fps:30,scale:0.85};}

export const START_CITIES = [
 ['austin','Austin',30.2672,-97.7431],['boston','Boston',42.3601,-71.0589],
 ['chicago','Chicago',41.8781,-87.6298],['dallas','Dallas',32.7767,-96.7970],
 ['denver','Denver',39.7392,-104.9903],['houston','Houston',29.7604,-95.3698],
 ['la','Los Angeles',34.0522,-118.2437],['miami','Miami',25.7617,-80.1918],
 ['nyc','New York',40.7128,-74.0060],['sf','San Francisco',37.7749,-122.4194],
 ['seattle','Seattle',47.6062,-122.3321],['dc','Washington DC',38.9072,-77.0369],
 ['london','London',51.5074,-0.1278],['paris','Paris',48.8566,2.3522],
 ['berlin','Berlin',52.5200,13.4050],['rome','Rome',41.9028,12.4964],
 ['moscow','Moscow',55.7558,37.6173],['kyiv','Kyiv',50.4501,30.5234],
 ['tokyo','Tokyo',35.6762,139.6503],['singapore','Singapore',1.3521,103.8198],
 ['sydney','Sydney',-33.8688,151.2093],['dubai','Dubai',25.2048,55.2708],
 ['delhi','New Delhi',28.6139,77.2090],['toronto','Toronto',43.6532,-79.3832],
 ['mexico','Mexico City',19.4326,-99.1332],['sao-paulo','São Paulo',-23.5505,-46.6333],
 ['cairo','Cairo',30.0444,31.2357],['cape-town','Cape Town',-33.9249,18.4241],
].map(([id,name,lat,lon])=>({id,name,lat,lon}));
/** Retire automatic last-camera restoration while retaining rendering preferences. */
export function normalizeViewPreferences(p={}) {
 return {quality:['balanced','detail','light'].includes(p?.quality)?p.quality:'balanced',
 opening:p?.opening==='city'?'city':'default',
 city:START_CITIES.some(c=>c.id===p?.city)?p.city:'austin'};
}
