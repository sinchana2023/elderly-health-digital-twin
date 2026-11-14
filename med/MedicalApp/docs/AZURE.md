# Azure Digital Twins + Cosmos (in-repo)

Full setup lives in the project store doc `docs/azure-adt-cosmos-setup.md`. Summary:

- **ADT**: `server/azure/adtClient.js` — real Digital Twins SDK
- **Cosmos**: `server/azure/cosmosStore.js` — vitals + twin snapshots
- **Pipeline**: `server/azure/telemetryPipeline.js` — local + Azure ingest
- **API**: `POST /api/telemetry`, `GET /api/vitals/history`, `GET /api/twin`, `POST /api/azure/bootstrap`

Secret names: `AZURE_DIGITAL_TWINS_URL`, `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_COSMOS_ENDPOINT`, `AZURE_COSMOS_KEY` (+ optional database/container names).
