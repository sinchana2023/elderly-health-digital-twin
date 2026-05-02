import React from 'react';
import { View } from 'react-native';
import HealthDashboard from '../../components/HealthDashboard';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <HealthDashboard />
    </View>
  );
} 