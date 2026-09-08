// Read-only source smoke check. Never prints or submits API credentials.
const checks = [
  ['Free configuration', '/api/free-providers'],
  ['Place search', '/api/free-geocode?q=Reykjavik'],
  ['Flights', '/api/opensky'],
  ['Military flights', '/api/adsblol/mil'],
  ['Satellites', '/api/celestrak/stations'],
  ['Space missions', '/api/launches'],
  ['Camera directory', '/api/cctv/sources'],
  ['Traffic configuration', '/api/tomtom/status'],
  ['Fire configuration', '/api/firms/status'],
  ['Ships', '/api/ais-live'],
  ['Weather', '/api/weather-effects?latitude=30.2672&longitude=-97.7431'],
];
const results = [];
for (let i = 0; i < checks.length; i += 3) {
  await Promise.all(checks.slice(i, i + 3).map(async ([name, path]) => {
    const start = Date.now();
    try {
      const response = await fetch(`http://localhost:4173${path}`, { signal: AbortSignal.timeout(30000) });
      const text = await response.text();
      const body = name === 'Satellites' && !text.trim().startsWith('{')
        ? { results: text.trim().split('\n').filter(line => line.startsWith('1 ')) }
        : JSON.parse(text);
      const rows = body.states || body.ac || body.results || body.sources || body.vessels;
      const result = { name, http: response.status, seconds: ((Date.now() - start) / 1000).toFixed(1),
        ...(Array.isArray(rows) ? { count: rows.length } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(typeof body.hasKey === 'boolean' ? { hasKey: body.hasKey } : {}),
        ...(body.place ? { place: body.place.label } : {}),
        ...(path === '/api/free-providers' ? { configuration: body } : {}),
      };
      results.push(result);
      console.log(JSON.stringify(result));
    } catch (error) {
      const result = { name, error: error.name === 'TimeoutError' ? 'timeout' : 'request failed' };
      results.push(result);
      console.log(JSON.stringify(result));
    }
  }));
}
if (results.some(r => r.error || (r.http >= 400 && r.name !== 'Ships'))) process.exitCode = 1;
