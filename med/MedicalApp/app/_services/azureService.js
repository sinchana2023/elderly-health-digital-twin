import {
  getLatest,
  getHistory,
  subscribe,
  startMockHealthStore,
} from './mockHealthStore';

/**
 * Drop-in replacement for the original Azure/Firestore health metrics service.
 * Backed by local mock ESP32 sensor stream.
 */
class AzureService {
  constructor() {
    startMockHealthStore();
    console.log('[MedAssist] Mock health metrics service ready');
  }

  async storeHealthMetrics(userId, metrics) {
    // No-op in demo — metrics are generated locally
    return `mock-${Date.now()}`;
  }

  async getLatestHealthMetrics() {
    return getLatest();
  }

  async getHealthMetrics(limitCount = 10) {
    return getHistory(limitCount)
      .slice()
      .reverse()
      .map((row) => ({ id: row.id, ...row }));
  }

  subscribeToHealthMetrics(callback) {
    return subscribe((latest) => {
      if (latest) callback(latest);
    });
  }
}

export const azureService = new AzureService();
