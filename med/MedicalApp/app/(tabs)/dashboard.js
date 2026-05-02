import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Button } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import NotificationList from '../components/NotificationList';
import { getCurrentNotifications } from '../services/anomalyDetection';

export default function DashboardScreen() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugTimestamps, setDebugTimestamps] = useState([]);
  const [bpmHistory, setBpmHistory] = useState([]);
  const intervalRef = useRef(null);

  // Fetch the latest document by timestamp and log top 5
  const fetchLatestMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch top 10 for graph, top 5 for debug
      const q = query(
        collection(db, 'healthMetrics'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const debugList = [];
      const bpmList = [];
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data();
          const ts = data.timestamp && data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp;
          debugList.push({ id: doc.id, timestamp: ts });
          bpmList.push({ bpm: data.bpm, timestamp: ts });
        });
        setMetrics(snapshot.docs[0].data()); // Most recent for cards/pie
      } else {
        setMetrics(null);
      }
      setDebugTimestamps(debugList.slice(0, 5));
      setBpmHistory(bpmList.reverse()); // Oldest to newest for graph
    } catch (err) {
      setError('Failed to fetch health metrics');
      setMetrics(null);
      setDebugTimestamps([]);
      setBpmHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestMetrics();
    intervalRef.current = setInterval(fetchLatestMetrics, 60000); // Refresh every minute
    return () => clearInterval(intervalRef.current);
  }, []);

  // Pie chart data (use metrics if available, else fallback)
  const pieData = metrics ? [
    { name: 'Heart Rate', population: metrics.bpm, color: '#FF6384', legendFontColor: '#7F7F7F' },
    { name: 'Env Temp', population: metrics.dht_temp, color: '#36A2EB', legendFontColor: '#7F7F7F' },
    { name: 'Body Temp', population: metrics.lm35_temp, color: '#FFCE56', legendFontColor: '#7F7F7F' },
    { name: 'Acceleration', population: Math.abs(metrics.acc_x), color: '#4BC0C0', legendFontColor: '#7F7F7F' },
    { name: 'Movement', population: metrics.gps_speed, color: '#9966FF', legendFontColor: '#7F7F7F' },
  ] : [
    { name: 'Heart Rate', population: 25, color: '#FF6384', legendFontColor: '#7F7F7F' },
    { name: 'Env Temp', population: 20, color: '#36A2EB', legendFontColor: '#7F7F7F' },
    { name: 'Body Temp', population: 20, color: '#FFCE56', legendFontColor: '#7F7F7F' },
    { name: 'Acceleration', population: 15, color: '#4BC0C0', legendFontColor: '#7F7F7F' },
    { name: 'Movement', population: 20, color: '#9966FF', legendFontColor: '#7F7F7F' },
  ];

  // Card data with icons and navigation routes, using dynamic values
  const healthCards = [
    { title: 'Heart Rate', icon: 'heart-pulse', color: '#FF6384', route: 'screens/HeartDetails', value: metrics ? `${metrics.bpm} BPM` : '--' },
    { title: 'Body Temperature', icon: 'thermometer', color: '#36A2EB', route: 'screens/EnvironmentDetails', value: metrics ? `${metrics.dht_temp?.toFixed(1)}°C` : '--' },
    { title: 'Environment', icon: 'thermometer-lines', color: '#FFCE56', route: 'screens/BodyTempDetails', value: metrics ? `${metrics.lm35_temp?.toFixed(1)}°C` : '--' },
    { title: 'Movement', icon: 'run', color: '#9966FF', route: 'screens/MovementDetails', value: metrics ? `${(metrics.gps_speed * 1000).toFixed(0)} steps` : '--' },
    { title: 'Acceleration', icon: 'speedometer', color: '#4BC0C0', route: 'screens/AccelerationDetails', value: metrics ? `${metrics.acc_x?.toFixed(1)} m/s²` : '--' },
    { title: 'SpO2', icon: 'water-percent', color: '#00b894', route: 'screens/Spo2Details', value: metrics ? `${metrics.spo2}%` : '--' },
    { title: 'Location', icon: 'map-marker', color: '#fdcb6e', route: 'screens/LocationDetails', value: metrics ? `${metrics.gps_lat?.toFixed(4)}, ${metrics.gps_lng?.toFixed(4)}` : '--' },
  ];

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  const handleDebugNotifications = () => {
    const notifications = getCurrentNotifications();
    console.log('Current notifications:', notifications);
    alert('Check console for current notifications!');
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Health Dashboard</Text>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Health Metrics Overview</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
      {/* Heart Rate Card with Line Chart */}
      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/screens/HeartDetails')}
          disabled={loading}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FF6384' }]}> 
            <MaterialCommunityIcons name={'heart-pulse'} size={32} color="white" />
          </View>
          <Text style={styles.cardTitle}>Heart Rate</Text>
          <Text style={styles.cardValue}>{metrics ? `${metrics.bpm} BPM` : '--'}</Text>
        </TouchableOpacity>
        {/* Other cards */}
        {healthCards.slice(1).map((card, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => {
              if (card.title === 'Environment') {
                router.push('/screens/EnvironmentDetails');
              } else if (card.title === 'Body Temperature') {
                router.push('/screens/BodyTempDetails');
              } else if (card.title === 'Acceleration') {
                router.push('/screens/AccelerationDetails');
              } else if (card.title === 'Movement') {
                router.push('/screens/MovementDetails');
              } else if (card.title === 'SpO2') {
                router.push('/screens/Spo2Details');
              } else if (card.title === 'Location') {
                router.push('/screens/LocationDetails');
              } else {
                router.push(card.route);
              }
            }}
            disabled={loading}
          >
            <View style={[styles.iconContainer, { backgroundColor: card.color }]}> 
              <MaterialCommunityIcons name={card.icon} size={32} color="white" />
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button title="Debug Notifications" onPress={handleDebugNotifications} />
      {/* Notification List */}
      <NotificationList />
      {/* Debug Section: Show top 5 document IDs and timestamps */}
      <View style={styles.rawSection}>
        <Text style={styles.rawHeader}>Top 5 Firestore Health Metrics by Timestamp (Debug)</Text>
        {debugTimestamps.length === 0 ? (
          <Text style={styles.rawJson}>No data found</Text>
        ) : (
          debugTimestamps.map((item, idx) => (
            <Text style={styles.rawJson} key={item.id}>{`#${idx + 1} ID: ${item.id}, timestamp: ${item.timestamp}`}</Text>
          ))
        )}
      </View>
      {/* Raw Firestore Data Section */}
      <View style={styles.rawSection}>
        <Text style={styles.rawHeader}>Latest Firestore Health Metrics (Raw)</Text>
        {metrics === null ? (
          <Text style={styles.rawJson}>No data found</Text>
        ) : (
          <Text style={styles.rawJson}>{JSON.stringify(metrics, null, 2)}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#00CEC9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
  chartContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    width: '47%',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  rawSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rawHeader: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#222',
  },
  rawJson: {
    fontFamily: 'monospace',
    color: '#222',
    fontSize: 13,
  },
}); 