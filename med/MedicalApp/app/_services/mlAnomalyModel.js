/**
 * Lightweight logistic regression anomaly scorer (browser-safe).
 * Weights: models/ml/anomaly-weights.json — see models/ml/README.md.
 */

import weights from '../../models/ml/anomaly-weights.json';

const sigmoid = (z) => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));

function magnitude(x, y, z) {
  return Math.sqrt((x || 0) ** 2 + (y || 0) ** 2 + (z || 0) ** 2);
}

export function extractFeatures(sample) {
  const bpm = sample.bpm ?? 75;
  const spo2 = sample.spo2 ?? 98;
  const body = sample.lm35_temp ?? 36.6;
  const accMag = magnitude(sample.acc_x, sample.acc_y, sample.acc_z);
  const gyroMag = magnitude(sample.gyro_x, sample.gyro_y, sample.gyro_z);
  const heatHumidity = Math.max(0, (sample.dht_temp || 0) + (sample.dht_hum || 0) - 70) / 30;
  const speed = sample.gps_speed ?? 0;

  return {
    bpm_z: (bpm - 75) / 12,
    spo2_deficit: Math.max(0, 98 - spo2) / 3,
    fever_delta: Math.max(0, body - 37.2) / 0.6,
    hypo_delta: Math.max(0, 36.0 - body) / 0.5,
    acc_mag_norm: accMag / 9.81,
    gyro_spike: Math.min(gyroMag / 90, 3),
    heat_humidity: heatHumidity,
    speed_norm: Math.min(speed / 5, 2),
  };
}

export function scoreAnomaly(sample) {
  const featureMap = extractFeatures(sample);
  const x = weights.featureOrder.map((name) => featureMap[name] ?? 0);
  let z = weights.bias;
  const contributions = [];
  weights.featureOrder.forEach((name, i) => {
    const c = (weights.weights[i] || 0) * x[i];
    z += c;
    contributions.push({ feature: name, contribution: c, value: x[i] });
  });
  const probability = sigmoid(z);
  const isAnomaly = probability >= (weights.threshold ?? 0.55);
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    probability,
    riskScore: Math.round(probability * 100),
    riskLevel: probability >= 0.75 ? 'high' : probability >= 0.55 ? 'elevated' : 'normal',
    isAnomaly,
    topFeatures: contributions.slice(0, 3),
    reasons: contributions
      .slice(0, 3)
      .map((c) => reasonLabel(c.feature, sample))
      .filter(Boolean),
    model: weights.name,
    version: weights.version,
  };
}

function reasonLabel(feature, sample) {
  switch (feature) {
    case 'bpm_z':
      return `Heart rate ${sample.bpm} BPM`;
    case 'spo2_deficit':
      return `SpO2 ${sample.spo2}%`;
    case 'fever_delta':
      return `Body temp ${sample.lm35_temp?.toFixed?.(1)}°C (elevated)`;
    case 'hypo_delta':
      return `Body temp ${sample.lm35_temp?.toFixed?.(1)}°C (low)`;
    case 'acc_mag_norm':
      return 'Acceleration spike (possible fall)';
    case 'gyro_spike':
      return 'Sudden orientation change';
    case 'heat_humidity':
      return `Room ${sample.dht_temp?.toFixed?.(1)}°C / ${sample.dht_hum?.toFixed?.(0)}% RH`;
    case 'speed_norm':
      return `Movement speed ${sample.gps_speed?.toFixed?.(2)}`;
    default:
      return feature;
  }
}

export function getModelInfo() {
  return {
    name: weights.name,
    type: weights.type,
    threshold: weights.threshold,
    features: weights.featureOrder,
    version: weights.version,
    trainAccuracy: weights.trainAccuracy,
  };
}
