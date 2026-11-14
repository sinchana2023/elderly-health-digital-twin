import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useMetricHistory from '../_hooks/useMetricHistory';

const LocationDetails = () => {
  const screenWidth = Dimensions.get('window').width;
  const { history, loading, latest } = useMetricHistory('gps_lat');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="map-marker" size={40} color="#fdcb6e" />
        <Text style={styles.title}>Location</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Latitude</Text>
          <Text style={styles.statValue}>
            {latest ? latest.gps_lat.toFixed(5) : '--'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Longitude</Text>
          <Text style={styles.statValue}>
            {latest ? latest.gps_lng.toFixed(5) : '--'}
          </Text>
        </View>
      </View>
      <Text style={styles.subHeader}>GPS latitude drift near home (simulated)</Text>
      {loading ? (
        <ActivityIndicator color="#fdcb6e" />
      ) : history.length > 1 ? (
        <LineChart
          data={{
            labels: history.map((item) => {
              const d = new Date(item.timestamp);
              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }),
            datasets: [
              {
                data: history.map((h) => Number(((h.gps_lat || 28.61) - 28.61) * 10000)),
              },
            ],
          }}
          width={Math.min(screenWidth - 40, 480)}
          height={180}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (o = 1) => `rgba(253,203,110,${o})`,
            decimalPlaces: 2,
          }}
          bezier
        />
      ) : (
        <Text style={styles.noData}>Not enough data</Text>
      )}
      <Text style={styles.note}>
        Map tiles omitted on web demo. Coordinates match the original home geofence used for
        out-of-range alerts.
      </Text>
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
    width: '42%',
    elevation: 3,
  },
  statLabel: { color: '#666', fontWeight: 'bold' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#e17055', marginTop: 4 },
  subHeader: { textAlign: 'center', marginBottom: 10 },
  noData: { textAlign: 'center', color: '#888' },
  note: { marginTop: 20, color: '#636e72', fontSize: 13, lineHeight: 18, textAlign: 'center' },
});

export default LocationDetails;
