/**
 * AI product-content generation via Google Gemini.
 * Falls back to a deterministic mock when GEMINI_API_KEY is not set,
 * so the feature works in demos without a key.
 */
const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

function mock(name, category) {
  const cat = category ? ` in the ${category} category` : '';
  return {
    description:
      `The ${name} is a high-quality product${cat} designed to deliver reliable ` +
      `everyday performance. Thoughtfully made with attention to detail, it offers great ` +
      `value and is a dependable choice for customers who want quality they can trust.`,
    tags: [name.toLowerCase().split(' ')[0], category?.toLowerCase(), 'bestseller', 'new-arrival']
      .filter(Boolean)
      .slice(0, 5),
    _mock: true,
  };
}

async function callGemini(prompt) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent` +
    `?key=${process.env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  return JSON.parse(text);
}

export async function generateProductContent({ name, category, keywords }) {
  if (!name) throw new Error('Product name is required');

  if (!process.env.GEMINI_API_KEY) {
    return mock(name, category);
  }

  const prompt =
    `You are an e-commerce copywriter. For the product "${name}"` +
    (category ? ` (category: ${category})` : '') +
    (keywords ? ` with keywords: ${keywords}` : '') +
    `, respond with strict JSON of shape ` +
    `{"description": string (2-3 sentences, marketing tone), "tags": string[] (3-6 lowercase tags)}.`;

  try {
    const out = await callGemini(prompt);
    return {
      description: out.description || mock(name, category).description,
      tags: Array.isArray(out.tags) ? out.tags.slice(0, 6) : mock(name, category).tags,
      _mock: false,
    };
  } catch (err) {
    console.error('Gemini failed, using mock:', err.message);
    return { ...mock(name, category), _error: err.message };
  }
}
