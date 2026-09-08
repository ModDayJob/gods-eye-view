export const PREFERENCES_KEY = 'gods-eye.live-views.v1';
export function cleanPreferences(raw) {
  const favorites = (Array.isArray(raw?.favorites) ? raw.favorites : []).filter(p =>
    typeof p?.name === 'string' && p.name.trim() && Number.isFinite(p.lat) &&
    Number.isFinite(p.lon) && Math.abs(p.lat)<=90 && Math.abs(p.lon)<=180
  ).slice(0,50).map(p=>({name:p.name.slice(0,160),lat:p.lat,lon:p.lon}));
  return {favorites,unit:raw?.unit==='C'?'C':'F',selected:typeof raw?.selected==='string'?raw.selected:'Boston'};
}
export function temperature(value,unit) {
  return Number.isFinite(value) ? `${Math.round(unit==='F'?value*9/5+32:value)}°${unit}` : 'unavailable';
}
