import routes from '../data/routes.json';

type Message={role:'user'|'assistant',content:string};
type Env={GEMINI_API_KEY?:string,GEMINI_MODEL?:string};
const districts=['Satipo','Río Negro','Mazamari','Llaylla','Pangoa','Coviriali','Pampa Hermosa','Río Tambo'];
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const normalized=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const stopWords=new Set('quiero saber sobre donde como puedo visitar cuales hay del las los una para por que esta este conocer informacion favor podrias puedes tiene tienen tour ruta rutas satipo junin peru'.split(' '));

export function bulletinFallback(query:string,language:string|undefined){
 if(language!=='es'&&language!=='en')return null;
 const en=language==='en';
 if(en)query=normalized(query).replace(/viewpoints?|lookouts?/g,'mirador').replace(/waterfalls?/g,'catarata').replace(/coffee|cafes?/g,'cafeteria');
 const words=(normalized(query).match(/[a-z0-9]{3,}/g)||[]).filter(w=>!stopWords.has(w)).map(w=>w.replace(/ores$/,'or').replace(/s$/,''));
 let entries=routes.flatMap((names,d)=>names.map(name=>({name,d,score:words.filter(w=>normalized(name).includes(w)).length}))).filter(e=>e.score>0).sort((a,b)=>b.score-a.score);
 if(!entries.length&&!words.length&&/satipo/.test(normalized(query)))entries=routes[0].map(name=>({name,d:0,score:1}));
 if(!entries.length)return null;
 const matches=entries.slice(0,6);
 return response({mode:'bulletin',notice:en?'AI is temporarily unavailable. This answer comes from the visitor bulletin, without AI generation.':'La IA no está disponible en este momento. Esta respuesta proviene del boletín, sin generación de IA.',answer:(en?'The 2025 visitor bulletin lists these stops:\n\n':'En el Boletín Turístico 2025 figuran estas paradas:\n\n')+matches.map(e=>'• '+e.name+(en?' — route ':' — ruta ')+districts[e.d]+(en?' (page ':' (página ')+(e.d+2)+').').join('\n')+(en?'\n\nFind them under Explorar and add stops to your itinerary. Confirm current access with a local operator.':'\n\nPuedes encontrarlas en “Explorar” y agregar tus paradas al itinerario. Confirma el acceso y las condiciones actuales con un operador local.'),sources:matches.map(e=>({archivo:'Boletín Turístico 2025',pagina:e.d+2}))});
}

export async function answerWithRecovery(system:string,messages:Message[],query:string,language:string|undefined,env:Env,sources:{archivo:string,pagina:number}[]=[]){
 const model=env.GEMINI_MODEL||'gemini-2.5-flash';let lastStatus=502;
 const body=JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),generationConfig:{maxOutputTokens:1400,temperature:0.3}});
 for(let attempt=0;attempt<2;attempt++){
  if(attempt)await new Promise(resolve=>setTimeout(resolve,700));
  try{
   const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY!},body,signal:AbortSignal.timeout(20000)});
   lastStatus=res.status;
   if(!res.ok){
    // Log diagnostic codes only; never credentials, prompts or conversation content.
    console.warn(JSON.stringify({event:'assistant_provider_error',status:res.status,attempt:attempt+1,model}));
    if([408,500,502,503,504].includes(res.status)&&attempt===0)continue;
    break;
   }
   const data=await res.json() as {candidates?:{content?:{parts?:{text?:string,thought?:boolean}[]}}[]};
   const answer=data.candidates?.[0]?.content?.parts?.filter(p=>!p.thought).map(p=>p.text||'').join('').trim();
   if(answer)return response({mode:'ai',answer,sources});
   console.warn(JSON.stringify({event:'assistant_empty_response',attempt:attempt+1,model}));lastStatus=502;
  }catch(error){
   console.warn(JSON.stringify({event:'assistant_network_error',attempt:attempt+1,model,kind:error instanceof Error?error.name:'unknown'}));lastStatus=502;
  }
 }
 const fallback=bulletinFallback(query,language);if(fallback)return fallback;
 if(language==='en')return response({error:lastStatus===429?'The AI usage limit has been reached. You can still explore the routes and bulletin.':'AI is temporarily unavailable. Retry your question or explore the bulletin.',retryable:true},lastStatus===429?429:503);
 return response({error:lastStatus===429?'La IA alcanzó su límite de uso. Puedes consultar las rutas y el boletín mientras vuelve a estar disponible.':'La IA no está disponible temporalmente. Puedes reintentar tu consulta o explorar el boletín.',retryable:true},lastStatus===429?429:503);
}
