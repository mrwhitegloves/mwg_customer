// app/location-finding.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';

export default function LocationFindingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);

  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -20, duration: 600, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 600, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    const scale = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 600, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 600, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    bounce.start();
    scale.start();

    // AUTO START PERMISSION (Native Dialog)
    handleLocationPermission();

    return () => {
      bounce.stop();
      scale.stop();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleLocationPermission = async () => {
    setIsProcessing(true);
    Animated.timing(progressAnim, { toValue: 1, duration: 3000, useNativeDriver: false }).start();

    try {
      // This shows NATIVE iOS/Android dialog
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        // User denied → go to manual
        router.replace('/location-form');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = position.coords;

      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address.formattedAddress === null || address.city === null) {
        router.replace('/location-form');
        return;
      }

      const locationData = {
        label: 'Home',
        street: address.street || '',
        city: address.city || '',
        state: address.region || '',
        postalCode: address.postalCode || '',
        fullAddress: address.formattedAddress || '',
        latitude,
        longitude,
        isDefault: true,
      };

      await api.post('/auth/location', locationData);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.log('Location error:', error);
      router.replace('/location-form');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5', paddingBottom: insets.bottom }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        <Animated.View
          style={[
            { marginBottom: 48, alignItems: 'center' },
            { transform: [{ translateY: bounceAnim }, { scale: scaleAnim }] },
          ]}
        >
          <View style={{ position: 'absolute', bottom: -30, width: 80, height: 12, borderRadius: 40, backgroundColor: 'rgba(0, 0, 0, 0.1)' }} />
          <View style={{
            width: 120, height: 120, borderRadius: 60,
            backgroundColor: '#FFE5E0', justifyContent: 'center', alignItems: 'center',
            shadowColor: '#E74C3C', shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3, shadowRadius: 12, elevation: 8
          }}>
            <Ionicons name="location" size={80} color="#E74C3C" />
          </View>
        </Animated.View>

        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16, textAlign: 'center' }}>
          Finding Your Location
        </Text>
        <Text style={{ fontSize: 16, color: '#7F8C8D', textAlign: 'center', lineHeight: 24, marginBottom: 48 }}>
          Please wait while we detect your location...
        </Text>

        {isProcessing && (
          <View style={{ width: '100%', height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' }}>
            <Animated.View style={{ height: '100%', backgroundColor: '#E74C3C', borderRadius: 3, width: progressWidth }} />
          </View>
        )}

        {isProcessing && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <ActivityIndicator size="small" color="#E74C3C" />
            <Text style={{ marginLeft: 8, color: '#7F8C8D' }}>Detecting location...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}