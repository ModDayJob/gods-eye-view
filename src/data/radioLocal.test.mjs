import test from 'node:test';
import assert from 'node:assert/strict';
import {radioStationsNear,stationMatchesRadioCategory} from './radio.js';
test('local radio excludes distant stations, ranks nearest first, and leaves worldwide unchanged',()=>{
 const anchor={lat:30.2672,lon:-97.7431};
 const stations=[{id:'boston',lat:42.36,lon:-71.06},{id:'san-antonio',lat:29.42,lon:-98.49},{id:'austin',...anchor}];
 assert.deepEqual(radioStationsNear(stations,anchor).map(s=>s.id),['austin','san-antonio']);
 assert.equal(radioStationsNear(stations,null),stations);
 assert.deepEqual(radioStationsNear(stations,{lat:0,lon:0}),[]);
 assert.equal(stations[0].id,'boston');
});
test('spoken-service categories match words rather than fragments of music tags',()=>{
 assert.equal(stationMatchesRadioCategory({tags:['sound systems']},'public-safety'),false);
 assert.equal(stationMatchesRadioCategory({tags:['fire scanner']},'public-safety'),true);
 assert.equal(stationMatchesRadioCategory({tags:['noaa weather radio']},'weather'),true);
 assert.equal(stationMatchesRadioCategory({tags:['breaking news']},'news'),true);
 assert.equal(stationMatchesRadioCategory({tags:['watch music']},'aviation-marine'),false);
});
