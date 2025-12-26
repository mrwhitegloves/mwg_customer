// customer/app/_auth-wrapper.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAppSelector } from '../store/hooks';
import SplashScreen from './(onboarding)/splash';

let hasCheckedAuth = false; // ← Global flag (outside component)

export default function AuthWrapper() {
  const router = useRouter();
  const { token } = useAppSelector((state) => state.auth);
  const [isReady, setIsReady] = useState(false);
  const checkedRef = useRef(false); // ← Prevent double execution

  useEffect(() => {
    if (checkedRef.current || hasCheckedAuth) return;
    checkedRef.current = true;
    hasCheckedAuth = true;

    const checkAuth = async () => {
      try {
        let currentToken = token || (await AsyncStorage.getItem('authToken'));

        if (!currentToken) {
          router.replace('/login');
          setIsReady(true);
          return;
        }

        const res = await api.get('/auth/me');
        const user = res.data.user;
        const hasAddress =
          (user.addresses && user.addresses.length > 0) ||
          (user.deliveryAddresses && user.deliveryAddresses.length > 0);

        router.replace(hasAddress ? '/' : '/location-finding');
      } catch (err) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();
  }, [token, router]);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="home" />
      <Stack.Screen name="profile-form" />
      <Stack.Screen name="vehicle-form" />
      <Stack.Screen name="location-form" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="bookingConfirmed" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="login" />
      <Stack.Screen name="location-finding" />
      {/* <Stack.Screen name="profile/profile-edit" />
      <Stack.Screen name="profile/profile-notifications" />
      <Stack.Screen name="profile/profile-security" /> */}
    </Stack>
  );
}