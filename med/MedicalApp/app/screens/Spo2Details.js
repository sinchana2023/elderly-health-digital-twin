import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useMetricHistory from '../_hooks/useMetricHistory';

const Spo2Details = () => {
  const screenWidth = Dimensions.get('window').width;
  const { history, loading, latest } = useMetricHistory('spo2');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="water-percent" size={40} color="#00b894" />
        <Text style={styles.title}>SpO2 Details</Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>SpO2</Text>
          <Text style={styles.statValue}>{latest ? `${latest.spo2}%` : '--'}</Text>
        </View>
      </View>
      <Text style={styles.subHeader}>SpO2 (simulated pulse oximeter)</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color="#00b894" />
      ) : history.length > 1 ? (
        <LineChart
          data={{
            labels: history.map((item) => {
              const d = new Date(item.timestamp);
              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }),
            datasets: [{ data: history.map((item) => item.spo2 ?? 0) }],
          }}
          width={Math.min(screenWidth - 40, 480)}
          height={180}
          yAxisSuffix="%"
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (o = 1) => `rgba(0,184,148,${o})`,
            decimalPlaces: 0,
          }}
          bezier
        />
      ) : (
        <Text style={styles.noData}>Not enough data for graph</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginLeft: 12 },
  statsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '40%',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  statLabel: { fontSize: 14, color: '#666', marginBottom: 4, fontWeight: 'bold' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#00b894' },
  subHeader: { fontSize: 16, color: '#333', marginBottom: 10, textAlign: 'center' },
  noData: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 20 },
});

export default Spo2Details;
