import { safeNewsUrl } from './situationModel.js';

/** Validate browser-held evidence without treating old reports as current. */
export function readSnapshots(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(s => s && typeof s.id === 'string' && typeof s.region === 'string' &&
    typeof s.topic === 'string' && Number.isFinite(Date.parse(s.capturedAt)) && Array.isArray(s.items))
    .slice(-30).map(s => ({ ...s, items: s.items.filter(a => a && typeof a.title === 'string' &&
      safeNewsUrl(a.url) && Number.isFinite(Date.parse(a.publishedAt))).slice(0,60) }));
}

/** Compare matching collection scopes, not inferred changes in the real world. */
export function compareSnapshots(current, previous) {
  if (!previous || !current || current.region !== previous.region || current.topic !== previous.topic ||
      String(current.hours) !== String(previous.hours)) return null;
  const key = a => a.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const old = new Set(previous.items.map(key)), now = new Set(current.items.map(key));
  return { added: current.items.filter(a => !old.has(key(a))),
    absent: previous.items.filter(a => !now.has(key(a))), shared: current.items.filter(a => old.has(key(a))).length };
}

/** Free local evidence retrieval; never claim generated answers or corroboration. */
export function findEvidence(question, items) {
  const stop = new Set('what when where which who why how does have has about with from this that there their are the and for any can tell show could would should happening happened explain report reports mention mentions evidence sources source latest'.split(' '));
  const terms = [...new Set((question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []).filter(t => !stop.has(t)))];
  if (!terms.length) return [];
  return items.map(a => ({ ...a, matched: terms.filter(t => (a.title+' '+a.source).toLowerCase().includes(t)) }))
    .filter(a => a.matched.length).sort((a,b) => b.matched.length-a.matched.length || Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,8);
}
