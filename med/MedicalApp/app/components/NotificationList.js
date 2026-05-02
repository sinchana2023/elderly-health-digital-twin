import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { addNotificationListener, getCurrentNotifications } from '../services/anomalyDetection';

export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    // Get initial notifications
    setNotifications(getCurrentNotifications());

    // Subscribe to new notifications
    const unsubscribe = addNotificationListener((newNotifications) => {
      setNotifications(newNotifications);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  if (notifications.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Recent Alerts</Text>
        <Text style={styles.noAlerts}>No recent alerts</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Alerts</Text>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {notifications.map((notification) => (
          <View 
            key={notification.id} 
            style={[
              styles.notification,
              notification.priority === 'high' ? styles.highPriority : styles.mediumPriority
            ]}
          >
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationBody}>{notification.body}</Text>
            <Text style={styles.timestamp}>
              {new Date(notification.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  noAlerts: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  notification: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  highPriority: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  mediumPriority: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
}); 