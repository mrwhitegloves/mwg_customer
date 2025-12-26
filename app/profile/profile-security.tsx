import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

// File-level options: Hide header (fallback if layout doesn't catch it)
export const options = {
  headerShown: false, // Hides the automatic Stack header
  title: '', // Empty title to avoid any text
};

export default function SecurityScreen() {
  const router = useRouter();
  const [faceId, setFaceId] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [touchId, setTouchId] = useState(true);

  return (
    <>
    {/* Optional: Use Stack.Screen for extra control */}
      <Stack.Screen options={{ headerShown: false }} />
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }} edges={['top']}>
        <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
        <TouchableOpacity style={{ width: 40, height: 40, justifyContent: 'center' }} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ fontSize: 16, color: '#333', fontWeight: '500' }}>Face ID</Text>
            <Switch
              value={faceId}
              onValueChange={setFaceId}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={faceId ? '#2ECC71' : '#FFF'}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ fontSize: 16, color: '#333', fontWeight: '500' }}>Remember me</Text>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={rememberMe ? '#2ECC71' : '#FFF'}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ fontSize: 16, color: '#333', fontWeight: '500' }}>Touch ID</Text>
            <Switch
              value={touchId}
              onValueChange={setTouchId}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={touchId ? '#2ECC71' : '#FFF'}
            />
          </View>

          <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ fontSize: 16, color: '#333', fontWeight: '500' }}>Google Authenticator</Text>
            <Ionicons name="chevron-forward" size={20} color="#2ECC71" />
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#E8F5E9', paddingVertical: 16, borderRadius: 24, alignItems: 'center', marginTop: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2ECC71' }}>Change Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
}