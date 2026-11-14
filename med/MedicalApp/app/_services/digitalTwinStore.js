/**
 * In-process Azure Digital Twins mirror (DTDL-aligned).
 * Always available for the hostable demo; optional sync via azureDigitalTwins.js.
 */

import { scoreAnomaly } from './mlAnomalyModel';

const MODEL_IDS = {
  patient: 'dtmi:medassist:ElderlyPatient;1',
  wearable: 'dtmi:medassist:WearableDevice;1',
  environment: 'dtmi:medassist:CareEnvironment;1',
};

const twinIds = {
  patient: 'patient-demo-elder',
  wearable: 'wearable-esp32Device',
  environment: 'env-home-livingroom',
};

let graph = null;
let listeners = new Set();
let lastRisk = null;

function createGraph() {
  return {
    mode: 'local', // or 'azure' when synced
    models: MODEL_IDS,
    twins: {
      [twinIds.patient]: {
        $dtId: twinIds.patient,
        $metadata: { $model: MODEL_IDS.patient },
        fullName: 'Demo Elder',
        age: 72,
        homeLatitude: 28.6139,
        homeLongitude: 77.209,
        riskScore: 0,
        riskLevel: 'normal',
        lastUpdated: new Date().toISOString(),
      },
      [twinIds.wearable]: {
        $dtId: twinIds.wearable,
        $metadata: { $model: MODEL_IDS.wearable },
        deviceId: 'esp32Device',
        bpm: 72,
        spo2: 98,
        bodyTempC: 36.6,
        accX: 0,
        accY: 0,
        accZ: 9.8,
        gyroX: 0,
        gyroY: 0,
        gyroZ: 0,
        gpsLat: 28.6139,
        gpsLng: 77.209,
        gpsSpeed: 0,
        fallLikely: false,
        lastTelemetry: new Date().toISOString(),
      },
      [twinIds.environment]: {
        $dtId: twinIds.environment,
        $metadata: { $model: MODEL_IDS.environment },
        roomId: 'home-livingroom',
        roomTempC: 24,
        humidityPct: 45,
        comfortIndex: 69,
        lastUpdated: new Date().toISOString(),
      },
    },
    relationships: [
      {
        $relationshipId: 'wears-1',
        $sourceId: twinIds.patient,
        $targetId: twinIds.wearable,
        $relationshipName: 'wears',
      },
      {
        $relationshipId: 'locatedIn-1',
        $sourceId: twinIds.patient,
        $targetId: twinIds.environment,
        $relationshipName: 'locatedIn',
      },
    ],
  };
}

function ensure() {
  if (!graph) graph = createGraph();
  return graph;
}

function notify() {
  const snapshot = getTwinSnapshot();
  listeners.forEach((cb) => {
    try {
      cb(snapshot);
    } catch (e) {
      console.warn('digitalTwin listener error', e);
    }
  });
}

/**
 * Apply a sensor telemetry sample onto the twin graph + ML risk on the patient.
 */
export function updateTwinFromTelemetry(sample) {
  const g = ensure();
  const now = sample.timestamp || new Date().toISOString();
  const risk = scoreAnomaly(sample);
  lastRisk = risk;

  const wearable = g.twins[twinIds.wearable];
  wearable.bpm = sample.bpm;
  wearable.spo2 = sample.spo2;
  wearable.bodyTempC = sample.lm35_temp;
  wearable.accX = sample.acc_x;
  wearable.accY = sample.acc_y;
  wearable.accZ = sample.acc_z;
  wearable.gyroX = sample.gyro_x;
  wearable.gyroY = sample.gyro_y;
  wearable.gyroZ = sample.gyro_z;
  wearable.gpsLat = sample.gps_lat;
  wearable.gpsLng = sample.gps_lng;
  wearable.gpsSpeed = sample.gps_speed;
  wearable.fallLikely = risk.topFeatures?.some((f) => f.feature === 'acc_mag_norm' && f.contribution > 0.4) || false;
  wearable.lastTelemetry = now;

  const env = g.twins[twinIds.environment];
  env.roomTempC = sample.dht_temp;
  env.humidityPct = sample.dht_hum;
  env.comfortIndex = (sample.dht_temp || 0) + (sample.dht_hum || 0);
  env.lastUpdated = now;

  const patient = g.twins[twinIds.patient];
  patient.riskScore = risk.riskScore;
  patient.riskLevel = risk.riskLevel;
  patient.lastUpdated = now;

  notify();

  // Fire-and-forget: API → Cosmos persist + real ADT patch when secrets exist
  import('./azureDigitalTwins')
    .then((mod) => mod.maybeSyncTwinPatch?.(g, risk, sample))
    .catch(() => {});

  return { graph: g, risk };
}

export function getTwinSnapshot() {
  const g = ensure();
  return {
    mode: g.mode,
    models: g.models,
    twinIds,
    patient: { ...g.twins[twinIds.patient] },
    wearable: { ...g.twins[twinIds.wearable] },
    environment: { ...g.twins[twinIds.environment] },
    relationships: [...g.relationships],
    risk: lastRisk,
  };
}

export function subscribeTwin(callback) {
  ensure();
  listeners.add(callback);
  callback(getTwinSnapshot());
  return () => listeners.delete(callback);
}

export function setTwinMode(mode) {
  ensure().mode = mode;
  notify();
}

export { MODEL_IDS, twinIds };
