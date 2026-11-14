import { Platform } from 'react-native';
import { getHistory } from './mockHealthStore';

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
  console.log('=== ANOMALY SERVICE (mock) ===', Platform.OS);
  return true;
}

const ACC_THRESHOLD_IMPACT = 2.5 * 9.81;
const BODY_TEMP_FEVER = 37.5;
const BODY_TEMP_HYPOTHERMIA = 35.0;
const SPO2_NORMAL_MIN = 95;
const SPO2_WARNING = 90;
const SPO2_CRITICAL = 85;
const BPM_RESTING_MIN = 60;
const BPM_RESTING_MAX = 100;
const BPM_ACTIVE_MIN = 50;
const BPM_ACTIVE_MAX = 160;
const TEMP_THRESHOLD_HOT = 30.0;
const HUMIDITY_THRESHOLD_HIGH = 70.0;
const TEMP_HUMIDITY_COMBINED_THRESHOLD = 80.0;
const HOME_LATITUDE = 28.6139;
const HOME_LONGITUDE = 77.209;
const MAX_DISTANCE_KM = 1.0;
const MAX_SPEED_KMH = 5.0;

function magnitude(x, y, z) {
  return Math.sqrt((x || 0) ** 2 + (y || 0) ** 2 + (z || 0) ** 2);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function addNotification({ title, body, priority = 'default' }) {
  const notification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title,
    body,
    priority,
    timestamp: new Date().toISOString(),
  };
  notificationStore.unshift(notification);
  if (notificationStore.length > 50) {
    notificationStore = notificationStore.slice(0, 50);
  }

  // Soft push on native only; web uses in-app NotificationList
  if (Platform.OS !== 'web') {
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { notification }, sound: true },
        trigger: null,
      });
    } catch (e) {
      // ignore on unsupported platforms
    }
  }

  notifyListeners();
}

function detectAnomalies(metricsList) {
  const anomalies = [];
  if (!metricsList?.length) return anomalies;
  const latest = metricsList[0];

  if (latest.lm35_temp > BODY_TEMP_FEVER) {
    anomalies.push({
      title: 'Fever Detected',
      body: `Body temperature is ${latest.lm35_temp.toFixed(1)}°C. Please monitor closely.`,
      priority: 'high',
    });
  } else if (latest.lm35_temp < BODY_TEMP_HYPOTHERMIA) {
    anomalies.push({
      title: 'Low Body Temperature',
      body: `Body temperature is ${latest.lm35_temp.toFixed(1)}°C. Possible hypothermia.`,
      priority: 'high',
    });
  }

  if (latest.spo2 < SPO2_CRITICAL) {
    anomalies.push({
      title: 'Critical SpO2 Level',
      body: `Blood oxygen is critically low at ${latest.spo2}%. Seek medical attention.`,
      priority: 'high',
    });
  } else if (latest.spo2 < SPO2_WARNING) {
    anomalies.push({
      title: 'Low SpO2 Level',
      body: `Blood oxygen is low at ${latest.spo2}%. Please monitor closely.`,
      priority: 'high',
    });
  } else if (latest.spo2 < SPO2_NORMAL_MIN) {
    anomalies.push({
      title: 'Below Normal SpO2',
      body: `Blood oxygen is below normal at ${latest.spo2}%.`,
      priority: 'medium',
    });
  }

  const isActive = latest.gps_speed > 0.5;
  const bpmMin = isActive ? BPM_ACTIVE_MIN : BPM_RESTING_MIN;
  const bpmMax = isActive ? BPM_ACTIVE_MAX : BPM_RESTING_MAX;
  if (latest.bpm < bpmMin) {
    anomalies.push({
      title: 'Low Heart Rate',
      body: `Heart rate is low at ${latest.bpm} BPM.`,
      priority: 'high',
    });
  } else if (latest.bpm > bpmMax) {
    anomalies.push({
      title: 'High Heart Rate',
      body: `Heart rate is high at ${latest.bpm} BPM.`,
      priority: 'high',
    });
  }

  const dhtTemp = latest.dht_temp || 0;
  const humidity = latest.dht_hum || 0;
  if (dhtTemp > TEMP_THRESHOLD_HOT && humidity > HUMIDITY_THRESHOLD_HIGH) {
    anomalies.push({
      title: 'Hot and Humid Conditions',
      body: `Room ${dhtTemp.toFixed(1)}°C, humidity ${humidity.toFixed(1)}%.`,
      priority: 'medium',
    });
  } else if (dhtTemp + humidity > TEMP_HUMIDITY_COMBINED_THRESHOLD) {
    anomalies.push({
      title: 'Uncomfortable Conditions',
      body: `Combined temp/humidity index is high.`,
      priority: 'medium',
    });
  }

  const accMag = magnitude(latest.acc_x, latest.acc_y, latest.acc_z);
  if (accMag > ACC_THRESHOLD_IMPACT) {
    anomalies.push({
      title: 'Possible Fall Detected',
      body: `Sudden acceleration spike (${accMag.toFixed(1)} m/s²). Check on the person.`,
      priority: 'high',
    });
  }

  if (latest.gps_lat && latest.gps_lng) {
    const distance = calculateDistance(
      HOME_LATITUDE,
      HOME_LONGITUDE,
      latest.gps_lat,
      latest.gps_lng
    );
    if (distance > MAX_DISTANCE_KM) {
      anomalies.push({
        title: 'Out of Range',
        body: 'Person is outside the safe area.',
        priority: 'high',
      });
    }
    if (latest.gps_speed > MAX_SPEED_KMH) {
      anomalies.push({
        title: 'Unusual Movement Speed',
        body: `Moving at ${latest.gps_speed.toFixed(1)} km/h.`,
        priority: 'medium',
      });
    }
  }

  return anomalies;
}

export async function pollAndDetectAnomalies() {
  try {
    const metricsList = getHistory(10).slice().reverse();
    const anomalies = detectAnomalies(metricsList);
    if (!anomalies.length) return;
    const anomalyKey =
      anomalies.map((a) => a.title + a.body).join('|') +
      (metricsList[0]?.timestamp || '');
    if (anomalyKey === lastAnomalyKey) return;
    for (const anomaly of anomalies) {
      await addNotification(anomaly);
    }
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
    global.anomalyDetectionInterval = setInterval(pollAndDetectAnomalies, 15000);
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
      title: 'Welcome to MedAssist',
      body: 'Local sensor simulation is active — monitoring vitals for demo.',
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
