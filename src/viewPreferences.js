import * as Cesium from 'cesium';
import { flyToAustin } from './camera.js';
import { START_CITIES, normalizeViewPreferences, renderingProfile } from './viewPreferencesModel.js';
const KEY='gev.view-comfort.v1';
function readPreferences(){try{return normalizeViewPreferences(JSON.parse(localStorage.getItem(KEY)));}catch{return normalizeViewPreferences();}}
function goToOpening(viewer,prefs){
 if(viewer.trackedEntity)viewer.trackedEntity=undefined;
 viewer.camera.cancelFlight();
 if(prefs.opening==='default'){flyToAustin(viewer);return;}
 const city=START_CITIES.find(c=>c.id===prefs.city)||START_CITIES[0];
 viewer.camera.setView({destination:Cesium.Cartesian3.fromDegrees(city.lon,city.lat,18000),
  orientation:{heading:0,pitch:-Math.PI/2,roll:0}});
}
/** Called instead of the default animation, never after it or over a shared link. */
export function applyOpeningView(viewer){goToOpening(viewer,readPreferences());}
export function initViewPreferences({viewer}) {
 let prefs=readPreferences();
 const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 const dialog=el('dialog');dialog.className='view-preferences';dialog.setAttribute('aria-label','View and startup');
 const launch=el('button','View');launch.id='view-preferences-button';launch.title='Performance and opening location';document.getElementById('top-center-actions')?.append(launch);
 const close=el('button','Done'),status=el('p');status.setAttribute('role','status');
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));return true;}catch{status.textContent='Browser storage is unavailable; settings last only for this session.';return false;}};
 const select=(label,choices,value)=>{const l=el('label',label),s=el('select');s.setAttribute('aria-label',label);for(const [v,t] of choices){const o=el('option',t);o.value=v;s.append(o);}s.value=value;l.append(s);return {l,s};};
 const quality=select('Rendering quality',[['balanced','Balanced · 30 fps'],['detail','Detailed · 60 fps'],['light','Light · 20 fps']],prefs.quality);
 const opening=select('When opening the app',[['default','Original default · Austin'],['city','My chosen city']],prefs.opening);
 const city=select('Opening city',START_CITIES.map(c=>[c.id,c.name]).sort((a,b)=>a[1].localeCompare(b[1])),prefs.city);
 const sync=()=>{city.l.hidden=prefs.opening!=='city';};
 const applyQuality=()=>{const p=renderingProfile(prefs.quality);viewer.targetFrameRate=p.fps;viewer.resolutionScale=p.scale;viewer.scene.requestRender();};
 quality.s.onchange=()=>{prefs.quality=quality.s.value;applyQuality();if(persist())status.textContent='Rendering preference saved.';};
 opening.s.onchange=()=>{prefs.opening=opening.s.value;sync();if(persist())status.textContent='Opening preference saved.';};
 city.s.onchange=()=>{prefs.city=city.s.value;if(persist())status.textContent='Opening city saved.';};
 const preview=el('button','Go to opening view');preview.onclick=()=>{goToOpening(viewer,prefs);dialog.close();};
 dialog.append(el('h2','Make the view yours'),quality.l,opening.l,city.l,
 el('p','Opens at a consistent location. Shared links and reloads of a map URL keep the view in that link. Open the app’s base address to use your saved default.'),preview,status,close);
 document.body.append(dialog);close.onclick=()=>dialog.close();launch.onclick=()=>dialog.showModal();sync();applyQuality();
 // Save the migration once; old last-place settings no longer drive startup.
 persist();
}
