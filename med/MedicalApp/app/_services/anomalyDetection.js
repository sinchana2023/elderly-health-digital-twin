import { Platform } from 'react-native';
import { getHistory } from './mockHealthStore';
import { scoreAnomaly } from './mlAnomalyModel';

let notificationStore = [];
let notificationListeners = [];
let lastAnomalyKey = '';

export function addNotificationListener(callback) {
  notificationListeners.push(callback);
  return () => {
    notificationListeners = notificationListeners.filter((l) => l !== callback);
  };
}

export function getCurrentNotifications() {
  return [...notificationStore];
}

export function clearNotifications() {
  notificationStore = [];
  notifyListeners();
}

function notifyListeners() {
  notificationListeners.forEach((listener) => listener([...notificationStore]));
}

export function testAnomalyService() {
  console.log('=== ML ANOMALY SERVICE ===', Platform.OS);
  return true;
}

async function addNotification({ title, body, priority = 'default', meta }) {
  const notification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title,
    body,
    priority,
    meta,
    timestamp: new Date().toISOString(),
  };
  notificationStore.unshift(notification);
  if (notificationStore.length > 50) {
    notificationStore = notificationStore.slice(0, 50);
  }

  if (Platform.OS !== 'web') {
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { notification }, sound: true },
        trigger: null,
      });
    } catch {
      // ignore
    }
  }

  notifyListeners();
}

export async function pollAndDetectAnomalies() {
  try {
    const latest = getHistory(1)[0];
    if (!latest) return;
    const scored = scoreAnomaly(latest);
    if (!scored.isAnomaly) return;

    const anomalyKey = `${scored.riskLevel}:${scored.reasons.join('|')}:${latest.timestamp}`;
    if (anomalyKey === lastAnomalyKey) return;

    await addNotification({
      title: `ML risk ${scored.riskLevel} (${scored.riskScore}%)`,
      body: scored.reasons.join(' · ') || 'Anomalous vitals pattern detected by logistic model.',
      priority: scored.riskLevel === 'high' ? 'high' : 'medium',
      meta: scored,
    });
    lastAnomalyKey = anomalyKey;
  } catch (err) {
    console.error('Error in pollAndDetectAnomalies:', err);
  }
}

export async function startAnomalyDetectionBackground() {
  try {
    await pollAndDetectAnomalies();
    if (global.anomalyDetectionInterval) {
      clearInterval(global.anomalyDetectionInterval);
    }
    global.anomalyDetectionInterval = setInterval(pollAndDetectAnomalies, 12000);
  } catch (error) {
    console.error('Error starting anomaly detection:', error);
  }
}

export async function startNotificationsAfterLogin() {
  try {
    if (global.anomalyDetectionInterval) {
      clearInterval(global.anomalyDetectionInterval);
    }
    await addNotification({
      title: 'MedAssist monitoring active',
      body: 'Digital twin + ML risk scoring on simulated ESP32 vitals.',
      priority: 'medium',
    });
    await startAnomalyDetectionBackground();
  } catch (error) {
    console.error('Error starting notifications after login:', error);
  }
}

export function stopNotifications() {
  if (global.anomalyDetectionInterval) {
    clearInterval(global.anomalyDetectionInterval);
    global.anomalyDetectionInterval = null;
  }
  notificationStore = [];
  notifyListeners();
}
