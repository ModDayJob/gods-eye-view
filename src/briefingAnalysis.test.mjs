import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readSnapshots,compareSnapshots,findEvidence} from './briefingAnalysis.js';
const a={title:'Flood warning in Brazil',url:'https://example.org/a',source:'Example',publishedAt:'2026-09-08T10:00:00Z'};
const s={id:'one',region:'world',topic:'disaster',hours:'24',capturedAt:a.publishedAt,items:[a]};
test('history rejects malformed evidence and caps retention',()=>{
 assert.equal(readSnapshots([null,{...s,items:[a,{...a,url:'javascript:alert(1)'}]}])[0].items.length,1);
 assert.equal(readSnapshots(Array(40).fill(s)).length,30);
});
test('comparison refuses mixed scopes and identifies sample additions',()=>{
 assert.equal(compareSnapshots(s,{...s,region:'ukraine'}),null);
 assert.equal(compareSnapshots(s,{...s,hours:'6'}),null);
 assert.deepEqual(compareSnapshots(s,s),{added:[],absent:[],shared:1});
 assert.equal(compareSnapshots({...s,items:[a,{...a,title:'New report'}]},s).added.length,1);
});
test('question retrieval does not fabricate evidence for unsupported questions',()=>{
 assert.equal(findEvidence('What about flooding in Brazil?', [a]).length,1);
 assert.equal(findEvidence('Who will win tomorrow?', [a]).length,0);
 assert.equal(findEvidence('What is happening?', [a]).length,0);
});
