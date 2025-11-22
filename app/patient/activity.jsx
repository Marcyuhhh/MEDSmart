import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { patientStyles } from '../../styles/patient.styles';
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore';
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

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
      <Text style={patientStyles.activityTimestamp}>{formatTime(item.timestamp)}</Text>
    </View>
  );
};

export default function ActivityScreen() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'activity_log'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() });
      });
      setActivities(logs);
      setIsLoading(false);
      setIsRefreshing(false);
    }, (error) => {
      console.log("Listening error:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    const unreadItems = activities.filter(item => !item.isRead);
    if (unreadItems.length === 0) return;
    unreadItems.forEach(item => {
      const docRef = doc(db, 'activity_log', item.id);
      batch.update(docRef, { isRead: true });
    });
    try { await batch.commit(); } catch (e) { console.error(e); }
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
                Notifications triggered by the system will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}