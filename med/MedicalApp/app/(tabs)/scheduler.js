import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import * as Notifications from 'expo-notifications';
import { FontAwesome5 } from '@expo/vector-icons';
import { db } from '../../config/firebase';
import { addMedication, getPatientMedications } from '../../config/database';
import { auth } from '../../config/firebase';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function MedicineScheduler() {
  const [selectedDate, setSelectedDate] = useState('');
  const [medications, setMedications] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  // Load saved medications when component mounts
  useEffect(() => {
    loadMedications();
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow notifications to receive medicine reminders.');
    }
  };

  const loadMedications = async () => {
    try {
      if (!auth.currentUser) {
        console.log('No user logged in');
        return;
      }

      const patientId = auth.currentUser.uid;
      const patientMedications = await getPatientMedications(patientId);
      
      // Organize medications by date
      const organizedMedications = {};
      patientMedications.forEach(med => {
        if (!organizedMedications[med.date]) {
          organizedMedications[med.date] = [];
        }
        organizedMedications[med.date].push(med);
      });
      
      setMedications(organizedMedications);
    } catch (error) {
      console.error('Error loading medications:', error);
      Alert.alert('Error', 'Failed to load medications');
    }
  };

  const scheduleNotification = async (medicine, date, time) => {
    const [hours, minutes] = time.split(':');
    const scheduledTime = new Date(date);
    scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0);

    // Don't schedule if the time has passed
    if (scheduledTime <= new Date()) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medicine Reminder',
          body: `Time to take ${medicine} - ${dosage}`,
          data: { medicineName: medicine, dosage },
        },
        trigger: {
          hour: parseInt(hours),
          minute: parseInt(minutes),
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const handleAddMedication = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'Please log in to add medications');
      return;
    }

    if (!selectedDate || !medicineName || !time || !dosage) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      const patientId = auth.currentUser.uid;
      const newMedication = {
        name: medicineName,
        dosage,
        frequency,
        time,
        notes,
        date: selectedDate,
      };

      // Add to Firebase using our database function
      await addMedication(patientId, newMedication);
      
      // Reload medications to get the updated list
      await loadMedications();
      
      // Schedule notification
      await scheduleNotification(medicineName, selectedDate, time);

      // Reset form
      setModalVisible(false);
      setMedicineName('');
      setDosage('');
      setFrequency('');
      setTime('');
      setNotes('');
      
      Alert.alert('Success', 'Medication added successfully');
    } catch (error) {
      console.error('Error adding medication:', error);
      Alert.alert('Error', 'Failed to add medication');
    }
  };

  const markedDates = Object.keys(medications).reduce((acc, date) => {
    acc[date] = { marked: true, dotColor: '#4CAF50' };
    return acc;
  }, {});

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: '#4CAF50',
    };
  }

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          todayTextColor: '#4CAF50',
          selectedDayBackgroundColor: '#4CAF50',
          dotColor: '#4CAF50',
        }}
      />

      <View style={styles.medicationsContainer}>
        <Text style={styles.medicationsTitle}>
          {selectedDate ? `Medications for ${selectedDate}` : 'Select a date'}
        </Text>
        <ScrollView style={styles.medicationsList}>
          {selectedDate &&
            medications[selectedDate]?.map((med, index) => (
              <View key={index} style={styles.medicationCard}>
                <View style={styles.medicationHeader}>
                  <FontAwesome5 name="pills" size={20} color="#4CAF50" />
                  <Text style={styles.medicationTime}>{med.time}</Text>
                </View>
                <Text style={styles.medicationName}>{med.name}</Text>
                <Text style={styles.medicationDosage}>Dosage: {med.dosage}</Text>
                {med.frequency && (
                  <Text style={styles.medicationFrequency}>
                    Frequency: {med.frequency}
                  </Text>
                )}
                {med.notes && <Text style={styles.medicationNotes}>{med.notes}</Text>}
              </View>
            ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>Add Medication</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Medication</Text>

            <TextInput
              style={styles.input}
              placeholder="Medicine Name"
              value={medicineName}
              onChangeText={setMedicineName}
            />

            <TextInput
              style={styles.input}
              placeholder="Dosage (e.g., 1 pill, 5ml)"
              value={dosage}
              onChangeText={setDosage}
            />

            <TextInput
              style={styles.input}
              placeholder="Frequency (e.g., Once daily, Twice daily)"
              value={frequency}
              onChangeText={setFrequency}
            />

            <TextInput
              style={styles.input}
              placeholder="Time (HH:MM)"
              value={time}
              onChangeText={setTime}
            />

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddMedication}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  medicationsContainer: {
    flex: 1,
    padding: 20,
  },
  medicationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  medicationsList: {
    flex: 1,
  },
  medicationCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  medicationTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 10,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  medicationFrequency: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  medicationNotes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
}); 