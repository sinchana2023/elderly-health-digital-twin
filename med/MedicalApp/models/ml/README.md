# MedAssist ML anomaly model

## What it is

A **logistic regression** risk scorer (`anomaly-weights.json`) that maps wearable/environment features to **P(anomaly)** ∈ [0, 1].

It replaces the previous hard threshold rules in the demo. The UI still shows human-readable reasons derived from the top contributing features.

## Features

| Feature | Meaning |
|---------|---------|
| `bpm_z` | Heart rate deviation from elderly resting mean (~75 BPM) |
| `spo2_deficit` | How far SpO2 is below 98% |
| `fever_delta` | Degrees above 37.2°C |
| `hypo_delta` | Degrees below 36.0°C |
| `acc_mag_norm` | Acceleration magnitude (fall / impact) |
| `gyro_spike` | Orientation change spike |
| `heat_humidity` | Uncomfortable room heat+humidity index |
| `speed_norm` | Unusual GPS speed |

Each feature is standardized with the stored `means` / `scales`, then:

\[
p = \sigma(w \cdot x + b)
\]

If \(p \ge\) `threshold` (0.55), the sample is flagged.

## Training

Weights were fit on **synthetic** labeled elderly-care samples (normal vs fever / hypoxia / tachycardia / fall / heat).  
Re-fit locally:

```bash
node scripts/trainAnomalyModel.js
```

This writes an updated `models/ml/anomaly-weights.json`. No cloud or sklearn required (pure JS gradient descent).

## Limits

Demo-grade only — not a clinical device. Prefer consulting a clinician for real decisions.
