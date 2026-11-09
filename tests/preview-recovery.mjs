// Local visual QA: simulate an unavailable provider without real credentials.
process.env.PORT='5177';
process.env.GEMINI_API_KEY='local-visual-test';
globalThis.fetch=async()=>new Response('',{status:503});
await import('../server.mjs');
