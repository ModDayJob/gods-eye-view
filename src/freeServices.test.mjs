import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhotonPlace } from './freeGeocode.js';
import { freeServicesPlugin, freeProviderConfig } from '../server/freeServices.js';
import { sourceStatusText } from './sourceStatus.js';

const berlin = { geometry: { type: 'Point', coordinates: [13.4, 52.5] }, properties: {
  name: 'Berlin', country: 'Germany', osm_value: 'city', extent: [13, 53, 14, 52],
} };
test('free geocoder validates coordinates and converts north/south extent order', () => {
  const place = normalizePhotonPlace(berlin);
  assert.deepEqual(place.types, ['locality']);
  assert.deepEqual(place.viewport, { southwest: { lat: 52, lng: 13 }, northeast: { lat: 53, lng: 14 } });
  assert.equal(normalizePhotonPlace({ ...berlin, geometry: { type: 'Point', coordinates: [0, 100] } }), null);
  assert.equal(normalizePhotonPlace(null), null);
});
test('provider status exposes only booleans and free mode overrides metered keys', () => {
  const config = freeProviderConfig({ GEV_FREE_ONLY: '1', OPENAI_API_KEY: 'secret', GOOGLE_MAPS_API_KEY: 'secret', AISSTREAM_API_KEY: 'secret' });
  assert.equal(config.voice, false);
  assert.equal(config.google, false);
  assert.equal(config.ships, true);
  assert.ok(Object.values(config).every(v => typeof v === 'boolean'));
  assert.ok(!JSON.stringify(config).includes('secret'));
});
function harness(fetchJson) {
  const routes = new Map();
  freeServicesPlugin({ fetchJson }).configureServer({ middlewares: { use: (path, fn) => routes.set(path, fn) } });
  return (url, method = 'GET') => new Promise(resolve => {
    let status;
    routes.get('/api/free-geocode')({ url, method }, {
      writeHead: s => { status = s; },
      end: body => resolve({ status, body: JSON.parse(body) }),
    });
  });
}
test('free search coalesces simultaneous queries and caches the response', async () => {
  let calls = 0;
  const request = harness(async url => {
    calls++;
    assert.equal(new URL(url).searchParams.get('q'), 'Berlin');
    return { features: [berlin] };
  });
  const [a, b] = await Promise.all([request('?q=Berlin'), request('?q=Berlin')]);
  assert.equal(a.status, 200);
  assert.deepEqual(a, b);
  assert.equal((await request('?q=berlin')).body.place.label, 'Berlin, Germany');
  assert.equal(calls, 1);
});
test('invalid search requests never call the provider; outages are not empty success', async () => {
  let calls = 0;
  const request = harness(async () => { calls++; throw new Error('outage'); });
  assert.equal((await request('?q=')).status, 400);
  assert.equal((await request(`?q=${'x'.repeat(201)}`)).status, 400);
  assert.equal((await request('?q=Berlin', 'POST')).status, 405);
  assert.equal(calls, 0);
  assert.equal((await request('?q=Berlin')).status, 503);
});
test('source status distinguishes off, failed, and receipt age from observation time', () => {
  assert.equal(sourceStatusText({ enabled: true, stats: { status: 'zoom-in', error: 'Zoom in to load' } }), 'Zoom in to load');
  assert.equal(sourceStatusText({ enabled: false }), 'Off');
  assert.match(sourceStatusText({ enabled: true, stats: { error: 'feed down' } }), /Unavailable/);
  assert.equal(sourceStatusText({ enabled: true, stats: { count: 4, lastUpdate: 1000 } }, 61000), '4 items · received 1m ago');
  assert.match(sourceStatusText({ enabled: true, stats: { count: 4, lastUpdate: 1000, source: 'adsb.lol', coverage: 'regional fallback' } }, 61000), /FALLBACK.*regional fallback/);
});
