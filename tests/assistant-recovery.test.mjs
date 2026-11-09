import test,{afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {assistantAPI} from '../server/assistant.mjs';
const originalFetch=globalThis.fetch;
const env={GEMINI_API_KEY:'local-test-value',GEMINI_MODEL:'test-model'};
let visitor=0;
afterEach(()=>{globalThis.fetch=originalFetch});
const request=(text='MIRADOR',language='es')=>new Request('https://satipo.test/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://satipo.test','cf-connecting-ip':String(++visitor)},body:JSON.stringify({messages:[{role:'user',content:text}],language})});
const generated=text=>Response.json({candidates:[{content:{parts:[{text}]}}]});

test('retries one temporary provider failure and returns the AI response',async()=>{
 let calls=0;globalThis.fetch=async()=>++calls===1?new Response('',{status:503}):generated('El mirador está en la ruta Satipo.');
 const res=await assistantAPI(request(),env),data=await res.json();
 assert.equal(calls,2);assert.equal(res.status,200);assert.equal(data.mode,'ai');assert.match(data.answer,/mirador/);
});

test('persistent failure returns identified bulletin facts for MIRADOR',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return new Response('',{status:503})};
 const res=await assistantAPI(request(),env),data=await res.json();
 assert.equal(calls,2);assert.equal(res.status,200);assert.equal(data.mode,'bulletin');
 assert.match(data.notice,/sin generación de IA/);assert.match(data.answer,/Mirador Cerro Satélite/);
 assert.match(data.answer,/Mirador San Juan Bautista/);assert.match(data.answer,/El Waly/);
 assert.deepEqual(data.sources.map(s=>s.pagina),[2,5,8]);
});

test('quota errors are not retried and still allow bulletin lookup',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return new Response('',{status:429})};
 const res=await assistantAPI(request(),env),data=await res.json();
 assert.equal(calls,1);assert.equal(data.mode,'bulletin');
});

test('a network failure recovers on the second attempt',async()=>{
 let calls=0;globalThis.fetch=async()=>{if(++calls===1)throw new TypeError('Network unavailable');return generated('Respuesta recuperada.')};
 const data=await(await assistantAPI(request(),env)).json();assert.equal(calls,2);assert.equal(data.mode,'ai');
});

test('unknown questions receive a retryable error rather than invented facts',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return new Response('',{status:403})};
 const res=await assistantAPI(request('Explícame astronomía'),env),data=await res.json();
 assert.equal(calls,1);assert.equal(res.status,503);assert.equal(data.retryable,true);assert.equal(data.answer,undefined);
});

test('bulletin fallback does not fabricate native-language conversation',async()=>{
 globalThis.fetch=async()=>new Response('',{status:503});
 const res=await assistantAPI(request('MIRADOR','ashaninka'),env),data=await res.json();
 assert.equal(res.status,503);assert.equal(data.mode,undefined);assert.equal(data.retryable,true);
});
