/** Convert Photon/OpenStreetMap results into the app's existing place contract. */
export function normalizePhotonPlace(feature) {
  const [lon, lat] = feature?.geometry?.coordinates || [];
  if (feature?.geometry?.type !== 'Point' || !Number.isFinite(lat) || !Number.isFinite(lon)
      || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const p = feature.properties || {};
  const label = [...new Set([p.name, p.city, p.state, p.country].filter(v => typeof v === 'string' && v))].join(', ');
  if (!label) return null;
  const kind = p.type || p.osm_value;
  const types = kind === 'country' ? ['country']
    : ['state', 'county'].includes(kind) ? ['administrative_area_level_1']
    : ['city', 'town', 'village', 'district', 'locality'].includes(kind) ? ['locality']
    : p.osm_key === 'highway' ? ['route'] : ['point_of_interest'];
  let viewport = null;
  const extent = p.extent;
  if (Array.isArray(extent) && extent.length === 4 && extent.every(Number.isFinite)
      && Math.abs(extent[0]) <= 180 && Math.abs(extent[2]) <= 180
      && Math.abs(extent[1]) <= 90 && Math.abs(extent[3]) <= 90) {
    viewport = {
      southwest: { lat: Math.min(extent[1], extent[3]), lng: extent[0] },
      northeast: { lat: Math.max(extent[1], extent[3]), lng: extent[2] },
    };
  }
  return { lat, lon, label, primaryName: p.name || label, types, viewport, source: 'Photon · OpenStreetMap' };
}

export async function findFreePlace(query, { signal } = {}) {
  const response = await fetch(`/api/free-geocode?q=${encodeURIComponent(query)}`, {
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(response.status === 429 ? 'Place search is busy; retry shortly.' : 'Place search is temporarily unavailable.');
  const payload = await response.json();
  return payload.place || null;
}
