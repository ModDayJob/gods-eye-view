import {test} from 'node:test';import assert from 'node:assert/strict';import {waitForStartup} from './startupGate.js';
test('a stuck feed cannot retain the cover indefinitely',async()=>assert.deepEqual(await waitForStartup(new Promise(()=>{}),{timeoutMs:20,minMs:1}),{settled:false,ok:false}));
test('normal restoration and rejected restoration both release the cover',async()=>{
 assert.deepEqual(await waitForStartup(Promise.resolve(),{timeoutMs:100,minMs:1}),{settled:true,ok:true});
 assert.deepEqual(await waitForStartup(Promise.reject(new Error('feed')),{timeoutMs:100,minMs:1}),{settled:true,ok:false});
});
