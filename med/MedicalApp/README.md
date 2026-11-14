# MedAssist — Elderly IoT Health Monitoring (Web Demo)

Batch 55 capstone recovery: **MedAssist** monitors elderly vitals from an ESP32 sensor kit (heart rate, SpO2, body/room temp, motion, GPS). This branch runs as a **hostable web demo** with **local mock sensor data** — no Azure IoT Hub, Firebase, or Arduino required.

## Run locally (web)

```bash
cd med/MedicalApp
npm install
npm run web
```

Open the URL Expo prints (usually `http://localhost:8081`).

### Demo login

- Tap **Continue as Demo**, or
- Email / password: any values (e.g. `demo@medassist.local` / `demo1234`)

## What was mocked

| Original | Demo |
|----------|------|
| ESP32 → Azure IoT Hub | `app/services/mockHealthStore.js` simulated stream |
| Firebase Auth / Firestore | Local AsyncStorage demo session |
| Push notifications | In-app alert list (web-safe) |
| Live maps | Coordinates + chart; map tiles omitted |

Preserved UX: splash → onboarding → login → Home / Dashboard / Medical AI / Profile, vitals detail screens, anomaly alerts (fever, SpO2, BPM, fall).

## Product identity

- Brand: **MedAssist** — “Your Health Companion”
- Accent: `#00CEC9`
- Theme: elderly IoT health monitoring (Batch 55)

## Notes

- `npm run web` uses Expo web (`react-native-web`).
- Optional static export: `npx expo export -p web` (output under `dist/`).
