import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useMetricHistory from '../_hooks/useMetricHistory';

const EnvironmentDetails = () => {
  const screenWidth = Dimensions.get('window').width;
  const { history, loading, latest } = useMetricHistory('dht_temp');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="thermometer-lines" size={40} color="#FFCE56" />
        <Text style={styles.title}>Environment</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Room Temp</Text>
          <Text style={styles.statValue}>
            {latest ? `${latest.dht_temp.toFixed(1)}°C` : '--'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Humidity</Text>
          <Text style={styles.statValue}>
            {latest ? `${latest.dht_hum.toFixed(0)}%` : '--'}
          </Text>
        </View>
      </View>
      <Text style={styles.subHeader}>DHT11 room temperature (simulated)</Text>
      {loading ? (
        <ActivityIndicator color="#FFCE56" />
      ) : history.length > 1 ? (
        <LineChart
          data={{
            labels: history.map((item) => {
              const d = new Date(item.timestamp);
              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }),
            datasets: [{ data: history.map((h) => h.dht_temp ?? 24) }],
          }}
          width={Math.min(screenWidth - 40, 480)}
          height={180}
          yAxisSuffix="°"
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (o = 1) => `rgba(255,206,86,${o})`,
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
  title: { fontSize: 24, fontWeight: 'bold', marginLeft: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '40%',
    elevation: 3,
  },
  statLabel: { color: '#666', fontWeight: 'bold' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#e17055', marginTop: 4 },
  subHeader: { textAlign: 'center', marginBottom: 10 },
  noData: { textAlign: 'center', color: '#888' },
});

export default EnvironmentDetails;
