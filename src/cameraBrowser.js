// One selected stream at a time. Closed dialogs own no media requests.
const REGIONS = {1:'North Coast',2:'Redding / Northeast California',3:'Sacramento region',4:'San Francisco Bay Area',5:'Central Coast',6:'Fresno / Central Valley',7:'Los Angeles region',8:'San Bernardino / Riverside',9:'Eastern Sierra',10:'Stockton region',11:'San Diego region',12:'Orange County'};
const cityGroup = source => source.provider === 'Caltrans'
  ? REGIONS[Number(String(source.cityId).replace('ca-d',''))] || source.city : source.city;
export function initCameraBrowser() {
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
  const heading = document.createElement('h2'); heading.textContent = 'Camera cities & live video';
  const close = document.createElement('button'); close.textContent = 'Close';
  close.onclick = () => dialog.close();
  const info = document.createElement('p');
  info.textContent = 'Public traffic cameras. Choose a city and camera. Live video starts only when you press Play; snapshots are periodically refreshed provider images.';
  const city = document.createElement('select'); city.setAttribute('aria-label', 'Camera city');
  const camera = document.createElement('select'); camera.setAttribute('aria-label', 'Camera location');
  city.style.cssText = camera.style.cssText = 'max-width:100%;margin:8px;padding:8px';
  const play = document.createElement('button'); play.textContent = 'Play live video';
  const stop = document.createElement('button'); stop.textContent = 'Return to snapshot';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  const video = document.createElement('video'); video.controls = true; video.muted = true; video.playsInline = true;
  const preview = document.createElement('img'); preview.alt = 'Selected public traffic-camera snapshot';
  video.style.cssText = preview.style.cssText = 'width:100%;max-height:52vh;object-fit:contain;background:#000';
  video.hidden = true;
  const credit = document.createElement('p');
  dialog.append(heading, close, info, city, camera, play, stop, status, preview, video, credit);
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
    const source = current();
    play.disabled = !source?.liveVideoUrl;
    stop.disabled = true;
    if (!source) { status.textContent = 'No cameras available in this city.'; return; }
    credit.textContent = `${source.provider} · ${source.license || 'Public provider feed'} · City areas are approximate.`;
    status.textContent = 'SNAPSHOT · Loading provider image…';
    preview.hidden = false;
    const token = generation;
    preview.onload = () => { if (generation === token) status.textContent = 'SNAPSHOT · Image received. Check the picture timestamp; the provider may return an unavailable-image placeholder.'; };
    preview.onerror = () => { if (generation === token) status.textContent = 'SNAPSHOT · Provider image unavailable. Try another camera.'; };
    const update = () => { if (dialog.open) preview.src = `/api/cctv/frame/${encodeURIComponent(source.id)}?t=${Date.now()}`; };
    update(); timer = setInterval(update, 30000);
  }
  function chooseCity() {
    camera.replaceChildren();
    for (const source of sources.filter(s => cityGroup(s) === city.value)) {
      const option = document.createElement('option'); option.value = source.id;
      option.textContent = `${source.liveVideoUrl ? 'VIDEO · ' : ''}${source.name}`;
      camera.append(option);
    }
    snapshot();
  }
  city.onchange = chooseCity; camera.onchange = snapshot; stop.onclick = snapshot;
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
    dialog.showModal(); status.textContent = 'Loading camera cities…';
    play.disabled = true; stop.disabled = true;
    controller = new AbortController();
    const request = controller;
    const timeout = setTimeout(() => request.abort(), 25000);
    try {
      const r = await fetch('/api/cctv/sources', { signal: request.signal });
      if (!r.ok) throw new Error('Catalog unavailable');
      const body = await r.json();
      if (!dialog.open || request.signal.aborted) return;
      sources = Array.isArray(body.sources) ? body.sources : [];
      city.replaceChildren();
      for (const name of [...new Set(sources.map(cityGroup))].sort()) {
        const option = document.createElement('option'); option.value = name;
        option.textContent = `${name} (${sources.filter(s => cityGroup(s) === name).length})`; city.append(option);
      }
      chooseCity();
    } catch { if (dialog.open) status.textContent = 'Camera catalog unavailable. Close and reopen to retry.'; }
    finally { clearTimeout(timeout); }
  };
  dialog.addEventListener('close', () => { controller?.abort(); release(); });
}
