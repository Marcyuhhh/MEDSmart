import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// Use the smart tab bar we fixed earlier
import BottomTabBar from '../../components/shared/bottomTabBar';
import { COLORS } from '../../styles/common.styles';

// Caregiver color (GREEN)
const CAREGIVER_COLOR = COLORS.caregiverPrimary;

export default function CaregiverLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} activeColor={CAREGIVER_COLOR} />}
      screenOptions={{
        headerStyle: { backgroundColor: CAREGIVER_COLOR },
        headerTintColor: COLORS.white,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          headerShown: false, // Activity screen will have its own header with filter buttons
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="medbox"
        options={{
          title: 'MedBox',
          // We use a different icon for Caregiver to imply "Management"
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'medkit' : 'medkit-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'App Settings',
        }}
      />
    </Tabs>
  );
}