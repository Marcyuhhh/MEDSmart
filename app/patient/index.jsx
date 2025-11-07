import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../_layout';
import Button from '../../components/common/button';

export default function PatientHome() {
  const { setAuth } = useAuth();
  return (
    <View style={[styles.container, { backgroundColor: '#E3F2FD' }]}>
      <Text style={[styles.title, { color: '#1E88E5' }]}>Patient Dashboard</Text>
      <Text style={styles.text}>Welcome, Patient!</Text>
      <Button title="Log Out" onPress={() => setAuth(null)} color="#1E88E5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 18, marginBottom: 20 }
});