/**
 * Azure configuration from environment / Cursor app secrets.
 * Never hardcode secret values.
 */

function env(name, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function getAdtConfig() {
  const url = env('AZURE_DIGITAL_TWINS_URL');
  const tenantId = env('AZURE_TENANT_ID');
  const clientId = env('AZURE_CLIENT_ID');
  const clientSecret = env('AZURE_CLIENT_SECRET');
  return {
    url: url.replace(/\/$/, ''),
    tenantId,
    clientId,
    clientSecret,
    configured: Boolean(url && tenantId && clientId && clientSecret),
  };
}

function getCosmosConfig() {
  const endpoint = env('AZURE_COSMOS_ENDPOINT');
  const key = env('AZURE_COSMOS_KEY');
  const databaseId = env('AZURE_COSMOS_DATABASE', 'medassist');
  const vitalsContainer = env('AZURE_COSMOS_VITALS_CONTAINER', 'vitals');
  const twinContainer = env('AZURE_COSMOS_TWIN_CONTAINER', 'twinSnapshots');
  return {
    endpoint: endpoint.replace(/\/$/, ''),
    key,
    databaseId,
    vitalsContainer,
    twinContainer,
    configured: Boolean(endpoint && key),
  };
}

function getAzureStatus() {
  const adt = getAdtConfig();
  const cosmos = getCosmosConfig();
  return {
    adtConfigured: adt.configured,
    cosmosConfigured: cosmos.configured,
    adtEndpoint: adt.configured ? adt.url : null,
    cosmosEndpoint: cosmos.configured ? cosmos.endpoint : null,
    databaseId: cosmos.databaseId,
    mode: adt.configured || cosmos.configured ? 'azure' : 'local',
  };
}

module.exports = {
  getAdtConfig,
  getCosmosConfig,
  getAzureStatus,
};
