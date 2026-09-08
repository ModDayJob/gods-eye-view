import { layerFeedState } from './data/manager.js';

// Receipt deadlines are generous tolerances, not provider observation promises.
const DEADLINES = { flights: 180000, military: 120000, earthquakes: 300000,
  'ais-live-vessels': 120000, 'rocket-launches': 1200000, 'local-firms': 3600000 };
const REFERENCE = new Set(['military-installations', 'local-datacenters', 'local-dams', 'telegeography-submarine-cables']);
export function sourceHealth(layer, now = Date.now()) {
  const stats = layer.stats || {};
  const time = stats.lastUpdate == null ? NaN : new Date(stats.lastUpdate).getTime();
  const ageMs = Number.isFinite(time) ? Math.max(0, now - time) : null;
  let state = !layer.enabled ? 'off' : layerFeedState(stats);
  if (layer.enabled && layer.lifecycleState === 'enabling') state = 'loading';
  const overdue = layer.enabled && DEADLINES[layer.id] && ageMs !== null && ageMs > DEADLINES[layer.id];
  if (overdue && !['unavailable', 'off'].includes(state)) state = 'stale';
  let kind = REFERENCE.has(layer.id) ? 'Reference data' : 'Provider snapshots';
  if (layer.id === 'satellites') kind = 'Predicted position from orbital elements';
  if (layer.id === 'traffic') kind = stats.mode === 'sim' ? 'Simulated movement' : 'Traffic flow; vehicle movement is visualized';
  if (layer.id === 'cctv') kind = 'Provider images; delivery does not verify camera availability';
  return { id: layer.id, enabled: Boolean(layer.enabled), state, kind, ageMs,
    count: Number.isFinite(Number(stats.count)) ? Number(stats.count) : null,
    observationTime: 'Not verified by this health check' };
}

export function createHealthJournal(limit = 200) {
  const previous = new Map();
  const events = [];
  return {
    sample(layers, now = Date.now()) {
      const sources = layers.map(layer => sourceHealth(layer, now));
      for (const source of sources) {
        if (previous.get(source.id) !== source.state) {
          events.push({ at: new Date(now).toISOString(), id: source.id, state: source.state });
          previous.set(source.id, source.state);
        }
      }
      if (events.length > limit) events.splice(0, events.length - limit);
      // Whitelisted summaries only: no raw errors, URLs, coordinates, or keys.
      return { version: 1, capturedAt: new Date(now).toISOString(), sources, events: events.map(e => ({ ...e })) };
    },
  };
}
