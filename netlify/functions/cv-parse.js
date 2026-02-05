// Netlify Serverless Function — CV Parsing via Claude
// Extracts structured professional data from CV text

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };

  try {
    const { cvText } = JSON.parse(event.body);
    if (!cvText || cvText.length < 50) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'CV text too short or missing' }) };
    }

    const systemPrompt = `You are an expert information extraction system.
Your task is to extract structured professional data from a candidate CV.
The CV text may be poorly formatted, include tables, bullet points, headers, or inconsistent ordering.
Do not summarize. Do not rewrite. Only extract and structure.

EXTRACTION RULES:
1. Only use information explicitly present in the CV. Do NOT infer. Do NOT assume seniority, skills, or dates.
2. If information is missing, return null.
3. Standardize formats: Dates as YYYY-MM, country names in full, employment type as one of ["Full-time","Part-time","Contract","Internship","Consulting","Freelance","Unknown"].
4. Do not merge roles even if at the same company.
5. Preserve career chronology exactly as written.

SPECIAL EXTRACTION LOGIC:
- Responsibilities = duties, role scope, team size, reporting lines
- Achievements = metrics, outcomes, impact, improvements (look for %, £, $, growth, reductions, revenue, cost savings)
- Skills: Classify into technical_skills (e.g. SQL, Python, IFRS), tools_software (e.g. SAP, Excel, Tableau), soft_skills (e.g. Leadership, Stakeholder Management), languages (e.g. English, French)

DISAMBIGUATION RULES:
- "Led a team of 6 analysts" → Responsibility
- "Reduced costs by 18%" → Achievement

DO NOT: Fabricate missing months, Guess industries, Expand acronyms, Rewrite sentences.

Return ONLY valid JSON in this exact schema:
{
  "candidate_profile": {
    "full_name": "",
    "email": "",
    "phone": "",
    "location": { "city": "", "country": "" },
    "linkedin_url": "",
    "portfolio_url": "",
    "professional_summary": ""
  },
  "employment_history": [
    {
      "company_name": "",
      "company_industry": "",
      "job_title": "",
      "employment_type": "",
      "location": { "city": "", "country": "" },
      "start_date": "",
      "end_date": "",
      "is_current_role": false,
      "responsibilities": [],
      "achievements": [],
      "technologies_used": []
    }
  ],
  "education": [
    { "institution": "", "degree": "", "field_of_study": "", "start_year": "", "end_year": "" }
  ],
  "certifications": [
    { "name": "", "issuing_body": "", "year": "" }
  ],
  "skills": {
    "technical_skills": [],
    "tools_software": [],
    "soft_skills": [],
    "languages": []
  },
  "projects": [
    { "project_name": "", "description": "", "technologies_used": "", "year": "" }
  ],
  "publications": [],
  "awards": [],
  "volunteer_experience": [],
  "additional_information": []
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `CV TEXT TO PROCESS:\n\n${cvText.slice(0, 15000)}` }],
      }),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI service error' }) };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);

    if (match) {
      const parsed = JSON.parse(match[0]);
      return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    }

    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not parse CV data' }) };
  } catch (error) {
    console.error('CV parse error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
