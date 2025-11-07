import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStyles } from '../../styles/auth.styles';
import Button from '../../components/common/button';
import { COLORS } from '../../styles/common.styles';

export default function RoleSelectionScreen() {
  const router = useRouter();

  const handleSelectRole = (role) => {
    router.push({
      pathname: '/auth/signup',
      params: { role: role }
    });
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <Text style={[authStyles.roleTitle, { textAlign: 'center', marginBottom: 20 }]}>
        Sign up as:
      </Text>

      <TouchableOpacity
        style={authStyles.roleCard}
        onPress={() => handleSelectRole('patient')}
      >
        <Text style={authStyles.roleTitle}>Patient</Text>
        <Text style={authStyles.roleDescription}>
          Manage your medication schedules, track adherence, and get reminders.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={authStyles.roleCard}
        onPress={() => handleSelectRole('caregiver')}
      >
        <Text style={authStyles.roleTitle}>Caregiver</Text>
        <Text style={authStyles.roleDescription}>
          Monitor a patient's adherence, receive alerts, and help manage their schedule.
        </Text>
      </TouchableOpacity>

      <View style={{ marginTop: 40 }}>
        <Button
          title="Back to Login"
          onPress={() => router.back()}
          color={COLORS.gray}
        />
      </View>
    </SafeAreaView>
  );
}