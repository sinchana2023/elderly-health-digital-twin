# Elderly Health Digital Twin — MedAssist Web Demo

Capstone Batch 55 recovery of **MedAssist**, an elderly IoT health-monitoring app (ESP32 sensors → cloud → mobile dashboard).

## Hostable web demo

```bash
cd med/MedicalApp
npm install
npm run web
```

- Open the Expo web URL (default `http://localhost:8081`)
- Tap **Continue as Demo** (no Firebase/Azure/Arduino needed)
- Explore Home, Dashboard (ML risk), **Twin**, Medical AI chat, and vitals details

See [`med/MedicalApp/README.md`](med/MedicalApp/README.md) for mocks, Digital Twin / ML docs, and optional secret names.

## Original artifacts

- `Batch 55 capstone report.pdf`, poster, ppt, demo mp4
- `aurdino IDE code.txt` — ESP32 firmware notes
- `elderly-iot-function/` — Azure Functions
- `med/api-server.js`, Azure scripts — cloud backends (not required for the web demo)
