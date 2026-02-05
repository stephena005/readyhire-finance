// Netlify Serverless Function — AI Problem Generation
// Generates tailored interview questions and case studies

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  try {
    const { profile, type, targetCompany, companyData, levelName } = JSON.parse(event.body);

    if (!profile) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing profile' }) };
    }

    const companyContext = companyData
      ? `Target Company: ${companyData.name} (${companyData.style}). Sector: ${companyData.type}.`
      : `Industry: ${profile.ind || 'Finance'}.`;

    const prompt = `You are a high-end finance interview coach. Generate a realistic, challenging, and highly tailored ${type === 'case' ? 'business case study' : 'interview question'} for a ${profile.role?.t || 'Finance Professional'} at a ${profile.size || 'Standard'} company.
  
  User Profile:
  - Seniority: ${levelName || 'Finance'}
  - Role: ${profile.role?.t || 'N/A'} (${profile.role?.c || 'Technical'})
  - ${companyContext}
  
  Requirements:
  1. The scenario must be deeply relevant to the combined role, industry, and company size.
  2. If a company is provided, include sector-specific challenges.
  3. JSON only format:
  {
    "t": "Short Title",
    "s": "Detailed scenario/context (3-4 sentences)",
    "task": "Specific instruction for the candidate",
    "direction": "Step-by-step guidance on how to structure the answer",
    "tips": "Expert insider tip for this specific scenario",
    "keys": ["4-5 specific technical keywords or concepts for grading"],
    "m": "High-quality model answer (2-3 sentences)",
    "cat": "Technical/Commercial/Leadership",
    "d": "Custom",
    "time": 30,
    "criteria": ["3-4 evaluation criteria"],
    "context": "Extended backstory for case studies",
    "lk": false
  }`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
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
