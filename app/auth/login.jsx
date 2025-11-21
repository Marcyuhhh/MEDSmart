import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../_layout';
import Button from '../../components/common/button';
import Input from '../../components/common/input';
import { authStyles } from '../../styles/auth.styles';
import { COLORS } from '../../styles/common.styles';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful!");
    } catch (error) {
      Alert.alert("Login Failed", "Invalid email or password.");
      setIsLoading(false);
    }
  };

  // FIX: Updated path to /auth/forgot-password
  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <Text style={authStyles.title}>MEDSmart</Text>
      
      <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      
      <View style={authStyles.forgotPasswordContainer}>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={authStyles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.patientPrimary} style={{marginVertical: 20}} />
      ) : (
        <Button title="Login" onPress={handleLogin} color={COLORS.patientPrimary} />
      )}
      
      {/* FIX: Updated path to /auth/role-selection */}
      <TouchableOpacity onPress={() => router.push('/auth/role-selection')}>
        <Text style={authStyles.link}>
          Don't have an account? <Text style={authStyles.linkBold}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}