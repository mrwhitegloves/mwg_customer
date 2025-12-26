import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import PlacesAutocomplete from './PlacesAutocomplete';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export default function HomeLocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocationAddress, setCurrentLocationAddress] = useState(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);

  // Format place from geocode
  const formatPlaceFromGeocode = (address, location) => {
    return {
      fullAddress: address?.[0]?.formattedAddress || 'Unknown Address',
      street: address?.[0]?.street,
      city: address?.[0]?.city,
      state: address?.[0]?.region,
      postalCode: address?.[0]?.postalCode,
      latitude: location?.coords?.latitude,
      longitude: location?.coords?.longitude,
    };
  };

  // Save location to backend
  const saveLocation = async (place) => {
    if (!place?.latitude || !place?.longitude) return;

    try {
      setIsLoading(true);
      const payload = {
        label: 'Home',
        street: place.street || '',
        city: place.city,
        state: place.state,
        postalCode: place.postalCode || '',
        latitude: place.latitude,
        longitude: place.longitude,
        isDefault: true,
        fullAddress: place.fullAddress,
      };

      const res = await api.post('/auth/location', payload);
      const { redirect } = res.data;
      router.replace(redirect || '/(tabs)/home');
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Failed to save location' });
    } finally {
      setIsLoading(false);
    }
  };

  // Get current location (with permission check)
  const getCurrentLocation = async () => {
    setIsFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentLocationAddress(null);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      const formattedPlace = formatPlaceFromGeocode(address, location);
      setCurrentLocationAddress(formattedPlace.fullAddress);
    } catch (err) {
      console.log('Location fetch error:', err);
      setCurrentLocationAddress(null);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  // Auto-fetch on mount (only if permission already granted)
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        setIsFetchingLocation(false);
      }
    })();
  }, []);

  // Handle button press
  const handleUseCurrentLocation = async () => {
    await getCurrentLocation();
    if (currentLocationAddress) {
      // Re-fetch latest coords and save
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      const place = formatPlaceFromGeocode(address, location);
      await saveLocation(place);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5', paddingBottom: insets.bottom }} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', marginLeft: 16, flex: 1 }}>
          Select Loaction
        </Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#FFF' }}>
        <PlacesAutocomplete
          apiKey={GOOGLE_PLACES_API_KEY}
          onPlaceSelected={saveLocation}
          placeholder="Search for your address..."
        />
        {isLoading && <ActivityIndicator style={{ position: 'absolute', right: 28, top: 28 }} />}
      </View>

      {/* Current Location Section */}
      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            <TouchableOpacity
              onPress={handleUseCurrentLocation}
              disabled={isFetchingLocation}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFF',
                marginHorizontal: 16,
                marginTop: 12,
                padding: 16,
                borderRadius: 12,
                elevation: 2,
                opacity: isFetchingLocation ? 0.7 : 1,
              }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                {isFetchingLocation ? (
                  <ActivityIndicator size="small" color="#4A90E2" />
                ) : (
                  <Ionicons name="locate" size={24} color="#4A90E2" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                {currentLocationAddress ? (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 }}>
                      Use Current Location
                    </Text>
                    <Text style={{ fontSize: 14, color: '#666', numberOfLines: 2 }}>
                      {currentLocationAddress}
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                    Use Current Location
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </SafeAreaView>
  );
}