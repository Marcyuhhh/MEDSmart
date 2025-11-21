import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { patientStyles } from '../../styles/patient.styles';
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';
import { doc, onSnapshot, getDoc } from 'firebase/firestore'; // Firebase imports
import { db } from '../../config/firebaseConfig';

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
  
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [upcomingDose, setUpcomingDose] = useState(null);
  const [followingDoses, setFollowingDoses] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- 1. LISTEN FOR DEVICE STATUS ---
  useEffect(() => {
    if (!user) return;
    
    const unsubStatus = onSnapshot(doc(db, 'deviceStatus', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setConnectionStatus(docSnap.data().status || 'offline');
      } else {
        setConnectionStatus('offline');
      }
    }, (error) => {
      console.error("Error listening to device status:", error);
      setConnectionStatus('offline');
    });
    
    return () => unsubStatus();
  }, [user]);

  // --- 2. FETCH SCHEDULES ---
  const fetchDashboardData = async () => {
    if (!user) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    
    console.log("Fetching dashboard data from Firebase...");
    
    try {
      const medboxSnap = await getDoc(doc(db, 'medboxes', user.uid));
      
      if (medboxSnap.exists()) {
        const data = medboxSnap.data();
        const allMeds = [];

        // Convert Object to Array and filter only configured compartments
        Object.keys(data).forEach(key => {
          const item = data[key];
          if (item.medName && !item.isEmpty) { // Only include configured AND non-empty compartments
            allMeds.push({
              id: key,
              medName: item.medName,
              dose: `1 pill · ${key}`,
              time: item.time || '00:00',
              description: item.description || ''
            });
          }
        });

        // Sort by time
        allMeds.sort((a, b) => a.time.localeCompare(b.time));

        if (allMeds.length > 0) {
          setUpcomingDose(allMeds[0]);
          setFollowingDoses(allMeds.slice(1));
        } else {
          setUpcomingDose(null);
          setFollowingDoses([]);
        }
      } else {
        // No medbox data found
        setUpcomingDose(null);
        setFollowingDoses([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Keep existing data or set to empty if error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Refresh function
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchDashboardData();
  }, [user]);

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
        ListEmptyComponent={() => (
          !isLoading && !upcomingDose ? (
            <Text style={{textAlign: 'center', color: COLORS.gray, fontSize: 16, marginTop: 20, marginBottom: 20}}>
              No medications scheduled. Set them up in the MedBox tab.
            </Text>
          ) : null
        )}
      />
    </SafeAreaView>
  );
}