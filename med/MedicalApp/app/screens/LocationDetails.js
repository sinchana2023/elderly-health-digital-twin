import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LocationDetails = () => {
  const screenWidth = Dimensions.get('window').width;
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchLocationHistory = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'healthMetrics'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const locList = [];
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data();
          const ts = data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp;
          locList.push({ lat: data.gps_lat, lng: data.gps_lng, timestamp: ts });
        });
      }
      setLocationHistory(locList.reverse()); // Oldest to newest
    } catch (err) {
      setLocationHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationHistory();
    intervalRef.current = setInterval(fetchLocationHistory, 60000); // Refresh every minute
    return () => clearInterval(intervalRef.current);
  }, []);

  const latest = locationHistory.length > 0 ? locationHistory[locationHistory.length - 1] : null;

  const now = new Date();
  const timeLabels = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    timeLabels.push(`${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`);
  }
  const dataLat = timeLabels.map(label => {
    const found = locationHistory.find(item => {
      const d = new Date(item.timestamp);
      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}` === label;
    });
    return found ? found.lat ?? 0 : 0;
  });
  const dataLng = timeLabels.map(label => {
    const found = locationHistory.find(item => {
      const d = new Date(item.timestamp);
      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}` === label;
    });
    return found ? found.lng ?? 0 : 0;
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="map-marker" size={40} color="#fdcb6e" />
        <Text style={styles.title}>Location Details</Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Latitude</Text>
          <Text style={styles.statValue}>{latest ? latest.lat?.toFixed(6) : '--'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Longitude</Text>
          <Text style={styles.statValue}>{latest ? latest.lng?.toFixed(6) : '--'}</Text>
        </View>
      </View>
      <Text style={styles.subHeader}>Latitude (last 10 minutes)</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : timeLabels.length > 1 ? (
        <LineChart
          data={{
            labels: timeLabels,
            datasets: [
              {
                data: dataLat,
                color: (opacity = 1) => `rgba(253,203,110,${opacity})`,
              },
            ],
          }}
          width={screenWidth - 40}
          height={250}
          yAxisSuffix=""
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(253,203,110,${opacity})`,
            decimalPlaces: 6,
            propsForLabels: { fontSize: 12, fill: '#000' },
            propsForDots: { r: '2', strokeWidth: '1', stroke: '#fdcb6e' },
            propsForBackgroundLines: { stroke: '#eee' },
          }}
          bezier
          fromZero
          yLabelsOffset={10}
          segments={4}
        />
      ) : (
        <Text style={styles.noData}>Not enough data for graph</Text>
      )}
      <Text style={styles.subHeader}>Longitude (last 10 minutes)</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : timeLabels.length > 1 ? (
        <LineChart
          data={{
            labels: timeLabels,
            datasets: [
              {
                data: dataLng,
                color: (opacity = 1) => `rgba(255,87,34,${opacity})`,
              },
            ],
          }}
          width={screenWidth - 40}
          height={250}
          yAxisSuffix=""
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(255,87,34,${opacity})`,
            decimalPlaces: 6,
            propsForLabels: { fontSize: 12, fill: '#000' },
            propsForDots: { r: '2', strokeWidth: '1', stroke: '#ff5722' },
            propsForBackgroundLines: { stroke: '#eee' },
          }}
          bezier
          fromZero
          yLabelsOffset={10}
          segments={4}
        />
      ) : (
        <Text style={styles.noData}>Not enough data for graph</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '40%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fdcb6e',
  },
  subHeader: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  noData: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default LocationDetails; 