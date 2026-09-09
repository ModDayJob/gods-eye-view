import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicVideoUrl, balanceCameraCities, normalizeWashingtonCameras } from './cameraExpansion.js';
test('only official HTTPS HLS links reach the browser player', () => {
  assert.equal(publicVideoUrl('https://wzmedia.dot.ca.gov/D7/cam/playlist.m3u8'), 'https://wzmedia.dot.ca.gov/D7/cam/playlist.m3u8');
  for (const url of ['https://evil.test/a.m3u8', 'http://wzmedia.dot.ca.gov/a.m3u8', 'https://key@wzmedia.dot.ca.gov/a.m3u8', 'https://wzmedia.dot.ca.gov.evil.test/a.m3u8']) assert.equal(publicVideoUrl(url), '');
});
test('city balancing does not let a large provider crowd out later cities', () => {
  const input = [{city:'A',id:1},{city:'A',id:2},{city:'A',id:3},{city:'B',id:4},{city:'C',id:5}];
  assert.deepEqual(balanceCameraCities(input, 3).map(x=>x.id), [1,4,5]);
  assert.equal(balanceCameraCities(input, 20).length, 5);
  assert.deepEqual(balanceCameraCities([], 20), []);
});
test('Washington rejects invalid coordinates and untrusted image origins', () => {
  const feature = { attributes: { OBJECTID: 1, CameraTitle: 'I-5', ImageURL: 'https://images.wsdot.wa.gov/a.jpg' }, geometry: {x:-122.33,y:47.60} };
  const [camera] = normalizeWashingtonCameras({features:[feature]});
  assert.equal(camera.city, 'Seattle area');
  assert.equal(camera.feedType, 'image');
  assert.equal(normalizeWashingtonCameras({features:[{...feature,geometry:{x:0,y:0}}]}).length,0);
  assert.equal(normalizeWashingtonCameras({features:[{...feature,attributes:{...feature.attributes,ImageURL:'http://localhost/private'}}]}).length,0);
});
