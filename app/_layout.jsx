import React, { useState, createContext, useContext, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function useProtectedRoute(user) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('--- 2. GUARD CHECKING --- User:', user, 'Segments:', segments);

    if (segments.length === 0) {
      return;
    }

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      console.log('--- 3. GUARD ACTION --- No user! Redirecting to login.');
      router.replace('/login');
    } else if (user && user.role === 'patient' && segments[0] !== 'patient') {
      console.log('--- 3. GUARD ACTION --- Patient found! Redirecting to patient home.');
      router.replace('/patient');
    } else if (user && user.role === 'caregiver' && segments[0] !== 'caregiver') {
      console.log('--- 3. GUARD ACTION --- Caregiver found! Redirecting to caregiver home.');
      router.replace('/caregiver');
    }
  }, [user, segments, router]);
}

function RootLayoutNav() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  useProtectedRoute(user);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="patient" />
      <Stack.Screen name="caregiver" />
    </Stack>
  );
}

export default function RootLayout() {
  const [auth, setAuth] = useState(null);

  return (
    <AuthContext.Provider value={{ user: auth, setAuth }}>
      <RootLayoutNav />
    </AuthContext.Provider>
  );
}