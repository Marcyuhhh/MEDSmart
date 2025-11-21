import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { patientStyles } from '../../styles/patient.styles';
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';
// --- FIREBASE IMPORTS ---
import { collection, query, where, orderBy, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

const ActivityItem = ({ item }) => {
  let iconName;
  let style;
  let iconColor = COLORS.white;

  switch (item.type) {
    case 'success':
      iconName = 'checkmark-circle';
      style = patientStyles.activitySuccess;
      break;
    case 'warning':
      iconName = 'alert-circle';
      style = patientStyles.activityWarning;
      break;
    case 'alert':
      iconName = 'close-circle';
      style = patientStyles.activityAlert;
      break;
    default:
      iconName = 'help-circle';
      style = { backgroundColor: COLORS.gray };
  }

  return (
    <View style={patientStyles.activityItem}>
      {item.isRead ? (
        <View style={patientStyles.unreadDotPlaceholder} />
      ) : (
        <View style={patientStyles.unreadDot} />
      )}
      
      <View style={[patientStyles.activityIconContainer, style]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <View style={patientStyles.activityTextContainer}>
        <Text style={patientStyles.activityTitle}>{item.title}</Text>
        <Text style={patientStyles.activityMessage}>{item.message}</Text>
      </View>
      <Text style={patientStyles.activityTimestamp}>{item.time}</Text>
    </View>
  );
};

export default function ActivityScreen() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- 1. REAL FETCH ---
  const fetchData = async () => {
    if (!user) {
      setActivities([]);
      return;
    }
    
    try {
      // Query: Get logs for this user, ordered by time
      const q = query(
        collection(db, 'activity_log'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const logs = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({ 
          id: doc.id, 
          ...data,
          // Convert Firestore timestamp to display time
          time: formatTimestamp(data.timestamp),
          // Ensure isRead is boolean
          isRead: data.isRead || false
        });
      });
      
      setActivities(logs);
    } catch (error) {
      console.error("Fetch error:", error);
      // Fallback to empty array if error
      setActivities([]);
    }
  };

  // Helper function to format Firestore timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    try {
      // If it's a Firestore timestamp
      if (timestamp.toDate) {
        const date = timestamp.toDate();
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // If it's already a string or other format
      return timestamp;
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return 'Unknown time';
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData().then(() => setIsLoading(false));
  }, [user]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData().then(() => setIsRefreshing(false));
  }, [user]);

  // --- 2. REAL MARK ALL READ ---
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    const unreadItems = activities.filter(item => !item.isRead);
    if (unreadItems.length === 0) return;
    
    console.log("Marking all as read in Firebase...");
    
    const batch = writeBatch(db);
    
    unreadItems.forEach(item => {
      const docRef = doc(db, 'activity_log', item.id);
      batch.update(docRef, { isRead: true });
    });

    try {
      await batch.commit();
      // Optimistic update
      setActivities(prev => prev.map(item => ({ ...item, isRead: true })));
    } catch (error) {
      console.error("Batch update failed", error);
      Alert.alert("Error", "Failed to mark activities as read");
    }
  };
  
  const unreadCount = useMemo(() => activities.filter(item => !item.isRead).length, [activities]);

  return (
    <SafeAreaView style={patientStyles.container} edges={['bottom', 'left', 'right']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Activity',
          headerStyle: { backgroundColor: COLORS.patientPrimary },
          headerTintColor: COLORS.white,
          headerRight: () => (
            unreadCount > 0 ? (
              <TouchableOpacity style={patientStyles.headerButton} onPress={handleMarkAllAsRead}>
                <Text style={patientStyles.headerButtonText}>Mark All Read</Text>
              </TouchableOpacity>
            ) : null
          ),
        }}
      />
    
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.patientPrimary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={activities}
          renderItem={({ item }) => <ActivityItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={patientStyles.activityListContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[COLORS.patientPrimary]}
            />
          }
          ListEmptyComponent={
            <View style={patientStyles.emptyListContainer}>
              <Ionicons name="notifications-off-outline" size={60} color={COLORS.gray} />
              <Text style={patientStyles.emptyListText}>
                No activity yet.
                {"\n"}
                Your adherence events will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}