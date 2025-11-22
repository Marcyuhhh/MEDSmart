import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { patientStyles } from '../../styles/patient.styles';
import { COLORS, SIZES } from '../../styles/common.styles';
import { useAuth } from '../_layout';

// --- IMPORT SERVICE ---
// We import the new function here
import { clearActivityHistory } from '../../services/activityService';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';

const ToggleRow = ({ label, onValueChange, isEnabled }) => (
  <View style={patientStyles.settingsRow}>
    <Text style={patientStyles.settingsRowText}>{label}</Text>
    <Switch
      trackColor={{ false: COLORS.gray, true: COLORS.patientPrimary }}
      thumbColor={COLORS.white}
      onValueChange={onValueChange}
      value={isEnabled}
    />
  </View>
);

const ClickableRow = ({ label, onPress, color = COLORS.black }) => (
  <TouchableOpacity onPress={onPress}>
    <View style={patientStyles.settingsRow}>
      <Text style={[patientStyles.settingsRowText, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward-outline" size={22} color={color} />
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { setAuth, user } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  // --- UPDATED HANDLER ---
  const onClearActivity = () => {
    Alert.alert(
      "Clear Activity",
      "Are you sure you want to permanently delete all your activity history? This cannot be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            setIsLoading(true);
            
            try {
              console.log("Deleting activity logs via Service...");
              
              // Call the service function
              await clearActivityHistory(user.uid);
              
              Alert.alert("Success", "Your activity history has been cleared.");
            } catch (error) {
              console.error("Clear history error:", error);
              Alert.alert("Error", "Failed to clear history. Please try again.");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const onDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This will erase all your schedules and data.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              "Please confirm you want to delete your account.",
              [
                { text: "Cancel" },
                {
                  text: "Delete",
                  style: 'destructive',
                  onPress: async () => {
                    if (!user) return;
                    setIsLoading(true);
                    try {
                      console.log("--- PERMANENTLY DELETING ACCOUNT ---");
                      
                      // 1. Clear History first using our service
                      await clearActivityHistory(user.uid);

                      // 2. Delete MedBox
                      await deleteDoc(doc(db, 'medboxes', user.uid));
                      
                      // 3. Delete User Profile
                      await deleteDoc(doc(db, 'users', user.uid));
                      
                      // 4. Log Out
                      setAuth(null);
                      
                    } catch (error) {
                      console.error(error);
                      Alert.alert("Error", "Failed to delete account data.");
                      setIsLoading(false);
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={patientStyles.settingsContainer} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.patientPrimary]} />
        }
      >
        {isLoading && (
          <View style={{ padding: 20 }}>
            <ActivityIndicator size="large" color={COLORS.patientPrimary} />
            <Text style={{ textAlign: 'center', color: COLORS.gray, marginTop: 10 }}>Processing...</Text>
          </View>
        )}

        <View style={patientStyles.profileSection}>
          <Text style={patientStyles.profileSectionTitle}>NOTIFICATIONS</Text>
          <ToggleRow
            label="Enable Notifications"
            isEnabled={notificationsEnabled}
            onValueChange={() => setNotificationsEnabled(prev => !prev)}
          />
        </View>
        
        <View style={patientStyles.profileSection}>
          <Text style={patientStyles.profileSectionTitle}>DATA MANAGEMENT</Text>
          <ClickableRow
            label="Clear Activity History"
            onPress={onClearActivity}
            color={COLORS.patientPrimary}
          />
        </View>

        <View style={patientStyles.profileSection}>
          <Text style={patientStyles.profileSectionTitle}>LEGAL</Text>
          <ClickableRow label="Privacy Policy" onPress={() => Alert.alert("Privacy Policy", "Coming soon.")} />
          <ClickableRow label="Terms of Service" onPress={() => Alert.alert("Terms of Service", "Coming soon.")} />
        </View>

        <View style={patientStyles.dangerSection}>
          <TouchableOpacity style={patientStyles.dangerButton} onPress={onDeleteAccount}>
            <Text style={patientStyles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: SIZES.xxlarge }} />
      </ScrollView>
    </SafeAreaView>
  );
}