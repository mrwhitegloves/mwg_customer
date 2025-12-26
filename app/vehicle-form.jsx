// app/vehicle-form.jsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api from '../services/api';

export default function VehicleFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rcNumber, setRcNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rcNumber.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Oops!',
        text2: 'Please enter your RC number',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/vehicle', {
        rcNumber: rcNumber.trim().toUpperCase(),
      });

      Toast.show({
        type: 'success',
        text1: 'Vehicle Added!',
        text2: `AI detected: ${response.data.make} ${response.data.model} • ${response.data.segment}`,
      });

      // Redirect based on backend response
      if (response.data.redirect) {
        router.replace(response.data.redirect);
      } else {
        router.replace('/location-finding');
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Invalid RC number. Please try again.';
      
      Toast.show({
        type: 'error',
        text1: 'Invalid RC',
        text2: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF', paddingBottom: insets.bottom }}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Back Button */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
          {/* AI Illustration */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Image
              source={require('../assets/images/ai-car.jpg')} // Add your AI car icon
              style={{ width: 180, height: 180 }}
              resizeMode="contain"
            />
          </View>

          <Text style={{ fontSize: 32, fontWeight: '800', color: '#222', textAlign: 'center', marginBottom: 12 }}>
            Add Your Vehicle
          </Text>

          <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40, lineHeight: 24 }}>
            Just enter your RC number — our AI will detect your car make, model & segment in seconds
          </Text>

          {/* RC Input */}
          <View style={inputContainer}>
            <Ionicons name="card-outline" size={22} color="#999" style={{ marginRight: 12 }} />
            <TextInput
              style={inputStyle}
              placeholder="Enter RC Number (e.g. DL10AB1234)"
              placeholderTextColor="#AAA"
              value={rcNumber}
              onChangeText={setRcNumber}
              autoCapitalize="characters"
              autoCorrect={false}
              keyboardType="default"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[submitButton, isLoading && { opacity: 0.8 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={submitText}>
                Add Vehicle
              </Text>
            )}
          </TouchableOpacity>

          {/* Trust Badge */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 }}>
            <Text style={{ fontSize: 13, color: '#999' }}>Powered by</Text>
            <Text style={{ fontSize: 13, color: '#1A73E8', fontWeight: 'bold', marginLeft: 6 }}>
              Mr White Gloves
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Toast />
    </SafeAreaView>
  );
}

// ────── STYLES ──────
const inputContainer = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F8F9FA',
  borderRadius: 16,
  paddingHorizontal: 20,
  height: 64,
  borderWidth: 1.5,
  borderColor: '#E0E0E0',
  marginBottom: 24,
};

const inputStyle = {
  flex: 1,
  fontSize: 17,
  color: '#222',
  fontWeight: '500',
};

const submitButton = {
  backgroundColor: '#22C55E',
  height: 62,
  borderRadius: 16,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 12,
  elevation: 8,
};

const submitText = {
  color: '#FFF',
  fontSize: 18,
  fontWeight: 'bold',
};