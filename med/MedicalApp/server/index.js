/**
 * MedAssist API host: chat + Azure Digital Twins + Cosmos persistence.
 *
 * Secrets (names only — set via Cursor Secrets / host env):
 *   MEDASSIST_AI_API_KEY, MEDASSIST_AI_BASE_URL, MEDASSIST_AI_MODEL
 *   AZURE_DIGITAL_TWINS_URL, AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
 *   AZURE_COSMOS_ENDPOINT, AZURE_COSMOS_KEY
 *   AZURE_COSMOS_DATABASE (optional, default medassist)
 *   AZURE_COSMOS_VITALS_CONTAINER / AZURE_COSMOS_TWIN_CONTAINER (optional)
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
const { getAzureStatus } = require('./azure/config');
const { bootstrapAdt } = require('./azure/adtClient');
const {
  ingestTelemetry,
  readHistory,
  readTwinState,
} = require('./azure/telemetryPipeline');

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, '../dist');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/api/health', (_req, res) => {
  const azure = getAzureStatus();
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.MEDASSIST_AI_API_KEY),
    ...azure,
  });
});

app.get('/api/azure/status', (_req, res) => {
  res.json(getAzureStatus());
});

app.post('/api/azure/bootstrap', async (_req, res) => {
  try {
    const result = await bootstrapAdt();
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, reason: e.message });
  }
});

/** Ingest vitals → local buffer + Cosmos + ADT patch */
app.post('/api/telemetry', async (req, res) => {
  try {
    const sample = req.body?.sample || req.body;
    if (!sample || typeof sample !== 'object') {
      return res.status(400).json({ ok: false, reason: 'sample required' });
    }
    const risk = req.body?.risk;
    const result = await ingestTelemetry(sample, risk);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, reason: e.message });
  }
});

app.get('/api/vitals/history', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 40;
    const deviceId = String(req.query.deviceId || 'esp32Device');
    const result = await readHistory(limit, deviceId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ source: 'error', items: [], reason: e.message });
  }
});

app.get('/api/twin', async (_req, res) => {
  try {
    const result = await readTwinState();
    res.json(result);
  } catch (e) {
    res.status(500).json({ source: 'error', reason: e.message });
  }
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
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.type('html').send(
      `<p>MedAssist API is running (Azure ADT + Cosmos routes ready). Use <code>npm run web</code> for Expo UI, or <code>npm run export:web</code> then restart to serve <code>dist/</code>.</p>`
    );
  });
}

app.listen(PORT, () => {
  const azure = getAzureStatus();
  console.log(`[MedAssist server] http://127.0.0.1:${PORT}`);
  console.log(
    `[MedAssist server] mode=${azure.mode} adt=${azure.adtConfigured} cosmos=${azure.cosmosConfigured}`
  );
});
