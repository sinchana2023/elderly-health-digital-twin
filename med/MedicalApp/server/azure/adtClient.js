/**
 * Real Azure Digital Twins client (DTDL models + twin upsert/patch).
 * Uses @azure/digital-twins-core + ClientSecretCredential when secrets are set.
 */
const fs = require('fs');
const path = require('path');
const { ClientSecretCredential } = require('@azure/identity');
const { DigitalTwinsClient } = require('@azure/digital-twins-core');
const { getAdtConfig } = require('./config');

const MODEL_DIR = path.join(__dirname, '../../models/dtdl');

const MODEL_IDS = {
  patient: 'dtmi:medassist:ElderlyPatient;1',
  wearable: 'dtmi:medassist:WearableDevice;1',
  environment: 'dtmi:medassist:CareEnvironment;1',
};

const TWIN_IDS = {
  patient: 'patient-demo-elder',
  wearable: 'wearable-esp32Device',
  environment: 'env-home-livingroom',
};

let clientPromise = null;
let modelsEnsured = false;
let twinsEnsured = false;

function getClient() {
  const cfg = getAdtConfig();
  if (!cfg.configured) return null;
  if (!clientPromise) {
    const credential = new ClientSecretCredential(
      cfg.tenantId,
      cfg.clientId,
      cfg.clientSecret
    );
    clientPromise = Promise.resolve(new DigitalTwinsClient(cfg.url, credential));
  }
  return clientPromise;
}

function loadDtdlModels() {
  return ['ElderlyPatient.json', 'WearableDevice.json', 'CareEnvironment.json'].map((file) => {
    const raw = fs.readFileSync(path.join(MODEL_DIR, file), 'utf8');
    return JSON.parse(raw);
  });
}

async function ensureModels(client) {
  if (modelsEnsured) return;
  const models = loadDtdlModels();
  try {
    // createModels is idempotent enough for demo; ignore "already exists"
    await client.createModels(models);
  } catch (e) {
    const msg = String(e?.message || e);
    if (!/already exists|ModelIdAlreadyExists|409/i.test(msg)) {
      // Some tenants already have models — continue
      console.warn('[ADT] createModels:', msg.slice(0, 200));
    }
  }
  modelsEnsured = true;
}

function patientTwinDoc(seed = {}) {
  return {
    $metadata: { $model: MODEL_IDS.patient },
    fullName: seed.fullName || 'Demo Elder',
    age: seed.age ?? 72,
    homeLatitude: seed.homeLatitude ?? 28.6139,
    homeLongitude: seed.homeLongitude ?? 77.209,
    riskScore: seed.riskScore ?? 0,
    riskLevel: seed.riskLevel || 'normal',
    lastUpdated: seed.lastUpdated || new Date().toISOString(),
  };
}

function wearableTwinDoc(seed = {}) {
  return {
    $metadata: { $model: MODEL_IDS.wearable },
    deviceId: seed.deviceId || 'esp32Device',
    bpm: seed.bpm ?? 72,
    spo2: seed.spo2 ?? 98,
    bodyTempC: seed.bodyTempC ?? 36.6,
    accX: seed.accX ?? 0,
    accY: seed.accY ?? 0,
    accZ: seed.accZ ?? 9.8,
    gyroX: seed.gyroX ?? 0,
    gyroY: seed.gyroY ?? 0,
    gyroZ: seed.gyroZ ?? 0,
    gpsLat: seed.gpsLat ?? 28.6139,
    gpsLng: seed.gpsLng ?? 77.209,
    gpsSpeed: seed.gpsSpeed ?? 0,
    fallLikely: Boolean(seed.fallLikely),
    lastTelemetry: seed.lastTelemetry || new Date().toISOString(),
  };
}

function environmentTwinDoc(seed = {}) {
  return {
    $metadata: { $model: MODEL_IDS.environment },
    roomId: seed.roomId || 'home-livingroom',
    roomTempC: seed.roomTempC ?? 24,
    humidityPct: seed.humidityPct ?? 45,
    comfortIndex: seed.comfortIndex ?? 69,
    lastUpdated: seed.lastUpdated || new Date().toISOString(),
  };
}

async function upsertTwinSafe(client, twinId, document) {
  await client.upsertDigitalTwin(twinId, JSON.stringify(document));
}

async function ensureTwins(client) {
  if (twinsEnsured) return;
  await upsertTwinSafe(client, TWIN_IDS.patient, patientTwinDoc());
  await upsertTwinSafe(client, TWIN_IDS.wearable, wearableTwinDoc());
  await upsertTwinSafe(client, TWIN_IDS.environment, environmentTwinDoc());

  // Relationships (ignore if already present)
  try {
    await client.upsertRelationship(
      TWIN_IDS.patient,
      'wears-1',
      JSON.stringify({
        $relationshipId: 'wears-1',
        $sourceId: TWIN_IDS.patient,
        $relationshipName: 'wears',
        $targetId: TWIN_IDS.wearable,
      })
    );
  } catch (e) {
    console.warn('[ADT] wears relationship:', String(e?.message || e).slice(0, 160));
  }
  try {
    await client.upsertRelationship(
      TWIN_IDS.patient,
      'locatedIn-1',
      JSON.stringify({
        $relationshipId: 'locatedIn-1',
        $sourceId: TWIN_IDS.patient,
        $relationshipName: 'locatedIn',
        $targetId: TWIN_IDS.environment,
      })
    );
  } catch (e) {
    console.warn('[ADT] locatedIn relationship:', String(e?.message || e).slice(0, 160));
  }

  twinsEnsured = true;
}

function patchFromObject(props) {
  return Object.entries(props)
    .filter(([, v]) => v !== undefined)
    .map(([key, value]) => ({
      op: 'replace',
      path: `/${key}`,
      value,
    }));
}

/**
 * Apply telemetry + ML risk onto ADT twins.
 * @returns {{ synced: boolean, reason?: string, twinIds?: object }}
 */
async function syncTelemetryToAdt(sample, risk = {}) {
  const cfg = getAdtConfig();
  if (!cfg.configured) {
    return { synced: false, reason: 'no_azure_credentials' };
  }

  const client = await getClient();
  await ensureModels(client);
  await ensureTwins(client);

  const now = sample.timestamp || new Date().toISOString();

  const wearablePatch = patchFromObject({
    deviceId: sample.device_id || 'esp32Device',
    bpm: sample.bpm,
    spo2: sample.spo2,
    bodyTempC: sample.lm35_temp,
    accX: sample.acc_x,
    accY: sample.acc_y,
    accZ: sample.acc_z,
    gyroX: sample.gyro_x,
    gyroY: sample.gyro_y,
    gyroZ: sample.gyro_z,
    gpsLat: sample.gps_lat,
    gpsLng: sample.gps_lng,
    gpsSpeed: sample.gps_speed,
    fallLikely: Boolean(risk?.topFeatures?.some((f) => f.feature === 'acc_mag_norm')),
    lastTelemetry: now,
  });

  const envPatch = patchFromObject({
    roomTempC: sample.dht_temp,
    humidityPct: sample.dht_hum,
    comfortIndex: (sample.dht_temp || 0) + (sample.dht_hum || 0),
    lastUpdated: now,
  });

  const patientPatch = patchFromObject({
    riskScore: risk.riskScore ?? 0,
    riskLevel: risk.riskLevel || 'normal',
    lastUpdated: now,
  });

  await client.updateDigitalTwin(TWIN_IDS.wearable, wearablePatch);
  await client.updateDigitalTwin(TWIN_IDS.environment, envPatch);
  await client.updateDigitalTwin(TWIN_IDS.patient, patientPatch);

  return { synced: true, twinIds: TWIN_IDS, models: MODEL_IDS };
}

async function getTwinGraphFromAdt() {
  const cfg = getAdtConfig();
  if (!cfg.configured) {
    return { available: false, reason: 'no_azure_credentials' };
  }
  const client = await getClient();
  await ensureModels(client);
  await ensureTwins(client);

  const [patient, wearable, environment] = await Promise.all([
    client.getDigitalTwin(TWIN_IDS.patient),
    client.getDigitalTwin(TWIN_IDS.wearable),
    client.getDigitalTwin(TWIN_IDS.environment),
  ]);

  return {
    available: true,
    mode: 'azure',
    twinIds: TWIN_IDS,
    models: MODEL_IDS,
    patient: patient.body || patient,
    wearable: wearable.body || wearable,
    environment: environment.body || environment,
  };
}

async function bootstrapAdt() {
  const cfg = getAdtConfig();
  if (!cfg.configured) {
    return { ok: false, reason: 'no_azure_credentials' };
  }
  const client = await getClient();
  modelsEnsured = false;
  twinsEnsured = false;
  await ensureModels(client);
  await ensureTwins(client);
  return { ok: true, twinIds: TWIN_IDS, models: MODEL_IDS };
}

module.exports = {
  MODEL_IDS,
  TWIN_IDS,
  syncTelemetryToAdt,
  getTwinGraphFromAdt,
  bootstrapAdt,
  getAdtConfig,
};
