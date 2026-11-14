const MEDICAL_DISCLAIMER =
  'Disclaimer: MedAssist AI provides general health information only. It is not a doctor, does not diagnose or prescribe, and is not a substitute for professional medical care. Seek emergency help for urgent symptoms.';

const BLOCKED_PATTERNS = [
  /\b(kill|suicide|self[\s-]?harm|hurt myself)\b/i,
  /\b(make|build|buy)\b.*\b(bomb|weapon|poison|explosive)\b/i,
  /\b(hack|phishing|steal)\b.*\b(account|password|bank)\b/i,
];

const OUT_OF_SCOPE = [
  /\b(write (me )?code|leetcode|homework|essay)\b/i,
  /\b(stock tip|crypto|gambling)\b/i,
  /\b(romance|dating|flirt)\b/i,
  /\b(joke|poem|story)\b/i,
];

const DIAGNOSIS_ASK = [
  /\b(diagnos[ea]|what do i have|is it cancer|prescribe|dosage|how many (mg|pills))\b/i,
  /\b(should i (stop|start) (taking|my) (medication|medicine|drug))\b/i,
];

const MEDICAL_HINTS = [
  /\b(heart|bpm|pulse|spo2|oxygen|temp(erature)?|fever|fall|dizzy|blood|pressure|sleep|diet|exercise|pain|breath|cough|hydrat|vitamin|elderly|senior|caregiver)\b/i,
  /\b(vital|symptom|health|wellness|medicine|appointment|monitor|risk|twin)\b/i,
];

function classifyUserMessage(text = '') {
  const msg = String(text).trim();
  if (!msg) return { action: 'empty' };
  for (const re of BLOCKED_PATTERNS) if (re.test(msg)) return { action: 'refuse_harmful' };
  for (const re of OUT_OF_SCOPE) {
    if (re.test(msg) && !MEDICAL_HINTS.some((m) => m.test(msg))) {
      return { action: 'refuse_out_of_scope' };
    }
  }
  for (const re of DIAGNOSIS_ASK) if (re.test(msg)) return { action: 'refuse_diagnosis' };
  if (!MEDICAL_HINTS.some((m) => m.test(msg))) return { action: 'refuse_out_of_scope' };
  return { action: 'allow' };
}

function guardrailReply(action) {
  switch (action) {
    case 'empty':
      return `Please ask a health or monitoring question.\n\n${MEDICAL_DISCLAIMER}`;
    case 'refuse_harmful':
      return `I can’t help with that request. If you or someone else is in danger, contact local emergency services immediately.\n\n${MEDICAL_DISCLAIMER}`;
    case 'refuse_diagnosis':
      return `I can’t diagnose conditions or prescribe/adjust medications. I can share general information about vitals and when to seek care — please consult a licensed clinician for personal medical decisions.\n\n${MEDICAL_DISCLAIMER}`;
    case 'refuse_out_of_scope':
      return `I’m limited to general medical and elderly-care monitoring topics (vitals, wellness, when to seek help). Please rephrase as a health question.\n\n${MEDICAL_DISCLAIMER}`;
    default:
      return MEDICAL_DISCLAIMER;
  }
}

function appendDisclaimer(text) {
  if (!text) return MEDICAL_DISCLAIMER;
  if (text.includes('not a doctor') || text.includes('Disclaimer:')) return text;
  return `${String(text).trim()}\n\n${MEDICAL_DISCLAIMER}`;
}

const SYSTEM_PROMPT = `You are MedAssist Medical AI for an elderly IoT health monitoring demo.
Rules:
- Only discuss general health, vitals, wellness, and elderly-care monitoring.
- Never diagnose, prescribe, or recommend specific drug dosages.
- Refuse harmful, illegal, or unrelated requests briefly.
- Always remind the user you are not a doctor and they should seek professional care for personal decisions.
- If given twin/vitals context, explain it in plain language without alarming unnecessarily.`;

module.exports = {
  MEDICAL_DISCLAIMER,
  SYSTEM_PROMPT,
  classifyUserMessage,
  guardrailReply,
  appendDisclaimer,
};
