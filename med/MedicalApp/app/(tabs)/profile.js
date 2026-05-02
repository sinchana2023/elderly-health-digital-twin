import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { stopNotifications } from '../../app/services/anomalyDetection';

const MenuItem = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIconContainer}>
      <FontAwesome5 name={icon} size={20} color="#fff" />
    </View>
    <Text style={styles.menuTitle}>{title}</Text>
    <FontAwesome5 name="chevron-right" size={16} color="#ccc" />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState({
    name: 'Jane Doe',
    phone: '+123 567 89000',
    email: 'Janedoe@example.com',
    image: null
  });
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedUserData = await AsyncStorage.getItem('userData');
      if (savedUserData) {
        setUserData(JSON.parse(savedUserData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            // Stop notifications
            stopNotifications();
            await AsyncStorage.removeItem('userToken');
            router.replace('/auth/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Emergency contacts data
  const emergencyContacts = [
    {
      id: 1,
      name: 'Home',
      phone: '+91 9876543210',
      message: 'Emergency: Need immediate help at home!'
    },
    {
      id: 2,
      name: 'Doctor',
      phone: '+91 9876543211',
      message: 'Medical Emergency: Need immediate assistance!'
    },
    {
      id: 3,
      name: 'Neighbour',
      phone: '+91 9876543212',
      message: 'Emergency: Need your help!'
    }
  ];

  const handleCall = (phone) => {
    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl)
      .then(supported => {
        if (!supported) {
          Alert.alert('Phone number is not available');
        } else {
          return Linking.openURL(phoneUrl);
        }
      })
      .catch(err => console.error('An error occurred', err));
  };

  const handleMessage = (phone, message) => {
    const messageUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
    Linking.canOpenURL(messageUrl)
      .then(supported => {
        if (!supported) {
          Alert.alert('SMS is not available');
        } else {
          return Linking.openURL(messageUrl);
        }
      })
      .catch(err => console.error('An error occurred', err));
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          {userData.image ? (
            <Image source={{ uri: userData.image }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <FontAwesome5 name="user" size={40} color="#fff" />
            </View>
          )}
          <TouchableOpacity style={styles.editButton}>
            <FontAwesome5 name="pen" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.profileName}>{userData.name}</Text>
        <Text style={styles.profileContact}>{userData.phone}</Text>
        <Text style={styles.profileEmail}>{userData.email}</Text>
      </View>

      {/* Emergency Help Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => setIsEmergencyOpen(!isEmergencyOpen)}
        >
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name="help-circle" size={24} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Emergency Help</Text>
          </View>
          <MaterialCommunityIcons 
            name={isEmergencyOpen ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>

        {isEmergencyOpen && (
          <View style={styles.emergencyContainer}>
            {emergencyContacts.map(contact => (
              <View key={contact.id} style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.callButton]}
                    onPress={() => handleCall(contact.phone)}
                  >
                    <MaterialCommunityIcons name="phone" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.messageButton]}
                    onPress={() => handleMessage(contact.phone, contact.message)}
                  >
                    <MaterialCommunityIcons name="message" size={20} color="#fff" />
                    <Text style={styles.buttonText}>SOS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <MenuItem
          icon="user"
          title="Profile"
          onPress={() => Alert.alert('Profile', 'Edit your profile information')}
        />
        <MenuItem
          icon="heart"
          title="Favorite"
          onPress={() => Alert.alert('Favorites', 'View your favorite items')}
        />
        <MenuItem
          icon="credit-card"
          title="Payment Method"
          onPress={() => Alert.alert('Payment', 'Manage your payment methods')}
        />
        <MenuItem
          icon="shield-alt"
          title="Privacy Policy"
          onPress={() => Alert.alert('Privacy', 'View privacy policy')}
        />
        <MenuItem
          icon="cog"
          title="Settings"
          onPress={() => Alert.alert('Settings', 'Adjust your preferences')}
        />
        <MenuItem
          icon="question-circle"
          title="Help"
          onPress={() => Alert.alert('Help', 'Get assistance')}
        />
        <MenuItem
          icon="sign-out-alt"
          title="Logout"
          onPress={handleLogout}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#00CEC9',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileContact: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 3,
  },
  profileEmail: {
    color: '#fff',
    fontSize: 16,
  },
  section: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  emergencyContainer: {
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  contactInfo: {
    marginBottom: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  messageButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00CEC9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
}); 