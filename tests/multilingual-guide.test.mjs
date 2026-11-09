import test,{afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assistantAPI} from '../server/assistant.mjs';
const bank=JSON.parse(readFileSync(new URL('../data/multilingual-guide.json',import.meta.url),'utf8'));
const originalFetch=globalThis.fetch;let visitor=100;
afterEach(()=>{globalThis.fetch=originalFetch});
const env={GEMINI_API_KEY:'local-test-value',GEMINI_MODEL:'test-model'};
const request=(text,language='auto')=>new Request('https://satipo.test/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://satipo.test','cf-connecting-ip':String(++visitor)},body:JSON.stringify({messages:[{role:'user',content:text}],language})});

test('advertises four priority languages and all question examples',async()=>{
 const data=await(await assistantAPI(new Request('https://satipo.test/api/chat'),env)).json();
 assert.deepEqual(data.languageCodes,['es','en','ashaninka','quechua']);assert.equal(data.training.questionExamples,86);
 for(const code of data.languageCodes)assert.ok(data.examples[code].length>0);
});

for(const language of ['es','en'])test('documented tourism answers work without provider in '+language,async()=>{
 globalThis.fetch=async()=>{throw Error('Provider must not be called for an exact reference')};
 const example=bank.faqs.find(f=>f.id==='offline');
 const data=await(await assistantAPI(request(example.questions[language][0]),{})).json();
 assert.equal(data.language,language);assert.equal(data.mode,'reference');assert.ok(data.answer.includes(example.answers[language]));
});

for(const language of ['ashaninka','quechua'])test('recognizes a sourced native question in '+language,async()=>{
 const example=bank.phrases.find(p=>p.language===language&&p.id.endsWith('-how'));
 const data=await(await assistantAPI(request(example.question),{})).json();
 assert.equal(data.language,language);assert.equal(data.mode,'reference');assert.ok(data.answer.includes(example.nativeAnswer));
 assert.ok(data.answer.includes('Español:'));assert.equal(data.review,'documented_expression_local_review_pending');assert.ok(data.sources[0].url);
});

test('English free-form questions instruct the provider to use English',async()=>{
 let prompt='';globalThis.fetch=async(_url,options)=>{prompt=JSON.parse(options.body).systemInstruction.parts[0].text;return Response.json({candidates:[{content:{parts:[{text:'I can help you explore Satipo.'}]}}]})};
 const data=await(await assistantAPI(request('Can you suggest a quiet route around Satipo?'),env)).json();
 assert.equal(data.language,'en');assert.equal(data.mode,'ai');assert.match(prompt,/IDIOMA SELECCIONADO: en/);assert.match(prompt,/inglés natural/);
});

test('English provider failures keep the backup answer in English',async()=>{
 globalThis.fetch=async()=>new Response('',{status:429});
 const data=await(await assistantAPI(request('Can you show me scenic viewpoints?'),env)).json();
 assert.equal(data.language,'en');assert.equal(data.mode,'bulletin');assert.match(data.answer,/The 2025 visitor bulletin/);assert.match(data.answer,/Mirador Cerro Satélite/);
});

test('explicit English selection takes precedence over Spanish input',async()=>{
 const data=await(await assistantAPI(request('Mirador','en'),{})).json();
 assert.equal(data.language,'en');assert.match(data.answer,/The bulletin lists/);
});

test('native expressions without complete replies do not fabricate translations',async()=>{
 const example=bank.phrases.find(p=>p.id==='ash-name');
 const data=await(await assistantAPI(request(example.question),{})).json();
 assert.equal(data.mode,'reference');assert.match(data.answer,/Soy la guía virtual/);assert.match(data.answer,/no dispongo|Todavía no dispongo/);assert.equal(data.language,'ashaninka');
});
