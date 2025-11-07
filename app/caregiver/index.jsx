import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../_layout';
import Button from '../../components/common/button';

export default function CaregiverHome() {
  const { setAuth } = useAuth();
  return (
    <View style={[styles.container, { backgroundColor: '#E8F5E8' }]}>
      <Text style={[styles.title, { color: '#43A047' }]}>Caregiver Dashboard</Text>
      <Text style={styles.text}>Monitoring Patient: Marc</Text>
      <Button title="Log Out" onPress={() => setAuth(null)} color="#43A047" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 18, marginBottom: 20 }
});