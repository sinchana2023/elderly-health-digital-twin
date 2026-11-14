import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { startNotificationsAfterLogin } from '../_services/anomalyDetection';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = useState('demo@medassist.local');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const { login, loginAsDemo } = useAuth();
  const router = useRouter();

  const finishLogin = async () => {
    await startNotificationsAfterLogin();
    router.replace('/(tabs)');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      await finishLogin();
    } catch (error) {
      Alert.alert('Login Error', error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await loginAsDemo();
      await finishLogin();
    } catch (error) {
      Alert.alert('Demo Error', error.message || 'Could not start demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="medical-bag" size={64} color="#00CEC9" />
      <Text style={styles.brand}>MedAssist</Text>
      <Text style={styles.subtitle}>Elderly IoT Health Monitoring · Demo</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.demoButton} onPress={handleDemo} disabled={loading}>
        <Text style={styles.demoButtonText}>Continue as Demo</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        No Firebase or Azure credentials needed. Sensor data is simulated locally.
      </Text>

      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/(auth)/signup')}>
        <Text style={styles.linkText}>Don&apos;t have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f0f7f7',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  brand: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00CEC9',
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#636e72',
    marginBottom: 28,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#00CEC9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoButton: {
    marginTop: 12,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00CEC9',
    backgroundColor: '#fff',
  },
  demoButtonText: {
    color: '#00CEC9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    marginTop: 16,
    textAlign: 'center',
    color: '#636e72',
    fontSize: 13,
    lineHeight: 18,
  },
  linkButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  linkText: {
    color: '#00CEC9',
    fontSize: 15,
  },
});
