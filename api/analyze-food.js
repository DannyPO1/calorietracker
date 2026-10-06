const MODEL = 'gemini-3.8-flash';
const MAX_GEMINI_ATTEMPTS = 3;

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return errorResponse(res, 500, 'CONFIG_MISSING', 'De AI-fotoscan is niet correct geconfigureerd.', id);
  }

  const id = requestId();
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
      'Maak een lijst van afzonderlijke, duidelijk zichtbare voedingsmiddelen of dranken.',
      'Gebruik Nederlandse, concrete productnamen die geschikt zijn voor een voedingsdatabase.',
      'Schat per item het zichtbare eetbare gewicht in gram. Voor vloeistoffen mag je milliliter benaderen als gram.',
      'Als een gerecht uit meerdere duidelijk zichtbare onderdelen bestaat, splits die onderdelen op wanneer dat redelijk kan.',
      'Neem geen bord, bestek, verpakking of decoratie op als voedingsmiddel.',
      'Verzin geen verborgen ingrediënten die je niet kunt zien.',
      'Geef GEEN calorieën, eiwitten, koolhydraten of vetten. Die waarden worden door de app zelf uit de voedingsdatabase gehaald.',
      'Als je iets niet betrouwbaar kunt herkennen, geef het een lage confidence en een korte Nederlandse note.',
      'Retourneer uitsluitend JSON volgens het opgegeven schema.'
    ].join('\n');

    const geminiPayload = {
      model: MODEL,
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

    for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt++) {
      response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(geminiPayload)
      });

      raw = await response.text();
      result = null;
      try { result = JSON.parse(raw); } catch (_) {}

      if (response.ok) break;

      // Gemini can temporarily return 503 during demand spikes. Retry a few
      // times before surfacing the error to the app.
      const retryable = [429, 502, 503, 504].includes(response.status);
      if (retryable && attempt < MAX_GEMINI_ATTEMPTS) {
        console.warn('Gemini temporary/quota error; retrying', { id, status: response.status, attempt });
        const retryAfter = Number(response.headers.get('retry-after'));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 5000)
          : attempt * 1500;
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }

      console.error('Gemini API error', id, response.status, raw.slice(0, 1500));
      if (response.status === 401 || response.status === 403) {
        return errorResponse(res, 502, 'GEMINI_AUTH', 'De AI-service accepteert de ingestelde API-sleutel niet.', id);
      }
      if (response.status === 429) {
        return errorResponse(res, 429, 'GEMINI_QUOTA', 'De AI-service heeft tijdelijk geen capaciteit meer. Probeer het later opnieuw.', id);
      }
      if (response.status === 503) {
        return errorResponse(res, 503, 'GEMINI_UNAVAILABLE', 'Gemini is tijdelijk overbelast. Probeer het over een moment opnieuw.', id);
      }
      if (response.status === 400) {
        return errorResponse(res, 502, 'GEMINI_BAD_REQUEST', 'Gemini kon deze foto-aanvraag niet verwerken. Probeer eventueel een andere of duidelijkere foto.', id);
      }
      return errorResponse(res, response.status >= 500 ? 502 : response.status, 'GEMINI_ERROR', 'De AI-service kon de foto niet analyseren. Probeer het opnieuw.', id);
    }

    if (!response?.ok) {
      console.error('Gemini API failed after retries', response?.status, raw.slice(0, 1500));
      return errorResponse(res, 503, 'GEMINI_UNAVAILABLE', 'Gemini is tijdelijk niet beschikbaar. Probeer het over een moment opnieuw.', id);
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

    return send(res, 200, { items: cleanItems });
  } catch (error) {
    console.error('analyze-food error', id, error);
    return errorResponse(res, 500, 'INTERNAL_ERROR', 'Er ging iets mis bij de AI-fotoscan. Probeer het opnieuw.', id);
  }
}
