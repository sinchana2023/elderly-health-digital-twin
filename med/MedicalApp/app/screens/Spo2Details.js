import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Spo2Details = () => {
  const screenWidth = Dimensions.get('window').width;
  const [spo2History, setSpo2History] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchSpo2History = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'healthMetrics'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const spo2List = [];
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data();
          const ts = data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp;
          spo2List.push({ spo2: data.spo2, timestamp: ts });
        });
      }
      setSpo2History(spo2List.reverse()); // Oldest to newest
    } catch (err) {
      setSpo2History([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpo2History();
    intervalRef.current = setInterval(fetchSpo2History, 60000); // Refresh every minute
    return () => clearInterval(intervalRef.current);
  }, []);

  const latest = spo2History.length > 0 ? spo2History[spo2History.length - 1] : null;

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
      <Text style={styles.subHeader}>SpO2 (last 10 readings)</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : spo2History.length > 1 ? (
        <LineChart
          data={{
            labels: spo2History.map(item => {
              const d = new Date(item.timestamp);
              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }),
            datasets: [
              {
                data: spo2History.map(item => item.spo2 ?? 0),
                color: (opacity = 1) => `rgba(0,184,148,${opacity})`,
              },
            ],
          }}
          width={screenWidth - 40}
          height={180}
          yAxisSuffix="%"
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(0,184,148,${opacity})`,
            decimalPlaces: 0,
            propsForLabels: { fontSize: 10 },
            propsForDots: { r: '3', strokeWidth: '2', stroke: '#00b894' },
            propsForBackgroundLines: { stroke: '#eee' },
          }}
          bezier
          fromZero
          yLabelsOffset={10}
          segments={6}
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
    color: '#00b894',
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

export default Spo2Details; 