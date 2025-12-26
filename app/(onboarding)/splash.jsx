// app/(onboarding)/splash.jsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  StatusBar,
  Text,
  View,
} from 'react-native';
import api from '../../services/api';
import { useAppSelector } from '../../store/hooks';

const SplashScreen = () => {
  const router = useRouter();
  const { token } = useAppSelector((state) => state.auth);
  const [isChecking, setIsChecking] = useState(true);

  const logo = require("../../assets/images/icon.jpg");
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Get token from Redux OR AsyncStorage
        let currentToken = token;
        if (!currentToken) {
          currentToken = await AsyncStorage.getItem('authToken');
        }


        if (!currentToken) {
          // Not logged in → go to login
          router.replace('/login');
          return;
        }

        // 2. Validate token with /auth/me
        const res = await api.get('/auth/me');
        const user = res.data.user;

        // 3. Check if user has vehicle
        const hasVehicle = user.vehicles && user.vehicles !== null;

        // 4. Navigate accordingly
        if (hasVehicle) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/vehicle-form');
        }
      } catch (err) {
        console.warn('Token invalid or API error:', err);
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };

    // Show splash for at least 2 seconds
    const timer = setTimeout(() => {
      checkAuth();
    }, 2000);

    return () => clearTimeout(timer);
  }, [token, router]);

  // Show splash while checking
  if (isChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000ff', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" />
        <Animated.View style={[{ alignItems: 'center', marginBottom: 60 }, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={{ width: 240, height: 240, justifyContent: 'center', alignItems: 'center' }}>
            <Image source={logo} style={{ width: 200, height: 200 }} resizeMode="contain" />
          </View>
        </Animated.View>

        <View style={{ alignItems: 'center', position: 'absolute', bottom: 120 }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={{ color: '#ffffffff', fontSize: 14, marginTop: 12, fontWeight: '500', opacity: 0.9 }}>
            Loading...
          </Text>
        </View>

        <View style={{ position: 'absolute', bottom: 40 }}>
          <Text style={{ color: '#ffffffff', fontSize: 14, fontWeight: '500', opacity: 0.8 }}>
            Mr White Gloves
          </Text>
        </View>
      </View>
    );
  }

  return null; // Navigation already handled
};

export default SplashScreen;