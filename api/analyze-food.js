const MODEL = 'gemini-3.8-flash';

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
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
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
    return send(res, 500, { error: 'GEMINI_API_KEY ontbreekt op Vercel.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const image = String(body?.image || '');
    const mimeType = String(body?.mimeType || 'image/jpeg');

    if (!image) return send(res, 400, { error: 'Geen foto ontvangen.' });
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return send(res, 400, { error: 'Gebruik een JPEG-, PNG- of WebP-foto.' });
    }

    // Keep the public endpoint bounded. The frontend normally sends a resized JPEG,
    // so this also protects the free Gemini quota from oversized requests.
    if (image.length > 8_000_000) {
      return send(res, 413, { error: 'De foto is te groot. Probeer opnieuw met een kleinere foto.' });
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

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(geminiPayload)
    });

    const raw = await response.text();
    let result = null;
    try { result = JSON.parse(raw); } catch (_) {}

    if (!response.ok) {
      console.error('Gemini API error', response.status, raw.slice(0, 1000));
      return send(res, response.status >= 500 ? 502 : response.status, {
        error: 'Gemini kon de foto niet analyseren. Probeer het opnieuw.'
      });
    }

    const outputText = result?.output_text ||
      result?.interaction?.output_text ||
      result?.interaction?.outputText ||
      '';

    if (!outputText) {
      console.error('Gemini response without output text', raw.slice(0, 1500));
      return send(res, 502, { error: 'Gemini gaf geen analyse terug.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch (error) {
      console.error('Invalid structured Gemini output', outputText.slice(0, 1500));
      return send(res, 502, { error: 'Gemini gaf geen geldig resultaat terug.' });
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
    console.error('analyze-food error', error);
    return send(res, 500, { error: 'Er ging iets mis bij de AI-fotoscan. Probeer het opnieuw.' });
  }
}
