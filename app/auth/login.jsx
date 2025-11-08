import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../_layout';
import Button from '../../components/common/button'; 
import Input from '../../components/common/input';
import { authStyles } from '../../styles/auth.styles';
import { COLORS } from '../../styles/common.styles';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Attempting login with:', email, password);
    Alert.alert(
      'Login Clicked', 
      'This will connect to Firebase. Use the "Bypass" button for now.'
    );
  };

  const handleBypassToPatient = () => {
    console.log('Bypassing to Patient Dashboard...');

    const mockUser = {
       uid: 'dummy-patient-id',
        role: 'patient',
        name: 'Marc',
        email: 'marc@patient.com',
        age: '72',
        contact: '09123456789',
        bloodType: 'O+',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '09987654321',
        deviceId: 'MEDSMART-A1B2',
        };
    setAuth(mockUser);
  };
  
  const handleForgotPassword = () => {
    console.log('Navigating to Forgot Password');
    router.push('/auth/forgot-password');
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <Text style={authStyles.title}>MEDSmart</Text>
      
      <Input 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
      />
      
      <View style={authStyles.forgotPasswordContainer}>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={authStyles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <Button 
        title="Login" 
        onPress={handleLogin} 
        color={COLORS.patientPrimary}
      />
      
      <TouchableOpacity onPress={() => router.push('/auth/role-selection')}>
        <Text style={authStyles.link}>
          Don't have an account? <Text style={authStyles.linkBold}>Sign up</Text>
        </Text>
      </TouchableOpacity>
      
      <View style={authStyles.devBypassContainer}>
        <Button 
          title="Bypass to Patient Home (Dev)" 
          onPress={handleBypassToPatient} 
          color={COLORS.gray}
        />
      </View>
    </SafeAreaView>
  );
}