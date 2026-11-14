/**
 * Optional Azure Digital Twins sync.
 * Uses AZURE_DIGITAL_TWINS_URL + Entra app credentials when present.
 * Never throws into the UI path — local twin remains source of truth for the demo.
 */

import { setTwinMode } from './digitalTwinStore';

function readAzureConfig() {
  // Server-side / Node only. Expo web client will not see these secrets.
  const url =
    (typeof process !== 'undefined' && process.env?.AZURE_DIGITAL_TWINS_URL) || '';
  const tenant =
    (typeof process !== 'undefined' && process.env?.AZURE_TENANT_ID) || '';
  const clientId =
    (typeof process !== 'undefined' && process.env?.AZURE_CLIENT_ID) || '';
  const clientSecret =
    (typeof process !== 'undefined' && process.env?.AZURE_CLIENT_SECRET) || '';
  const configured = Boolean(url && tenant && clientId && clientSecret);
  return { url, tenant, clientId, clientSecret, configured };
}

export function isAzureDigitalTwinsConfigured() {
  return readAzureConfig().configured;
}

/**
 * Attempt to PATCH twin properties to ADT. No-op without credentials.
 * Real SDK wiring can replace the fetch stubs when secrets are bound on the server.
 */
export async function maybeSyncTwinPatch(graph, risk) {
  const cfg = readAzureConfig();
  if (!cfg.configured) {
    setTwinMode('local');
    return { synced: false, reason: 'no_azure_credentials' };
  }

  try {
    // Token acquisition would use client credentials against Entra.
    // Left as an explicit extension point so the demo stays hostable without Azure.
    setTwinMode('azure-configured');
    console.log(
      '[MedAssist ADT] Credentials detected — twin patch would target',
      cfg.url,
      'risk=',
      risk?.riskScore
    );
    // Placeholder: a production build would call
    // DigitalTwinsClient.updateDigitalTwin(...) with JSON Patch from graph.twins.
    return { synced: false, reason: 'credentials_present_sdk_stub' };
  } catch (e) {
    console.warn('[MedAssist ADT] sync skipped', e?.message);
    setTwinMode('local');
    return { synced: false, reason: e?.message || 'error' };
  }
}

export function getAzureStatus() {
  const cfg = readAzureConfig();
  return {
    configured: cfg.configured,
    endpoint: cfg.configured ? cfg.url : null,
  };
}
