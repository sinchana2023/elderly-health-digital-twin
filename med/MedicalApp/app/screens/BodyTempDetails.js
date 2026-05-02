import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BodyTempDetails = () => {
  const screenWidth = Dimensions.get('window').width;
  const [tempHistory, setTempHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchTempHistory = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'healthMetrics'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const tempList = [];
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data();
          const ts = data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp;
          tempList.push({ temp: data.dht_temp, timestamp: ts });
        });
      }
      setTempHistory(tempList.reverse()); // Oldest to newest
    } catch (err) {
      setTempHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTempHistory();
    intervalRef.current = setInterval(fetchTempHistory, 60000); // Refresh every minute
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="thermometer-lines" size={40} color="#FFCE56" />
        <Text style={styles.title}>Body Temperature Details</Text>
      </View>
      <Text style={styles.subHeader}>DHT11 Temperature Trend (last 10 readings)</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : tempHistory.length > 1 ? (
        <LineChart
          data={{
            labels: tempHistory.map(item => {
              const d = new Date(item.timestamp);
              return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }),
            datasets: [
              {
                data: tempHistory.map(item => item.temp ?? 0),
              },
            ],
          }}
          width={screenWidth - 40}
          height={220}
          yAxisSuffix="°C"
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            color: (opacity = 1) => `rgba(255,206,86,${opacity})`,
            decimalPlaces: 1,
            propsForLabels: { fontSize: 10 },
            propsForDots: { r: '3', strokeWidth: '2', stroke: '#FFCE56' },
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
});

export default BodyTempDetails; 