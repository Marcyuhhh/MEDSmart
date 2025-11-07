import React from 'react';
import { Tabs } from 'expo-router';
import BottomTabBar from '../../components/shared/bottomTabBar';
import { Ionicons } from '@expo/vector-icons';

const CAREGIVER_COLOR = '#43A047';

export default function CaregiverLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} activeColor={CAREGIVER_COLOR} />}
      screenOptions={{
        headerStyle: { backgroundColor: CAREGIVER_COLOR },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Patient Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Patient Activity',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="medbox"
        options={{
          title: 'Patient MedBox',
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