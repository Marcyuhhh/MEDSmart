import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
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
  
  const [editName, setEditName] = useState(user?.name || '');
  const [editAge, setEditAge] = useState(user?.age || '');
  const [editContact, setEditContact] = useState(user?.contact || '');
  const [emergencyName, setEmergencyName] = useState(user?.emergencyContactName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyContactPhone || '');

  const onRefresh = useCallback(() => {
    console.log("Refreshing profile data...");
    setIsRefreshing(true);
    setTimeout(() => {
      console.log("Profile data refreshed.");
      setIsRefreshing(false);
    }, 1000);
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Log Out', 
        style: 'destructive', 
        onPress: () => { setAuth(null); }
      },
    ]);
  };

  const handleSaveProfile = () => {
    console.log('Saving profile:', { editName, editAge, editContact });
    setAuth(prev => ({ ...prev, name: editName, age: editAge, contact: editContact }));
    setIsEditModalVisible(false);
  };
  
  const handleSaveEmergencyContact = () => {
    console.log('Saving emergency contact:', { emergencyName, emergencyPhone });
    setAuth(prev => ({ ...prev, emergencyContactName: emergencyName, emergencyContactPhone: emergencyPhone }));
    setIsEmergencyModalVisible(false);
  };

  const handleRoleSwitch = () => {
    Alert.alert(
      "Confirm Role Switch",
      "Switching to a Caregiver role will **permanently delete** all your patient data, including schedules and activity logs. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm & Delete Data",
          style: "destructive",
          onPress: () => {
            console.log("Switching role to Caregiver and deleting data...");
            setAuth(prev => ({ ...prev, role: 'caregiver' }));
            setIsRoleModalVisible(false);
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
              {user?.role ? user.role.toUpperCase() : 'PATIENT'}
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
          <InfoRow label="Device Status" value={user?.deviceId} />
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
        <TouchableOpacity 
          style={patientStyles.modalBackdrop} 
          activeOpacity={1} 
          onPressOut={() => setIsEditModalVisible(false)}
        >
          <View style={patientStyles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={patientStyles.modalTitle}>Edit Profile</Text>
            <Input placeholder="Full Name" value={editName} onChangeText={setEditName} />
            <Input placeholder="Age" value={editAge} onChangeText={setEditAge} keyboardType="numeric" />
            <Input placeholder="Contact Number" value={editContact} onChangeText={setEditContact} keyboardType="phone-pad" />
            <Button title="Save Changes" onPress={handleSaveProfile} color={COLORS.patientPrimary} />
          </View>
        </TouchableOpacity>
      </Modal>
      
      <Modal
        visible={isPairingModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPairingModalVisible(false)}
      >
        <TouchableOpacity 
          style={patientStyles.modalBackdrop} 
          activeOpacity={1} 
          onPressOut={() => setIsPairingModalVisible(false)}
        >
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
                Your Code: {user?.uid?.substring(0, 8).toUpperCase() || 'ABC12345'}
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
        <TouchableOpacity 
          style={patientStyles.modalBackdrop} 
          activeOpacity={1} 
          onPressOut={() => setIsEmergencyModalVisible(false)}
        >
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
            <Button 
              title="Save Contact" 
              onPress={handleSaveEmergencyContact} 
              color={COLORS.patientPrimary} 
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isRoleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRoleModalVisible(false)}
      >
        <TouchableOpacity 
          style={patientStyles.modalBackdrop} 
          activeOpacity={1} 
          onPressOut={() => setIsRoleModalVisible(false)}
        >
          <View style={patientStyles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={patientStyles.modalTitle}>Switch to Caregiver?</Text>
            <Text style={authStyles.instructionText}>
              Switching to a Caregiver role will **permanently delete** all of your patient data, including schedules and activity logs. This cannot be undone.
            </Text>
            
            <View style={{marginTop: 10}}>
              <Button 
                title="Confirm & Delete Data" 
                color={COLORS.danger} 
                onPress={handleRoleSwitch} 
              />
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