import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { patientStyles } from '../../styles/patient.styles';
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

// --- SERVICES ---
import { takeDoseNow, subscribeToDeviceStatus } from '../../services/medboxService';

// --- 1. ROBUST TIME PARSER ---
const parseTime = (timeStr) => {
  if (!timeStr) return -1;
  try {
    // Regex to capture: Hours : Minutes (optional space) Modifier
    // Handles "8:30 PM", "8:30PM", and "8:30 PM" (unicode space)
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
    
    if (!match) return -1;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3] ? match[3].toUpperCase() : null;

    if (modifier) {
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
    }

    return hours * 60 + minutes;
  } catch (e) {
    console.error("Time parse error:", timeStr, e);
    return -1;
  }
};

// --- HELPER: Check Window ---
const isTakeWindowActive = (doseTimeStr) => {
  const doseMinutes = parseTime(doseTimeStr);
  if (doseMinutes === -1) return { active: false };
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Window: Starts 3 mins before, Ends 30 mins after
  const startWindow = doseMinutes - 3;
  const endWindow = doseMinutes + 30;

  const isActive = currentMinutes >= startWindow && currentMinutes <= endWindow;
  
  return { active: isActive };
};

const getCurrentDay = () => {
  const days = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
  return days[new Date().getDay()];
};

const MedCard = ({ item }) => (
  <View style={patientStyles.medCard}>
    <View style={patientStyles.medInfo}>
      <Text style={patientStyles.medName}>{item.medName || 'Medication'}</Text>
      <Text style={patientStyles.medDose}>{item.dose || '1 pill'}</Text>
    </View>
    <Text style={patientStyles.medTime}>{item.time}</Text>
  </View>
);

const UpcomingCard = ({ dose, onTakeNow }) => {
  // Force re-check of the window logic
  const windowStatus = isTakeWindowActive(dose?.time);

  if (!dose) {
    return (
      <View style={[patientStyles.upcomingCard, { backgroundColor: COLORS.gray }]}>
        <Text style={patientStyles.upcomingMedName}>No more doses for today!</Text>
        <Text style={patientStyles.upcomingDose}>You are all caught up.</Text>
      </View>
    );
  }
  return (
    <View style={patientStyles.upcomingCard}>
      <View style={{marginBottom: 15}}>
        <Text style={patientStyles.upcomingTime}>{dose.time}</Text>
        <Text style={patientStyles.upcomingMedName}>{dose.medName}</Text>
        <Text style={patientStyles.upcomingDose}>{dose.dose}</Text>
      </View>
      
      {/* Only show button if time is valid */}
      {windowStatus.active && (
        <TouchableOpacity 
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: 12, borderRadius: 8, alignItems: 'center',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)'
          }}
          onPress={() => onTakeNow(dose)}
        >
          <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 16}}>TAKE NOW</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const StatusCard = ({ status }) => {
  const getStatusStyle = () => {
    if (status === 'online') return patientStyles.statusOnline; // Green
    if (status === 'offline') return patientStyles.statusOffline; // Red
    return patientStyles.statusConnecting; // Gray/Yellow
  };

  let statusText = 'Connecting...';
  if (status === 'online') statusText = 'Online';
  if (status === 'offline') statusText = 'Offline';
  if (status === 'not_connected') statusText = 'Not Paired';

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
  const [connectionStatus, setConnectionStatus] = useState('not_connected');
  const [upcomingDose, setUpcomingDose] = useState(null);
  const [followingDoses, setFollowingDoses] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Ticker to force re-render every minute for button logic
  const [minuteTicker, setMinuteTicker] = useState(0);

  // --- 1. REAL-TIME DEVICE STATUS LISTENER (via Service) ---
  useEffect(() => {
    if (!user || !user.deviceId || user.deviceId === 'Not Connected') {
      setConnectionStatus('not_connected');
      return;
    }

    // Subscribe to the heartbeat service
    const unsubscribe = subscribeToDeviceStatus(user.deviceId, (status) => {
       setConnectionStatus(status);
    });

    return () => unsubscribe();
  }, [user?.deviceId]);

  // --- 2. DASHBOARD DATA FETCH ---
  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      const medboxSnap = await getDoc(doc(db, 'medboxes', user.uid));
      
      if (medboxSnap.exists()) {
        const data = medboxSnap.data();
        const today = getCurrentDay();
        let todaysMeds = [];

        Object.keys(data).forEach(key => {
          const item = data[key];
          if (item.medName && item.days && item.days.includes(today)) {
            todaysMeds.push({
              id: key,
              medName: item.medName,
              dose: `1 pill · ${key}`,
              time: item.time,
              minutes: parseTime(item.time),
              isEmpty: item.isEmpty
            });
          }
        });

        // Sort
        todaysMeds.sort((a, b) => a.minutes - b.minutes);

        // Filter
        const untakenMeds = todaysMeds.filter(m => !m.isEmpty && m.minutes !== -1);
        
        if (untakenMeds.length > 0) {
          setUpcomingDose(untakenMeds[0]);
          setFollowingDoses(untakenMeds.slice(1));
        } else {
          setUpcomingDose(null);
          setFollowingDoses([]);
        }
      }
    } catch (e) {
      console.error("Dashboard Fetch Error:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // --- 3. REFRESH INTERVAL ---
  useEffect(() => {
    fetchDashboardData();
    // Run every 60 seconds to update "Next Dose" and check the "Take Now" window
    const interval = setInterval(() => {
      fetchDashboardData();
      setMinuteTicker(prev => prev + 1);
    }, 60000); 
    return () => clearInterval(interval);
  }, [user]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchDashboardData();
  }, []);

  // --- 4. TAKE NOW HANDLER ---
  const handleTakeNow = (dose) => {
    if (!user.deviceId || user.deviceId === 'Not Connected') {
        Alert.alert("No Device", "Please connect your MedBox in the Profile tab.");
        return;
    }

    Alert.alert(
      "Take Dose Now?",
      `This will open ${dose.medName} (${dose.id}).`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            try {
              await takeDoseNow(user.uid, user.deviceId, dose.id);
              Alert.alert("Success", "Opening...");
              fetchDashboardData(); // Update UI immediately
            } catch (error) {
              Alert.alert("Error", "Failed to send command.");
            }
          }
        }
      ]
    );
  };

  const ListHeader = () => (
    <View style={patientStyles.header}>
      <Text style={patientStyles.headerTitle}>Welcome, {user?.name || 'Patient'}</Text>
      <Text style={patientStyles.headerSubtitle}>Here is your summary for today.</Text>
      
      <Text style={patientStyles.sectionTitle}>Status</Text>
      <StatusCard status={connectionStatus} />
      
      <Text style={patientStyles.sectionTitle}>Your Next Dose</Text>
      <UpcomingCard dose={upcomingDose} onTakeNow={handleTakeNow} tick={minuteTicker} />
      
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.patientPrimary]} />}
        ListEmptyComponent={() => (
          !isLoading && !upcomingDose ? (
            <Text style={{textAlign: 'center', color: COLORS.gray, fontSize: 16, marginTop: 20}}>
              No more medications scheduled for today.
            </Text>
          ) : null
        )}
      />
    </SafeAreaView>
  );
}