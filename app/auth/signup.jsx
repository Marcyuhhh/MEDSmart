import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, Alert, ScrollView, Modal, FlatList 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/common/button';
import Input from '../../components/common/input';
import { authStyles } from '../../styles/auth.styles';
import { COLORS } from '../../styles/common.styles';

const BLOOD_TYPES = [
  'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'
];

export default function SignUpScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const title = role === 'patient' 
    ? 'Create Patient Account' 
    : 'Create Caregiver Account';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [contact, setContact] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSignUp = () => {
    if (!name || !email || !age || !contact || !bloodType || !password || !confirmPassword) {
      Alert.alert('Empty Fields', 'Please fill out all fields to register.');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Your passwords do not match.');
      return;
    }

    console.log('Signing up with data:', {
      role, name, email, age, contact, bloodType,
    });
    
    Alert.alert(
      'Success (Mock)', 
      `Account for ${name} (${role}) created. This will connect to Firebase.`,
      [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
    );
    
    router.replace('/auth/login');
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
        <Input 
          placeholder="Email" 
          value={email} 
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input 
          placeholder="Age" 
          value={age} 
          onChangeText={setAge}
          keyboardType="numeric"
        />
        <Input 
          placeholder="Contact Number (e.g., 09...)" 
          value={contact} 
          onChangeText={setContact}
          keyboardType="phone-pad"
        />
        
        <TouchableOpacity
          style={authStyles.dropdownButton}
          onPress={() => setIsModalVisible(true)}
        >
          {bloodType ? (
            <Text style={authStyles.dropdownButtonText}>{bloodType}</Text>
          ) : (
            <Text style={authStyles.dropdownPlaceholder}>Select Blood Type</Text>
          )}
        </TouchableOpacity>
        
        <Input 
          placeholder="Password" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />
        <Input 
          placeholder="Confirm Password" 
          value={confirmPassword} 
          onChangeText={setConfirmPassword} 
          secureTextEntry 
        />

        <View style={{ marginVertical: 20 }}>
          <Button 
            title="Create Account" 
            onPress={handleSignUp} 
            color={COLORS.patientPrimary}
          />
        </View>

        <TouchableOpacity onPress={() => router.replace('/auth/login')}>
          <Text style={authStyles.link}>
            Already have an account? <Text style={authStyles.linkBold}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity 
          style={authStyles.modalBackdrop} 
          activeOpacity={1} 
          onPressOut={() => setIsModalVisible(false)}
        >
          <View style={authStyles.modalContent}>
            <Text style={authStyles.modalTitle}>Select Blood Type</Text>
            <FlatList
              data={BLOOD_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={authStyles.modalOption}
                  onPress={() => onSelectBloodType(item)}
                >
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