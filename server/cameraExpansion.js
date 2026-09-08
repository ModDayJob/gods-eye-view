export function publicVideoUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'wzmedia.dot.ca.gov'
      && !url.username && !url.password && url.pathname.endsWith('.m3u8') ? url.href : '';
  } catch { return ''; }
}

// Round-robin keeps a large early provider from excluding every later city.
export function balanceCameraCities(sources, limit, groupBy = source => source.city || source.provider || 'Other') {
  const groups = new Map();
  for (const source of sources) {
    const key = groupBy(source);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(source);
  }
  const result = [];
  for (let i = 0; result.length < limit; i++) {
    let added = false;
    for (const group of groups.values()) {
      if (group[i] && result.length < limit) { result.push(group[i]); added = true; }
    }
    if (!added) break;
  }
  return result;
}

const CITIES = [['Seattle', 47.6062, -122.3321], ['Tacoma', 47.2529, -122.4443],
  ['Olympia', 47.0379, -122.9007], ['Spokane', 47.6588, -117.4260],
  ['Vancouver WA', 45.628, -122.6739], ['Bellingham', 48.7519, -122.4787],
  ['Everett', 47.979, -122.202], ['Yakima', 46.6021, -120.5059],
  ['Tri-Cities', 46.2396, -119.1006], ['Wenatchee', 47.4235, -120.3103]];
export function normalizeWashingtonCameras(payload) {
  return (payload?.features || []).flatMap(({ attributes: a = {}, geometry: g = {} }) => {
    const lat = Number(g.y), lon = Number(g.x);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 45 || lat > 50 || lon < -125 || lon > -116 || !a.OBJECTID) return [];
    let image;
    try {
      image = new URL(a.ImageURL);
      if (image.protocol !== 'https:' || image.username || image.password
        || !['images.wsdot.wa.gov', 'images.wsdot.com', 'www.wsdot.com', 'www.tripcheck.com'].includes(image.hostname)) return [];
    } catch { return []; }
    const nearest = [...CITIES].sort((a, b) => ((lat-a[1])**2 + ((lon-a[2])*0.68)**2) - ((lat-b[1])**2 + ((lon-b[2])*0.68)**2))[0];
    return [{ id: `wsdot-${a.OBJECTID}`, name: String(a.CameraTitle || a.OBJECTID),
      city: `${nearest[0]} area`, cityId: nearest[0].toLowerCase().replace(/\s/g, '-'),
      provider: 'Washington State Department of Transportation', lat, lon,
      headingDeg: ({ N: 0, E: 90, S: 180, W: 270 })[a.CompassDirection] ?? 0,
      headingConfidence: 'low', pitchDeg: -18, fovDeg: 44, rangeM: 145,
      mountHeightM: 8, groundElevationM: 0, feedType: 'image', url: image.href,
      snapshotUrl: image.href, sourceKind: 'wsdot-open-data', license: 'WSDOT public traffic cameras; provider snapshots' }];
  });
}

export async function loadWashingtonCameras() {
  if (process.env.CCTV_WSDOT_ENABLED === '0') return [];
  try {
    const url = 'https://data.wsdot.wa.gov/arcgis/rest/services/TravelInformation/TravelInfoCamerasWeather/FeatureServer/0/query?where=1%3D1&outFields=OBJECTID,CameraTitle,ImageURL,CompassDirection&outSR=4326&f=json&resultRecordCount=2000';
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return balanceCameraCities(normalizeWashingtonCameras(await r.json()), 300);
  } catch { console.warn('[CCTV] Washington camera catalog unavailable'); return []; }
}
