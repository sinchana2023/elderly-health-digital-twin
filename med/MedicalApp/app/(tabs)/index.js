import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function Dashboard() {
  return (
    <ScrollView style={styles.container}>
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard}>
          <FontAwesome5 name="calendar-plus" size={24} color="#00CEC9" />
          <Text style={styles.actionText}>Book Appointment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <FontAwesome5 name="pills" size={24} color="#00CEC9" />
          <Text style={styles.actionText}>Medicine Reminder</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <FontAwesome5 name="file-medical" size={24} color="#00CEC9" />
          <Text style={styles.actionText}>Health Records</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Appointments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        <View style={styles.appointmentCard}>
          <View style={styles.appointmentInfo}>
            <Text style={styles.doctorName}>Dr. Sarah Johnson</Text>
            <Text style={styles.appointmentType}>General Checkup</Text>
            <Text style={styles.appointmentTime}>Today, 2:30 PM</Text>
          </View>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Medicine Reminders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Medicines</Text>
        <View style={styles.medicineCard}>
          <FontAwesome5 name="capsules" size={24} color="#00CEC9" />
          <View style={styles.medicineInfo}>
            <Text style={styles.medicineName}>Vitamin D3</Text>
            <Text style={styles.medicineTime}>After Breakfast</Text>
          </View>
          <TouchableOpacity style={styles.takenButton}>
            <FontAwesome5 name="check" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Health Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Stats</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <FontAwesome5 name="heartbeat" size={24} color="#00CEC9" />
            <Text style={styles.statValue}>72 BPM</Text>
            <Text style={styles.statLabel}>Heart Rate</Text>
          </View>
          <View style={styles.statCard}>
            <FontAwesome5 name="walking" size={24} color="#00CEC9" />
            <Text style={styles.statValue}>8,234</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
          <View style={styles.statCard}>
            <FontAwesome5 name="bed" size={24} color="#00CEC9" />
            <Text style={styles.statValue}>7.5h</Text>
            <Text style={styles.statLabel}>Sleep</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  actionCard: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    width: '30%',
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  appointmentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  appointmentInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#00CEC9',
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: '#00CEC9',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  medicineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  medicineInfo: {
    flex: 1,
    marginLeft: 15,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  medicineTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  takenButton: {
    backgroundColor: '#00CEC9',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    width: '31%',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
}); 