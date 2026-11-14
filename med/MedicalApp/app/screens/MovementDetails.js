import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useMetricHistory from '../_hooks/useMetricHistory';

const MovementDetails = () => {
  const screenWidth = Dimensions.get('window').width;
  const { history, loading, latest } = useMetricHistory('gyro_x');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="run" size={40} color="#9966FF" />
        <Text style={styles.title}>Movement / Gyro</Text>
      </View>
      <View style={styles.statsRow}>
        {['gyro_x', 'gyro_y', 'gyro_z'].map((k) => (
          <View key={k} style={styles.statCard}>
            <Text style={styles.statLabel}>{k.toUpperCase()}</Text>
            <Text style={styles.statValue}>
              {latest ? latest[k].toFixed(1) : '--'}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.subHeader}>Gyroscope (°/s) — simulated MPU6050</Text>
      {loading ? (
        <ActivityIndicator color="#9966FF" />
      ) : history.length > 1 ? (
        <LineChart
          data={{
            labels: history.map((item) => {
              const d = new Date(item.timestamp);
              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }),
            datasets: [{ data: history.map((h) => h.gyro_x ?? 0) }],
          }}
          width={Math.min(screenWidth - 40, 480)}
          height={180}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (o = 1) => `rgba(153,102,255,${o})`,
            decimalPlaces: 1,
          }}
          bezier
        />
      ) : (
        <Text style={styles.noData}>Not enough data</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginLeft: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: '30%',
    elevation: 3,
  },
  statLabel: { color: '#666', fontSize: 12, fontWeight: 'bold' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#9966FF', marginTop: 4 },
  subHeader: { textAlign: 'center', marginBottom: 10 },
  noData: { textAlign: 'center', color: '#888' },
});

export default MovementDetails;
