import { Redirect } from 'expo-router';
import { useAuth } from './_layout';

export default function Index() {
  const { user } = useAuth();

  if (user?.role === 'patient') {
    return <Redirect href="/patient" />;
  }

  if (user?.role === 'caregiver') {
    return <Redirect href="/caregiver" />;
  }

  return <Redirect href="/auth/login" />;
}
