import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const HeartDetails = () => {
  const screenWidth = Dimensions.get('window').width;
  const [bpmHistory, setBpmHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchBpmHistory = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'healthMetrics'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const bpmList = [];
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data();
          const ts = data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp;
          bpmList.push({ bpm: data.bpm, timestamp: ts });
        });
      }
      setBpmHistory(bpmList.reverse()); // Oldest to newest
    } catch (err) {
      setBpmHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBpmHistory();
    intervalRef.current = setInterval(fetchBpmHistory, 60000); // Refresh every minute
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="heart-pulse" size={40} color="#FF6384" />
        <Text style={styles.title}>Heart Rate Monitor</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>78</Text>
          <Text style={styles.statLabel}>Current BPM</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>85</Text>
          <Text style={styles.statLabel}>Max BPM</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>72</Text>
          <Text style={styles.statLabel}>Min BPM</Text>
        </View>
      </View>

      <Text style={styles.subHeader}>BPM Trend (last 10 readings)</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : bpmHistory.length > 1 ? (
        <LineChart
          data={{
            labels: bpmHistory.map(item => {
              const d = new Date(item.timestamp);
              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }),
            datasets: [
              {
                data: bpmHistory.map(item => item.bpm ?? 0),
              },
            ],
          }}
          width={screenWidth - 40}
          height={220}
          yAxisSuffix=""
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(255,99,132,${opacity})`,
            decimalPlaces: 0,
            propsForLabels: { fontSize: 10 },
            propsForDots: { r: '3', strokeWidth: '2', stroke: '#FF6384' },
            propsForBackgroundLines: { stroke: '#eee' },
          }}
          bezier
          fromZero
          yLabelsOffset={10}
          segments={6} // 0, 20, 40, 60, 80, 100, 120
          yAxisMin={0}
          yAxisMax={120}
        />
      ) : (
        <Text style={styles.noData}>Not enough data for graph</Text>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Heart Rate Zones</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Resting (60-100 BPM)</Text>
          <Text style={styles.infoValue}>Normal</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Activity Level</Text>
          <Text style={styles.infoValue}>Moderate</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Updated</Text>
          <Text style={styles.infoValue}>2 mins ago</Text>
        </View>
      </View>
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
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '30%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6384',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  subHeader: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  noData: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    color: '#666',
  },
  infoValue: {
    fontWeight: 'bold',
  },
});

export default HeartDetails; 