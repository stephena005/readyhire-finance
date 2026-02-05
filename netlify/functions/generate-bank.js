// Netlify Serverless Function — Question Bank Generation
// Generates a personalised question bank from CV data + Job Description

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
  if (!API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  try {
    const { cvData, jobDescription, targetRole, targetCompany, questionCount, caseCount, includeManagerLevel } = JSON.parse(event.body);
    console.log('Request:', { hasCV: !!cvData, hasJD: !!jobDescription, role: targetRole, company: targetCompany });

    if (!cvData && !jobDescription && !targetRole) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Need CV data, job description, or target role' }) };
    }

    // Build concise context from CV
    let cvContext = '';
    if (cvData) {
      const cur = cvData.employment_history?.find(e => e.is_current_role) || cvData.employment_history?.[0];
      const achievements = cvData.employment_history?.flatMap(e => e.achievements || []).slice(0, 5) || [];
      const skills = [...(cvData.skills?.technical_skills || []), ...(cvData.skills?.tools_software || [])].slice(0, 10);
      cvContext = `\nCANDIDATE: ${cvData.candidate_profile?.full_name || 'Candidate'}, ${cur?.job_title || 'N/A'} at ${cur?.company_name || 'N/A'}. Skills: ${skills.join(', ') || 'N/A'}. Achievements: ${achievements.slice(0, 3).join('; ') || 'N/A'}.`;
    }

    let jdContext = jobDescription ? `\nJOB DESCRIPTION:\n${jobDescription.slice(0, 2000)}` : '';
    let companyCtx = targetCompany ? `\nCOMPANY: ${targetCompany}` : '';

    const nQ = Math.min(questionCount || 5, 6);
    const nC = Math.min(caseCount || 1, 1);

    const prompt = `Generate ${nQ} finance interview questions and ${nC} case study as JSON.${cvContext}${jdContext}${companyCtx}${targetRole ? `\nROLE: ${targetRole}` : ''}
${includeManagerLevel ? 'Include leadership questions.' : ''}
Return ONLY this JSON:
{"questions":[{"id":1,"q":"Question text","type":"experience","cat":"Technical","difficulty":"intermediate","keys":["k1","k2"],"m":"Model answer","context":"Why relevant","direction":"How to structure","tips":"Tip"}],"cases":[{"id":1,"t":"Title","s":"Scenario","task":"Task","cat":"Category","d":"intermediate","time":30,"criteria":["c1","c2"],"m":"Approach","direction":"Guide","tips":"Tip","context":"Background"}],"bankMeta":{"targetRole":"${targetRole || 'Finance'}","difficulty":"mixed","personalisationLevel":"${cvData ? 'high' : 'standard'}","cvInsights":"Summary"}}`;

    console.log('Calling Anthropic API, prompt length:', prompt.length);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error('Anthropic API error:', response.status, errBody);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI service error: ' + response.status, detail: errBody.slice(0, 200) }) };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    console.log('Response length:', text.length, 'First 100 chars:', text.slice(0, 100));
    const match = text.match(/\{[\s\S]*\}/);

    if (match) {
      const parsed = JSON.parse(match[0]);
      console.log('Success: questions:', parsed.questions?.length, 'cases:', parsed.cases?.length);
      return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    }

    console.error('No JSON in response:', text.slice(0, 500));
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not generate question bank' }) };
  } catch (error) {
    console.error('Question bank generation error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Internal server error' }) };
  }
};
