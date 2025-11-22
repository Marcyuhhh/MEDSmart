import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../../components/shared/bottomTabBar'; // Lowercase 'b' match
import { COLORS } from '../../styles/common.styles';

const CAREGIVER_COLOR = COLORS.caregiverPrimary;

export default function CaregiverLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} activeColor={CAREGIVER_COLOR} />}
      screenOptions={{
        headerStyle: { backgroundColor: CAREGIVER_COLOR },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {/* 1. Dashboard - UPDATED HEADER */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Monitoring Dashboard', // Specific Title requested
          // headerShown: true is the default, so we don't need to say false anymore
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* 2. Activity */}
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          headerShown: false, // Custom header inside screen
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* 3. MedBox */}
      <Tabs.Screen
        name="medbox"
        options={{
          title: 'MedBox',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'medkit' : 'medkit-outline'} size={24} color={color} />
          ),
        }}
      />

      {/* 4. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      
      {/* 5. Settings (Hidden) */}
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