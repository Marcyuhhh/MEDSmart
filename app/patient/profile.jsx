import React, { useState, useEffect, useCallback } from 'react';
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
import { patientStyles } from '../../styles/patient.styles';
import { COLORS } from '../../styles/common.styles';
import { useAuth } from '../_layout';
import Button from '../../components/common/button';
import Input from '../../components/common/input';
import { authStyles } from '../../styles/auth.styles';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { linkDeviceToAccount, subscribeToDeviceStatus } from '../../services/medboxService';

const InfoRow = ({ label, value }) => (
  <View style={patientStyles.profileRow}>
    <Text style={patientStyles.profileRowLabel}>{label}</Text>
    <Text style={patientStyles.profileRowValue}>{value || 'N/A'}</Text>
  </View>
);

const ClickableRow = ({ label, onPress, iconName = 'chevron-forward-outline' }) => (
  <TouchableOpacity style={patientStyles.profileRow} onPress={onPress}>
    <Text style={patientStyles.profileRowLabel}>{label}</Text>
    <Ionicons name={iconName} size={22} color={COLORS.gray} />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user, setAuth } = useAuth();
  const router = useRouter();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPairingModalVisible, setIsPairingModalVisible] = useState(false);
  const [isEmergencyModalVisible, setIsEmergencyModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [isDeviceModalVisible, setIsDeviceModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('not_connected');

  const [editName, setEditName] = useState(user?.name || '');
  const [editAge, setEditAge] = useState(user?.age || '');
  const [editContact, setEditContact] = useState(user?.contact || '');
  const [emergencyName, setEmergencyName] = useState(user?.emergencyContactName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyContactPhone || '');
  const [inputDeviceId, setInputDeviceId] = useState('');

  useEffect(() => {
    if (!user || !user.deviceId) {
      setDeviceStatus('not_connected');
      return;
    }
    const unsubscribe = subscribeToDeviceStatus(user.deviceId, (status) => {
      setDeviceStatus(status);
    });
    return () => unsubscribe();
  }, [user]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => setAuth(null) },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: editName,
        age: editAge,
        contact: editContact
      });
      setAuth(prev => ({ ...prev, name: editName, age: editAge, contact: editContact }));
      setIsEditModalVisible(false);
      Alert.alert("Success", "Profile updated.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not update profile.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveEmergencyContact = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone
      });
      setAuth(prev => ({ ...prev, emergencyContactName: emergencyName, emergencyContactPhone: emergencyPhone }));
      setIsEmergencyModalVisible(false);
      Alert.alert("Success", "Emergency contact updated.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not update contact.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectDevice = async () => {
    if (!inputDeviceId.startsWith("MEDSMART_")) {
      Alert.alert("Invalid ID", "Device ID must start with 'MEDSMART_'");
      return;
    }
    setIsLoading(true);
    try {
      await linkDeviceToAccount(user.uid, inputDeviceId);
      setAuth(prev => ({ ...prev, deviceId: inputDeviceId }));
      Alert.alert("Success", "Device Connected! The green light should turn solid.");
      setIsDeviceModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to link device.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSwitch = () => {
    Alert.alert(
      "Confirm Role Switch",
      "Switching to a Caregiver role will **permanently delete** all your patient data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm & Delete Data",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            setIsLoading(true);
            try {
              await deleteDoc(doc(db, 'medboxes', user.uid));
              const q = query(collection(db, 'activity_log'), where('userId', '==', user.uid));
              const snapshot = await getDocs(q);
              const batch = writeBatch(db);
              snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
              });
              await batch.commit();
              await updateDoc(doc(db, 'users', user.uid), {
                role: 'caregiver',
                deviceId: null,
                emergencyContactName: null,
                emergencyContactPhone: null,
                bloodType: null 
              });
              setAuth(prev => ({ ...prev, role: 'caregiver' }));
              router.replace('/caregiver'); 
              setIsRoleModalVisible(false);
            } catch (error) {
              console.error("Role switch error:", error);
              Alert.alert("Error", "Failed to switch role.");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={patientStyles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.patientPrimary]}
          />
        }
      >
        <View style={patientStyles.profileHeader}>
          <View style={patientStyles.profileAvatar}>
            <Text style={patientStyles.profileAvatarText}>
              {user?.name?.charAt(0) || 'P'}
            </Text>
          </View>
          <Text style={patientStyles.profileName}>{user?.name || 'Patient Name'}</Text>
          <Text style={patientStyles.profileEmail}>{user?.email || 'patient@email.com'}</Text>
          <TouchableOpacity 
            style={patientStyles.profileRoleBadge}
            onPress={() => setIsRoleModalVisible(true)}
          >
            <Text style={patientStyles.profileRoleBadgeText}>
              ROLE: {user?.role ? user.role.toUpperCase() : 'PATIENT'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={patientStyles.profileSection}>
          <Text style={patientStyles.profileSectionTitle}>PERSONAL INFORMATION</Text>
          <InfoRow label="Age" value={user?.age} />
          <InfoRow label="Contact" value={user?.contact} />
          <InfoRow label="Blood Type" value={user?.bloodType} />
          <ClickableRow label="Edit Profile" onPress={() => setIsEditModalVisible(true)} />
        </View>
        
        <View style={patientStyles.profileSection}>
          <Text style={patientStyles.profileSectionTitle}>EMERGENCY CONTACT</Text>
          <InfoRow label="Name" value={user?.emergencyContactName} />
          <InfoRow label="Phone" value={user?.emergencyContactPhone} />
          <ClickableRow 
            label="Edit Emergency Contact" 
            onPress={() => setIsEmergencyModalVisible(true)} 
          />
        </View>
        
        <View style={patientStyles.profileSection}>
          <Text style={patientStyles.profileSectionTitle}>DEVICE & CAREGIVER</Text>
          <InfoRow 
            label="Device Status" 
            value={
              deviceStatus === 'online' ? '🟢 Online' : 
              deviceStatus === 'offline' ? '🔴 Offline' : '⚪ Not Connected'
            } 
          />
          <InfoRow label="Device ID" value={user?.deviceId && user.deviceId !== 'Not Connected' ? user.deviceId : '-'} />
          <ClickableRow label="Connect Device" onPress={() => setIsDeviceModalVisible(true)} iconName="hardware-chip-outline" />
          <ClickableRow label="Pair with Caregiver" onPress={() => setIsPairingModalVisible(true)} />
        </View>

        <View style={patientStyles.profileSection}>
          <Text style={patientStyles.profileSectionTitle}>SETTINGS</Text>
          <ClickableRow 
            label="App Settings" 
            onPress={() => router.push('/patient/settings')} 
          />
          <ClickableRow 
            label="Log Out" 
            onPress={handleLogout} 
            iconName="log-out-outline" 
          />
        </View>
      </ScrollView>

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <TouchableOpacity style={patientStyles.modalBackdrop} activeOpacity={1} onPressOut={() => setIsEditModalVisible(false)}>
          <View style={patientStyles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={patientStyles.modalTitle}>Edit Profile</Text>
            <Input placeholder="Full Name" value={editName} onChangeText={setEditName} />
            <Input placeholder="Age" value={editAge} onChangeText={setEditAge} keyboardType="numeric" />
            <Input placeholder="Contact Number" value={editContact} onChangeText={setEditContact} keyboardType="phone-pad" />
            {isLoading ? (
               <ActivityIndicator color={COLORS.patientPrimary} style={{marginTop:10}}/> 
            ) : (
               <Button title="Save Changes" onPress={handleSaveProfile} color={COLORS.patientPrimary} />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      
      <Modal
        visible={isPairingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPairingModalVisible(false)}
      >
        <TouchableOpacity style={patientStyles.modalBackdrop} activeOpacity={1} onPressOut={() => setIsPairingModalVisible(false)}>
          <View style={patientStyles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={patientStyles.modalTitle}>Pair with Caregiver</Text>
            <Text style={authStyles.instructionText}>
              Have your caregiver scan this QR code or enter the code below in their app.
            </Text>
            <View style={patientStyles.qrContainer}>
              <View style={patientStyles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={100} color={COLORS.gray} />
              </View>
              <Text style={patientStyles.qrCodeText}>
                Your Code: {user?.uid?.substring(0, 8).toUpperCase() || '...'}
              </Text>
            </View>
            <Button title="Done" onPress={() => setIsPairingModalVisible(false)} color={COLORS.gray} />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isEmergencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEmergencyModalVisible(false)}
      >
        <TouchableOpacity style={patientStyles.modalBackdrop} activeOpacity={1} onPressOut={() => setIsEmergencyModalVisible(false)}>
          <View style={patientStyles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={patientStyles.modalTitle}>Edit Emergency Contact</Text>
            <Input 
              placeholder="Contact's Full Name" 
              value={emergencyName} 
              onChangeText={setEmergencyName} 
            />
            <Input 
              placeholder="Contact's Phone Number" 
              value={emergencyPhone} 
              onChangeText={setEmergencyPhone} 
              keyboardType="phone-pad" 
            />
            {isLoading ? (
               <ActivityIndicator color={COLORS.patientPrimary} style={{marginTop:10}}/> 
            ) : (
               <Button title="Save Contact" onPress={handleSaveEmergencyContact} color={COLORS.patientPrimary} />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isDeviceModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDeviceModalVisible(false)}
      >
        <TouchableOpacity style={patientStyles.modalBackdrop} activeOpacity={1} onPressOut={() => setIsDeviceModalVisible(false)}>
          <View style={patientStyles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={patientStyles.modalTitle}>Connect Hardware</Text>
            <Text style={authStyles.instructionText}>
              Enter the Device ID shown on the Serial Monitor (e.g., MEDSMART_...).
            </Text>
            <Input 
              placeholder="MEDSMART_XXXXXXXX" 
              value={inputDeviceId} 
              onChangeText={setInputDeviceId} 
              autoCapitalize="characters"
            />
            {isLoading ? (
               <ActivityIndicator color={COLORS.patientPrimary} style={{marginTop:10}}/> 
            ) : (
               <Button title="Connect" onPress={handleConnectDevice} color={COLORS.patientPrimary} />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isRoleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRoleModalVisible(false)}
      >
        <TouchableOpacity style={patientStyles.modalBackdrop} activeOpacity={1} onPressOut={() => setIsRoleModalVisible(false)}>
          <View style={patientStyles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={patientStyles.modalTitle}>Switch to Caregiver?</Text>
            <Text style={authStyles.instructionText}>
              Switching to a Caregiver role will **permanently delete** all of your patient data, including schedules and activity logs. This cannot be undone.
            </Text>
            <View style={{marginTop: 10}}>
              {isLoading ? (
                 <ActivityIndicator color={COLORS.danger} style={{marginBottom:10}}/> 
              ) : (
                 <Button 
                  title="Confirm & Delete Data" 
                  color={COLORS.danger} 
                  onPress={handleRoleSwitch} 
                />
              )}
              <Button 
                title="Cancel" 
                color={COLORS.gray} 
                onPress={() => setIsRoleModalVisible(false)} 
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}