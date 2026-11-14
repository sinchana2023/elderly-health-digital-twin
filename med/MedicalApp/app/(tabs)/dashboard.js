import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import NotificationList from '../_components/NotificationList';
import { getCurrentNotifications } from '../_services/anomalyDetection';
import { subscribe } from '../_services/mockHealthStore';
import { subscribeTwin } from '../_services/digitalTwinStore';
import { scoreAnomaly } from '../_services/mlAnomalyModel';

export default function DashboardScreen() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bpmHistory, setBpmHistory] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    const unsub = subscribe((latest, history) => {
      setMetrics(latest);
      setBpmHistory(
        history.slice(-10).map((row) => ({
          bpm: row.bpm,
          timestamp: row.timestamp,
        }))
      );
      if (latest) setRisk(scoreAnomaly(latest));
      setAlertCount(getCurrentNotifications().length);
      setLoading(false);
    });
    const unsubTwin = subscribeTwin((snap) => {
      if (snap?.risk) setRisk(snap.risk);
    });
    return () => {
      unsub();
      unsubTwin();
    };
  }, []);

  const pieData = metrics
    ? [
        { name: 'Heart Rate', population: metrics.bpm, color: '#FF6384', legendFontColor: '#7F7F7F' },
        { name: 'Env Temp', population: metrics.dht_temp, color: '#36A2EB', legendFontColor: '#7F7F7F' },
        { name: 'Body Temp', population: metrics.lm35_temp, color: '#FFCE56', legendFontColor: '#7F7F7F' },
        { name: 'Acceleration', population: Math.abs(metrics.acc_x) + 1, color: '#4BC0C0', legendFontColor: '#7F7F7F' },
        { name: 'Movement', population: Math.max(metrics.gps_speed * 10, 1), color: '#9966FF', legendFontColor: '#7F7F7F' },
      ]
    : [
        { name: 'Heart Rate', population: 25, color: '#FF6384', legendFontColor: '#7F7F7F' },
        { name: 'Env Temp', population: 20, color: '#36A2EB', legendFontColor: '#7F7F7F' },
        { name: 'Body Temp', population: 20, color: '#FFCE56', legendFontColor: '#7F7F7F' },
        { name: 'Acceleration', population: 15, color: '#4BC0C0', legendFontColor: '#7F7F7F' },
        { name: 'Movement', population: 20, color: '#9966FF', legendFontColor: '#7F7F7F' },
      ];

  const healthCards = [
    {
      title: 'Heart Rate',
      icon: 'heart-pulse',
      color: '#FF6384',
      route: '/screens/HeartDetails',
      value: metrics ? `${metrics.bpm} BPM` : '--',
    },
    {
      title: 'Body Temperature',
      icon: 'thermometer',
      color: '#36A2EB',
      route: '/screens/BodyTempDetails',
      value: metrics ? `${metrics.lm35_temp?.toFixed(1)}°C` : '--',
    },
    {
      title: 'Environment',
      icon: 'thermometer-lines',
      color: '#FFCE56',
      route: '/screens/EnvironmentDetails',
      value: metrics ? `${metrics.dht_temp?.toFixed(1)}°C / ${metrics.dht_hum?.toFixed(0)}%` : '--',
    },
    {
      title: 'Movement',
      icon: 'run',
      color: '#9966FF',
      route: '/screens/MovementDetails',
      value: metrics ? `${(metrics.gps_speed * 1000).toFixed(0)} steps` : '--',
    },
    {
      title: 'Acceleration',
      icon: 'speedometer',
      color: '#4BC0C0',
      route: '/screens/AccelerationDetails',
      value: metrics ? `${metrics.acc_x?.toFixed(1)} m/s²` : '--',
    },
    {
      title: 'SpO2',
      icon: 'water-percent',
      color: '#00b894',
      route: '/screens/Spo2Details',
      value: metrics ? `${metrics.spo2}%` : '--',
    },
    {
      title: 'Location',
      icon: 'map-marker',
      color: '#fdcb6e',
      route: '/screens/LocationDetails',
      value: metrics
        ? `${metrics.gps_lat?.toFixed(4)}, ${metrics.gps_lng?.toFixed(4)}`
        : '--',
    },
  ];

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 206, 201, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForLabels: { fontSize: 10 },
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color="#00CEC9" />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>Health Dashboard</Text>
          <Text style={styles.subHeader}>MedAssist · twin + ML risk · simulated ESP32</Text>
        </View>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="bell-outline" size={18} color="#fff" />
          <Text style={styles.badgeText}>{alertCount}</Text>
        </View>
      </View>

      {risk ? (
        <TouchableOpacity
          style={[
            styles.riskCard,
            {
              backgroundColor:
                risk.riskLevel === 'high'
                  ? '#d63031'
                  : risk.riskLevel === 'elevated'
                    ? '#e17055'
                    : '#00b894',
            },
          ]}
          onPress={() => router.push('/(tabs)/twin')}
        >
          <Text style={styles.riskTitle}>
            ML risk {risk.riskScore}% · {risk.riskLevel}
          </Text>
          <Text style={styles.riskBody}>
            {(risk.reasons || []).join(' · ') || 'Vitals within model baseline'}
          </Text>
          <Text style={styles.riskLink}>View digital twin →</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Health Metrics Overview</Text>
        <PieChart
          data={pieData}
          width={Math.min(screenWidth - 40, 420)}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      {bpmHistory.length > 1 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Heart Rate Trend</Text>
          <LineChart
            data={{
              labels: bpmHistory.map((item) => {
                const d = new Date(item.timestamp);
                return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
              }),
              datasets: [{ data: bpmHistory.map((item) => item.bpm ?? 0) }],
            }}
            width={Math.min(screenWidth - 40, 420)}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 12 }}
          />
        </View>
      )}

      <View style={styles.cardsContainer}>
        {healthCards.map((card) => (
          <TouchableOpacity
            key={card.title}
            style={styles.card}
            onPress={() => router.push(card.route)}
          >
            <View style={[styles.iconContainer, { backgroundColor: card.color }]}>
              <MaterialCommunityIcons name={card.icon} size={32} color="white" />
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <NotificationList />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f7f7',
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
  subHeader: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontSize: 13,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  riskCard: {
    margin: 20,
    marginBottom: 0,
    borderRadius: 12,
    padding: 14,
  },
  riskTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  riskBody: { color: 'rgba(255,255,255,0.95)', marginTop: 6, fontSize: 13, lineHeight: 18 },
  riskLink: { color: '#fff', marginTop: 8, fontWeight: '600', fontSize: 13 },
  chartContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 0,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3.84,
    elevation: 3,
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
    shadowOpacity: 0.12,
    shadowRadius: 3.84,
    elevation: 3,
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
});
