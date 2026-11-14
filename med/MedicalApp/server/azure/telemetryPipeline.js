/**
 * Unified telemetry pipeline: local buffer + Cosmos persist + ADT twin patch.
 */
const { syncTelemetryToAdt, getTwinGraphFromAdt } = require('./adtClient');
const {
  writeVitalsSample,
  writeTwinGraphSnapshot,
  getVitalsHistory,
  getLatestTwins,
} = require('./cosmosStore');
const { getAzureStatus } = require('./config');

const LOCAL_HISTORY_MAX = 200;
const localHistory = [];

function scoreLite(sample) {
  // Lightweight server-side risk hint (UI still uses full ML model).
  let score = 10;
  if (sample.spo2 != null && sample.spo2 < 92) score += 35;
  if (sample.bpm != null && (sample.bpm > 110 || sample.bpm < 50)) score += 25;
  if (sample.lm35_temp != null && sample.lm35_temp >= 37.5) score += 20;
  if (sample.lm35_temp != null && sample.lm35_temp <= 35.5) score += 20;
  const accMag = Math.hypot(sample.acc_x || 0, sample.acc_y || 0, sample.acc_z || 0);
  if (accMag > 20) score += 40;
  score = Math.min(99, score);
  return {
    riskScore: score,
    riskLevel: score >= 75 ? 'high' : score >= 55 ? 'elevated' : 'normal',
    topFeatures:
      accMag > 20 ? [{ feature: 'acc_mag_norm', contribution: 1 }] : [],
  };
}

function pushLocal(sample, risk) {
  localHistory.unshift({
    ...sample,
    riskScore: risk.riskScore,
    riskLevel: risk.riskLevel,
  });
  if (localHistory.length > LOCAL_HISTORY_MAX) localHistory.length = LOCAL_HISTORY_MAX;
}

/**
 * Ingest one telemetry sample.
 * Always updates local buffer; Cosmos/ADT when secrets are present.
 */
async function ingestTelemetry(sample, riskInput) {
  const risk = riskInput || scoreLite(sample);
  pushLocal(sample, risk);

  const status = getAzureStatus();
  const result = {
    ok: true,
    mode: status.mode,
    local: true,
    cosmos: { written: false },
    adt: { synced: false },
    risk,
  };

  if (status.cosmosConfigured) {
    try {
      result.cosmos = await writeVitalsSample(sample, risk);
    } catch (e) {
      result.cosmos = { written: false, reason: e.message };
      console.warn('[Cosmos] write failed:', e.message);
    }
  } else {
    result.cosmos = { written: false, reason: 'no_cosmos_credentials' };
  }

  if (status.adtConfigured) {
    try {
      result.adt = await syncTelemetryToAdt(sample, risk);
      if (result.adt.synced) {
        try {
          const graph = await getTwinGraphFromAdt();
          if (graph.available && status.cosmosConfigured) {
            await writeTwinGraphSnapshot(graph);
          }
        } catch (e) {
          console.warn('[Cosmos] twin snapshot failed:', e.message);
        }
      }
    } catch (e) {
      result.adt = { synced: false, reason: e.message };
      console.warn('[ADT] sync failed:', e.message);
    }
  } else {
    result.adt = { synced: false, reason: 'no_azure_credentials' };
  }

  return result;
}

async function readHistory(limit = 40, deviceId = 'esp32Device') {
  const status = getAzureStatus();
  if (status.cosmosConfigured) {
    try {
      const remote = await getVitalsHistory({ deviceId, limit });
      if (remote.available) {
        return { source: 'cosmos', items: remote.items };
      }
    } catch (e) {
      console.warn('[Cosmos] history read failed:', e.message);
    }
  }
  return {
    source: 'local',
    items: localHistory
      .filter((r) => !deviceId || (r.device_id || 'esp32Device') === deviceId)
      .slice(0, limit),
  };
}

async function readTwinState() {
  const status = getAzureStatus();
  if (status.adtConfigured) {
    try {
      const graph = await getTwinGraphFromAdt();
      if (graph.available) return { source: 'adt', ...graph };
    } catch (e) {
      console.warn('[ADT] twin read failed:', e.message);
    }
  }
  if (status.cosmosConfigured) {
    try {
      const snap = await getLatestTwins();
      if (snap.available && Object.keys(snap.twins || {}).length) {
        return { source: 'cosmos', available: true, mode: 'cosmos-latest', ...snap.twins };
      }
    } catch (e) {
      console.warn('[Cosmos] twin read failed:', e.message);
    }
  }
  const latest = localHistory[0] || null;
  return {
    source: 'local',
    available: Boolean(latest),
    mode: 'local',
    latestSample: latest,
  };
}

module.exports = {
  ingestTelemetry,
  readHistory,
  readTwinState,
  scoreLite,
};
