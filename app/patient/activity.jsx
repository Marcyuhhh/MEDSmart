import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { patientStyles } from '../../styles/patient.styles';
import { COLORS } from '../../styles/common.styles';

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
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = () => {
    console.log("Fetching activity data...");
    
    const mockData = [
      { id: '1', type: 'success', title: 'Dose Taken', message: 'Metformin from A1', time: '8:02 AM' },
      { id: '2', type: 'alert', title: 'Dose Missed', message: 'Lisinopril from B2', time: 'Yesterday' },
      { id: '3', type: 'warning', title: 'Dose Due Soon', message: 'Take Atorvastatin in 5 min', time: 'Yesterday' },
    ];
    setActivities(mockData);
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    setIsLoading(false);
  }, []);

  const onRefresh = useCallback(() => {
    console.log("Refreshing activity data...");
    setIsRefreshing(true);
    fetchData();
    setIsRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={patientStyles.container} edges={['bottom', 'left', 'right']}>
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