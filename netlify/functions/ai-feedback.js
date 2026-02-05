// Netlify Serverless Function — AI Feedback
// Securely proxies requests to Anthropic API, keeping API key server-side only

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    console.error('ANTHROPIC_API_KEY not configured');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  try {
    const { question, answer, context } = JSON.parse(event.body);

    if (!question || !answer) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing question or answer' }) };
    }

    const prompt = `Finance interview coach. Analyse this answer strictly and fairly.
Context: ${context || 'Finance interview'}
Question: ${question.q}
Answer: ${answer}
Key concepts expected: ${(question.keys || []).join(', ')}
Model answer: ${question.m || 'N/A'}

Respond with JSON only, no other text:
{"score":0-100,"strengths":[{"t":"title","d":"detail"}],"improvements":[{"t":"title","d":"detail"}],"found":[],"missing":[],"summary":"2 sentences max"}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI service error' }) };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);

    if (match) {
      const parsed = JSON.parse(match[0]);
      return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ error: 'Could not parse AI response' }) };
  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
