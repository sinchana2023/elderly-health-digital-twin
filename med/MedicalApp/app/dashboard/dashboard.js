import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { azureService } from '../_services/azureService';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const latest = await azureService.getLatestHealthMetrics();
      if (mounted) {
        setMetrics(latest);
        setLoading(false);
      }
    })();
    const unsubscribe = azureService.subscribeToHealthMetrics((newData) => {
      if (mounted) setMetrics(newData);
    });
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#00CEC9" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Metrics</Text>
      <Text style={styles.row}>BPM: {metrics?.bpm ?? '--'}</Text>
      <Text style={styles.row}>SpO2: {metrics?.spo2 ?? '--'}%</Text>
      <Text style={styles.row}>Body: {metrics?.lm35_temp?.toFixed?.(1) ?? '--'}°C</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f7f7' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#00CEC9', marginBottom: 12 },
  row: { fontSize: 16, marginBottom: 8, color: '#333' },
});
