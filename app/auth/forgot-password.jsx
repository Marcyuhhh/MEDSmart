import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/common/button';
import Input from '../../components/common/input';
import { authStyles } from '../../styles/auth.styles';
import { COLORS } from '../../styles/common.styles';

// --- FIREBASE IMPORTS ---
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetLink = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }
    
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Check Your Email',
        `A password reset link has been sent to ${email}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <Text style={[authStyles.title, { marginBottom: 20 }]}>Reset Password</Text>
      <Text style={authStyles.instructionText}>
        Enter the email address associated with your account, and we'll send you a link to reset your password.
      </Text>

      <Input 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={{ marginVertical: 20 }}>
        {isLoading ? (
          <ActivityIndicator color={COLORS.patientPrimary} />
        ) : (
          <Button title="Send Reset Link" onPress={handleSendResetLink} color={COLORS.patientPrimary} />
        )}
      </View>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={authStyles.link}>Back to <Text style={authStyles.linkBold}>Login</Text></Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}