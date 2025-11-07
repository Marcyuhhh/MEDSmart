import React from 'react';
import { Tabs } from 'expo-router';
import BottomTabBar from '../../components/shared/bottomTabBar';
import { Ionicons } from '@expo/vector-icons';

const PATIENT_COLOR = '#1E88E5';

export default function PatientLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} activeColor={PATIENT_COLOR} />}
      screenOptions={{
        headerStyle: { backgroundColor: PATIENT_COLOR },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
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
    </Tabs>
  );
}