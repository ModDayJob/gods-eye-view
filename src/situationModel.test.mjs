import {test} from 'node:test';import assert from 'node:assert/strict';
import {cleanArticles,safeNewsUrl,headlineKeywords} from './situationModel.js';
test('headlines reject unsafe URLs, invalid times and duplicates',()=>{
 const now=Date.now(),a={url:'https://example.com/a',title:'Ceasefire talks resume',publishedAt:new Date(now).toISOString(),domain:'Example'};
 assert.equal(cleanArticles([a,{...a,url:'https://example.com/b'},{...a,url:'javascript:alert(1)'},{...a,title:'Old',publishedAt:'2000-01-01'}],now).length,1);
 assert.equal(safeNewsUrl('https://user:pass@example.com'),null);
 assert.equal(cleanArticles([{...a,publishedAt:'invalid'}],now).length,0);
});
test('keyword counts represent headlines, not repeated words or confidence',()=>{
 assert.deepEqual(headlineKeywords([{title:'Ceasefire ceasefire talks'},{title:'Ceasefire continues'}])[0],['ceasefire',2]);
});
test('map counts are explicit country-name mentions only',async()=>{
 const {mentionedCountries}=await import('./situationModel.js');
 assert.deepEqual(mentionedCountries([{title:'Ukraine and Iran diplomacy'},{title:'Iran updates'}]).map(c=>[c.name,c.count]),[['Iran',2],['Ukraine',1]]);
 assert.equal(mentionedCountries([{title:'Unknown location'}]).length,0);
});
