import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// --- NEW IMPORT: useRouter for navigation ---
import { useRouter } from 'expo-router';
import { caregiverStyles } from '../../styles/caregiver.styles';
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';
import Button from '../../components/common/button';

// --- Sub-components (Unchanged) ---
const PatientCard = ({ patient }) => (
  <View style={caregiverStyles.patientCard}>
    <View style={caregiverStyles.patientAvatar}>
      <Text style={caregiverStyles.patientAvatarText}>
        {patient.name.charAt(0)}
      </Text>
    </View>
    <View>
      <Text style={caregiverStyles.patientName}>{patient.name}</Text>
      <Text style={caregiverStyles.patientStatus}>
        Condition: {patient.condition}
      </Text>
    </View>
  </View>
);

const UpcomingCard = ({ dose }) => {
  if (!dose) {
    return (
      <View style={[caregiverStyles.upcomingCard, { backgroundColor: COLORS.gray }]}>
        <Text style={caregiverStyles.upcomingMedName}>Patient has taken all doses.</Text>
      </View>
    );
  }
  return (
    <View style={caregiverStyles.upcomingCard}>
      <View style={{flexDirection:'row', justifyContent:'space-between'}}>
        <Text style={caregiverStyles.upcomingTime}>{dose.time}</Text>
        <Ionicons name="time-outline" size={24} color={COLORS.white} />
      </View>
      <Text style={caregiverStyles.upcomingMedName}>{dose.medName}</Text>
      <Text style={caregiverStyles.upcomingDose}>{dose.dose}</Text>
    </View>
  );
};

const StatusCard = ({ status }) => {
  const getStatusStyle = () => {
    if (status === 'online') return caregiverStyles.statusOnline;
    if (status === 'offline') return caregiverStyles.statusOffline;
    return caregiverStyles.statusConnecting;
  };
  
  return (
    <View style={caregiverStyles.statusCard}>
      <Text style={caregiverStyles.statusText}>
        Device Status: {status === 'online' ? 'Online' : 'Offline'}
      </Text>
      <View style={[caregiverStyles.statusIndicator, getStatusStyle()]} />
    </View>
  );
};

const RecentAlertItem = ({ item }) => (
  <View style={caregiverStyles.activityItem}>
    <View style={[
      caregiverStyles.activityIconContainer, 
      item.type === 'alert' ? caregiverStyles.activityAlert : caregiverStyles.activityWarning
    ]}>
      <Ionicons 
        name={item.type === 'alert' ? 'alert-circle' : 'time'} 
        size={24} 
        color={COLORS.white} 
      />
    </View>
    <View style={caregiverStyles.activityTextContainer}>
      <Text style={caregiverStyles.activityTitle}>{item.title}</Text>
      <Text style={caregiverStyles.activityMessage}>{item.message}</Text>
    </View>
    <Text style={caregiverStyles.activityTimestamp}>{item.time}</Text>
  </View>
);

// --- Main Caregiver Dashboard Component ---

export default function CaregiverDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  // --- 1. Connection Check ---
  const isPatientConnected = user?.linkedPatientId ? true : false;

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [patientData, setPatientData] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState('offline');
  const [upcomingDose, setUpcomingDose] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);

  const fetchData = () => {
    // Only fetch if connected
    if (!isPatientConnected) return;

    console.log("Fetching patient data...");
    // TODO: Connect to Firebase
    
    // --- Mock Data (Only loads if connected) ---
    setPatientData({
      name: user?.linkedPatientName || 'Marc (Patient)',
      condition: 'Hypertension',
    });
    setDeviceStatus('online');
    setUpcomingDose({
      time: '2:00 PM',
      medName: 'Lisinopril',
      dose: '1 pill · Compartment B2'
    });
    setRecentAlerts([
      { id: '1', type: 'alert', title: 'Missed Dose', message: 'Metformin was not taken.', time: 'Yesterday' },
      { id: '2', type: 'warning', title: 'Low Battery', message: 'MedBox battery is at 15%.', time: '2 days ago' },
    ]);
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    setIsLoading(false);
  }, [isPatientConnected]); // Re-run if connection status changes

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [isPatientConnected]);

  const handleSendReminder = () => {
    Alert.alert("Reminder Sent", `Notification sent to patient.`);
  };

  // --- RENDER: No Patient State ---
  if (!isPatientConnected) {
    return (
      <SafeAreaView style={caregiverStyles.container}>
        <View style={caregiverStyles.header}>
          <Text style={caregiverStyles.headerTitle}>Caregiver Dashboard</Text>
          <Text style={caregiverStyles.headerSubtitle}>Welcome, {user?.name || 'Caregiver'}</Text>
        </View>
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Ionicons name="people-outline" size={80} color={COLORS.gray} />
          <Text style={{ 
            fontSize: 20, 
            fontWeight: 'bold', 
            color: COLORS.black, 
            marginTop: 20 
          }}>
            No Patient Linked
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: COLORS.gray, 
            textAlign: 'center', 
            marginTop: 10, 
            marginBottom: 30 
          }}>
            To start monitoring, please pair with a patient using their Invite Code.
          </Text>
          
          <Button 
            title="Link Patient Now" 
            onPress={() => router.push('/(caregiver)/profile')}
            color={COLORS.caregiverPrimary}
          />
        </View>
      </SafeAreaView>
    );
  }

  // --- RENDER: Connected State (Dashboard) ---
  const ListHeader = () => (
    <View style={caregiverStyles.header}>
      <Text style={caregiverStyles.headerTitle}>Caregiver Dashboard</Text>
      <Text style={caregiverStyles.headerSubtitle}>Monitoring Dashboard</Text>

      <Text style={caregiverStyles.sectionTitle}>Monitoring</Text>
      <PatientCard patient={patientData || {name: 'Loading...', condition: '...'}} />

      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10}}>
        <Text style={[caregiverStyles.sectionTitle, {marginTop: 0}]}>Status</Text>
      </View>
      <StatusCard status={deviceStatus} />
      
      <View style={{ marginTop: 10 }}>
        <Button 
          title="Send Reminder Nudge" 
          onPress={handleSendReminder}
          color={COLORS.caregiverPrimary}
        />
      </View>

      <Text style={caregiverStyles.sectionTitle}>Patient's Next Dose</Text>
      <UpcomingCard dose={upcomingDose} />

      <Text style={caregiverStyles.sectionTitle}>Recent Alerts</Text>
      {isLoading && <ActivityIndicator size="large" color={COLORS.caregiverPrimary} />}
    </View>
  );

  return (
    <SafeAreaView style={caregiverStyles.container}>
      <FlatList
        data={recentAlerts}
        renderItem={({ item }) => <RecentAlertItem item={item} />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={caregiverStyles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.caregiverPrimary]}
          />
        }
        ListEmptyComponent={
          <Text style={{textAlign: 'center', color: COLORS.gray, marginTop: 20}}>
            No recent alerts. Everything looks good!
          </Text>
        }
      />
    </SafeAreaView>
  );
}