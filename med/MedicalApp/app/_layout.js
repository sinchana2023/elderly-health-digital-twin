import { Stack } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { AuthProvider } from '../context/AuthContext';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { startMockHealthStore } from './_services/mockHealthStore';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({});

  useEffect(() => {
    startMockHealthStore();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
        await Notifications.requestPermissionsAsync();
      } catch (e) {
        console.log('Notifications unavailable', e?.message);
      }
    })();
  }, []);

  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#00CEC9' },
            headerTintColor: '#fff',
          }}
        >
          <Stack.Screen name="splash" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="screens/HeartDetails"
            options={{ title: 'Heart Rate', headerTintColor: '#fff' }}
          />
          <Stack.Screen
            name="screens/EnvironmentDetails"
            options={{ title: 'Environment', headerTintColor: '#fff' }}
          />
          <Stack.Screen
            name="screens/BodyTempDetails"
            options={{ title: 'Body Temperature', headerTintColor: '#fff' }}
          />
          <Stack.Screen
            name="screens/MovementDetails"
            options={{ title: 'Movement', headerTintColor: '#fff' }}
          />
          <Stack.Screen
            name="screens/AccelerationDetails"
            options={{ title: 'Acceleration', headerTintColor: '#fff' }}
          />
          <Stack.Screen
            name="screens/Spo2Details"
            options={{ title: 'SpO2', headerTintColor: '#fff' }}
          />
          <Stack.Screen
            name="screens/LocationDetails"
            options={{ title: 'Location', headerTintColor: '#fff' }}
          />
        </Stack>
      </View>
    </AuthProvider>
  );
}
