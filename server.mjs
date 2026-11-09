import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assistantAPI} from './server/assistant.mjs';
const root=path.resolve(fileURLToPath(new URL('./public/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.pdf':'application/pdf','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');return}
  if(url.pathname==='/api/chat'){
   const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>32000){res.writeHead(413,{'Content-Type':'application/json'});res.end('{"error":"Mensaje demasiado largo."}');return}chunks.push(chunk)}
   const protocol=req.headers['x-forwarded-proto']==='https'?'https':'http';const origin=protocol+'://'+req.headers.host;const headers=new Headers({'Content-Type':'application/json'});if(req.headers.origin)headers.set('origin',req.headers.origin);headers.set('cf-connecting-ip',String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'visitor').split(',')[0].trim());
   const request=new Request(origin+'/api/chat',{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});const response=await assistantAPI(request,process.env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
  let relative=decodeURIComponent(url.pathname);if(['/', '/guide','/guide.html'].includes(relative))relative='/guide.html';
  const filename=path.resolve(root,'.'+relative);if(!filename.startsWith(root+path.sep)&&filename!==path.join(root,'guide.html')){res.writeHead(403);res.end();return}
  const info=await stat(filename);if(!info.isFile())throw Error('not-file');
  res.setHeader('Content-Type',types[path.extname(filename)]||'application/octet-stream');res.setHeader('Content-Length',info.size);res.setHeader('Cache-Control',filename.endsWith('sw.js')?'no-cache':'public, max-age=300');if(req.method==='HEAD'){res.end();return}createReadStream(filename).on('error',()=>res.destroy()).pipe(res);
 }catch{if(!res.headersSent)res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('No encontrado.');}
});
server.requestTimeout=60000;server.headersTimeout=15000;server.listen(Number(process.env.PORT)||10000,'0.0.0.0',()=>console.log('Satipo: servidor listo.'));
process.on('SIGTERM',()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),25000).unref()});
