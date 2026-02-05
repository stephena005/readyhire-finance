import { auth } from '../firebase';

const getAuthHeaders = async () => {
    const token = await auth.currentUser?.getIdToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const parseCVText = async (cvText) => {
    try {
        const r = await fetch('/.netlify/functions/cv-parse', {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ cvText })
        });
        if (!r.ok) throw new Error();
        return await r.json();
    } catch (e) {
        console.error('CV parse:', e);
        return null;
    }
};

export const generateQuestionBank = async (params) => {
    const maxRetries = 2;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const r = await fetch('/.netlify/functions/generate-bank', {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(params)
            });
            const data = await r.json();
            if (!r.ok) {
                console.error('Bank gen error:', r.status, data);
                if (attempt === 0) {
                    await new Promise(res => setTimeout(res, 1000));
                    continue;
                }
                return null;
            }
            return data;
        } catch (e) {
            console.error('Bank gen fetch error:', e);
            if (attempt === 0) {
                await new Promise(res => setTimeout(res, 1000));
                continue;
            }
            return null;
        }
    }
    return null;
};

export const getAIFeedback = async (question, answer, context) => {
    try {
        const r = await fetch('/.netlify/functions/ai-feedback', {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ question, answer, context })
        });
        const d = await r.json();
        if (d.score !== undefined) return d;
    } catch (e) {
        console.error('AI Feedback error:', e);
    }

    // Fallback scoring logic
    const ans = answer.toLowerCase();
    const keys = question.keys || [];
    const found = keys.filter(k => ans.includes(k.toLowerCase()));
    const missing = keys.filter(k => !ans.includes(k.toLowerCase()));
    const score = Math.round(Math.min((found.length / Math.max(keys.length, 1)) * 60 + Math.min(answer.split(/\s+/).length / 5, 25) + 10, 95));

    return {
        score,
        strengths: [{ t: 'Good attempt', d: found.length ? 'Covered: ' + found.slice(0, 2).join(', ') : 'Keep practising' }],
        improvements: [{ t: 'Add concepts', d: missing.length ? 'Consider: ' + missing.slice(0, 2).join(', ') : 'Review model' }],
        found,
        missing,
        summary: 'Score: ' + score + '. Covered ' + found.length + '/' + keys.length + ' concepts.'
    };
};

export const verifySubscription = async (userEmail) => {
    try {
        const r = await fetch('/.netlify/functions/verify-subscription', {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ userEmail })
        });
        if (!r.ok) return { tier: 'free' };
        return await r.json();
    } catch (e) {
        console.error('Verify sub error:', e);
        return { tier: 'free' };
    }
};

export const createCheckoutSession = async (priceId, userId, userEmail) => {
    try {
        const r = await fetch('/.netlify/functions/create-checkout', {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify({
                priceId,
                userId,
                userEmail,
                successUrl: window.location.origin + '/?checkout=success',
                cancelUrl: window.location.origin + '/'
            })
        });
        const d = await r.json();
        if (d.url) window.location.href = d.url;
    } catch (e) {
        console.error('Checkout error:', e);
        alert('Payment setup failed. Please try again.');
    }
};

export const exportProgress = (history, profile, score, weakAreas) => {
    const d = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const s = history.slice(0, 20).map(h => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${h.date.toLocaleDateString()}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${h.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">
        <span style="padding:2px 10px;border-radius:999px;font-weight:700;${h.score >= 70 ? 'background:#dcfce7;color:#166534' : 'background:#fef3c7;color:#92400e'}">${h.score}</span>
      </td>
    </tr>
  `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ReadyHire Report</title>
      <style>
        body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px 20px}
        h1{color:#4f46e5}
        table{width:100%;border-collapse:collapse}
        th{text-align:left;padding:10px 12px;background:#f8fafc;border-bottom:2px solid #e2e8f0;font-size:13px}
        .section{margin:32px 0;padding:24px;background:#f8fafc;border-radius:16px}
        @media print{.section{break-inside:avoid}}
      </style>
    </head>
    <body>
      <div style="text-align:center">
        <h1>ReadyHire Progress Report</h1>
        <p>${d}</p>
        <div style="width:120px;height:120px;border-radius:50%;border:8px solid ${score >= 70 ? '#10b981' : '#f59e0b'};display:flex;align-items:center;justify-content:center;margin:20px auto;font-size:36px;font-weight:900">
          ${score}
        </div>
        <p style="font-size:18px;font-weight:600">${profile?.currentRole || ''} to ${profile?.targetRole || ''}</p>
      </div>
      <div class="section">
        <h2>Sessions</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Topic</th><th>Score</th></tr>
          </thead>
          <tbody>${s}</tbody>
        </table>
      </div>
    </body>
    </html>
  `;

    const b = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'readyhire-report-' + new Date().toISOString().split('T')[0] + '.html';
    a.click();
};
