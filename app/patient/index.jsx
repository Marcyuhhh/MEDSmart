import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { patientStyles } from '../../styles/patient.styles';
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';

const MedCard = ({ item }) => (
  <View style={patientStyles.medCard}>
    <View style={patientStyles.medInfo}>
      <Text style={patientStyles.medName}>{item.medName || 'Medication'}</Text>
      <Text style={patientStyles.medDose}>{item.dose || '1 pill'}</Text>
    </View>
    <Text style={patientStyles.medTime}>{item.time || '10:00 AM'}</Text>
  </View>
);

const UpcomingCard = ({ dose }) => {
  if (!dose) {
    return (
      <View style={[patientStyles.upcomingCard, { backgroundColor: COLORS.gray }]}>
        <Text style={patientStyles.upcomingMedName}>All doses taken for today!</Text>
      </View>
    );
  }
  return (
    <View style={patientStyles.upcomingCard}>
      <Text style={patientStyles.upcomingTime}>{dose.time || '8:00 AM'}</Text>
      <Text style={patientStyles.upcomingMedName}>{dose.medName || 'Metformin'}</Text>
      <Text style={patientStyles.upcomingDose}>{dose.dose || '1 pill · Compartment A1'}</Text>
    </View>
  );
};

const StatusCard = ({ status }) => {
  const getStatusStyle = () => {
    if (status === 'online') return patientStyles.statusOnline;
    if (status === 'offline') return patientStyles.statusOffline;
    return patientStyles.statusConnecting;
  };
  const statusText = status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Connecting...';
  return (
    <View style={patientStyles.statusCard}>
      <Text style={patientStyles.statusText}>MedBox Status: {statusText}</Text>
      <View style={[patientStyles.statusIndicator, getStatusStyle()]} />
    </View>
  );
};

export default function PatientDashboard() {
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [upcomingDose, setUpcomingDose] = useState(null);
  const [followingDoses, setFollowingDoses] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    console.log("Refreshing dashboard data...");
    setIsRefreshing(true);
    setTimeout(() => {
      setUpcomingDose({ time: '8:01 AM', medName: 'Metformin', dose: '1 pill · A1' });
      setConnectionStatus('online');
      setIsRefreshing(false);
    }, 1000);
  }, []);

  useEffect(() => {
    console.log("Fetching initial dashboard data...");
    setIsLoading(true);
    setUpcomingDose({ time: '8:00 AM', medName: 'Metformin', dose: '1 pill · A1' });
    setFollowingDoses([
      { id: '1', time: '12:00 PM', medName: 'Lisinopril', dose: '1 pill · B2' },
      { id: '2', time: '7:00 PM', medName: 'Metformin', dose: '1 pill · A1' },
    ]);
    setConnectionStatus('online');
    setIsLoading(false);
  }, []);

  const ListHeader = () => (
    <View style={patientStyles.header}>
      <Text style={patientStyles.headerTitle}>Welcome, {user?.name || 'Patient'}</Text>
      <Text style={patientStyles.headerSubtitle}>Here is your summary for today.</Text>
      <Text style={patientStyles.sectionTitle}>Status</Text>
      <StatusCard status={connectionStatus} />
      <Text style={patientStyles.sectionTitle}>Your Next Dose</Text>
      <UpcomingCard dose={upcomingDose} />
      <Text style={patientStyles.sectionTitle}>Following Doses</Text>
      {isLoading && <ActivityIndicator size="large" color={COLORS.patientPrimary} />}
    </View>
  );

  return (
    <SafeAreaView style={patientStyles.container}>
      <FlatList
        data={followingDoses}
        renderItem={({ item }) => <MedCard item={item} />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={patientStyles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.patientPrimary]}
          />
        }
      />
    </SafeAreaView>
  );
}