// app/profile.jsx
import api from '@/services/api';
import { font, icon, radius, spacing } from '@/services/ui';
import { useAppDispatch } from '@/store/hooks';
import { logoutAsync } from '@/store/slices/authSlice';
import { persistor } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function Profile() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [logoutModal, setLogoutModal] = useState(false);

  const fetchUser = async (isPullToRefresh = false) => {
    if (!isPullToRefresh) {
      setLoading(true);
      setError('');
    }
    setRefreshing(true);

    try {
      const res = await api.get('/auth/me');
      const fetchedUser = res.data?.user;

      if (!fetchedUser) {
        setError('No user data found');
        setUser(null);
      } else {
        setUser(fetchedUser);
        setError('');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load profile';
      setError(msg);
      setUser(null);
      if (!isPullToRefresh) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: msg,
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useState(() => {
    fetchUser();
  }, []);

  const onRefresh = useCallback(() => {
    fetchUser(true);
  }, []);

  const openPrivacyPolicy = async () => {
  const url = 'https://www.mrwhitegloves.com/privacy-policy';

  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'Unable to open Privacy Policy',
    });
  }
};


  const handleLogout = async () => {
    try {
      await dispatch(logoutAsync()).unwrap();
      await AsyncStorage.removeItem('authToken');
      await persistor.purge();
      router.replace('/login');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: 'Please try again',
      });
    } finally {
      setLogoutModal(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={["top", "left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={icon.lg} color="#1A202C" />
        </TouchableOpacity>
        <Text style={{ fontSize: font.xl, fontWeight: '700', color: '#1A202C', marginLeft: spacing.lg, flex: 1 }}>
          My Profile
        </Text>
      </View>

      {/* Main Content */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#cc2e2e" />
          <Text style={{ marginTop: spacing.lg, color: '#64748B', fontSize: font.lg }}>Loading your profile...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl }}>
          <Ionicons name="cloud-offline-outline" size={icon.xl * 2} color="#94A3B8" />
          <Text style={{ fontSize: font.xxl, fontWeight: '700', color: '#1E293B', marginTop: spacing.xl }}>
            Unable to load profile
          </Text>
          <Text style={{ fontSize: font.lg, color: '#64748B', textAlign: 'center', marginTop: spacing.md, lineHeight: 24 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            style={{
              marginTop: spacing.xxl,
              backgroundColor: '#cc2e2e',
              paddingHorizontal: spacing.xxl * 2,
              paddingVertical: spacing.lg,
              borderRadius: radius.pill,
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: font.lg }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !user ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#94A3B8', fontSize: font.lg }}>No profile data</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#cc2e2e']}
              tintColor="#cc2e2e"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }}
        >
          {/* Profile Card */}
          <View style={{
            backgroundColor: '#FFF',
            marginHorizontal: spacing.lg,
            marginTop: spacing.lg,
            borderRadius: radius.xl,
            padding: spacing.xl,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <View style={{ position: 'relative', marginBottom: spacing.xl }}>
              <View style={{
                width: spacing.xxl * 5,
                height: spacing.xxl * 5,
                borderRadius: spacing.xxl * 2.5,
                backgroundColor: '#F3F4F6',
                overflow: 'hidden',
                borderWidth: 5,
                borderColor: '#cc2e2e',
              }}>
                {user.profileImage ? (
                  <Image
                    source={{ uri: user.profileImage }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="person" size={icon.xl * 2} color="#94A3B8" />
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => router.push('/profile/profile-edit')}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: '#cc2e2e',
                  width: spacing.xxl * 2,
                  height: spacing.xxl * 2,
                  borderRadius: spacing.xxl,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 4,
                  borderColor: '#FFF',
                }}
              >
                <Ionicons name="camera" size={icon.lg} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: font.xxl, fontWeight: '800', color: '#1A202C', marginBottom: spacing.sm }}>
              {user.name || 'User'}
            </Text>
            <Text style={{ fontSize: font.lg, color: '#64748B' }}>
              {user.email || 'No email added'}
            </Text>
            <Text style={{ fontSize: font.md, color: '#94A3B8', marginTop: spacing.sm }}>
              {user.phone && (`+${user.phone}`)}
            </Text>
          </View>

          {/* Menu Items */}
          <View style={{ 
            backgroundColor: '#FFF', 
            marginHorizontal: spacing.lg,
            marginTop: spacing.md,
            borderRadius: radius.xl,
            overflow: 'hidden' 
            }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.xl,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}
              onPress={() => router.push('/profile/profile-edit')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: spacing.xxl * 2,
                  height: spacing.xxl * 2,
                  borderRadius: spacing.xxl * 1.25,
                  backgroundColor: '#ECFDF5',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Ionicons name="person-outline" size={icon.lg} color="#10B981" />
                </View>
                <Text style={{ fontSize: font.lg, fontWeight: '600', color: '#1E293B', marginLeft: spacing.lg }}>
                  Edit Profile
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={icon.lg} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: spacing.xl,
                paddingHorizontal: spacing.xl,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}
              onPress={() => router.push('/vehicle-details')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: spacing.xxl * 2,
                  height: spacing.xxl * 2,
                  borderRadius: spacing.xxl * 1.25,
                  backgroundColor: '#ECFDF5',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Ionicons name="car-sport" size={icon.lg} color="#10B981" />
                </View>
                <Text style={{ fontSize: font.lg, fontWeight: '600', color: '#1E293B', marginLeft: spacing.lg }}>
                  My Vehicle
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={icon.lg} color="#94A3B8" />
            </TouchableOpacity>

            {/* Privacy Policy */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: spacing.xl,
                paddingHorizontal: spacing.xl,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}
              onPress={openPrivacyPolicy}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: spacing.xxl * 2,
                  height: spacing.xxl * 2,
                  borderRadius: spacing.xxl * 1.25,
                  backgroundColor: '#EFF6FF',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Ionicons name="document-text-outline" size={icon.lg} color="#2563EB" />
                </View>
                <Text style={{ fontSize: font.lg, fontWeight: '600', color: '#1E293B', marginLeft: spacing.lg }}>
                  Privacy Policy
                </Text>
              </View>
              <Ionicons name="open-outline" size={icon.lg} color="#94A3B8" />
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: spacing.xl,
                paddingHorizontal: spacing.xl,
              }}
              onPress={() => setLogoutModal(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: spacing.xxl * 2,
                  height: spacing.xxl * 2,
                  borderRadius: spacing.xxl * 1.25,
                  backgroundColor: '#FEF2F2',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Ionicons name="log-out-outline" size={icon.lg} color="#EF4444" />
                </View>
                <Text style={{ fontSize: font.lg, fontWeight: '600', color: '#EF4444', marginLeft: spacing.lg }}>
                  Logout
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={icon.lg} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Logout Confirmation Modal */}
      <Modal visible={logoutModal} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.xl,
        }}>
          <View style={{
            backgroundColor: '#FFF',
            borderRadius: radius.xl,
            padding: spacing.xxl,
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 20,
          }}>
            <Ionicons name="log-out-outline" size={icon.xl * 2} color="#EF4444" />
            <Text style={{ fontSize: font.xxl, fontWeight: '800', color: '#1E293B', marginTop: spacing.xl }}>
              Logout?
            </Text>
            <Text style={{ fontSize: font.md, color: '#64748B', textAlign: 'center', marginTop: spacing.md, lineHeight: 24 }}>
              Are you sure you want to log out of your account?
            </Text>

            <View style={{ width: '100%', marginTop: spacing.xxl, gap: spacing.md }}>
              <TouchableOpacity
                onPress={handleLogout}
                style={{
                  backgroundColor: '#EF4444',
                  paddingVertical: spacing.lg,
                  borderRadius: radius.lg,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: font.lg }}>
                  Yes, Logout
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setLogoutModal(false)}
                style={{
                  backgroundColor: '#F3F4F6',
                  paddingVertical: spacing.lg,
                  borderRadius: radius.lg,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#374151', fontWeight: '700', fontSize: font.lg }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
}