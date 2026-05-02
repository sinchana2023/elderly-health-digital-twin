import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" options={{ gestureEnabled: false }} />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      <Stack.Screen 
        name="screens/HeartDetails"
        options={{
          title: 'Heart Rate',
          headerTintColor: '#FF6384',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="screens/EnvironmentDetails"
        options={{
          title: 'Environment',
          headerTintColor: '#36A2EB',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="screens/BodyTempDetails"
        options={{
          title: 'Body Temperature',
          headerTintColor: '#FFCE56',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="screens/MovementDetails"
        options={{
          title: 'Movement',
          headerTintColor: '#9966FF',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="screens/AccelerationDetails"
        options={{
          title: 'Acceleration',
          headerTintColor: '#4BC0C0',
          headerShown: true,
        }}
      />
    </Stack>
  );
} 