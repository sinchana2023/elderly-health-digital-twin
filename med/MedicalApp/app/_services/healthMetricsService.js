import { generateHealthMetrics, generateMultipleDataPoints } from '../../scripts/generateHealthMetrics';
import { getLatest, getHistory } from './mockHealthStore';

export const storeHealthMetrics = async (userId) => {
  const metricsData = generateHealthMetrics();
  console.log('[MedAssist] Mock store single metrics (local only):', metricsData);
  return { ...metricsData, userId };
};

export const storeMultipleHealthMetrics = async (userId, count = 10) => {
  const metricsData = generateMultipleDataPoints(count);
  return metricsData.map((d) => ({ ...d, userId }));
};

export const getLatestHealthMetrics = async () => getLatest();

export const getHealthMetricsHistory = async (_userId, limitCount = 10) =>
  getHistory(limitCount).slice().reverse();
