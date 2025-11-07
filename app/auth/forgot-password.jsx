import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/common/button';
import Input from '../../components/common/input';
import { authStyles } from '../../styles/auth.styles';
import { COLORS } from '../../styles/common.styles';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSendResetLink = () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return;
    }

    console.log('Password reset email sent to:', email);
    Alert.alert(
      'Check Your Email',
      `If an account exists for ${email}, a password reset link has been sent.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
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
        <Button 
          title="Send Reset Link" 
          onPress={handleSendResetLink} 
          color={COLORS.patientPrimary}
        />
      </View>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={authStyles.link}>
          Back to <Text style={authStyles.linkBold}>Login</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}