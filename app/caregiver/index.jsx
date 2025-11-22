import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { caregiverStyles } from '../../styles/caregiver.styles';
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';
import Button from '../../components/common/button';

// --- FIREBASE IMPORTS ---
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

// --- HELPERS ---
const parseTime = (timeStr) => {
  if (!timeStr) return -1;
  try {
    const cleanStr = timeStr.replace(/[\u202f\u00a0]/g, " ").trim();
    const match = cleanStr.match(/(\d{1,2}):(\d{2})\s*([AaPp][Mm])?/);
    if (!match) return -1;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3] ? match[3].toUpperCase() : null;
    if (modifier) {
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
    }
    return hours * 60 + minutes;
  } catch (e) { return -1; }
};

const getCurrentDay = () => {
  const days = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
  return days[new Date().getDay()];
};

// --- SUB-COMPONENTS ---

// 1. Modified Patient Card with "MONITORING" Label
const PatientCard = ({ patient }) => (
  <View style={[caregiverStyles.patientCard, { flexDirection: 'column', alignItems: 'flex-start', marginTop: 10 }]}>
    <Text style={{ 
      fontSize: 14, 
      fontWeight: 'bold', 
      color: COLORS.caregiverPrimary, 
      marginBottom: 15,
      letterSpacing: 1,
      textTransform: 'uppercase' 
    }}>
      Currently Monitoring
    </Text>

    <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
      <View style={caregiverStyles.patientAvatar}>
        <Text style={caregiverStyles.patientAvatarText}>
          {patient?.name ? patient.name.charAt(0) : '?'}
        </Text>
      </View>
      <View>
        <Text style={caregiverStyles.patientName}>{patient?.name || 'Unknown'}</Text>
        <Text style={caregiverStyles.patientStatus}>
          Contact: {patient?.contact || 'N/A'}
        </Text>
      </View>
    </View>
  </View>
);

const UpcomingCard = ({ dose }) => {
  if (!dose) {
    return (
      <View style={[caregiverStyles.upcomingCard, { backgroundColor: COLORS.gray }]}>
        <Text style={caregiverStyles.upcomingMedName}>All doses taken for today.</Text>
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

// Reusing the activityItem style for the list of meds
const MedCard = ({ item }) => (
  <View style={caregiverStyles.activityItem}>
    <View style={[
      caregiverStyles.activityIconContainer, 
      { backgroundColor: COLORS.caregiverPrimary }
    ]}>
      <Ionicons name="medkit" size={24} color={COLORS.white} />
    </View>
    <View style={caregiverStyles.activityTextContainer}>
      <Text style={caregiverStyles.activityTitle}>{item.medName}</Text>
      <Text style={caregiverStyles.activityMessage}>{item.dose}</Text>
    </View>
    <Text style={caregiverStyles.activityTimestamp}>{item.time}</Text>
  </View>
);

// --- MAIN COMPONENT ---
export default function CaregiverDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const isPatientConnected = user?.linkedPatientId ? true : false;

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [patientProfile, setPatientProfile] = useState(null);
  const [upcomingDose, setUpcomingDose] = useState(null);
  const [followingDoses, setFollowingDoses] = useState([]);

  // --- FETCH DATA ---
  const fetchPatientDetails = async () => {
    if (!isPatientConnected) return;
    
    try {
      // A. Get Patient Profile
      const patientDoc = await getDoc(doc(db, 'users', user.linkedPatientId));
      if (patientDoc.exists()) {
        setPatientProfile(patientDoc.data());
      }

      // B. Get Schedule
      const medboxSnap = await getDoc(doc(db, 'medboxes', user.linkedPatientId));
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
        
        todaysMeds.sort((a, b) => a.minutes - b.minutes);
        
        // Filter out empty/taken meds
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
      console.error("Caregiver fetch error:", e);
    } finally {
        setIsLoading(false);
        setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchPatientDetails();
  }, [user?.linkedPatientId]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPatientDetails();
  }, [user?.linkedPatientId]);

  const handleSendReminder = async () => {
    if (!isPatientConnected) return;
    try {
        await addDoc(collection(db, 'activity_log'), {
            userId: user.linkedPatientId,
            type: 'warning',
            title: 'Caregiver Reminder',
            message: `${user.name || 'Caregiver'} sent you a reminder.`,
            timestamp: serverTimestamp(),
            isRead: false,
            compartmentId: 'REMINDER'
        });
        Alert.alert("Reminder Sent", "The patient will see this in their Activity log.");
    } catch (e) {
        Alert.alert("Error", "Could not send reminder.");
    }
  };

  // --- RENDER: NO PATIENT ---
  if (!isPatientConnected) {
    return (
      <SafeAreaView style={caregiverStyles.container}>
        <View style={caregiverStyles.header}>
          {/* No extra text here, just the empty state */}
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Ionicons name="people-outline" size={80} color={COLORS.gray} />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.black, marginTop: 20 }}>No Patient Linked</Text>
          <Text style={{ fontSize: 16, color: COLORS.gray, textAlign: 'center', marginTop: 10, marginBottom: 30 }}>
            To start monitoring, please pair with a patient using their Invite Code.
          </Text>
          <Button title="Link Patient Now" onPress={() => router.push('/caregiver/profile')} color={COLORS.caregiverPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  // --- RENDER: DASHBOARD ---
  const ListHeader = () => (
    <View style={caregiverStyles.header}>
      {/* 1. Patient Card (Monitoring Label Inside) */}
      <PatientCard patient={patientProfile} />

      {/* 2. Next Dose Section */}
      <Text style={caregiverStyles.sectionTitle}>Patient's Next Dose</Text>
      <UpcomingCard dose={upcomingDose} />

      {/* 3. Nudge Button */}
      <View style={{ marginTop: 20, marginBottom: 10 }}>
        <Button 
          title="Send Reminder Nudge" 
          onPress={handleSendReminder} 
          color={COLORS.caregiverPrimary} 
        />
      </View>

      {/* 4. Following Section */}
      <Text style={caregiverStyles.sectionTitle}>Following Medications</Text>
    </View>
  );

  return (
    <SafeAreaView style={caregiverStyles.container}>
      <FlatList
        data={followingDoses}
        renderItem={({ item }) => <MedCard item={item} />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={caregiverStyles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.caregiverPrimary]} />
        }
        ListEmptyComponent={
          !isLoading && (
            <Text style={{textAlign: 'center', color: COLORS.gray, marginTop: 20}}>
               No more doses scheduled for today.
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}