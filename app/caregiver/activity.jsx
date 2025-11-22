import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { caregiverStyles } from '../../styles/caregiver.styles';
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';
import Button from '../../components/common/button';

// --- SERVICE IMPORTS ---
import { subscribeToActivity, markAllAsRead } from '../../services/activityService';

// --- Activity Item Component ---
const ActivityItem = ({ item }) => {
  let iconName;
  let style;
  let iconColor = COLORS.white;

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
  
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Recent';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <View style={caregiverStyles.activityItem}>
      {/* Read Dot (Visible only for Unread) */}
      {!item.isRead ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.caregiverPrimary, marginRight: 10 }} />
      ) : (
        <View style={{ width: 8, height: 8, marginRight: 10 }} />
      )}

      <View style={[caregiverStyles.activityIconContainer, style]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <View style={caregiverStyles.activityTextContainer}>
        <Text style={caregiverStyles.activityTitle}>{item.title}</Text>
        <Text style={caregiverStyles.activityMessage}>{item.message}</Text>
      </View>
      <Text style={caregiverStyles.activityTimestamp}>{formatTime(item.timestamp)}</Text>
    </View>
  );
};

// --- MAIN COMPONENT ---
export default function CaregiverActivityScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [patientName, setPatientName] = useState(user?.linkedPatientName || 'Patient');

  const isPatientConnected = user?.linkedPatientId ? true : false; 

  // --- 1. REAL-TIME DATA SUBSCRIPTION ---
  useEffect(() => {
    if (!isPatientConnected) {
        setIsLoading(false);
        setActivities([]);
        return;
    }

    // Subscribe to the linked patient's activity stream
    const unsubscribe = subscribeToActivity(
        user.linkedPatientId, 
        (data) => {
            setActivities(data);
            setIsLoading(false);
        },
        (error) => {
            console.error("Caregiver Activity Listener Error:", error);
            setIsLoading(false);
        }
    );

    return () => unsubscribe();
  }, [isPatientConnected]); // Runs when patient link status changes


  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Since the data is live via onSnapshot, we only simulate the delay
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);
  
  // --- MARK ALL READ HANDLER ---
  const handleMarkAllAsRead = async () => {
    if (!isPatientConnected) return;
    try {
        await markAllAsRead(user.linkedPatientId, activities);
    } catch (e) {
        Alert.alert("Error", "Failed to mark alerts as read.");
    }
  };

  const unreadCount = useMemo(() => activities.filter(item => !item.isRead).length, [activities]);


  // --- RENDER: Header ---
  const Header = () => (
    <View style={caregiverStyles.header}>
      <Text style={caregiverStyles.headerTitle}>{patientName}'s Activity</Text>
      <Text style={caregiverStyles.headerSubtitle}>
        {isPatientConnected 
          ? `Adherence history for ${patientName}` 
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
          <Text style={{ fontSize: 18, color: COLORS.gray, textAlign: 'center', marginTop: 20, marginBottom: 30 }}>
            You are not linked to any patient yet.
          </Text>
          <Button 
            title="Go to Profile to Pair" 
            onPress={() => router.push('/caregiver/profile')}
            color={COLORS.caregiverPrimary}
          />
        </View>
      </SafeAreaView>
    );
  }

  // --- RENDER: Connected State ---
  return (
    <SafeAreaView style={caregiverStyles.container} edges={['top', 'left', 'right']}>
      {/* Custom Stack Header to include the Mark All Read button */}
      <Stack.Screen 
        options={{
          headerShown: true,
          title: `${patientName}'s Activity`,
          headerStyle: { backgroundColor: COLORS.caregiverPrimary },
          headerTintColor: COLORS.white,
          headerRight: () => (
            unreadCount > 0 ? (
              <TouchableOpacity 
                style={{ marginRight: 15 }} 
                onPress={handleMarkAllAsRead}
              >
                <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>Mark All Read</Text>
              </TouchableOpacity>
            ) : null
          ),
        }}
      />
      
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.caregiverPrimary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={activities}
          renderItem={({ item }) => <ActivityItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={caregiverStyles.activityListContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.caregiverPrimary]} />
          }
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: COLORS.gray, marginTop: 20 }}>
              No activity history found for this patient.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}