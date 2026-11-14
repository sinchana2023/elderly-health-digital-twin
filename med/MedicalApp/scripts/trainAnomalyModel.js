#!/usr/bin/env node
/**
 * Fit a tiny logistic regression on synthetic elderly vitals and write weights JSON.
 * Pure JS — no sklearn required.
 */
const fs = require('fs');
const path = require('path');

const FEATURES = [
  'bpm_z',
  'spo2_deficit',
  'fever_delta',
  'hypo_delta',
  'acc_mag_norm',
  'gyro_spike',
  'heat_humidity',
  'speed_norm',
];

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function sampleNormal() {
  return {
    bpm: rand(62, 88),
    spo2: rand(95, 99),
    lm35_temp: rand(36.2, 37.1),
    dht_temp: rand(22, 27),
    dht_hum: rand(35, 55),
    acc_x: rand(-0.4, 0.4),
    acc_y: rand(-0.4, 0.4),
    acc_z: rand(9.2, 10.2),
    gyro_x: rand(-5, 5),
    gyro_y: rand(-5, 5),
    gyro_z: rand(-5, 5),
    gps_speed: rand(0, 0.6),
    label: 0,
  };
}

function sampleAnomaly(kind) {
  const s = sampleNormal();
  s.label = 1;
  if (kind === 'spo2') s.spo2 = rand(85, 92);
  else if (kind === 'bpm') s.bpm = rand(110, 140);
  else if (kind === 'fever') s.lm35_temp = rand(37.7, 39);
  else if (kind === 'hypo') s.lm35_temp = rand(34.5, 35.5);
  else if (kind === 'fall') {
    s.acc_x = rand(15, 30);
    s.acc_y = rand(-10, 10);
    s.acc_z = rand(1, 15);
    s.gyro_x = rand(60, 150);
  } else if (kind === 'heat') {
    s.dht_temp = rand(31, 36);
    s.dht_hum = rand(70, 90);
  } else s.gps_speed = rand(6, 12);
  return s;
}

function mag(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z);
}

function features(s) {
  return [
    (s.bpm - 75) / 12,
    Math.max(0, 98 - s.spo2) / 3,
    Math.max(0, s.lm35_temp - 37.2) / 0.6,
    Math.max(0, 36.0 - s.lm35_temp) / 0.5,
    mag(s.acc_x, s.acc_y, s.acc_z) / 9.81,
    Math.min(mag(s.gyro_x, s.gyro_y, s.gyro_z) / 90, 3),
    Math.max(0, s.dht_temp + s.dht_hum - 70) / 30,
    Math.min(s.gps_speed / 5, 2),
  ];
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
}

function buildDataset(n = 800) {
  const kinds = ['spo2', 'bpm', 'fever', 'hypo', 'fall', 'heat', 'speed'];
  const data = [];
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) data.push(sampleNormal());
    else data.push(sampleAnomaly(kinds[i % kinds.length]));
  }
  return data;
}

function train(data, epochs = 400, lr = 0.08) {
  const w = FEATURES.map(() => 0);
  let b = 0;
  for (let e = 0; e < epochs; e++) {
    let dw = FEATURES.map(() => 0);
    let db = 0;
    for (const row of data) {
      const x = features(row);
      const p = sigmoid(x.reduce((s, xi, i) => s + xi * w[i], b));
      const err = p - row.label;
      for (let i = 0; i < w.length; i++) dw[i] += err * x[i];
      db += err;
    }
    const n = data.length;
    for (let i = 0; i < w.length; i++) w[i] -= (lr * dw[i]) / n;
    b -= (lr * db) / n;
  }
  return { w, b };
}

function evaluate(data, w, b) {
  let correct = 0;
  for (const row of data) {
    const x = features(row);
    const p = sigmoid(x.reduce((s, xi, i) => s + xi * w[i], b));
    const pred = p >= 0.55 ? 1 : 0;
    if (pred === row.label) correct++;
  }
  return correct / data.length;
}

const data = buildDataset(1000);
const { w, b } = train(data);
const acc = evaluate(data, w, b);

const out = {
  name: 'medassist-vitals-logistic-v1',
  type: 'logistic_regression',
  description:
    'Binary risk classifier trained on synthetic elderly vitals (normal vs anomalous). Output is P(anomaly).',
  featureOrder: FEATURES,
  means: [0, 0, 0, 0, 0, 0, 0, 0],
  scales: [1, 1, 1, 1, 1, 1, 1, 1],
  weights: w.map((v) => Number(v.toFixed(4))),
  bias: Number(b.toFixed(4)),
  threshold: 0.55,
  trainedOn: 'synthetic_elderly_vitals_v1',
  trainAccuracy: Number(acc.toFixed(3)),
  version: 1,
};

const dest = path.join(__dirname, '../models/ml/anomaly-weights.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');
console.log('Wrote', dest, 'accuracy≈', out.trainAccuracy);
