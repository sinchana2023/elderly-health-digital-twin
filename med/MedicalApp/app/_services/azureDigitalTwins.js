/**
 * Client bridge to real Azure Digital Twins + Cosmos via MedAssist API.
 * Secrets stay on the server. Without the API / secrets, local twin mode is used.
 */

import { setTwinMode } from './digitalTwinStore';
import { apiFetch } from './apiConfig';

let lastStatus = {
  adtConfigured: false,
  cosmosConfigured: false,
  mode: 'local',
};

export function isAzureDigitalTwinsConfigured() {
  return Boolean(lastStatus.adtConfigured);
}

export function getAzureStatus() {
  return { ...lastStatus };
}

export async function refreshAzureStatus() {
  try {
    const res = await apiFetch('/api/azure/status', { method: 'GET', timeoutMs: 4000 });
    if (!res.ok) throw new Error(`status ${res.status}`);
    lastStatus = await res.json();
    setTwinMode(
      lastStatus.adtConfigured || lastStatus.cosmosConfigured ? 'azure' : 'local'
    );
    return lastStatus;
  } catch {
    lastStatus = { adtConfigured: false, cosmosConfigured: false, mode: 'local' };
    setTwinMode('local');
    return lastStatus;
  }
}

/**
 * Push telemetry to API → Cosmos write + ADT twin patch when secrets exist.
 */
export async function maybeSyncTwinPatch(graph, risk, sample) {
  try {
    if (!sample) {
      // Derive a sample-shaped payload from wearable twin if caller only has graph
      const w = graph?.twins
        ? Object.values(graph.twins).find((t) => t.deviceId)
        : graph?.wearable;
      if (!w) {
        setTwinMode('local');
        return { synced: false, reason: 'no_sample' };
      }
      sample = {
        device_id: w.deviceId,
        bpm: w.bpm,
        spo2: w.spo2,
        lm35_temp: w.bodyTempC,
        dht_temp: graph?.environment?.roomTempC ?? graph?.twins?.['env-home-livingroom']?.roomTempC,
        dht_hum: graph?.environment?.humidityPct,
        acc_x: w.accX,
        acc_y: w.accY,
        acc_z: w.accZ,
        gyro_x: w.gyroX,
        gyro_y: w.gyroY,
        gyro_z: w.gyroZ,
        gps_lat: w.gpsLat,
        gps_lng: w.gpsLng,
        gps_speed: w.gpsSpeed,
        timestamp: w.lastTelemetry || new Date().toISOString(),
        source: 'client-twin',
      };
    }

    const res = await apiFetch('/api/telemetry', {
      method: 'POST',
      body: JSON.stringify({ sample, risk }),
      timeoutMs: 10000,
    });
    if (!res.ok) {
      setTwinMode('local');
      return { synced: false, reason: `http_${res.status}` };
    }
    const data = await res.json();
    if (data?.adt?.synced || data?.cosmos?.written) {
      setTwinMode('azure');
    } else {
      setTwinMode(data?.mode === 'azure' ? 'azure-degraded' : 'local');
    }
    lastStatus = {
      ...lastStatus,
      mode: data.mode,
      adtConfigured: data?.adt?.reason !== 'no_azure_credentials',
      cosmosConfigured: data?.cosmos?.reason !== 'no_cosmos_credentials',
    };
    return {
      synced: Boolean(data?.adt?.synced),
      cosmosWritten: Boolean(data?.cosmos?.written),
      ...data,
    };
  } catch (e) {
    setTwinMode('local');
    return { synced: false, reason: e?.message || 'api_unreachable' };
  }
}

export async function fetchRemoteTwin() {
  try {
    const res = await apiFetch('/api/twin', { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchVitalsHistory(limit = 40) {
  try {
    const res = await apiFetch(`/api/vitals/history?limit=${limit}`, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function bootstrapAzureTwins() {
  try {
    const res = await apiFetch('/api/azure/bootstrap', { method: 'POST' });
    return await res.json();
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// Probe once on load (non-blocking)
refreshAzureStatus().catch(() => {});
