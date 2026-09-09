import test from 'node:test';
import assert from 'node:assert/strict';
import {nearestCameraForMap} from './cameraBrowser.js';
const sources=[{id:'austin',city:'Austin',lat:30.27,lon:-97.74},{id:'london-far',city:'London',lat:51.6,lon:0},{id:'london-near',city:'London',lat:51.5137,lon:-.1545}];
test('camera browser follows map coordinates instead of alphabetical city order',()=>{
 assert.equal(nearestCameraForMap(sources,{lat:51.5137,lon:-.1545}).source.id,'london-near');
 assert.equal(nearestCameraForMap(sources,{lat:30.27,lon:-97.74}).source.id,'austin');
});
test('unsupported map locations do not silently select distant cameras',()=>{
 assert.equal(nearestCameraForMap(sources,{lat:42.36,lon:-71.06}),null);
 assert.equal(nearestCameraForMap(sources,null),null);
 assert.equal(nearestCameraForMap([{lat:null,lon:null}],{lat:0,lon:0}),null);
});
