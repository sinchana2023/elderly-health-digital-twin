# MedAssist — Elderly IoT + Digital Twin + ML + AI Chat

Batch 55 capstone recovery with:

- **Local / Azure Digital Twins** (DTDL patient, wearable, environment)
- **Simulated ESP32 vitals** feeding the twin and UI
- **ML anomaly scoring** (logistic regression on synthetic elderly vitals)
- **Guardrailed Medical AI chat** (API when keyed; local fallback otherwise)

## Run (web UI)

```bash
cd med/MedicalApp
npm install
npm run web
```

Open the Expo URL → **Continue as Demo**.

Tabs: Home · Dashboard (ML risk) · Twin · Medical AI · Profile.

## API host (Azure ADT + Cosmos + chat)

```bash
npm run server       # Express on :3000 — /api/telemetry, /api/twin, /api/vitals/history, /api/chat
# with Expo UI also running, telemetry is posted to the API automatically
npm run azure:bootstrap   # upload DTDL + upsert twins when ADT secrets are set
```

**Database choice:** Azure **Cosmos DB** (SQL API) for vitals history + twin snapshots — document-shaped data matches ADT payloads. Details: [`docs/AZURE.md`](docs/AZURE.md).

## Secrets (names only — set in Cursor Secrets / host env)

| Name | Required? | Purpose |
|------|-----------|---------|
| `MEDASSIST_AI_API_KEY` | No | OpenAI-compatible key for `/api/chat` |
| `MEDASSIST_AI_BASE_URL` | No | API base (default `https://api.openai.com/v1`) |
| `MEDASSIST_AI_MODEL` | No | Model id (default `gpt-4o-mini`) |
| `AZURE_DIGITAL_TWINS_URL` | No | ADT instance URL |
| `AZURE_TENANT_ID` | No | Entra tenant |
| `AZURE_CLIENT_ID` | No | App registration id |
| `AZURE_CLIENT_SECRET` | No | App registration secret |
| `AZURE_COSMOS_ENDPOINT` | No | Cosmos account URI |
| `AZURE_COSMOS_KEY` | No | Cosmos key |
| `AZURE_COSMOS_DATABASE` | No | Default `medassist` |

Demo works with **zero** secrets (local twin + local chat + ML). With secrets, `POST /api/telemetry` writes Cosmos and patches ADT.

## ML model

```bash
npm run train:ml
```

Docs: [`models/ml/README.md`](models/ml/README.md). DTDL: [`models/dtdl/`](models/dtdl/).

## Chat guardrails

Medical-info only · no diagnosis/prescription · refuse harmful/out-of-scope · always non-doctor disclaimer.
