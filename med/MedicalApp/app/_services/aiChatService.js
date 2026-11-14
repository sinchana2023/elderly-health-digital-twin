/**
 * Guardrailed Medical AI chat.
 * Tries /api/chat (server holds MEDASSIST_AI_API_KEY); falls back to local engine.
 */

import {
  classifyUserMessage,
  guardrailReply,
  appendDisclaimer,
  MEDICAL_DISCLAIMER,
} from './aiChatGuardrails';
import { getTwinSnapshot } from './digitalTwinStore';
import { getLatest } from './mockHealthStore';

function localMedicalAnswer(message, twin) {
  const m = message.toLowerCase();
  const w = twin?.wearable || {};
  const risk = twin?.risk;

  if (/\b(heart|bpm|pulse)\b/.test(m)) {
    return appendDisclaimer(
      `A typical resting heart rate for older adults is often about 60–100 BPM. Your twin currently shows about ${w.bpm ?? '--'} BPM. Persistent readings well outside that range, especially with dizziness or chest discomfort, warrant clinician review.`
    );
  }
  if (/\b(spo2|oxygen|o2)\b/.test(m)) {
    return appendDisclaimer(
      `SpO2 (blood oxygen) is commonly near 95–100% at rest for many adults. The wearable twin reads ${w.spo2 ?? '--'}%. Levels that stay under ~92%, or sudden drops with shortness of breath, should be evaluated promptly by a professional.`
    );
  }
  if (/\b(temp|fever|temperature)\b/.test(m)) {
    return appendDisclaimer(
      `Normal body temperature is roughly 36.1–37.2°C. The twin body temperature is ${w.bodyTempC?.toFixed?.(1) ?? '--'}°C. Ongoing fever, confusion, or severe symptoms need medical attention — I can’t diagnose the cause.`
    );
  }
  if (/\b(fall|accel|balance)\b/.test(m)) {
    return appendDisclaimer(
      `Fall detection in this demo uses motion spikes from the wearable twin (fallLikely=${w.fallLikely ? 'yes' : 'no'}). After a real fall, check for injury and seek emergency care if the person hits their head, can’t get up, or has severe pain.`
    );
  }
  if (/\b(risk|anomaly|alert|score)\b/.test(m)) {
    return appendDisclaimer(
      `The ML risk score on the patient twin is ${risk?.riskScore ?? twin?.patient?.riskScore ?? '--'} (${risk?.riskLevel || twin?.patient?.riskLevel || 'n/a'}). Top signals: ${(risk?.reasons || []).join('; ') || 'none flagged'}. This is a demo model, not a clinical alarm system.`
    );
  }
  if (/\b(sleep|diet|exercise|hydrat|wellness)\b/.test(m)) {
    return appendDisclaimer(
      `General wellness tips for older adults often include regular light activity as approved by a clinician, balanced meals, steady hydration, and a consistent sleep schedule. Personal plans should come from their care team.`
    );
  }

  return appendDisclaimer(
    `I can help with general questions about heart rate, SpO2, temperature, falls, environment comfort, and how the MedAssist twin/ML risk score works. Ask about one of those topics for a more specific overview.`
  );
}

async function tryApiChat(message, twin) {
  const controllers = [];
  try {
    const ctrl = new AbortController();
    controllers.push(ctrl);
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        twinContext: {
          patient: twin?.patient,
          wearable: twin?.wearable,
          environment: twin?.environment,
          risk: twin?.risk,
        },
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.reply) return null;
    return {
      reply: appendDisclaimer(data.reply),
      source: data.source || 'api',
    };
  } catch {
    return null;
  }
}

export async function sendMedicalChat(message) {
  const decision = classifyUserMessage(message);
  if (decision.action !== 'allow') {
    return {
      reply: guardrailReply(decision.action),
      source: 'guardrail',
      blocked: true,
      action: decision.action,
    };
  }

  const twin = getTwinSnapshot();
  // Refresh risk from latest sample if needed
  if (!twin.risk) {
    const latest = getLatest();
    if (latest) {
      // twin may already be updated by sensor loop
    }
  }

  const api = await tryApiChat(message, twin);
  if (api) return { ...api, blocked: false };

  return {
    reply: localMedicalAnswer(message, twin),
    source: 'local_fallback',
    blocked: false,
    disclaimer: MEDICAL_DISCLAIMER,
  };
}

export function getChatModeHint() {
  return 'Uses API when /api/chat + MEDASSIST_AI_API_KEY are available; otherwise local guarded answers.';
}
