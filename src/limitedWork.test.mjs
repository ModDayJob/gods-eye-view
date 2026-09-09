import test from 'node:test';
import assert from 'node:assert/strict';
import {settleLimited} from './limitedWork.js';
test('limits simultaneous work and retains failures without starving later tasks',async()=>{
 let active=0,peak=0;
 const result=await settleLimited([0,1,2,3,4],async i=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,5));active--;if(i===1)throw Error('offline');return i;},2);
 assert.equal(peak,2);assert.equal(result[1].status,'rejected');assert.equal(result[4].value,4);assert.equal(active,0);
});
