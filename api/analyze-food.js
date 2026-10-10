const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const OPENROUTER_MODEL = 'google/gemma-4-26b-a4b-it:free';
const TIMEOUT_MS = 20000;
export const config = { maxDuration: 30 };

const ALLOWED_ORIGINS = new Set([
  'https://dannypo1.github.io',
  'https://calorietracker-dusky.vercel.app'
]);
const RESPONSE_SCHEMA = {
  type: 'object', properties: { items: { type: 'array', items: { type: 'object',
    properties: {
      name: { type: 'string', description: 'Concrete Dutch name of one clearly visible food or drink.' },
      grams: { type: 'number', description: 'Estimated edible weight in grams or milliliters, based only on visible size.' },
      confidence: { type: 'number', description: 'Confidence from 0 to 1.' },
      notes: { type: 'string', description: 'Short Dutch note about uncertainty or estimated amount.' }
    }, required: ['name','grams','confidence','notes']
  } } }, required: ['items']
};
function send(res, status, body) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  return res.status(status).json(body);
}
function fail(res,status,code,error,id) { return send(res,status,{error,code,requestId:id}); }
function reqId() { try { return crypto.randomUUID(); } catch { return `ai-${Date.now()}`; } }
function cleanItems(parsed) {
  return (Array.isArray(parsed?.items) ? parsed.items : []).map(item => ({
    name: String(item?.name || '').trim().slice(0,120),
    grams: Math.max(1,Math.min(3000,Number(item?.grams)||100)),
    confidence: Math.max(0,Math.min(1,Number(item?.confidence)||0)),
    notes: String(item?.notes||'').trim().slice(0,220)
  })).filter(item=>item.name);
}
function geminiText(result) {
  const steps = Array.isArray(result?.steps) ? result.steps
    .filter(step=>step?.type==='model_output'||step?.type==='model_output_step'||step?.content)
    .flatMap(step=>Array.isArray(step?.content)?step.content:[])
    .filter(part=>part?.type==='text'&&typeof part?.text==='string').map(part=>part.text) : [];
  return result?.output_text || result?.outputText || result?.interaction?.output_text || result?.interaction?.outputText || steps.join('') || '';
}
async function timedFetch(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try { return await fetch(url,{...options,signal:controller.signal}); }
  finally { clearTimeout(timer); }
}
export default async function handler(req,res) {
  const origin=req.headers.origin||'';
  if(origin) {
    if(!ALLOWED_ORIGINS.has(origin)) return send(res,403,{error:'Deze app-omgeving is niet toegestaan.'});
    res.setHeader('Access-Control-Allow-Origin',origin); res.setHeader('Vary','Origin');
  }
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='POST') return send(res,405,{error:'Alleen POST is toegestaan.'});
  const id=reqId();
  const geminiKey=process.env.GEMINI_API_KEY;
  const openRouterKey=process.env.OPENROUTER_API_KEY;
  if(!geminiKey&&!openRouterKey) return fail(res,500,'CONFIG_MISSING','De AI-fotoscan is niet correct geconfigureerd.',id);
  try {
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    const image=String(body?.image||'');
    const mimeType=String(body?.mimeType||'image/jpeg');
    if(!image) return fail(res,400,'NO_IMAGE','Geen foto ontvangen.',id);
    if(!['image/jpeg','image/png','image/webp'].includes(mimeType)) return fail(res,400,'INVALID_IMAGE_TYPE','Gebruik een JPEG-, PNG- of WebP-foto.',id);
    if(image.length>8_000_000) return fail(res,413,'IMAGE_TOO_LARGE','De foto is te groot. Probeer opnieuw met een kleinere foto.',id);
    const prompt=[
      'Analyseer de bijgevoegde foto uitsluitend op zichtbare voeding en drank.',
      'Wees conservatief: gebruik oppervlak, textuur, kleur en context; herken voedsel niet alleen aan een ronde of platte vorm.',
      'Noem iets alleen hamburger of broodje als duidelijke kenmerken zichtbaar zijn. Een ronde koek, pannenkoek of omelet is niet automatisch een hamburger.',
      'Maak een lijst van afzonderlijke, duidelijk zichtbare voedingsmiddelen of dranken met concrete Nederlandse productnamen.',
      'Schat per item het eetbare gewicht in gram; voor vloeistoffen mag milliliter als gram worden benaderd. Gebruik geen standaard 100 g als het gewicht onzeker is.',
      'Splits een gerecht in zichtbare onderdelen als dat redelijk kan. Neem geen bord, bestek, verpakking of decoratie op.',
      'Verzin geen verborgen ingrediënten. Geef geen calorieën of macro’s; de app haalt voedingswaarden uit de database.',
      'Geef bij onzekerheid een lage confidence en een korte Nederlandse note. Retourneer uitsluitend JSON met items; elk item heeft name, grams, confidence en notes.'
    ].join('\n');
    let lastStatus=502, lastError='';
    // Primary: Gemini. Fall back only if Gemini fails or returns unusable output.
    if(geminiKey) {
      try {
        const response=await timedFetch('https://generativelanguage.googleapis.com/v1beta/interactions',{
          method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':geminiKey},
          body:JSON.stringify({model:GEMINI_MODEL,input:[{type:'text',text:prompt},{type:'image',data:image,mime_type:mimeType,resolution:'medium'}],response_format:{type:'text',mime_type:'application/json',schema:RESPONSE_SCHEMA}})
        });
        const raw=await response.text(); let result=null; try{result=JSON.parse(raw)}catch{}
        lastStatus=response.status; lastError=raw.slice(0,1200);
        if(response.ok) {
          const output=geminiText(result); let parsed=null; try{parsed=JSON.parse(output)}catch{}
          if(parsed&&Array.isArray(parsed.items)) {
            console.info('AI food response ready',{id,model:GEMINI_MODEL,items:parsed.items.length});
            return send(res,200,{items:cleanItems(parsed),model:GEMINI_MODEL});
          }
          lastStatus=502; lastError='Gemini returned invalid JSON';
        }
        console.warn('Gemini attempt failed; fallback may be used',{id,status:lastStatus});
      } catch(error) {
        lastStatus=error?.name==='AbortError'?504:502; lastError=String(error?.message||error);
        console.warn('Gemini request failed; fallback may be used',{id,status:lastStatus});
      }
    }
    if(openRouterKey) {
      try {
        const response=await timedFetch('https://openrouter.ai/api/v1/chat/completions',{
          method:'POST',headers:{'Authorization':`Bearer ${openRouterKey}`,'Content-Type':'application/json','HTTP-Referer':'https://dannypo1.github.io/calorietracker/','X-Title':'CalorieTracker'},
          body:JSON.stringify({model:OPENROUTER_MODEL,messages:[{role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:`data:${mimeType};base64,${image}`}}]}],response_format:{type:'json_object'},temperature:0.1,max_tokens:2500})
        });
        const raw=await response.text(); let result=null; try{result=JSON.parse(raw)}catch{}
        lastStatus=response.status; lastError=raw.slice(0,1200);
        const content=result?.choices?.[0]?.message?.content;
        if(response.ok&&typeof content==='string'&&content.trim()) {
          let parsed=null; try{parsed=JSON.parse(content)}catch{}
          if(parsed&&Array.isArray(parsed.items)) {
            console.info('AI food response ready',{id,model:OPENROUTER_MODEL,items:parsed.items.length});
            return send(res,200,{items:cleanItems(parsed),model:OPENROUTER_MODEL});
          }
          lastStatus=502; lastError='OpenRouter returned invalid JSON';
        }
        console.error('OpenRouter attempt failed',{id,status:lastStatus,response:lastError});
      } catch(error) {
        lastStatus=error?.name==='AbortError'?504:502; lastError=String(error?.message||error);
        console.error('OpenRouter request failed',{id,status:lastStatus,reason:lastError});
      }
    }
    console.error('All configured AI providers failed',{id,status:lastStatus,response:lastError});
    if(lastStatus===401||lastStatus===403) return fail(res,502,'AI_AUTH','Een AI-provider accepteert de ingestelde API-sleutel niet. Controleer de Vercel-omgevingsvariabelen.',id);
    if(lastStatus===429) return fail(res,429,'AI_QUOTA','De AI-diensten hebben tijdelijk geen capaciteit of quota meer. Probeer het later opnieuw.',id);
    if([502,503,504].includes(lastStatus)) return fail(res,503,'AI_UNAVAILABLE','De AI-fotoscan reageerde niet op tijd. Probeer het met dezelfde foto opnieuw.',id);
    if(lastStatus===400) return fail(res,502,'AI_BAD_REQUEST','Een AI-dienst kon deze foto-aanvraag niet verwerken. Probeer een andere of duidelijkere foto.',id);
    return fail(res,502,'AI_ERROR','De AI-diensten konden de foto niet analyseren. Probeer het opnieuw.',id);
  } catch(error) {
    console.error('analyze-food error',id,error);
    return fail(res,500,'INTERNAL_ERROR','Er ging iets mis bij de AI-fotoscan. Probeer het opnieuw.',id);
  }
}
