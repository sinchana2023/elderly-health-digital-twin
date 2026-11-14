import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useMetricHistory from '../_hooks/useMetricHistory';

const BodyTempDetails = () => {
  const screenWidth = Dimensions.get('window').width;
  const { history, loading, latest } = useMetricHistory('lm35_temp');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="thermometer" size={40} color="#36A2EB" />
        <Text style={styles.title}>Body Temperature</Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>LM35</Text>
          <Text style={styles.statValue}>
            {latest ? `${latest.lm35_temp.toFixed(1)}°C` : '--'}
          </Text>
        </View>
      </View>
      <Text style={styles.subHeader}>Body temp trend (simulated)</Text>
      {loading ? (
        <ActivityIndicator color="#36A2EB" />
      ) : history.length > 1 ? (
        <LineChart
          data={{
            labels: history.map((item) => {
              const d = new Date(item.timestamp);
              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }),
            datasets: [{ data: history.map((h) => h.lm35_temp ?? 36.5) }],
          }}
          width={Math.min(screenWidth - 40, 480)}
          height={180}
          yAxisSuffix="°"
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (o = 1) => `rgba(54,162,235,${o})`,
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
  statsContainer: { alignItems: 'center', marginBottom: 24 },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '50%',
    elevation: 3,
  },
  statLabel: { color: '#666', fontWeight: 'bold' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#36A2EB', marginTop: 4 },
  subHeader: { textAlign: 'center', marginBottom: 10, color: '#333' },
  noData: { textAlign: 'center', color: '#888' },
});

export default BodyTempDetails;
