import { settleLimited } from './limitedWork.js';
import { sourceHealth, createHealthJournal } from './sourceHealth.js';

const CADENCE = {
  flights: '30s snapshots · motion interpolated with a delay',
  military: '15s snapshots · motion interpolated',
  earthquakes: '60s · detections can be delayed by USGS',
  satellites: 'Orbits propagated continuously from published elements',
  'rocket-launches': '5 min · mission metadata; ascent may be reconstructed',
  'ais-live-vessels': '10s local snapshots of the live AIS stream',
  traffic: 'Live flow with a key; simulated vehicles otherwise',
  cctv: 'Active frames about every 10s · coverage varies by camera',
  radio: 'Station stream when played; directory refreshed separately',
  bikeshare: 'Station availability snapshots; operator cadence varies',
  'military-installations': 'Mapped reference data; cached, not live activity',
  'local-datacenters': 'Bundled reference data',
  'local-dams': 'Bundled reference data',
  'telegeography-submarine-cables': 'Bundled reference data',
  'local-firms': 'Satellite fire detections, not continuous observation',
};

export function sourceStatusText(layer, now = Date.now()) {
  const s = layer.stats || {};
  if (layer.lifecycleState === 'enabling' || s.loading) return 'Connecting…';
  if (!layer.enabled) return 'Off';
  if (['zoom-in', 'empty', 'idle'].includes(s.status) && !s.stale) {
    return s.error?.message || s.error || s.loadingLabel || 'No data in this view';
  }
  const error = s.managerRefreshError || s.error || s.lastError;
  if (error) return `Unavailable / partial: ${error.message || String(error)}`;
  if (s.refreshing) return 'Refreshing…';
  if (!s.lastUpdate) return 'Enabled · waiting for source data';
  const age = Math.max(0, Math.floor((now - new Date(s.lastUpdate).getTime()) / 1000));
  if (!Number.isFinite(age)) return 'Enabled · source time unavailable';
  const state = sourceHealth(layer, now).state;
  const prefix = state === 'nominal' ? '' : `${state.toUpperCase()} · `;
  const coverage = s.coverage ? ` · ${s.coverage}` : '';
  return `${prefix}${s.count ?? 0} items · received ${age < 60 ? `${age}s` : `${Math.floor(age / 60)}m`} ago${coverage}`;
}

export function initSourceStatus({ dataManager }) {
  const trigger = document.createElement('button');
  trigger.id = 'source-status-button';
  trigger.type = 'button';
  trigger.textContent = '◉';
  trigger.title = 'Live source status and free connections';
  trigger.setAttribute('aria-label', 'Live source status and free connections');
  document.getElementById('top-center-actions').append(trigger);
  const dialog = document.createElement('dialog');
  dialog.id = 'source-status-dialog';
  dialog.setAttribute('aria-labelledby', 'source-status-title');
  const heading = document.createElement('h2');
  heading.id = 'source-status-title';
  heading.textContent = 'Live sources & free connections';
  const close = document.createElement('button');
  close.textContent = 'Close';
  close.addEventListener('click', () => dialog.close());
  const intro = document.createElement('p');
  intro.textContent = 'Automatic refresh is active for enabled layers. Receipt time below is when this app fetched data, not when the provider observed it.';
  const refresh = document.createElement('button');
  refresh.textContent = 'Refresh enabled sources';
  const feedback = document.createElement('p');
  feedback.setAttribute('role', 'status');
  const rows = document.createElement('div');
  const journal = createHealthJournal();
  const healthSummary = document.createElement('p');
  healthSummary.setAttribute('role', 'status');
  const download = document.createElement('button');
  download.textContent = 'Download health report';
  const sampleHealth = () => {
    const report = journal.sample(dataManager.getAll().filter(l => l.showInTogglePanel));
    const attention = report.sources.filter(s => s.enabled && ['stale', 'degraded', 'unavailable', 'fallback'].includes(s.state)).length;
    const offline = navigator.onLine === false;
    const message = offline ? 'Network offline · cached data may remain visible' : attention ? `${attention} ${attention === 1 ? 'source needs' : 'sources need'} attention` : 'No reported feed faults';
    trigger.textContent = attention || offline ? `◉ ${attention || '!'}` : '◉';
    trigger.title = `${message} · open source health`;
    trigger.setAttribute('aria-label', trigger.title);
    healthSummary.textContent = `${message}. Checks use existing layer status; no extra provider requests. Observation freshness and camera availability require separate verification.`;
    return { ...report, networkOnline: !offline };
  };
  download.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(sampleHealth(), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gods-eye-health.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  sampleHealth();
  setInterval(sampleHealth, 5000);
  const connections = document.createElement('div');
  let config = null;
  let busy = false;
  let nextRefresh = 0;
  const rowNodes = new Map();
  const sourceRetryAt = new Map();
  const render = () => {
    if (!dialog.open) return;
    for (const layer of dataManager.getAll().filter(l => l.showInTogglePanel)) {
      let nodes = rowNodes.get(layer.id);
      if (!nodes) {
        const row = document.createElement('section'), title = document.createElement('strong'), detail = document.createElement('p'), retry = document.createElement('button');
        retry.textContent = 'Retry this source';
        retry.setAttribute('aria-label', `Retry ${layer.name}`);
        retry.onclick = () => refreshSources([layer.id]);
        row.append(title, detail, retry);rows.append(row);
        nodes = {title,detail,retry};rowNodes.set(layer.id,nodes);
      }
      nodes.title.textContent = `${layer.name} — ${sourceStatusText(layer)}`;
      nodes.detail.textContent = `${sourceHealth(layer).kind}. ${CADENCE[layer.id] || 'Source cadence varies'}`;
      nodes.retry.hidden = !layer.enabled;
      const retryIn = Math.max(0, Math.ceil(((sourceRetryAt.get(layer.id) || 0) - Date.now()) / 1000));
      nodes.retry.textContent = retryIn ? `Retry in ${retryIn}s` : 'Retry this source';
      nodes.retry.disabled = busy || retryIn > 0 || layer.lifecycleState !== 'enabled';
    }
    const remaining = Math.max(0, Math.ceil((nextRefresh - Date.now()) / 1000));
    refresh.disabled = busy || remaining > 0;
    refresh.textContent = busy ? 'Refreshing…' : remaining ? `Refresh available in ${remaining}s` : 'Refresh enabled sources';
  };
  async function refreshSources(ids) {
    if (busy) return;
    ids = ids.filter(id => Date.now() >= (sourceRetryAt.get(id) || 0));
    busy = true;nextRefresh = Date.now() + 60_000;
    for (const id of ids) sourceRetryAt.set(id, nextRefresh);
    render();
    try {
      const results = await settleLimited(ids, id => dataManager.refreshLayer(id), 2);
      const count = results.filter(r => r.status === 'fulfilled' && r.value).length;
      feedback.textContent = ids.length ? `${count} of ${ids.length} sources refreshed. Provider caches and limits still apply.` : 'Enable a layer in Data Layers first.';
    } finally {busy = false;render();}
  }
  refresh.addEventListener('click', () => refreshSources(dataManager.getAll().filter(l => l.enabled).map(l => l.id)));
  const renderConnections = () => {
    connections.replaceChildren();
    const label = document.createElement('h3');
    label.textContent = 'Optional free accounts';
    connections.append(label);
    for (const [key, name, env, url] of [
      ['ships', 'Live ships', 'AISSTREAM_API_KEY', 'https://aisstream.io/'],
      ['fires', 'Fire detections', 'FIRMS_MAP_KEY', 'https://firms.modaps.eosdis.nasa.gov/api/map_key/'],
      ['traffic', 'Real traffic flow', 'TOMTOM_API_KEY', 'https://docs.tomtom.com/pricing'],
    ]) {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.textContent = name;
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      p.append(link, ` — ${config ? config[key] ? 'key present; enable the layer to verify' : `add ${env}` : 'configuration unavailable'}`);
      connections.append(p);
    }
    const help = document.createElement('p');
    help.textContent = 'Put your own free-account keys in the local .env file and restart the launcher. For TomTom, use an account without paid overage; the local limit is 5,000 tiles/day in this setup. Never paste keys into chat.';
    const paid = document.createElement('p');
    paid.textContent = config?.freeOnly
      ? 'Free mode: Google photorealistic imagery and OpenAI voice/AI tools are disabled. OSM imagery is mapped data, not a live satellite image.'
      : 'Google photorealistic imagery and OpenAI voice require separate metered services. OSM imagery is not a live satellite image.';
    connections.append(help, paid);
  };
  dialog.append(heading, close, intro, healthSummary, download, refresh, feedback, rows, connections);
  document.body.append(dialog);
  let timer = null;
  trigger.addEventListener('click', async () => {
    if (dialog.open) return;
    dialog.showModal();
    render();
    renderConnections();
    timer = setInterval(render, 1000);
    try {
      const r = await fetch('/api/free-providers', { signal: AbortSignal.timeout(5000) });
      if (!r.ok) throw new Error('Configuration unavailable');
      config = await r.json();
    } catch { config = null; }
    if (dialog.open) renderConnections();
  });
  dialog.addEventListener('close', () => { clearInterval(timer); timer = null; });
}
