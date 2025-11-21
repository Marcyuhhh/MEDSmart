import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/common/button';
import Input from '../../components/common/input';
import { authStyles } from '../../styles/auth.styles';
import { COLORS } from '../../styles/common.styles';

// --- FIREBASE IMPORTS ---
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function SignUpScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const title = role === 'patient' ? 'Create Patient Account' : 'Create Caregiver Account';

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [contact, setContact] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    // 1. Validation
    if (!name || !email || !age || !contact || !bloodType || !password) {
      Alert.alert('Missing Info', 'Please fill out all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // 2. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Create Firestore Document
      // We use the Auth UID as the Document ID for easy lookup later
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        role: role, // 'patient' or 'caregiver'
        name: name,
        email: email,
        age: age,
        contact: contact,
        bloodType: bloodType,
        createdAt: new Date().toISOString(),
        // Fields specific to Patient
        deviceId: role === 'patient' ? 'Not Connected' : null,
        emergencyContactName: role === 'patient' ? 'Not Set' : null,
        emergencyContactPhone: role === 'patient' ? 'Not Set' : null,
        // Fields specific to Caregiver
        linkedPatientId: null
      });

      // 4. Success! 
      // The _layout.jsx listener will detect the new user and redirect automatically.
      // But showing an alert is nice.
      Alert.alert("Welcome!", "Account created successfully.");

    } catch (error) {
      console.error(error);
      Alert.alert("Registration Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectBloodType = (type) => {
    setBloodType(type);
    setIsModalVisible(false);
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[authStyles.title, { marginBottom: 30 }]}>{title}</Text>
        
        <Input placeholder="Full Name" value={name} onChangeText={setName} />
        <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Input placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
        <Input placeholder="Contact Number" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
        
        <TouchableOpacity style={authStyles.dropdownButton} onPress={() => setIsModalVisible(true)}>
          {bloodType ? (
            <Text style={authStyles.dropdownButtonText}>{bloodType}</Text>
          ) : (
            <Text style={authStyles.dropdownPlaceholder}>Select Blood Type</Text>
          )}
        </TouchableOpacity>
        
        <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Input placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        <View style={{ marginVertical: 20 }}>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.patientPrimary} />
          ) : (
            <Button title="Create Account" onPress={handleSignUp} color={COLORS.patientPrimary} />
          )}
        </View>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={authStyles.link}>Already have an account? <Text style={authStyles.linkBold}>Log in</Text></Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
        <TouchableOpacity style={authStyles.modalBackdrop} activeOpacity={1} onPressOut={() => setIsModalVisible(false)}>
          <View style={authStyles.modalContent}>
            <Text style={authStyles.modalTitle}>Select Blood Type</Text>
            <FlatList
              data={BLOOD_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={authStyles.modalOption} onPress={() => onSelectBloodType(item)}>
                  <Text style={authStyles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}