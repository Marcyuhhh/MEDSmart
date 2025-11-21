import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { caregiverStyles } from '../../styles/caregiver.styles';
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';
import Button from '../../components/common/button';

// --- Activity Item Component (Green Theme) ---
const ActivityItem = ({ item }) => {
  let iconName;
  let style;
  let iconColor = COLORS.white;

  // Reuse the logic but apply caregiver styles
  switch (item.type) {
    case 'success':
      iconName = 'checkmark-circle';
      style = caregiverStyles.activitySuccess;
      break;
    case 'warning':
      iconName = 'alert-circle';
      style = caregiverStyles.activityWarning;
      break;
    case 'alert':
      iconName = 'close-circle';
      style = caregiverStyles.activityAlert;
      break;
    default:
      iconName = 'help-circle';
      style = { backgroundColor: COLORS.gray };
  }

  return (
    <View style={caregiverStyles.activityItem}>
      <View style={[caregiverStyles.activityIconContainer, style]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <View style={caregiverStyles.activityTextContainer}>
        <Text style={caregiverStyles.activityTitle}>{item.title}</Text>
        <Text style={caregiverStyles.activityMessage}>{item.message}</Text>
      </View>
      <Text style={caregiverStyles.activityTimestamp}>{item.time}</Text>
    </View>
  );
};

// --- Main Component ---
export default function CaregiverActivityScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- 1. Connection Logic ---
  // We check if the logged-in caregiver has a patient ID linked
  const isPatientConnected = user?.linkedPatientId ? true : false; 

  // --- DATA FETCHING ---
  const fetchData = () => {
    if (!isPatientConnected) return;

    console.log("Fetching patient activity log...");
    // TODO: Connect to Firebase
    // Fetch `activity_log/{user.linkedPatientId}`
    
    // --- Mock Data (Only shown if connected) ---
    setActivities([
      { id: '1', type: 'alert', title: 'Missed Dose', message: 'Metformin from A1 (8:00 AM)', time: 'Today, 8:15 AM' },
      { id: '2', type: 'success', title: 'Dose Taken', message: 'Lisinopril from B2', time: 'Yesterday, 2:05 PM' },
      { id: '3', type: 'success', title: 'Dose Taken', message: 'Metformin from A1', time: 'Yesterday, 8:00 AM' },
    ]);
    // -------------------------------------------
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    setIsLoading(false);
  }, [isPatientConnected]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [isPatientConnected]);

  // --- RENDER: Header ---
  const Header = () => (
    <View style={caregiverStyles.header}>
      <Text style={caregiverStyles.headerTitle}>Patient Activity</Text>
      <Text style={caregiverStyles.headerSubtitle}>
        {isPatientConnected 
          ? `Monitoring: ${user?.linkedPatientName || 'Patient'}` 
          : 'No Patient Connected'}
      </Text>
    </View>
  );

  // --- RENDER: No Patient State ---
  if (!isPatientConnected) {
    return (
      <SafeAreaView style={caregiverStyles.container} edges={['top', 'left', 'right']}>
        <Header />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Ionicons name="link-outline" size={80} color={COLORS.gray} />
          <Text style={{ 
            fontSize: 18, 
            color: COLORS.gray, 
            textAlign: 'center', 
            marginTop: 20, 
            marginBottom: 30 
          }}>
            You are not linked to any patient yet. Pair with a patient to see their activity history.
          </Text>
          <Button 
            title="Go to Profile to Pair" 
            onPress={() => router.push('/(caregiver)/profile')}
            color={COLORS.caregiverPrimary}
          />
        </View>
      </SafeAreaView>
    );
  }

  // --- RENDER: Connected State ---
  return (
    <SafeAreaView style={caregiverStyles.container} edges={['top', 'left', 'right']}>
      <Header />
      
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.caregiverPrimary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={activities}
          renderItem={({ item }) => <ActivityItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={caregiverStyles.activityListContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[COLORS.caregiverPrimary]}
            />
          }
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: COLORS.gray, marginTop: 20 }}>
              No recent activity recorded.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}