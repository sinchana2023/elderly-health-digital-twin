/**
 * Local mock of ESP32 → Azure IoT → Firestore pipeline.
 * Emits realistic elderly-care metrics without cloud or hardware.
 */

const HISTORY_SIZE = 40;
const TICK_MS = 8000;

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// Home-ish coords (Delhi area used in original anomaly rules)
const HOME = { lat: 28.6139, lng: 77.209 };

let history = [];
let listeners = new Set();
let tickTimer = null;
let sampleIndex = 0;

function createSample(partial = {}) {
  const now = new Date();
  // Mild elderly resting profile with occasional mild anomalies
  const anomalyRoll = Math.random();
  let bpm = randInt(62, 88);
  let spo2 = randInt(95, 99);
  let lm35_temp = rand(36.2, 37.1);
  let dht_temp = rand(22, 28);
  let dht_hum = rand(35, 55);
  let acc_x = rand(-0.4, 0.4);
  let acc_y = rand(-0.4, 0.4);
  let acc_z = rand(9.2, 10.2);
  let gyro_x = rand(-5, 5);
  let gyro_y = rand(-5, 5);
  let gyro_z = rand(-5, 5);
  let gps_speed = rand(0, 0.8);

  if (anomalyRoll > 0.93) {
    spo2 = randInt(86, 92);
  } else if (anomalyRoll > 0.87) {
    bpm = randInt(108, 132);
  } else if (anomalyRoll > 0.82) {
    lm35_temp = rand(37.6, 38.4);
  } else if (anomalyRoll > 0.78) {
    lm35_temp = rand(34.8, 35.6);
  } else if (anomalyRoll > 0.74) {
    // simulated impact / fall-like spike
    acc_x = rand(18, 28);
    acc_y = rand(-8, 8);
    acc_z = rand(2, 12);
    gyro_x = rand(80, 140);
  } else if (anomalyRoll > 0.7) {
    dht_temp = rand(31, 35);
    dht_hum = rand(72, 88);
  }

  return {
    id: `mock-${now.getTime()}-${sampleIndex++}`,
    timestamp: now.toISOString(),
    device_id: 'esp32Device',
    gps_lat: HOME.lat + rand(-0.002, 0.002),
    gps_lng: HOME.lng + rand(-0.002, 0.002),
    gps_alt: rand(200, 230),
    gps_speed,
    dht_temp,
    dht_hum,
    lm35_temp,
    spo2,
    bpm,
    acc_x,
    acc_y,
    acc_z,
    gyro_x,
    gyro_y,
    gyro_z,
    userId: 'demo-user',
    createdAt: now.toISOString(),
    source: 'mock',
    ...partial,
  };
}

function seed() {
  history = [];
  const base = Date.now() - HISTORY_SIZE * 60_000;
  for (let i = 0; i < HISTORY_SIZE; i++) {
    const ts = new Date(base + i * 60_000);
    const sample = createSample({
      timestamp: ts.toISOString(),
      createdAt: ts.toISOString(),
      id: `mock-seed-${i}`,
    });
    history.push(sample);
  }
}

function notify() {
  const latest = history[history.length - 1];
  listeners.forEach((cb) => {
    try {
      cb(latest, [...history]);
    } catch (e) {
      console.warn('mockHealthStore listener error', e);
    }
  });
}

function pushSample(partial) {
  const sample = createSample(partial);
  history.push(sample);
  if (history.length > HISTORY_SIZE) {
    history = history.slice(-HISTORY_SIZE);
  }
  // Keep Digital Twin + ML risk in sync with every telemetry tick
  import('./digitalTwinStore')
    .then((mod) => mod.updateTwinFromTelemetry(sample))
    .catch(() => {});
  notify();
  return sample;
}

function ensureRunning() {
  if (!history.length) seed();
  if (tickTimer) return;
  tickTimer = setInterval(() => pushSample(), TICK_MS);
}

export function startMockHealthStore() {
  ensureRunning();
  return getLatest();
}

export function getLatest() {
  ensureRunning();
  return history[history.length - 1] || null;
}

export function getHistory(limitCount = 10) {
  ensureRunning();
  return history.slice(-limitCount);
}

/** Firestore-shaped docs for screens that expect snapshot.docs */
export function getHistoryAsDocs(limitCount = 10) {
  return getHistory(limitCount)
    .slice()
    .reverse()
    .map((row) => ({
      id: row.id,
      data: () => ({
        ...row,
        timestamp: {
          toDate: () => new Date(row.timestamp),
        },
      }),
    }));
}

export function subscribe(callback) {
  ensureRunning();
  listeners.add(callback);
  callback(getLatest(), [...history]);
  return () => listeners.delete(callback);
}

export function resetMockHealthStore() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  seed();
  ensureRunning();
}

// Auto-start when module loads in the app
ensureRunning();
