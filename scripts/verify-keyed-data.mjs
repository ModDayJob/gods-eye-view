import { lonLatToTile } from '../src/data/tomtomTiles.js';
import { decodeFlowTile } from '../src/data/flowTiles.js';
const root = 'http://localhost:4173';
const { x, y } = lonLatToTile(-97.7431, 30.2672, 12);
const checks = [
  ['Traffic tile', `/api/tomtom/flow/12/${x}/${y}.pbf`, 'tile'],
  ['Fire detections', '/api/firms', 'fires'],
  ['Ships', '/api/ais-live?maxRows=5000', 'ships'],
  ['Camera health', '/api/cctv/health', 'cameras'],
  ['Mapped installations', '/api/military-installations?south=30.15&west=-97.85&north=30.35&east=-97.65', 'mapped'],
];
await Promise.all(checks.map(async ([name, path, kind]) => {
  const start = Date.now();
  try {
    const r = await fetch(root + path, { signal: AbortSignal.timeout(90000) });
    const bytes = new Uint8Array(await r.arrayBuffer());
    const result = { name, http: r.status, seconds: Math.round((Date.now() - start) / 1000) };
    if (kind === 'tile' && r.ok) {
      result.bytes = bytes.length;
      result.contentType = r.headers.get('content-type');
      result.cache = r.headers.get('x-tomtom-cache');
      result.decodedRoadSegments = decodeFlowTile(bytes, 12, x, y).length;
    } else {
      const body = JSON.parse(new TextDecoder().decode(bytes));
      if (kind === 'fires') Object.assign(result, { count: body.fires?.length, stale: body.stale, sourceCount: body.sources?.length });
      if (kind === 'ships') Object.assign(result, { count: body.rows?.length, status: body.status, lastMessageAt: body.lastMessageAt });
      if (kind === 'mapped') Object.assign(result, { count: body.elements?.length, status: body.status });
      if (kind === 'cameras') {
        const cameras = Array.isArray(body.cameras) ? body.cameras : Object.values(body.cameras || {});
        result.observed = cameras.length;
        result.statusCounts = cameras.reduce((counts, camera) => {
          const status = camera.status || 'unknown'; counts[status] = (counts[status] || 0) + 1; return counts;
        }, {});
      }
    }
    console.log(JSON.stringify(result));
    if (!r.ok) process.exitCode = 1;
  } catch (e) {
    console.log(JSON.stringify({ name, error: e.name === 'TimeoutError' ? 'timeout' : 'request failed' }));
    process.exitCode = 1;
  }
}));
