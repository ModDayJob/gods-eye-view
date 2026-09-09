import { normalizePhotonPlace } from '../src/freeGeocode.js';

export function freeProviderConfig(env = process.env) {
  const hasKey = key => Boolean(String(env[key] || '').trim());
  return {
    freeOnly: env.GEV_FREE_ONLY === '1',
    ships: hasKey('AISSTREAM_API_KEY'),
    fires: hasKey('FIRMS_MAP_KEY'),
    traffic: hasKey('TOMTOM_API_KEY'),
    imagery: hasKey('CESIUM_ION_TOKEN'),
    voice: env.GEV_FREE_ONLY !== '1' && hasKey('OPENAI_API_KEY'),
    google: env.GEV_FREE_ONLY !== '1' && hasKey('GOOGLE_MAPS_API_KEY'),
  };
}

/** One bounded, cached search on Enter; no background autocomplete traffic. */
export function freeServicesPlugin({ fetchJson } = {}) {
  const cache = new Map();
  const inFlight = new Map();
  let lastRequest = 0;
  let queue = Promise.resolve();
  const send = (res, status, payload) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(payload));
  };
  const install = middlewares => {
    middlewares.use('/api/free-providers', (req, res) => {
      if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
      send(res, 200, freeProviderConfig());
    });
    middlewares.use('/api/free-geocode', async (req, res) => {
      if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
      const q = new URL(req.url || '', 'http://localhost').searchParams.get('q')?.trim();
      if (!q || q.length > 200) return send(res, 400, { error: 'Enter a place name (1–200 characters).' });
      const key = q.toLowerCase();
      const cached = cache.get(key);
      if (cached && Date.now() - cached.at < 24 * 60 * 60_000) return send(res, 200, cached.payload);
      if (!inFlight.has(key)) {
        if (inFlight.size >= 4) return send(res, 429, { error: 'Search busy; retry shortly.' });
        const task = queue.then(async () => {
          const delay = Math.max(0, 1100 - (Date.now() - lastRequest));
          if (delay) await new Promise(resolve => setTimeout(resolve, delay));
          lastRequest = Date.now();
          const url = new URL(process.env.GEV_PHOTON_URL || 'https://photon.komoot.io/api/');
          url.search = new URLSearchParams({ q, limit: '1', lang: 'en' }).toString();
          const data = await fetchJson(url.href, {
            timeoutMs: 9000, maxBytes: 128 * 1024,
            headers: { 'User-Agent': 'GodsEyeView/0.1 (+https://github.com/bilawalsidhu/gods-eye-view)' },
          });
          if (!Array.isArray(data?.features)) throw new Error('Invalid geocoder response');
          const payload = { place: normalizePhotonPlace(data.features[0]) };
          cache.set(key, { payload, at: Date.now() });
          while (cache.size > 200) cache.delete(cache.keys().next().value);
          return payload;
        });
        queue = task.catch(() => {});
        inFlight.set(key, task);
        task.finally(() => inFlight.delete(key)).catch(() => {});
      }
      try { send(res, 200, await inFlight.get(key)); }
      catch { send(res, 503, { error: 'Place search is temporarily unavailable.' }); }
    });
  };
  return { name: 'free-services', configureServer: s => install(s.middlewares), configurePreviewServer: s => install(s.middlewares) };
}
