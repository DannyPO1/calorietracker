const MODEL = 'gemini-3.1-flash-lite';
const MODEL_TIMEOUT_MS = 20000;

// Give Vercel enough headroom for a normal Lite response plus JSON parsing/response.
export const config = { maxDuration: 30 };

function requestId() {
  try { return crypto.randomUUID(); } catch (_) { return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
}

const ALLOWED_ORIGINS = new Set([
  'https://dannypo1.github.io',
  'https://calorietracker-dusky.vercel.app'
]);

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Dutch name of one clearly visible food or drink item.'
          },
          grams: {
            type: 'number',
            description: 'Estimated edible amount in grams or milliliters. Use a practical estimate based only on what is visible.'
          },
          confidence: {
            type: 'number',
            description: 'Confidence from 0 to 1 for identifying this item and its visible amount.'
          },
          notes: {
            type: 'string',
            description: 'Very short Dutch note about uncertainty, preparation, or why the amount is an estimate.'
          }
        },
        required: ['name', 'grams', 'confidence', 'notes']
      }
    }
  },
  required: ['items']
};

function send(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function errorResponse(res, status, code, error, id) {
  return send(res, status, { error, code, requestId: id });
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin) {
    if (!ALLOWED_ORIGINS.has(origin)) {
      return send(res, 403, { error: 'Deze app-omgeving is niet toegestaan.' });
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return send(res, 405, { error: 'Alleen POST is toegestaan.' });

  const id = requestId();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return errorResponse(res, 500, 'CONFIG_MISSING', 'De AI-fotoscan is niet correct geconfigureerd.', id);
  }
  console.info('AI food request', id);

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const image = String(body?.image || '');
    const mimeType = String(body?.mimeType || 'image/jpeg');

    if (!image) return errorResponse(res, 400, 'NO_IMAGE', 'Geen foto ontvangen.', id);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return errorResponse(res, 400, 'INVALID_IMAGE_TYPE', 'Gebruik een JPEG-, PNG- of WebP-foto.', id);
    }

    // Keep the public endpoint bounded. The frontend normally sends a resized JPEG,
    // so this also protects the free Gemini quota from oversized requests.
    if (image.length > 8_000_000) {
      return errorResponse(res, 413, 'IMAGE_TOO_LARGE', 'De foto is te groot. Probeer opnieuw met een kleinere foto.', id);
    }

    const prompt = [
      'Analyseer de bijgevoegde foto uitsluitend op zichtbare voeding en drank.',
      'Wees conservatief: herken een voedingsmiddel niet alleen op basis van de ronde of platte vorm. Gebruik ook oppervlak, textuur, kleur, verpakking en zichtbare context.',
      'Noem iets alleen hamburger of broodje als er daadwerkelijk duidelijke kenmerken van een hamburger/patty of broodje zichtbaar zijn. Een ronde koek, pannenkoek, omelet of andere ronde voeding is niet automatisch een hamburger.',
      'Maak een lijst van afzonderlijke, duidelijk zichtbare voedingsmiddelen of dranken.',
      'Gebruik Nederlandse, concrete productnamen die geschikt zijn voor een voedingsdatabase.',
      'Schat per item het zichtbare eetbare gewicht in gram. Voor vloeistoffen mag je milliliter benaderen als gram. Gebruik geen standaardwaarde van 100 g alleen omdat het gewicht onbekend is; kies een realistische schatting op basis van het zichtbare formaat.',
      'Als een gerecht uit meerdere duidelijk zichtbare onderdelen bestaat, splits die onderdelen op wanneer dat redelijk kan.',
      'Neem geen bord, bestek, verpakking of decoratie op als voedingsmiddel.',
      'Verzin geen verborgen ingrediënten die je niet kunt zien.',
      'Geef GEEN calorieën, eiwitten, koolhydraten of vetten. Die waarden worden door de app zelf uit de voedingsdatabase gehaald.',
      'Als je iets niet betrouwbaar kunt herkennen, geef het een lage confidence en een korte Nederlandse note.',
      'Retourneer uitsluitend JSON volgens het opgegeven schema.'
    ].join('\n');

    const geminiPayload = {
      model: PRIMARY_MODEL,
      input: [
        { type: 'text', text: prompt },
        { type: 'image', data: image, mime_type: mimeType, resolution: 'medium' }
      ],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: RESPONSE_SCHEMA
      }
    };

    let response = null;
    let raw = '';
    let result = null;
    let lastStatus = null;
    let lastModel = MODEL;

    async function callGemini() {
      const payload = { ...geminiPayload, model: MODEL };
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
      let r;
      try {
        r = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
      } catch (fetchError) {
        lastStatus = fetchError?.name === 'AbortError' ? 504 : 502;
        lastModel = MODEL;
        raw = fetchError?.name === 'AbortError' ? 'Gemini request timed out' : String(fetchError?.message || fetchError);
        result = null;
        console.warn('Gemini request timed out/failed', { id, model: MODEL, reason: raw });
        return false;
      } finally {
        clearTimeout(timeout);
      }

      const text = await r.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch (_) {}

      lastStatus = r.status;
      lastModel = MODEL;
      response = r;
      raw = text;
      result = parsed;

      if (!r.ok) {
        console.warn('Gemini model attempt failed', { id, model: MODEL, status: r.status });
        return false;
      }

      console.info('Gemini request succeeded', { id, model: MODEL });
      return true;
    }

    // v6.1.1 deliberately uses only Gemini 3.1 Flash-Lite. It is the only
    // model we have observed consistently accepting these image requests.
    // Avoiding the unavailable Flash models also keeps the browser request
    // short enough to return a reliable response on iPhone/Safari.
    const ok = await callGemini();

    if (!ok) {
      console.error('Gemini API failed after retries/fallback', {
        id, model: lastModel, status: lastStatus, response: raw.slice(0, 1500)
      });
      if (lastStatus === 401 || lastStatus === 403) {
        return errorResponse(res, 502, 'GEMINI_AUTH', 'De AI-service accepteert de ingestelde API-sleutel niet.', id);
      }
      if (lastStatus === 429) {
        return errorResponse(res, 429, 'GEMINI_QUOTA', 'De AI-service heeft tijdelijk geen capaciteit meer. Probeer het later opnieuw.', id);
      }
      if (lastStatus === 503 || lastStatus === 502 || lastStatus === 504) {
        return errorResponse(res, 503, 'GEMINI_UNAVAILABLE', 'De AI-service reageerde niet op tijd. Probeer het met dezelfde foto opnieuw.', id);
      }
      if (lastStatus === 400) {
        return errorResponse(res, 502, 'GEMINI_BAD_REQUEST', 'Gemini kon deze foto-aanvraag niet verwerken. Probeer eventueel een andere of duidelijkere foto.', id);
      }
      return errorResponse(res, 502, 'GEMINI_ERROR', 'De AI-service kon de foto niet analyseren. Probeer het opnieuw.', id);
    }

    // The Interactions REST response can expose the generated text inside a
    // model_output step rather than as a top-level output_text field.
    // Support both shapes so the app is resilient to the REST representation.
    const stepTexts = Array.isArray(result?.steps)
      ? result.steps
          .filter(step => step?.type === 'model_output' || step?.type === 'model_output_step' || step?.content)
          .flatMap(step => Array.isArray(step?.content) ? step.content : [])
          .filter(part => part?.type === 'text' && typeof part?.text === 'string')
          .map(part => part.text)
      : [];

    const outputText = result?.output_text ||
      result?.outputText ||
      result?.interaction?.output_text ||
      result?.interaction?.outputText ||
      stepTexts.join('') ||
      '';

    if (!outputText) {
      console.error('Gemini response without output text', JSON.stringify(result).slice(0, 5000));
      return errorResponse(res, 502, 'NO_AI_OUTPUT', 'Gemini gaf geen analyse terug. Probeer het opnieuw.', id);
    }

    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch (error) {
      console.error('Invalid structured Gemini output', outputText.slice(0, 1500));
      return errorResponse(res, 502, 'INVALID_AI_OUTPUT', 'Gemini gaf een ongeldig resultaat terug. Probeer het opnieuw.', id);
    }

    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const cleanItems = items
      .map(item => ({
        name: String(item?.name || '').trim().slice(0, 120),
        grams: Math.max(1, Math.min(3000, Number(item?.grams) || 100)),
        confidence: Math.max(0, Math.min(1, Number(item?.confidence) || 0)),
        notes: String(item?.notes || '').trim().slice(0, 220)
      }))
      .filter(item => item.name);

    console.info('AI food response ready', { id, model: MODEL, items: cleanItems.length });
    return send(res, 200, { items: cleanItems });
  } catch (error) {
    console.error('analyze-food error', id, error);
    return errorResponse(res, 500, 'INTERNAL_ERROR', 'Er ging iets mis bij de AI-fotoscan. Probeer het opnieuw.', id);
  }
}
