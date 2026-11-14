import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useMetricHistory from '../_hooks/useMetricHistory';

const AccelerationDetails = () => {
  const screenWidth = Dimensions.get('window').width;
  const { history, loading, latest } = useMetricHistory('acc_x');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="speedometer" size={40} color="#4BC0C0" />
        <Text style={styles.title}>Acceleration (MPU6050)</Text>
      </View>
      <View style={styles.statsRow}>
        {['acc_x', 'acc_y', 'acc_z'].map((k) => (
          <View key={k} style={styles.statCard}>
            <Text style={styles.statLabel}>{k.toUpperCase()}</Text>
            <Text style={styles.statValue}>
              {latest ? latest[k].toFixed(2) : '--'}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.subHeader}>Acc X trend — fall spikes appear as outliers</Text>
      {loading ? (
        <ActivityIndicator color="#4BC0C0" />
      ) : history.length > 1 ? (
        <LineChart
          data={{
            labels: history.map((item) => {
              const d = new Date(item.timestamp);
              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }),
            datasets: [
              { data: history.map((h) => h.acc_x ?? 0), color: (o) => `rgba(75,192,192,${o})` },
              { data: history.map((h) => h.acc_y ?? 0), color: (o) => `rgba(153,102,255,${o})` },
            ],
          }}
          width={Math.min(screenWidth - 40, 480)}
          height={200}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (o = 1) => `rgba(75,192,192,${o})`,
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
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#4BC0C0', marginTop: 4 },
  subHeader: { textAlign: 'center', marginBottom: 10 },
  noData: { textAlign: 'center', color: '#888' },
});

export default AccelerationDetails;
