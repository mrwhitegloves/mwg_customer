import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

export default function LocationFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [label, setLabel] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Jamshedpur');

  const [showLabelModal, setShowLableModal] = useState(false);

  const labels = ['Home', 'Office', 'Other'];

  const handleSubmit = async () => {
    if (!street || !city) {
      Toast.show({ type: 'error', text1: 'Invalid Input', text2: 'Street and City are required' });
      return;
    }
    setIsLoading(true);
    try {
      // Optional: Forward geocode if needed (for lat/lng)
      // let geocodes = await Location.geocodeAsync(`${street}, ${city}`);
      // const { latitude, longitude } = geocodes[0] || {};

      await api.post('/auth/location', {
        label,
        street,
        city,
        state,
        postalCode,
        latitude: null, // Or from geocode
        longitude: null,
        isDefault: true,
      });
      router.replace('/');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to save location';
      Toast.show({ type: 'error', text1: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const saveLocation = async (place) => {
    if (!place?.latitude) return;
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
      setCurrentLocation(place.city);
      router.replace(redirect || '/');
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Failed to save location' });
      
    } finally {
      setIsLoading(false);
    }
  };

  const renderDropdownItem = (item, onSelect, modalSetter) => (
    <TouchableOpacity
      style={{ padding: 16, borderBottomWidth: 1, borderColor: '#EEE' }}
      onPress={() => {
        onSelect(item);
        modalSetter(false);
      }}
    >
      <Text style={{ fontSize: 16 }}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF', paddingBottom: insets.bottom }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <TouchableOpacity style={{ width: 44, height: 44, justifyContent: 'center' }} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#333', marginBottom: 5, marginTop: 16 }}>Enter Your Location</Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#7b7b7bff', marginBottom: 32, marginTop: 1 }}>Help us find services near you</Text>

          <View style={{ paddingHorizontal: 2, paddingTop: 12, backgroundColor: '#FFF' }}>
        <PlacesAutocomplete
          apiKey={GOOGLE_PLACES_API_KEY}
          onPlaceSelected={saveLocation}
          placeholder="Search for your address..."
        />
        {isLoading && <ActivityIndicator style={{ position: 'absolute', right: 28, top: 28 }} />}
      </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 20, paddingTop: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' }}>
          <TouchableOpacity 
            style={{ backgroundColor: '#cc2e2eff', borderRadius: 24, paddingVertical: 16, alignItems: 'center', opacity: isLoading ? 0.7 : 1 }}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#FFF' }}>Save & Continue</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}