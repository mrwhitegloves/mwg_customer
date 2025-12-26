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

export default function NotificationsScreen() {
  const router = useRouter();
  const [generalNotification, setGeneralNotification] = useState(true);
  const [sound, setSound] = useState(false);
  const [vibrate, setVibrate] = useState(false);
  const [appUpdates, setAppUpdates] = useState(true);
  const [newService, setNewService] = useState(false);
  const [newTips, setNewTips] = useState(false);

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
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>Notification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ fontSize: 16, color: '#333', fontWeight: '500' }}>General Notification</Text>
            <Switch
              value={generalNotification}
              onValueChange={setGeneralNotification}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={generalNotification ? '#2ECC71' : '#FFF'}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ fontSize: 16, color: '#333', fontWeight: '500' }}>Sound</Text>
            <Switch
              value={sound}
              onValueChange={setSound}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={sound ? '#2ECC71' : '#FFF'}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ fontSize: 16, color: '#333', fontWeight: '500' }}>Vibrate</Text>
            <Switch
              value={vibrate}
              onValueChange={setVibrate}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={vibrate ? '#2ECC71' : '#FFF'}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ fontSize: 16, color: '#333', fontWeight: '500' }}>App Updates</Text>
            <Switch
              value={appUpdates}
              onValueChange={setAppUpdates}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={appUpdates ? '#2ECC71' : '#FFF'}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ fontSize: 16, color: '#333', fontWeight: '500' }}>New Service Available</Text>
            <Switch
              value={newService}
              onValueChange={setNewService}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={newService ? '#2ECC71' : '#FFF'}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ fontSize: 16, color: '#333', fontWeight: '500' }}>New tips available</Text>
            <Switch
              value={newTips}
              onValueChange={setNewTips}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={newTips ? '#2ECC71' : '#FFF'}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </>
  );
}