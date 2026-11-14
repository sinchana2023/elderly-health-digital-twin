import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeTwin } from '../_services/digitalTwinStore';
import { getModelInfo } from '../_services/mlAnomalyModel';
import { refreshAzureStatus, getAzureStatus } from '../_services/azureDigitalTwins';

function TwinCard({ title, icon, color, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={icon} size={22} color="#fff" />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function TwinScreen() {
  const [snap, setSnap] = useState(null);
  const [azure, setAzure] = useState(getAzureStatus());
  const model = getModelInfo();

  useEffect(() => subscribeTwin(setSnap), []);
  useEffect(() => {
    refreshAzureStatus().then(setAzure).catch(() => {});
    const id = setInterval(() => {
      refreshAzureStatus().then(setAzure).catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, []);

  if (!snap) {
    return (
      <View style={styles.loading}>
        <Text>Loading digital twin…</Text>
      </View>
    );
  }

  const riskColor =
    snap.patient.riskLevel === 'high'
      ? '#d63031'
      : snap.patient.riskLevel === 'elevated'
        ? '#e17055'
        : '#00b894';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Azure Digital Twin</Text>
        <Text style={styles.heroSub}>
          UI mode: {snap.mode} · ADT secrets: {azure.adtConfigured ? 'bound' : 'local fallback'} ·
          Cosmos: {azure.cosmosConfigured ? 'bound' : 'local fallback'} · DTDL patient / wearable /
          environment
        </Text>
      </View>

      <TwinCard title="Elderly Patient" icon="account-heart" color="#6c5ce7">
        <Row label="$dtId" value={snap.patient.$dtId} />
        <Row label="Model" value={snap.models.patient} />
        <Row label="Name" value={snap.patient.fullName} />
        <Row label="Age" value={String(snap.patient.age)} />
        <Row label="ML risk" value={`${snap.patient.riskScore}% (${snap.patient.riskLevel})`} />
        <View style={[styles.riskBar, { backgroundColor: riskColor }]}>
          <Text style={styles.riskBarText}>
            {(snap.risk?.reasons || []).join(' · ') || 'No elevated contributors'}
          </Text>
        </View>
      </TwinCard>

      <TwinCard title="Wearable Device" icon="watch-variant" color="#00CEC9">
        <Row label="$dtId" value={snap.wearable.$dtId} />
        <Row label="BPM / SpO2" value={`${snap.wearable.bpm} / ${snap.wearable.spo2}%`} />
        <Row label="Body °C" value={snap.wearable.bodyTempC?.toFixed?.(1)} />
        <Row
          label="Accel"
          value={`${snap.wearable.accX?.toFixed?.(2)}, ${snap.wearable.accY?.toFixed?.(2)}, ${snap.wearable.accZ?.toFixed?.(2)}`}
        />
        <Row label="Fall likely" value={snap.wearable.fallLikely ? 'yes' : 'no'} />
        <Row
          label="GPS"
          value={`${snap.wearable.gpsLat?.toFixed?.(4)}, ${snap.wearable.gpsLng?.toFixed?.(4)}`}
        />
      </TwinCard>

      <TwinCard title="Care Environment" icon="home-thermometer" color="#fdcb6e">
        <Row label="$dtId" value={snap.environment.$dtId} />
        <Row label="Room °C" value={snap.environment.roomTempC?.toFixed?.(1)} />
        <Row label="Humidity" value={`${snap.environment.humidityPct?.toFixed?.(0)}%`} />
        <Row label="Comfort index" value={snap.environment.comfortIndex?.toFixed?.(0)} />
      </TwinCard>

      <TwinCard title="Relationships" icon="graph" color="#636e72">
        {snap.relationships.map((r) => (
          <Text key={r.$relationshipId} style={styles.rel}>
            {r.$sourceId} —{r.$relationshipName}→ {r.$targetId}
          </Text>
        ))}
      </TwinCard>

      <TwinCard title="ML model" icon="brain" color="#e84393">
        <Row label="Name" value={model.name} />
        <Row label="Type" value={model.type} />
        <Row label="Threshold" value={String(model.threshold)} />
        <Row label="Train accuracy" value={model.trainAccuracy ? String(model.trainAccuracy) : 'n/a'} />
        <Text style={styles.hint}>See models/ml/README.md for feature definitions.</Text>
      </TwinCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f7f7' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: '#6c5ce7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  heroSub: { color: 'rgba(255,255,255,0.9)', marginTop: 6, fontSize: 13, lineHeight: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2d3436' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 12,
  },
  label: { color: '#636e72', fontSize: 13, flex: 1 },
  value: { color: '#2d3436', fontSize: 13, fontWeight: '600', flex: 1.4, textAlign: 'right' },
  riskBar: { marginTop: 10, borderRadius: 8, padding: 10 },
  riskBarText: { color: '#fff', fontSize: 12, lineHeight: 16 },
  rel: { fontSize: 12, color: '#2d3436', marginBottom: 6 },
  hint: { marginTop: 8, fontSize: 12, color: '#636e72' },
});
