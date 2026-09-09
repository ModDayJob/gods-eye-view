import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTHCAM_LOCATIONS,findEarthCamLocations} from './earthCamDirectory.js';
test('EarthCam discovery ranks near the map and searches across cities and landmarks',()=>{
 assert.equal(findEarthCamLocations('',{lat:51.51,lon:-.15})[0].id,'abbey-road');
 assert.equal(findEarthCamLocations('DUBLIN')[0].id,'temple-bar');
 assert.equal(findEarthCamLocations('missing place').length,0);
 assert.equal(findEarthCamLocations().length,5);
});
test('EarthCam entries are unique official viewing pages, not stream assets',()=>{
 assert.equal(new Set(EARTHCAM_LOCATIONS.map(e=>e.id)).size,EARTHCAM_LOCATIONS.length);
 for(const e of EARTHCAM_LOCATIONS){const u=new URL(e.url);assert.equal(u.protocol,'https:');assert.equal(u.hostname,'www.earthcam.com');assert.ok(!/\.(m3u8|mp4|jpg)/.test(u.pathname));assert.ok(Math.abs(e.lat)<=90&&Math.abs(e.lon)<=180)}
});
