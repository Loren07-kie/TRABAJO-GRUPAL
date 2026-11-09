import bank from '../data/multilingual-guide.json';
export const languageCodes=['es','en','ashaninka','quechua'] as const;
export type GuideLanguage=typeof languageCodes[number];
const key=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ]+/g,' ').trim();
export function resolveLanguage(query:string,requested?:string):GuideLanguage{
 if(languageCodes.includes(requested as GuideLanguage))return requested as GuideLanguage;
 const q=key(query);const phrase=bank.phrases.find(p=>key(p.question)===q);
 if(phrase)return phrase.language as GuideLanguage;
 const englishExact=bank.faqs.some(f=>f.questions.en.some(x=>key(x)===q));
 const spanishExact=bank.faqs.some(f=>f.questions.es.some(x=>key(x)===q));
 if(englishExact&&!spanishExact)return 'en';
 if(spanishExact)return 'es';
 if(/\b(jimpe|jaoka|kametsa|pasonke|kitaeteri|pipaitaka|niyoti)\b/.test(q))return 'ashaninka';
 if(/\b(imaynalla\w*|sutiy\w*|kachk\w*|maymanta|tinkunakama|q ayakama)\b/.test(q))return 'quechua';
 if(/^(does|is|are|can|could|would|why|when)\b/.test(q))return 'en';
 if(/\b(hello|hi|which|where|what|how|i want|i would|can you|tell me|show me|looking for|waterfalls?|viewpoints?|lookouts?|please|english|good morning|thanks)\b/.test(q))return 'en';
 return 'es';
}
export function multilingualMetadata(){return {languages:['español','asháninka','quechua','English'],languageCodes,training:{method:'reference_examples',faqTopics:bank.faqs.length,questionExamples:bank.faqs.reduce((n,f)=>n+f.questions.es.length+f.questions.en.length,0)+bank.phrases.length,nativeReview:'local_speaker_review_pending'},examples:Object.fromEntries(languageCodes.map(l=>[l,l==='es'||l==='en'?bank.faqs.filter(f=>['viewpoints','offline','satipo-tour'].includes(f.id)).map(f=>({question:f.questions[l][1]||f.questions[l][0],meaningEs:''})):bank.phrases.filter(p=>p.language===l).slice(0,3).map(p=>({question:p.question,meaningEs:p.meaningEs}))]))}}
export function referenceReply(query:string,language:GuideLanguage){
 const phrase=bank.phrases.find(p=>p.language===language&&key(p.question)===key(query));
 if(phrase){const source=phrase.source as {title:string,url:string};const page=phrase.page?` · ${source.title.startsWith('MINEDU')?'página del PDF':'página impresa'} ${phrase.page}`:'';return {mode:'reference',language,answer:(phrase.nativeAnswer?phrase.nativeAnswer+'\n\nEspañol: '+phrase.answerEs:'Entendí: «'+phrase.meaningEs+'».\n\n'+phrase.answerEs)+'\n\nFuente: '+source.title+page+'.\nExpresión documentada; su adecuación a la variedad local necesita revisión de un hablante.',sources:[{archivo:source.title,pagina:phrase.page,url:source.url}],review:phrase.review}}
 if(language!=='es'&&language!=='en')return null;
 const faq=bank.faqs.find(f=>[...f.questions.es,...f.questions.en].some(q=>key(q)===key(query)));
 if(!faq)return null;const en=language==='en';return {mode:'reference',language,answer:faq.answers[language]+'\n\n'+(en?'Source: ':'Fuente: ')+faq.source.title+(faq.source.pages.length?' · p. '+faq.source.pages.join(', '):'')+'.',sources:[{archivo:faq.source.title,paginas:faq.source.pages}]};
}
export function multilingualContext(query:string,language:GuideLanguage){
 const words=key(query).split(' ').filter(w=>w.length>3);
 const faqs=bank.faqs.map(f=>({f,score:words.filter(w=>key([...f.questions.es,...f.questions.en].join(' ')).includes(w)).length})).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.f);
 return {selectedLanguage:language,faqs,documentedLanguageExamples:bank.phrases.filter(p=>p.language===language),reviewPolicy:'Documented expressions are not proof of validation for every local variety. Do not invent missing native translations.'};
}
