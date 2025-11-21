import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { caregiverStyles } from '../../styles/caregiver.styles';
import { authStyles } from '../../styles/auth.styles';
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';
import Button from '../../components/common/button';
import Input from '../../components/common/input';

// --- FIREBASE IMPORTS ---
import { doc, updateDoc, collection, query, where, getDocs, deleteField, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

const InfoRow = ({ label, value }) => (
  <View style={caregiverStyles.profileRow}>
    <Text style={caregiverStyles.profileRowLabel}>{label}</Text>
    <Text style={caregiverStyles.profileRowValue}>{value || 'N/A'}</Text>
  </View>
);

const ClickableRow = ({ label, onPress, iconName = 'chevron-forward-outline' }) => (
  <TouchableOpacity style={caregiverStyles.profileRow} onPress={onPress}>
    <Text style={caregiverStyles.profileRowLabel}>{label}</Text>
    <Ionicons name={iconName} size={22} color={COLORS.gray} />
  </TouchableOpacity>
);

export default function CaregiverProfileScreen() {
  const { user, setAuth } = useAuth();
  const router = useRouter();
  
  // --- STATE ---
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPairingModalVisible, setIsPairingModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Inputs
  const [inviteCode, setInviteCode] = useState('');
  const [editName, setEditName] = useState(user?.name || '');
  const [editContact, setEditContact] = useState(user?.contact || '');

  // Patient Details State (Fetched separately)
  const [patientPhone, setPatientPhone] = useState('Loading...');

  const isPatientConnected = user?.linkedPatientId ? true : false;

  // --- FETCH PATIENT DETAILS ---
  const fetchPatientDetails = async () => {
    if (!isPatientConnected) {
      setPatientPhone('Not Connected');
      return;
    }
    try {
      const patientRef = doc(db, 'users', user.linkedPatientId);
      const patientSnap = await getDoc(patientRef);
      if (patientSnap.exists()) {
        setPatientPhone(patientSnap.data().contact || 'No Number Set');
      } else {
        setPatientPhone('Unknown');
      }
    } catch (e) {
      console.log("Error fetching patient details", e);
      setPatientPhone('Error loading');
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [user?.linkedPatientId]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPatientDetails();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => setAuth(null) },
    ]);
  };

  // --- PAIRING LOGIC ---
  const handlePairPatient = async () => {
    if (!inviteCode || inviteCode.length < 4) {
      Alert.alert("Invalid Code", "Please enter a valid invite code.");
      return;
    }

    setIsLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("inviteCode", "==", inviteCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("Not Found", "No patient found with that code.");
        setIsLoading(false);
        return;
      }

      const patientDoc = querySnapshot.docs[0];
      const patientData = patientDoc.data();

      const caregiverRef = doc(db, "users", user.uid);
      await updateDoc(caregiverRef, {
        linkedPatientId: patientData.uid,
        linkedPatientName: patientData.name
      });

      setAuth(prev => ({
        ...prev,
        linkedPatientId: patientData.uid,
        linkedPatientName: patientData.name
      }));

      Alert.alert("Success", `You are now linked to ${patientData.name}.`);
      setIsPairingModalVisible(false);
      setInviteCode('');
      
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not link to patient.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- DISCONNECT LOGIC ---
  const handleDisconnectPatient = () => {
    Alert.alert(
      "Disconnect Patient",
      `Are you sure you want to stop monitoring ${user?.linkedPatientName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Disconnect", 
          style: "destructive", 
          onPress: async () => {
             try {
               const caregiverRef = doc(db, "users", user.uid);
               await updateDoc(caregiverRef, {
                 linkedPatientId: deleteField(),
                 linkedPatientName: deleteField()
               });
               
               setAuth(prev => {
                 const newUser = { ...prev };
                 delete newUser.linkedPatientId;
                 delete newUser.linkedPatientName;
                 return newUser;
               });

               Alert.alert("Disconnected", "You are no longer linked to a patient.");
             } catch (error) {
               Alert.alert("Error", "Could not disconnect.");
             }
          }
        }
      ]
    );
  };

  // --- ROLE SWITCH ---
  const handleRoleSwitchPress = () => setIsRoleModalVisible(true);

  const confirmRoleSwitch = async () => {
    if (isPatientConnected) {
      setIsRoleModalVisible(false);
      setTimeout(() => {
        Alert.alert("Cannot Switch Role", "You must disconnect from your patient before switching.");
      }, 500);
      return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const newInviteCode = user.uid.substring(0, 8).toUpperCase();
      
      await updateDoc(userRef, { 
        role: 'patient',
        inviteCode: newInviteCode,
        deviceId: 'Not Connected',
        emergencyContactName: null,
        emergencyContactPhone: null
      });
      
      setAuth(prev => ({ 
        ...prev, 
        role: 'patient',
        inviteCode: newInviteCode,
        deviceId: 'Not Connected'
      }));
      
      router.replace('/patient'); // Force redirect
      setIsRoleModalVisible(false);
      
    } catch (error) {
      Alert.alert("Error", "Could not switch role.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { name: editName, contact: editContact });
      setAuth(prev => ({ ...prev, name: editName, contact: editContact }));
      setIsEditModalVisible(false);
      Alert.alert("Success", "Profile updated.");
    } catch (error) {
      Alert.alert("Error", "Could not update profile.");
    }
  };

  return (
    <SafeAreaView style={caregiverStyles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.caregiverPrimary]} />
        }
      >
        {/* 1. Header */}
        <View style={caregiverStyles.profileHeader}>
          <View style={caregiverStyles.profileAvatar}>
            <Text style={caregiverStyles.profileAvatarText}>{user?.name?.charAt(0) || 'C'}</Text>
          </View>
          <Text style={caregiverStyles.profileName}>{user?.name || 'Caregiver Name'}</Text>
          <Text style={caregiverStyles.profileEmail}>{user?.email || 'caregiver@email.com'}</Text>
          
          <TouchableOpacity style={caregiverStyles.profileRoleBadge} onPress={handleRoleSwitchPress}>
            <Text style={caregiverStyles.profileRoleBadgeText}>
              ROLE: {user?.role ? user.role.toUpperCase() : 'CAREGIVER'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Personal Information */}
        <View style={caregiverStyles.profileSection}>
          <Text style={caregiverStyles.profileSectionTitle}>MY INFORMATION</Text>
          <InfoRow label="Contact" value={user?.contact} />
          <ClickableRow label="Edit Profile" onPress={() => setIsEditModalVisible(true)} />
        </View>

        {/* 3. Patient Information (Replaces Emergency Contact) */}
        <View style={caregiverStyles.profileSection}>
          <Text style={caregiverStyles.profileSectionTitle}>PATIENT INFORMATION</Text>
          {isPatientConnected ? (
            <>
              <InfoRow label="Name" value={user?.linkedPatientName} />
              <InfoRow label="Phone" value={patientPhone} />
              {/* Disconnect Button inside the row style */}
              <TouchableOpacity 
                style={[caregiverStyles.profileRow, { borderBottomWidth: 0 }]} 
                onPress={handleDisconnectPatient}
              >
                 <Text style={{color: COLORS.danger, fontSize: 16, fontWeight: 'bold'}}>Disconnect Patient</Text>
                 <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
              </TouchableOpacity>
            </>
          ) : (
             <TouchableOpacity 
               style={[caregiverStyles.profileRow, { borderBottomWidth: 0 }]} 
               onPress={() => setIsPairingModalVisible(true)}
             >
                <Text style={{color: COLORS.caregiverPrimary, fontSize: 16, fontWeight: 'bold'}}>Pair with Patient</Text>
                <Ionicons name="qr-code-outline" size={22} color={COLORS.caregiverPrimary} />
             </TouchableOpacity>
          )}
        </View>

        {/* 4. Settings Section */}
        <View style={caregiverStyles.profileSection}>
          <Text style={caregiverStyles.profileSectionTitle}>SETTINGS</Text>
          <ClickableRow 
            label="App Settings" 
            onPress={() => router.push('/caregiver/settings')} 
          />
          <ClickableRow label="Log Out" onPress={handleLogout} iconName="log-out-outline" />
        </View>
      </ScrollView>

      {/* MODALS */}
      <Modal visible={isPairingModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsPairingModalVisible(false)}>
        <TouchableOpacity style={caregiverStyles.modalBackdrop} activeOpacity={1} onPressOut={() => setIsPairingModalVisible(false)}>
          <View style={caregiverStyles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={caregiverStyles.modalTitle}>Link to Patient</Text>
            <Text style={authStyles.instructionText}>Enter the Invite Code generated on the patient's profile.</Text>
            <Input placeholder="Enter Patient Code" value={inviteCode} onChangeText={setInviteCode} autoCapitalize="characters" />
            {isLoading ? <ActivityIndicator color={COLORS.caregiverPrimary} style={{marginTop:10}} /> : <Button title="Link Patient" onPress={handlePairPatient} color={COLORS.caregiverPrimary} />}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isRoleModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsRoleModalVisible(false)}>
        <TouchableOpacity style={caregiverStyles.modalBackdrop} activeOpacity={1} onPressOut={() => setIsRoleModalVisible(false)}>
          <View style={caregiverStyles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={caregiverStyles.modalTitle}>Switch to Patient?</Text>
            <Text style={authStyles.instructionText}>Do you want to switch your account type to **Patient**?{'\n\n'}Note: You must disconnect any linked patients before switching.</Text>
            <View style={{marginTop: 10}}>
              {isLoading ? <ActivityIndicator color={COLORS.caregiverPrimary} /> : (
                <Button title="Confirm Switch" color={COLORS.caregiverPrimary} onPress={confirmRoleSwitch} />
              )}
              <Button title="Cancel" color={COLORS.gray} onPress={() => setIsRoleModalVisible(false)} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isEditModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsEditModalVisible(false)}>
        <TouchableOpacity style={caregiverStyles.modalBackdrop} activeOpacity={1} onPressOut={() => setIsEditModalVisible(false)}>
          <View style={caregiverStyles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={caregiverStyles.modalTitle}>Edit Profile</Text>
            <Input placeholder="Full Name" value={editName} onChangeText={setEditName} />
            <Input placeholder="Contact Number" value={editContact} onChangeText={setEditContact} keyboardType="phone-pad" />
            <Button title="Save Changes" onPress={handleSaveProfile} color={COLORS.caregiverPrimary} />
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}