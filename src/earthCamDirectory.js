// Curated official viewing pages checked 2026-09-09. Coordinates identify
// approximate landmarks, not calibrated camera positions or live coverage.
export const EARTHCAM_LOCATIONS = Object.freeze([
 {id:'abbey-road',name:'Abbey Road Crossing',city:'London',country:'United Kingdom',lat:51.532,lon:-0.1778,url:'https://www.earthcam.com/world/england/london/abbeyroad/?cam=abbeyroad_uk'},
 {id:'times-square',name:'Times Square',city:'New York',country:'United States',lat:40.758,lon:-73.9855,url:'https://www.earthcam.com/usa/newyork/timessquare/'},
 {id:'temple-bar',name:'Temple Bar',city:'Dublin',country:'Ireland',lat:53.3456,lon:-6.2643,url:'https://www.earthcam.com/world/ireland/dublin/?cam=templebar'},
 {id:'bourbon-street',name:'Bourbon Street',city:'New Orleans',country:'United States',lat:29.9587,lon:-90.0657,url:'https://www.earthcam.com/cams/louisiana/neworleans/bourbonstreet/'},
 {id:'news-cafe',name:'Ocean Drive · News Cafe',city:'Miami Beach',country:'United States',lat:25.777,lon:-80.1319,url:'https://www.earthcam.com/usa/florida/miami/'},
].map(Object.freeze));
export function earthCamDistanceKm(entry, center) {
 if(!center || !Number.isFinite(center.lat) || !Number.isFinite(center.lon)) return Infinity;
 const rad=x=>x*Math.PI/180;
 const a=Math.sin(rad(entry.lat-center.lat)/2)**2+Math.cos(rad(center.lat))*Math.cos(rad(entry.lat))*Math.sin(rad(entry.lon-center.lon)/2)**2;
 return 12742*Math.asin(Math.sqrt(Math.min(1,Math.max(0,a))));
}
export function findEarthCamLocations(query='',center=null) {
 const q=query.trim().toLowerCase();
 return EARTHCAM_LOCATIONS.filter(e=>`${e.name} ${e.city} ${e.country}`.toLowerCase().includes(q))
 .map(e=>({...e,distanceKm:earthCamDistanceKm(e,center)}))
 .sort((a,b)=>a.distanceKm-b.distanceKm||a.city.localeCompare(b.city));
}
