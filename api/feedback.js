// Vercel Serverless Function
// This keeps your Anthropic API key secure on the server

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { question, answer, context } = req.body;

  // Validate input
  if (!question || !answer) {
    return res.status(400).json({ error: 'Missing question or answer' });
  }

  try {
    const prompt = `You are an expert finance interview coach. Analyse this interview answer.

Context: ${context || 'Finance interview'}
Question: ${question.q}
Candidate's Answer: ${answer}
Key concepts that should be covered: ${question.keys?.join(', ') || 'N/A'}
Model answer for reference: ${question.m || 'N/A'}

Evaluate the answer and respond with ONLY a JSON object (no markdown, no explanation):
{
  "score": <number 0-100>,
  "strengths": [{"t": "<strength title>", "d": "<specific detail from their answer>"}],
  "improvements": [{"t": "<improvement title>", "d": "<actionable advice>"}],
  "found": [<list of key concepts they covered>],
  "missing": [<list of key concepts they missed>],
  "summary": "<2-3 sentence assessment>"
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return res.status(response.status).json({ error: 'AI service error' });
    }

    const data = await response.json();
    
    // Extract the text content
    const text = data.content?.[0]?.text || '';
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const feedback = JSON.parse(jsonMatch[0]);
        return res.status(200).json(feedback);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return res.status(200).json({ 
          error: 'Could not parse AI response',
          raw: text 
        });
      }
    } else {
      return res.status(200).json({ 
        error: 'No JSON in response',
        raw: text 
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
}
