import { findEarthCamLocations } from './earthCamDirectory.js';
import { createEarthCamMap } from './earthCamMap.js';
// One selected stream at a time. Closed dialogs own no media requests.
const REGIONS = {1:'North Coast',2:'Redding / Northeast California',3:'Sacramento region',4:'San Francisco Bay Area',5:'Central Coast',6:'Fresno / Central Valley',7:'Los Angeles region',8:'San Bernardino / Riverside',9:'Eastern Sierra',10:'Stockton region',11:'San Diego region',12:'Orange County'};
const cityGroup = source => source.provider === 'Caltrans'
  ? REGIONS[Number(String(source.cityId).replace('ca-d',''))] || source.city : source.city;
export function nearestCameraForMap(sources, center, maxKm = 75) {
  if (!center || !Number.isFinite(center.lat) || !Number.isFinite(center.lon)) return null;
  const rad = value => value * Math.PI / 180;
  let nearest = null;
  for (const source of sources) {
    if (!Number.isFinite(source.lat) || !Number.isFinite(source.lon) || Math.abs(source.lat)>90 || Math.abs(source.lon)>180) continue;
    const a = Math.sin(rad(source.lat-center.lat)/2)**2 + Math.cos(rad(center.lat))*Math.cos(rad(source.lat))*Math.sin(rad(source.lon-center.lon)/2)**2;
    const km = 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
    if (km <= maxKm && (!nearest || km < nearest.km)) nearest = {source, km};
  }
  return nearest;
}

export function initCameraBrowser({ getMapCenter = () => null, viewer = null } = {}) {
  const button = document.createElement('button');
  button.textContent = '▣';
  button.title = 'Browse camera cities and live video';
  button.setAttribute('aria-label', button.title);
  button.id = 'camera-browser-button';
  document.getElementById('top-center-actions').append(button);
  const dialog = document.createElement('dialog');
  dialog.id = 'camera-browser-dialog';
  dialog.style.cssText = 'margin:auto;width:min(820px,92vw);max-height:85vh;overflow:auto;background:#0b1922;color:#e1edf2;border:1px solid #547783;border-radius:12px;padding:22px';
  dialog.setAttribute('aria-label', 'Camera cities and live video');
  const heading = document.createElement('h2'); heading.textContent = 'Explore cameras';
  const close = document.createElement('button'); close.textContent = 'Close';
  close.onclick = () => dialog.close();
  const info = document.createElement('p');
  info.textContent = 'Public traffic cameras. Choose a city and camera. Live video starts only when you press Play; snapshots are periodically refreshed provider images.';
  const city = document.createElement('select'); city.setAttribute('aria-label', 'Camera city');
  const camera = document.createElement('select'); camera.setAttribute('aria-label', 'Camera location');
  const area = document.createElement('p'); area.setAttribute('role','status'); area.id = 'camera-map-area';
  city.style.cssText = camera.style.cssText = 'max-width:100%;margin:8px;padding:8px';
  const play = document.createElement('button'); play.textContent = 'Play live video';
  const stop = document.createElement('button'); stop.textContent = 'Return to snapshot';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  const video = document.createElement('video'); video.controls = true; video.muted = true; video.playsInline = true;
  const preview = document.createElement('img'); preview.alt = 'Selected public traffic-camera snapshot';
  video.style.cssText = preview.style.cssText = 'width:100%;max-height:52vh;object-fit:contain;background:#000';
  video.hidden = true;
  const credit = document.createElement('p');
  const header = document.createElement('header'); header.className = 'camera-browser-header';
  const titleBlock = document.createElement('div');
  const eyebrow = document.createElement('span'); eyebrow.className = 'camera-browser-eyebrow'; eyebrow.textContent = 'YOUR WORLD · CAMERA DIRECTORY';
  titleBlock.append(eyebrow, heading); header.append(titleBlock, close);
  const navigation = document.createElement('nav'); navigation.className = 'camera-browser-nav'; navigation.setAttribute('aria-label','Camera sources');
  const trafficTab = document.createElement('button'); trafficTab.textContent = 'Traffic & live video';
  const earthTab = document.createElement('button'); earthTab.textContent = 'EarthCam locations ↗';
  navigation.append(trafficTab, earthTab);
  const trafficPanel = document.createElement('section'); trafficPanel.append(info, area, city, camera, play, stop, status, preview, video, credit);
  const earthPanel = document.createElement('section'); earthPanel.id = 'earthcam-directory'; earthPanel.hidden = true;
  const intro = document.createElement('p'); intro.textContent = 'Landmark views, watched on EarthCam. Official pages open in a new tab; availability and playback are managed by the broadcaster.';
  const toolbar = document.createElement('div'); toolbar.className = 'earthcam-toolbar';
  const search = document.createElement('input'); search.type = 'search'; search.placeholder = 'Search city or landmark'; search.setAttribute('aria-label','Search EarthCam locations');
  const pinLabel = document.createElement('label'); const pins = document.createElement('input'); pins.type = 'checkbox'; pins.setAttribute('aria-label','Show EarthCam locations on map'); pinLabel.append(pins,' Show map pins'); toolbar.append(search,pinLabel);
  const coverage = document.createElement('p'); coverage.className = 'earthcam-coverage'; coverage.setAttribute('role','status');
  const cards = document.createElement('div'); cards.className = 'earthcam-cards';
  const footnote = document.createElement('p'); footnote.className = 'earthcam-footnote'; footnote.textContent = 'Curated official pages · approximate landmark locations · no EarthCam video is embedded or rebroadcast. Existing traffic cameras remain available in the first tab.';
  const more = document.createElement('a'); more.href = 'https://www.earthcam.com/'; more.target = '_blank'; more.rel = 'noopener noreferrer'; more.textContent = 'Explore the full EarthCam network ↗';
  earthPanel.append(intro,toolbar,coverage,cards,more,footnote);
  dialog.append(header,navigation,trafficPanel,earthPanel);
  let mode = 'traffic', pinRequest = null;
  const earthMap = createEarthCamMap(viewer,entry=>{search.value=entry.city;pinRequest=entry;if(dialog.open){setMode('earthcam');renderEarthCam()}else button.click()});
  pins.onchange = () => earthMap.show(pins.checked);
  document.getElementById('clear-selected-layers')?.addEventListener('click',()=>{pins.checked=false;earthMap.show(false)});
  function renderEarthCam(){
    const entries = findEarthCamLocations(search.value,getMapCenter()); cards.replaceChildren();
    const nearby = entries.filter(e=>e.distanceKm<=75).length;
    coverage.textContent = !entries.length ? 'No matching locations in this curated list. Explore the full network below.' : `${entries.length} locations · ${nearby ? `${nearby} near your map` : 'none within 75 km of your map'} · nearest first`;
    for(const entry of entries){
      const card=document.createElement('article');card.className='earthcam-card';
      const badge=document.createElement('span');badge.className='earthcam-badge';badge.textContent='EARTHCAM · EXTERNAL PLAYER';
      const title=document.createElement('h3');title.textContent=entry.name;
      const place=document.createElement('p');place.textContent=`${entry.city}, ${entry.country}`;
      const distance=document.createElement('small');distance.textContent=Number.isFinite(entry.distanceKm)?`${Math.max(1,Math.round(entry.distanceKm)).toLocaleString()} km from map center`:'Approximate landmark location';
      const actions=document.createElement('div');actions.className='earthcam-card-actions';
      const watch=document.createElement('a');watch.href=entry.url;watch.target='_blank';watch.rel='noopener noreferrer';watch.textContent='Watch on EarthCam ↗';watch.setAttribute('aria-label',`Watch ${entry.name} on EarthCam (new tab)`);
      const locate=document.createElement('button');locate.textContent='Show on map';locate.onclick=()=>{pins.checked=true;earthMap.focus(entry);dialog.close()};
      actions.append(watch,locate);card.append(badge,title,place,distance,actions);cards.append(card);
    }
  }
  function setMode(next){mode=next;trafficPanel.hidden=mode!=='traffic';earthPanel.hidden=mode!=='earthcam';trafficTab.setAttribute('aria-pressed',String(mode==='traffic'));earthTab.setAttribute('aria-pressed',String(mode==='earthcam'));if(mode==='earthcam'){release();renderEarthCam()}else if(sources.length)snapshot()}
  trafficTab.onclick=()=>setMode('traffic');earthTab.onclick=()=>setMode('earthcam');search.oninput=renderEarthCam;

  document.body.append(dialog);
  let sources = [], hls = null, timer = null, generation = 0, controller = null;
  function release() {
    generation++;
    clearInterval(timer); timer = null;
    hls?.destroy(); hls = null;
    video.pause(); video.removeAttribute('src'); video.load(); video.hidden = true;
    preview.removeAttribute('src'); preview.hidden = true;
  }
  function current() { return sources.find(s => s.id === camera.value); }
  function snapshot() {
    release();
    if (mode !== 'traffic') return;
    const source = current();
    play.disabled = !source?.liveVideoUrl;
    stop.disabled = true;
    if (!source) { credit.textContent = ''; status.textContent = 'Choose an available camera city to browse elsewhere.'; return; }
    credit.textContent = `${source.provider} · ${source.license || 'Public provider feed'} · City areas are approximate.`;
    status.textContent = 'SNAPSHOT · Loading provider image…';
    preview.hidden = false;
    const token = generation;
    preview.onload = () => { if (generation === token) status.textContent = 'SNAPSHOT · Image received. Check the picture timestamp; the provider may return an unavailable-image placeholder.'; };
    preview.onerror = () => { if (generation === token) status.textContent = 'SNAPSHOT · Provider image unavailable. Try another camera.'; };
    const update = () => { if (dialog.open) preview.src = `/api/cctv/frame/${encodeURIComponent(source.id)}?t=${Date.now()}`; };
    update(); timer = setInterval(update, 30000);
  }
  function chooseCity(preferredId) {
    camera.replaceChildren();
    for (const source of sources.filter(s => cityGroup(s) === city.value)) {
      const option = document.createElement('option'); option.value = source.id;
      option.textContent = `${source.liveVideoUrl ? 'VIDEO · ' : ''}${source.name}`;
      camera.append(option);
    }
    camera.disabled = !camera.options.length;
    if (typeof preferredId === 'string') camera.value = preferredId;
    snapshot();
  }
  city.onchange = () => { area.textContent = `Browsing ${city.value || 'available'} cameras. Reopen to match the map again.`; chooseCity(); }; camera.onchange = snapshot; stop.onclick = snapshot;
  play.onclick = async () => {
    const source = current(); if (!source?.liveVideoUrl) return;
    release(); const token = generation;
    video.hidden = false; play.disabled = true; stop.disabled = false;
    status.textContent = 'LIVE VIDEO · Connecting…';
    video.onplaying = () => { if (generation === token) status.textContent = 'LIVE VIDEO · Playing provider stream; broadcast delay varies.'; };
    const fail = () => { if (generation === token) { status.textContent = 'LIVE VIDEO · Stream unavailable. Return to snapshot or choose another camera.'; play.disabled = false; hls?.destroy(); hls = null; video.pause(); } };
    video.onerror = fail;
    try {
      if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = source.liveVideoUrl;
      else {
        const { default: Hls } = await import('hls.js');
        if (generation !== token || !dialog.open) return;
        if (!Hls.isSupported()) { fail(); return; }
        hls = new Hls({ maxBufferLength: 15, backBufferLength: 15 });
        hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) fail(); });
        hls.loadSource(source.liveVideoUrl); hls.attachMedia(video);
      }
      await video.play();
    } catch { fail(); }
  };
  button.onclick = async () => {
    if (dialog.open) return;
    sources = [];
    dialog.showModal();
    if(!pinRequest)search.value='';
    setMode(pinRequest ? 'earthcam' : 'traffic'); pinRequest=null;
    status.textContent = 'Loading camera cities…';
    area.textContent = ''; city.replaceChildren(); camera.replaceChildren(); city.disabled = true; camera.disabled = true;
    const center = getMapCenter();
    play.disabled = true; stop.disabled = true;
    controller = new AbortController();
    const request = controller;
    const timeout = setTimeout(() => request.abort(), 25000);
    try {
      const r = await fetch('/api/cctv/sources', { signal: request.signal });
      if (!r.ok) throw new Error('Catalog unavailable');
      const body = await r.json();
      if (!dialog.open || request.signal.aborted || controller !== request) return;
      sources = Array.isArray(body.sources) ? body.sources : [];
      city.replaceChildren();
      for (const name of [...new Set(sources.map(cityGroup))].sort()) {
        const option = document.createElement('option'); option.value = name;
        option.textContent = `${name} (${sources.filter(s => cityGroup(s) === name).length})`; city.append(option);
      }
      city.disabled = !sources.length;
      const nearest = nearestCameraForMap(sources, center);
      if (nearest) {
        city.value = cityGroup(nearest.source);
        area.textContent = `Near your map: ${city.value} · closest camera ${nearest.km < 1 ? 'under 1' : Math.round(nearest.km)} km away. Coverage depends on the provider.`;
        chooseCity(nearest.source.id);
      } else {
        const empty = document.createElement('option'); empty.value = ''; empty.textContent = 'No nearby coverage — choose another city'; city.prepend(empty); city.value = '';
        area.textContent = center ? 'No cameras in our catalogue within 75 km of this map location. Available cities below are alternatives, not cameras for your selected city.' : 'Map location unavailable. Choose a camera city below.';
        chooseCity();
      }
    } catch { if (dialog.open && controller === request) status.textContent = 'Camera catalog unavailable. Close and reopen to retry.'; }
    finally { clearTimeout(timeout); }
  };
  dialog.addEventListener('close', () => { controller?.abort(); release(); });
}
