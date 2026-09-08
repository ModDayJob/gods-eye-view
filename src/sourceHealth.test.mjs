import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourceHealth, createHealthJournal } from './sourceHealth.js';
test('stalled live receipts become stale without implying stale reference data', () => {
  const layer = { id: 'flights', enabled: true, stats: { count: 3, lastUpdate: 1000 } };
  assert.equal(sourceHealth(layer, 200000).state, 'stale');
  assert.equal(sourceHealth({ ...layer, enabled: false }, 200000).state, 'off');
  assert.equal(sourceHealth({ ...layer, id: 'local-dams' }, 200000).state, 'nominal');
  assert.equal(sourceHealth({ ...layer, stats: { ...layer.stats, error: 'failed', status: 'offline' } }, 200000).state, 'unavailable');
});
test('recovery changes state and journal stays bounded without exporting sensitive payloads', () => {
  const journal = createHealthJournal(2);
  const layer = { id: 'flights', enabled: true, stats: { lastUpdate: 1000, url: 'secret', error: 'secret' } };
  journal.sample([layer], 2000);
  journal.sample([{ ...layer, stats: { lastUpdate: 1000 } }], 200000);
  const result = journal.sample([{ ...layer, stats: { lastUpdate: 200000 } }], 200001);
  assert.deepEqual(result.events.map(e => e.state), ['stale', 'nominal']);
  assert.ok(!JSON.stringify(result).includes('secret'));
  assert.equal(journal.sample([{ ...layer, stats: { lastUpdate: 200000 } }], 200002).events.length, 2);
});
test('simulation and prediction are identified and invalid dates remain unknown', () => {
  assert.match(sourceHealth({ id: 'satellites' }).kind, /Predicted/);
  assert.match(sourceHealth({ id: 'traffic', stats: { mode: 'sim' } }).kind, /Simulated/);
  assert.equal(sourceHealth({ stats: { lastUpdate: 'bad' } }).ageMs, null);
});
