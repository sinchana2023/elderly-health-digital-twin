import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useMetricHistory from '../_hooks/useMetricHistory';

const HeartDetails = () => {
  const screenWidth = Dimensions.get('window').width;
  const { history, loading, latest } = useMetricHistory('bpm');
  const values = history.map((h) => h.bpm ?? 0);
  const max = values.length ? Math.max(...values) : '--';
  const min = values.length ? Math.min(...values) : '--';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="heart-pulse" size={40} color="#FF6384" />
        <Text style={styles.title}>Heart Rate Monitor</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{latest?.bpm ?? '--'}</Text>
          <Text style={styles.statLabel}>Current BPM</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{max}</Text>
          <Text style={styles.statLabel}>Max BPM</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{min}</Text>
          <Text style={styles.statLabel}>Min BPM</Text>
        </View>
      </View>

      <Text style={styles.subHeader}>BPM Trend (simulated ESP32)</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#FF6384" />
      ) : history.length > 1 ? (
        <LineChart
          data={{
            labels: history.map((item) => {
              const d = new Date(item.timestamp);
              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }),
            datasets: [{ data: values }],
          }}
          width={Math.min(screenWidth - 40, 480)}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (o = 1) => `rgba(255,99,132,${o})`,
            decimalPlaces: 0,
          }}
          bezier
          style={{ borderRadius: 12 }}
        />
      ) : (
        <Text style={styles.noData}>Not enough data yet</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginLeft: 12, color: '#333' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '30%',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#FF6384' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  subHeader: { fontSize: 16, color: '#333', marginBottom: 10, textAlign: 'center' },
  noData: { textAlign: 'center', color: '#888', marginTop: 20 },
});

export default HeartDetails;
