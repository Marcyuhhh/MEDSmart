import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { caregiverStyles } from '../../styles/caregiver.styles'; // Green Styles
import { COLORS, SIZES } from '../../styles/common.styles';
import { useAuth } from '../_layout';

const ToggleRow = ({ label, onValueChange, isEnabled }) => (
  <View style={caregiverStyles.profileRow}>
    <Text style={caregiverStyles.profileRowLabel}>{label}</Text>
    <Switch
      trackColor={{ false: COLORS.gray, true: COLORS.caregiverPrimary }}
      thumbColor={COLORS.white}
      onValueChange={onValueChange}
      value={isEnabled}
    />
  </View>
);

const ClickableRow = ({ label, onPress, color = COLORS.black }) => (
  <TouchableOpacity onPress={onPress}>
    <View style={caregiverStyles.profileRow}>
      <Text style={[caregiverStyles.profileRowLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward-outline" size={22} color={color} />
    </View>
  </TouchableOpacity>
);

export default function CaregiverSettingsScreen() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const onDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This will permanently delete your caregiver account.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
             // TODO: Firebase delete logic
             console.log("--- DELETING CAREGIVER ACCOUNT ---");
             setAuth(null);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={caregiverStyles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.caregiverPrimary]} />
        }
      >
        <View style={caregiverStyles.profileSection}>
          <Text style={caregiverStyles.profileSectionTitle}>NOTIFICATIONS</Text>
          <ToggleRow
            label="Enable Alerts"
            isEnabled={notificationsEnabled}
            onValueChange={() => setNotificationsEnabled(prev => !prev)}
          />
        </View>

        <View style={caregiverStyles.profileSection}>
          <Text style={caregiverStyles.profileSectionTitle}>LEGAL</Text>
          <ClickableRow label="Privacy Policy" onPress={() => Alert.alert("Privacy Policy", "Coming soon.")} />
          <ClickableRow label="Terms of Service" onPress={() => Alert.alert("Terms of Service", "Coming soon.")} />
        </View>

        <View style={{ marginTop: SIZES.xxlarge, paddingHorizontal: SIZES.large }}>
          <TouchableOpacity
            style={{ backgroundColor: COLORS.danger, padding: SIZES.medium, borderRadius: SIZES.base, alignItems: 'center' }}
            onPress={onDeleteAccount}
          >
            <Text style={{ color: COLORS.white, fontSize: SIZES.large, fontWeight: 'bold' }}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}