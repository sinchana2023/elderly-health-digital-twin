/**
 * Optional host for static Expo web export + MedAssist API routes.
 * Secrets (never commit values):
 *   MEDASSIST_AI_API_KEY, MEDASSIST_AI_BASE_URL
 *   AZURE_DIGITAL_TWINS_URL, AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
 */
const path = require('path');
const fs = require('fs');
const express = require('express');

const {
  classifyUserMessage,
  guardrailReply,
  appendDisclaimer,
  SYSTEM_PROMPT,
  MEDICAL_DISCLAIMER,
} = require('./guardrails.cjs');

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, '../dist');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.MEDASSIST_AI_API_KEY),
    adtConfigured: Boolean(
      process.env.AZURE_DIGITAL_TWINS_URL &&
        process.env.AZURE_TENANT_ID &&
        process.env.AZURE_CLIENT_ID &&
        process.env.AZURE_CLIENT_SECRET
    ),
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    const twinContext = req.body?.twinContext || {};
    const decision = classifyUserMessage(message);
    if (decision.action !== 'allow') {
      return res.json({
        reply: guardrailReply(decision.action),
        source: 'guardrail',
        blocked: true,
      });
    }

    const apiKey = process.env.MEDASSIST_AI_API_KEY;
    if (!apiKey) {
      return res.json({
        reply: appendDisclaimer(
          `API key not bound. Local overview: twin risk ${twinContext?.patient?.riskScore ?? 'n/a'}%, BPM ${twinContext?.wearable?.bpm ?? 'n/a'}, SpO2 ${twinContext?.wearable?.spo2 ?? 'n/a'}%. Ask a clinician for personal advice.`
        ),
        source: 'server_fallback',
        blocked: false,
      });
    }

    const base = (process.env.MEDASSIST_AI_BASE_URL || 'https://api.openai.com/v1').replace(
      /\/$/,
      ''
    );
    const contextBlock = JSON.stringify(twinContext).slice(0, 4000);
    const upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.MEDASSIST_AI_MODEL || 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'system',
            content: `Current digital twin / vitals context (JSON): ${contextBlock}`,
          },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.warn('AI upstream error', upstream.status, errText.slice(0, 200));
      return res.json({
        reply: appendDisclaimer(
          'The AI provider request failed. Showing a safe fallback: please consult a clinician for personal medical questions.'
        ),
        source: 'upstream_error',
      });
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return res.json({
      reply: appendDisclaimer(content || MEDICAL_DISCLAIMER),
      source: 'openai_compatible',
      blocked: false,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      reply: appendDisclaimer('Chat service error.'),
      source: 'error',
    });
  }
});

if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.type('html').send(
      `<p>MedAssist API is running. Build the web app with <code>npm run export:web</code> to serve UI from <code>dist/</code>, or use <code>npm run web</code> for Expo.</p>`
    );
  });
}

app.listen(PORT, () => {
  console.log(`[MedAssist server] http://127.0.0.1:${PORT}`);
});
