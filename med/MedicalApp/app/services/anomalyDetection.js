import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Store for notifications
let notificationStore = [];
let notificationListeners = [];

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Function to add notification listener
export function addNotificationListener(callback) {
  notificationListeners.push(callback);
  return () => {
    notificationListeners = notificationListeners.filter(listener => listener !== callback);
  };
}

// Function to get current notifications
export function getCurrentNotifications() {
  return [...notificationStore];
}

// Function to clear notifications
export function clearNotifications() {
  notificationStore = [];
  notifyListeners();
}

// Helper to notify all listeners
function notifyListeners() {
  notificationListeners.forEach(listener => listener([...notificationStore]));
}

// Test function to verify service is running
export function testAnomalyService() {
  console.log('=== ANOMALY SERVICE TEST ===');
  console.log('Platform:', Platform.OS);
  console.log('If you see this message, the service is being imported correctly');
  return true;
}

// Constants for fall detection
const ACC_THRESHOLD_IMPACT = 2.5 * 9.81; // ~2.5g impact
const GYRO_THRESHOLD_DEG = 90; // orientation change (degrees)
const GYRO_INTEGRATION_SAMPLES = 5; // simulate 0.5s at 10Hz

// Constants for environmental conditions
const TEMP_THRESHOLD_HOT = 30.0; // °C
const HUMIDITY_THRESHOLD_HIGH = 70.0; // %
const TEMP_HUMIDITY_COMBINED_THRESHOLD = 80.0; // Combined index (temp + humidity)

// Constants for body temperature
const BODY_TEMP_FEVER = 37.5; // °C
const BODY_TEMP_HYPOTHERMIA = 35.0; // °C

// Constants for SpO2
const SPO2_NORMAL_MIN = 95; // %
const SPO2_WARNING = 90; // %
const SPO2_CRITICAL = 85; // %

// Constants for Heart Rate (BPM)
const BPM_RESTING_MIN = 60; // bpm
const BPM_RESTING_MAX = 100; // bpm
const BPM_ACTIVE_MIN = 50; // bpm
const BPM_ACTIVE_MAX = 160; // bpm

// Constants for location range
const HOME_LATITUDE = 28.6139; // Replace with actual home latitude
const HOME_LONGITUDE = 77.2090; // Replace with actual home longitude
const MAX_DISTANCE_KM = 1.0; // 1km radius
const MAX_SPEED_KMH = 5.0; // Alert if moving faster than 5 km/h

// Helper to calculate magnitude
function magnitude(x, y, z) {
  return Math.sqrt(Math.pow(x || 0, 2) + Math.pow(y || 0, 2) + Math.pow(z || 0, 2));
}

// Helper to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Add notification to store and show system notification
async function addNotification({ title, body, priority = 'default' }) {
  const notification = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    body,
    priority,
    timestamp: new Date().toISOString()
  };
  
  // Add to store
  notificationStore.unshift(notification);
  
  // Keep only last 50 notifications
  if (notificationStore.length > 50) {
    notificationStore = notificationStore.slice(0, 50);
  }
  
  // Show system notification
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: { notification },
        sound: true,
        priority: priority === 'high' ? 'high' : 'default',
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
  
  // Notify listeners
  notifyListeners();
  
  console.log('Notification added:', notification);
}

// Anomaly detection logic
function detectAnomalies(metricsList) {
  console.log('Starting anomaly detection with metrics:', JSON.stringify(metricsList[0], null, 2));
  const anomalies = [];
  if (!metricsList || metricsList.length === 0) {
    console.log('No metrics data available');
    return anomalies;
  }

  // Get latest sample
  const latest = metricsList[0];
  console.log('Processing latest metrics:', JSON.stringify(latest, null, 2));

  // Body temperature detection using LM35
  if (latest.lm35_temp) {
    console.log('Checking body temperature:', latest.lm35_temp);
    if (latest.lm35_temp > BODY_TEMP_FEVER) {
      console.log('Fever detected:', latest.lm35_temp);
      anomalies.push({
        title: 'Fever Detected',
        body: `Body temperature is ${latest.lm35_temp.toFixed(1)}°C. Please monitor closely.`,
        priority: 'high'
      });
    } else if (latest.lm35_temp < BODY_TEMP_HYPOTHERMIA) {
      console.log('Hypothermia detected:', latest.lm35_temp);
      anomalies.push({
        title: 'Low Body Temperature',
        body: `Body temperature is ${latest.lm35_temp.toFixed(1)}°C. Possible hypothermia.`,
        priority: 'high'
      });
    }
  }

  // SpO2 monitoring
  if (latest.spo2) {
    console.log('Checking SpO2:', latest.spo2);
    if (latest.spo2 < SPO2_CRITICAL) {
      console.log('Critical SpO2 detected:', latest.spo2);
      anomalies.push({
        title: 'Critical SpO2 Level',
        body: `Blood oxygen level is critically low at ${latest.spo2}%. Immediate medical attention required.`,
        priority: 'high'
      });
    } else if (latest.spo2 < SPO2_WARNING) {
      console.log('Low SpO2 detected:', latest.spo2);
      anomalies.push({
        title: 'Low SpO2 Level',
        body: `Blood oxygen level is low at ${latest.spo2}%. Please monitor closely.`,
        priority: 'high'
      });
    } else if (latest.spo2 < SPO2_NORMAL_MIN) {
      console.log('Below normal SpO2 detected:', latest.spo2);
      anomalies.push({
        title: 'Below Normal SpO2',
        body: `Blood oxygen level is below normal at ${latest.spo2}%.`,
        priority: 'medium'
      });
    }
  }

  // Heart Rate (BPM) monitoring
  if (latest.bpm) {
    console.log('Checking heart rate:', latest.bpm);
    const isActive = latest.gps_speed > 0;
    const bpmMin = isActive ? BPM_ACTIVE_MIN : BPM_RESTING_MIN;
    const bpmMax = isActive ? BPM_ACTIVE_MAX : BPM_RESTING_MAX;

    if (latest.bpm < bpmMin) {
      console.log('Low heart rate detected:', latest.bpm);
      anomalies.push({
        title: 'Low Heart Rate',
        body: `Heart rate is low at ${latest.bpm} BPM. ${isActive ? 'During activity.' : 'At rest.'}`,
        priority: 'high'
      });
    } else if (latest.bpm > bpmMax) {
      console.log('High heart rate detected:', latest.bpm);
      anomalies.push({
        title: 'High Heart Rate',
        body: `Heart rate is high at ${latest.bpm} BPM. ${isActive ? 'During activity.' : 'At rest.'}`,
        priority: 'high'
      });
    }
  }

  // Hot and humid conditions detection using DHT11
  const dhtTemp = latest.dht_temp || 0;
  const humidity = latest.dht_hum || 0;
  const combinedIndex = dhtTemp + humidity;
  console.log('Checking environmental conditions:', { dhtTemp, humidity, combinedIndex });

  if (dhtTemp > TEMP_THRESHOLD_HOT && humidity > HUMIDITY_THRESHOLD_HIGH) {
    console.log('Hot and humid conditions detected');
    anomalies.push({
      title: 'Hot and Humid Conditions',
      body: `Room temperature: ${dhtTemp.toFixed(1)}°C, Humidity: ${humidity.toFixed(1)}%. These conditions may affect comfort and health.`,
      priority: 'medium'
    });
  } else if (combinedIndex > TEMP_HUMIDITY_COMBINED_THRESHOLD) {
    console.log('Uncomfortable conditions detected');
    anomalies.push({
      title: 'Uncomfortable Conditions',
      body: `Combined temperature and humidity index is high (${combinedIndex.toFixed(1)}). Consider adjusting environment.`,
      priority: 'medium'
    });
  }

  // Location and movement detection
  if (latest.gps_lat && latest.gps_lng) {
    const distance = calculateDistance(
      HOME_LATITUDE,
      HOME_LONGITUDE,
      latest.gps_lat,
      latest.gps_lng
    );
    console.log('Checking location:', { distance, speed: latest.gps_speed });
    
    if (distance > MAX_DISTANCE_KM) {
      console.log('Out of range detected:', distance);
      anomalies.push({
        title: 'Out of Range',
        body: 'Person is out of the safe area.',
        priority: 'high'
      });
    }

    if (latest.gps_speed > MAX_SPEED_KMH) {
      console.log('Unusual speed detected:', latest.gps_speed);
      anomalies.push({
        title: 'Unusual Movement Speed',
        body: `Moving at ${latest.gps_speed.toFixed(1)} km/h. Current altitude: ${latest.gps_alt?.toFixed(1) || 'N/A'} meters.`,
        priority: 'medium'
      });
    }
  }

  console.log('Total anomalies detected:', anomalies.length);
  return anomalies;
}

// Keep track of last anomaly to avoid duplicate notifications
let lastAnomalyKey = '';

// Background polling function
export async function pollAndDetectAnomalies() {
  console.log('Starting polling cycle...');
  try {
    const q = query(
      collection(db, 'healthMetrics'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    console.log('Querying Firestore...');
    const snapshot = await getDocs(q);
    console.log('Firestore query completed. Documents found:', snapshot.size);
    
    if (!snapshot.empty) {
      // Get latest 10 samples, sorted newest to oldest
      const metricsList = snapshot.docs.map(doc => doc.data());
      console.log('Processing metrics data...');
      const anomalies = detectAnomalies(metricsList);
      
      if (anomalies.length > 0) {
        console.log('Anomalies detected:', anomalies.length);
        // Create a key to avoid duplicate notifications
        const anomalyKey = anomalies.map(a => a.title + a.body).join('|') + (metricsList[0].timestamp?.toString() || '');
        console.log('Current anomaly key:', anomalyKey);
        console.log('Last anomaly key:', lastAnomalyKey);
        
        if (anomalyKey !== lastAnomalyKey) {
          console.log('New anomalies detected, adding to notification store...');
          for (const anomaly of anomalies) {
            addNotification(anomaly);
          }
          lastAnomalyKey = anomalyKey;
          console.log('Notifications added to store successfully');
        } else {
          console.log('No new anomalies to report');
        }
      } else {
        console.log('No anomalies detected in this cycle');
      }
    } else {
      console.log('No data available in Firestore');
    }
  } catch (err) {
    console.error('Error in pollAndDetectAnomalies:', err);
  }
  console.log('Polling cycle completed');
}

// Start polling every minute
export async function startAnomalyDetectionBackground() {
  console.log('=== STARTING ANOMALY DETECTION SERVICE ===');
  console.log('Platform:', Platform.OS);
  
  try {
    console.log('Starting initial poll...');
    // Start polling
    await pollAndDetectAnomalies();
    console.log('Setting up polling interval...');
    const intervalId = setInterval(pollAndDetectAnomalies, 60000);
    
    // Store the interval ID so we can clear it if needed
    global.anomalyDetectionInterval = intervalId;
    
    console.log('Anomaly detection service started successfully');
  } catch (error) {
    console.error('Error starting anomaly detection:', error);
  }
}

// Start notifications after login
export async function startNotificationsAfterLogin() {
  try {
    // Clear any existing interval
    if (global.anomalyDetectionInterval) {
      clearInterval(global.anomalyDetectionInterval);
    }

    // Add welcome notification
    await addNotification({
      title: 'Welcome Back',
      body: 'Health monitoring is now active',
      priority: 'medium'
    });

    // Start the anomaly detection service
    await startAnomalyDetectionBackground();
  } catch (error) {
    console.error('Error starting notifications after login:', error);
  }
}

// Stop notifications (for logout)
export function stopNotifications() {
  if (global.anomalyDetectionInterval) {
    clearInterval(global.anomalyDetectionInterval);
    global.anomalyDetectionInterval = null;
  }
  // Clear notification store
  notificationStore = [];
  notifyListeners();
} 