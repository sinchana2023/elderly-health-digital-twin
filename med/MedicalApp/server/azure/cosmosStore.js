/**
 * Azure Cosmos DB persistence for vitals history + twin snapshots.
 *
 * Why Cosmos (not SQL/Table): document-shaped telemetry and twin JSON map
 * naturally to ADT payloads; partition by deviceId supports high-rate writes
 * from the ESP32/simulator path without schema migrations.
 */
const { CosmosClient } = require('@azure/cosmos');
const { getCosmosConfig } = require('./config');

let initPromise = null;

async function getContainers() {
  const cfg = getCosmosConfig();
  if (!cfg.configured) return null;

  if (!initPromise) {
    initPromise = (async () => {
      const client = new CosmosClient({ endpoint: cfg.endpoint, key: cfg.key });
      const { database } = await client.databases.createIfNotExists({
        id: cfg.databaseId,
      });
      const { container: vitals } = await database.containers.createIfNotExists({
        id: cfg.vitalsContainer,
        partitionKey: { paths: ['/deviceId'] },
      });
      const { container: twins } = await database.containers.createIfNotExists({
        id: cfg.twinContainer,
        partitionKey: { paths: ['/twinId'] },
      });
      return { client, database, vitals, twins, cfg };
    })().catch((e) => {
      initPromise = null;
      throw e;
    });
  }
  return initPromise;
}

/**
 * Persist one vitals sample (telemetry history).
 */
async function writeVitalsSample(sample, risk = {}) {
  const boxes = await getContainers();
  if (!boxes) return { written: false, reason: 'no_cosmos_credentials' };

  const deviceId = sample.device_id || sample.deviceId || 'esp32Device';
  const id = sample.id || `vitals-${Date.now()}`;
  const doc = {
    id,
    deviceId,
    type: 'vitals',
    timestamp: sample.timestamp || new Date().toISOString(),
    bpm: sample.bpm,
    spo2: sample.spo2,
    lm35_temp: sample.lm35_temp,
    dht_temp: sample.dht_temp,
    dht_hum: sample.dht_hum,
    acc_x: sample.acc_x,
    acc_y: sample.acc_y,
    acc_z: sample.acc_z,
    gyro_x: sample.gyro_x,
    gyro_y: sample.gyro_y,
    gyro_z: sample.gyro_z,
    gps_lat: sample.gps_lat,
    gps_lng: sample.gps_lng,
    gps_speed: sample.gps_speed,
    riskScore: risk.riskScore,
    riskLevel: risk.riskLevel,
    source: sample.source || 'telemetry',
    createdAt: new Date().toISOString(),
  };

  await boxes.vitals.items.upsert(doc);
  return { written: true, id: doc.id, deviceId };
}

/**
 * Persist twin snapshot documents (patient / wearable / environment).
 */
async function writeTwinSnapshot(twinId, twinBody, kind) {
  const boxes = await getContainers();
  if (!boxes) return { written: false, reason: 'no_cosmos_credentials' };

  const doc = {
    id: `${twinId}-${Date.now()}`,
    twinId,
    kind,
    type: 'twinSnapshot',
    body: twinBody,
    capturedAt: new Date().toISOString(),
  };
  await boxes.twins.items.upsert(doc);

  // Also keep a "latest" pointer per twin for fast reads
  await boxes.twins.items.upsert({
    id: `latest-${twinId}`,
    twinId,
    kind,
    type: 'twinLatest',
    body: twinBody,
    capturedAt: doc.capturedAt,
  });

  return { written: true, id: doc.id };
}

async function writeTwinGraphSnapshot(graph) {
  if (!graph) return { written: false, reason: 'no_graph' };
  const results = [];
  if (graph.patient) {
    results.push(
      await writeTwinSnapshot(
        graph.patient.$dtId || 'patient-demo-elder',
        graph.patient,
        'patient'
      )
    );
  }
  if (graph.wearable) {
    results.push(
      await writeTwinSnapshot(
        graph.wearable.$dtId || 'wearable-esp32Device',
        graph.wearable,
        'wearable'
      )
    );
  }
  if (graph.environment) {
    results.push(
      await writeTwinSnapshot(
        graph.environment.$dtId || 'env-home-livingroom',
        graph.environment,
        'environment'
      )
    );
  }
  return { written: results.every((r) => r.written), results };
}

async function getVitalsHistory({ deviceId = 'esp32Device', limit = 40 } = {}) {
  const boxes = await getContainers();
  if (!boxes) return { available: false, items: [], reason: 'no_cosmos_credentials' };

  const query = {
    query:
      'SELECT TOP @limit * FROM c WHERE c.deviceId = @deviceId AND c.type = @type ORDER BY c.timestamp DESC',
    parameters: [
      { name: '@limit', value: Number(limit) || 40 },
      { name: '@deviceId', value: deviceId },
      { name: '@type', value: 'vitals' },
    ],
  };
  const { resources } = await boxes.vitals.items.query(query).fetchAll();
  return { available: true, items: resources || [] };
}

async function getLatestTwins() {
  const boxes = await getContainers();
  if (!boxes) return { available: false, reason: 'no_cosmos_credentials' };

  const twinIds = [
    'patient-demo-elder',
    'wearable-esp32Device',
    'env-home-livingroom',
  ];
  const latest = {};
  for (const twinId of twinIds) {
    try {
      const { resource } = await boxes.twins.item(`latest-${twinId}`, twinId).read();
      if (resource) latest[resource.kind || twinId] = resource.body;
    } catch {
      // missing latest doc is fine on first run
    }
  }
  return { available: true, twins: latest };
}

module.exports = {
  writeVitalsSample,
  writeTwinSnapshot,
  writeTwinGraphSnapshot,
  getVitalsHistory,
  getLatestTwins,
  getContainers,
};
