const history=[];let busy=false;
const chatForm=document.querySelector('#chatForm'),messages=document.querySelector('#messages'),question=document.querySelector('#question');
function appendMessage(text){const p=document.createElement('p');p.textContent=text;p.style.whiteSpace='pre-wrap';messages.append(p);messages.scrollTop=messages.scrollHeight;return p}
function retryButton(container,text){const retry=document.createElement('button');retry.type='button';retry.className='secondary';retry.textContent='Reintentar consulta';retry.style.cssText='display:block;margin-top:12px';retry.onclick=()=>{if(busy)return;retry.remove();question.value=text;chatForm.requestSubmit()};container.append(retry)}
chatForm.onsubmit=async e=>{
 e.preventDefault();if(busy)return;const text=question.value.trim();if(!text)return;
 busy=true;question.value='';appendMessage(text);history.push({role:'user',content:text});
 const placeholder=appendMessage('Consultando el boletín y el material cultural…'),button=chatForm.querySelector('button'),language=document.querySelector('#language');
 button.disabled=true;language.disabled=true;
 try{
  const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history.slice(-9),language:language.value}),signal:AbortSignal.timeout(55000)});
  let data;try{data=await res.json()}catch{throw Error('El servidor está iniciando o no pudo responder. Reintenta tu consulta en unos momentos.')}
  if(!res.ok||!data.answer)throw Error(data.error||'La IA no pudo responder. Puedes reintentar la consulta.');
  const answer=data.answer.replace(/\*\*/g,'');
  placeholder.textContent=(data.mode==='bulletin'?'Información del boletín · respuesta de respaldo\nLa IA no está disponible en este momento.\n\n':'')+answer;
  if(data.mode==='bulletin'){placeholder.dataset.source='bulletin';retryButton(placeholder,text)}
  history.push({role:'assistant',content:data.answer});
  if(document.querySelector('#voice').checked&&language.value==='es'&&window.speechSynthesis){speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(answer);utterance.lang='es-PE';speechSynthesis.speak(utterance)}
 }catch(error){
  placeholder.textContent=!navigator.onLine?'La conversación con IA necesita internet. El boletín guardado sigue disponible.':error.name==='TimeoutError'||error.name==='AbortError'?'La respuesta tardó demasiado. Reintenta la consulta; también puedes seguir explorando el boletín.':error.message||'La IA no está disponible. Reintenta la consulta.';
  if(history.at(-1)?.role==='user'&&history.at(-1)?.content===text)history.pop();retryButton(placeholder,text);
 }finally{busy=false;button.disabled=false;language.disabled=false;messages.scrollTop+=placeholder.getBoundingClientRect().top-messages.getBoundingClientRect().top}
};
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;document.querySelector('#dictate').onclick=()=>{if(!SpeechRecognition){appendMessage('Este navegador no permite dictado. Puedes escribir tu pregunta.');return}const recognition=new SpeechRecognition();recognition.lang='es-PE';recognition.interimResults=false;recognition.onresult=e=>question.value=e.results[0][0].transcript;recognition.onerror=()=>appendMessage('No se pudo usar el micrófono. Revisa el permiso o escribe tu pregunta.');recognition.start()};
document.querySelector('#language').onchange=()=>{history.length=0;window.speechSynthesis?.cancel();appendMessage('Empezamos una nueva consulta. Las expresiones en idiomas originarios se apoyan en el material del tutor y pueden requerir revisión por un hablante.')};
