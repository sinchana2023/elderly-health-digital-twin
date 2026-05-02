import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AccelerationDetails = () => {
  const screenWidth = Dimensions.get('window').width;
  const [accHistory, setAccHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchAccHistory = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'healthMetrics'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const accList = [];
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data();
          const ts = data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp;
          accList.push({ x: data.acc_x, y: data.acc_y, z: data.acc_z, timestamp: ts });
        });
      }
      setAccHistory(accList.reverse()); // Oldest to newest
    } catch (err) {
      setAccHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccHistory();
    intervalRef.current = setInterval(fetchAccHistory, 60000); // Refresh every minute
    return () => clearInterval(intervalRef.current);
  }, []);

  const latest = accHistory.length > 0 ? accHistory[accHistory.length - 1] : null;

  const now = new Date();
  const timeLabels = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    timeLabels.push(`${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`);
  }
  const dataX = timeLabels.map(label => {
    const found = accHistory.find(item => {
      const d = new Date(item.timestamp);
      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}` === label;
    });
    return found ? found.x ?? 0 : 0;
  });
  const dataY = timeLabels.map(label => {
    const found = accHistory.find(item => {
      const d = new Date(item.timestamp);
      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}` === label;
    });
    return found ? found.y ?? 0 : 0;
  });
  const dataZ = timeLabels.map(label => {
    const found = accHistory.find(item => {
      const d = new Date(item.timestamp);
      return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}` === label;
    });
    return found ? found.z ?? 0 : 0;
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="speedometer" size={40} color="#4BC0C0" />
        <Text style={styles.title}>Acceleration Details</Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>X</Text>
          <Text style={styles.statValue}>{latest ? latest.x?.toFixed(2) : '--'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Y</Text>
          <Text style={styles.statValue}>{latest ? latest.y?.toFixed(2) : '--'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Z</Text>
          <Text style={styles.statValue}>{latest ? latest.z?.toFixed(2) : '--'}</Text>
        </View>
      </View>
      <Text style={styles.subHeader}>Acceleration X (last 10 minutes)</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : timeLabels.length > 1 ? (
        <LineChart
          data={{
            labels: timeLabels,
            datasets: [
              {
                data: dataX,
                color: (opacity = 1) => `rgba(255,99,132,${opacity})`,
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
            color: (opacity = 1) => `rgba(255,99,132,${opacity})`,
            decimalPlaces: 2,
            propsForLabels: { fontSize: 12, fill: '#000' },
            propsForDots: { r: '2', strokeWidth: '1', stroke: '#FF6384' },
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
      <Text style={styles.subHeader}>Acceleration Y (last 10 minutes)</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : timeLabels.length > 1 ? (
        <LineChart
          data={{
            labels: timeLabels,
            datasets: [
              {
                data: dataY,
                color: (opacity = 1) => `rgba(54,162,235,${opacity})`,
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
            color: (opacity = 1) => `rgba(54,162,235,${opacity})`,
            decimalPlaces: 2,
            propsForLabels: { fontSize: 12, fill: '#000' },
            propsForDots: { r: '2', strokeWidth: '1', stroke: '#36A2EB' },
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
      <Text style={styles.subHeader}>Acceleration Z (last 10 minutes)</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : timeLabels.length > 1 ? (
        <LineChart
          data={{
            labels: timeLabels,
            datasets: [
              {
                data: dataZ,
                color: (opacity = 1) => `rgba(75,192,192,${opacity})`,
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
            color: (opacity = 1) => `rgba(75,192,192,${opacity})`,
            decimalPlaces: 2,
            propsForLabels: { fontSize: 12, fill: '#000' },
            propsForDots: { r: '2', strokeWidth: '1', stroke: '#4BC0C0' },
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
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4BC0C0',
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

export default AccelerationDetails; 