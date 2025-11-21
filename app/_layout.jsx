import React, { useState, createContext, useContext, useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { COLORS } from '../styles/common.styles';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function useProtectedRoute(user, isInitialized) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    // FIX: Check for 'auth' folder, not '(auth)'
    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // FIX: Redirect to /auth/login
      router.replace('/auth/login');
    } else if (user && user.role === 'patient' && segments[0] !== 'patient') {
      // FIX: Redirect to /patient
      router.replace('/patient');
    } else if (user && user.role === 'caregiver' && segments[0] !== 'caregiver') {
      // FIX: Redirect to /caregiver
      router.replace('/caregiver');
    }
  }, [user, segments, isInitialized]);
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* FIX: Names match your actual folder names (no parentheses) */}
      <Stack.Screen name="auth" />
      <Stack.Screen name="patient" />
      <Stack.Screen name="caregiver" />
    </Stack>
  );
}

export default function RootLayout() {
  return <RootLayoutProvider />;
}

function RootLayoutProvider() {
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userDoc.data() });
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error(error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsInitialized(true);
    });
    return unsubscribe;
  }, []);

  useProtectedRoute(user, isInitialized);

  const setAuth = async (action) => {
    if (!action) {
      await signOut(auth);
      setUser(null);
      return;
    }
    if (typeof action === 'function') {
      setUser(prev => action(prev));
    } else {
      setUser(action);
    }
  };

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.patientPrimary} />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setAuth }}>
      <RootLayoutNav />
    </AuthContext.Provider>
  );
}