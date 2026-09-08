import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanPreferences,temperature} from './liveViewPreferences.js';
test('saved cities are bounded and malformed storage is safe',()=>{
 assert.deepEqual(cleanPreferences(null),{favorites:[],unit:'F',selected:'Boston'});
 assert.equal(cleanPreferences({favorites:[{name:'A',lat:91,lon:0},{name:'B',lat:0,lon:0}]}).favorites.length,1);
 assert.equal(cleanPreferences({favorites:Array.from({length:80},()=>({name:'A',lat:0,lon:0}))}).favorites.length,50);
});
test('units handle freezing, negatives and missing values',()=>{
 assert.equal(temperature(0,'F'),'32°F');assert.equal(temperature(-40,'F'),'-40°F');
 assert.equal(temperature(20,'C'),'20°C');assert.equal(temperature(null,'F'),'unavailable');
});
