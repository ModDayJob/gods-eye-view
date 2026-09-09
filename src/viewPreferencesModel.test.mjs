import {test} from 'node:test';import assert from 'node:assert/strict';
import {validLastView,renderingProfile} from './viewPreferencesModel.js';
test('rejects corrupted or worldwide remembered views',()=>{
 const v={lat:42,lon:-71,height:18000,heading:0,pitch:-1.5,roll:0,label:'Boston'};
 assert.equal(validLastView(v).label,'Boston');
 for(const patch of [{lat:100},{lon:200},{height:22000000},{pitch:NaN},{heading:30}])assert.equal(validLastView({...v,...patch}),null);
 assert.equal(validLastView(null),null);
});
test('balanced and light reduce rendering work while retaining detail option',()=>{
 assert.deepEqual(renderingProfile('detail'),{fps:60,scale:1});assert.deepEqual(renderingProfile('balanced'),{fps:30,scale:0.85});assert.equal(renderingProfile('light').fps,20);
});

test('migrates remembered camera modes to default and validates chosen cities',async()=>{
 const {normalizeViewPreferences,START_CITIES}=await import('./viewPreferencesModel.js');
 for(const opening of ['ask','last','world',undefined])assert.equal(normalizeViewPreferences({opening,quality:'light'}).opening,'default');
 assert.deepEqual(normalizeViewPreferences({opening:'city',city:'boston',quality:'light'}),{opening:'city',city:'boston',quality:'light'});
 assert.equal(normalizeViewPreferences({opening:'city',city:'missing'}).city,'austin');
 assert.equal(normalizeViewPreferences(null).opening,'default');
 assert.equal(new Set(START_CITIES.map(c=>c.id)).size,START_CITIES.length);
 for(const c of START_CITIES)assert.ok(Math.abs(c.lat)<=90&&Math.abs(c.lon)<=180);
});
