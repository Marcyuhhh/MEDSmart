import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../../components/shared/bottomTabBar';
import { COLORS } from '../../styles/common.styles';

const PATIENT_COLOR = COLORS.patientPrimary;

export default function PatientLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} activeColor={PATIENT_COLOR} />}
      screenOptions={{
        headerStyle: { backgroundColor: PATIENT_COLOR },
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="medbox"
        options={{
          title: 'MedBox',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'medkit' : 'medkit-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      
      {/* Settings screen - completely hidden from tab bar */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // This prevents direct navigation via URL
          title: 'App Settings',
          // No tabBarIcon so it won't appear in custom tab bar
        }}
      />
    </Tabs>
  );
}