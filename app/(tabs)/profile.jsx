// app/profile.jsx
import api from '@/services/api';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', paddingBottom: insets.bottom, }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1A202C" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#1A202C', marginLeft: 20, flex: 1 }}>
          My Profile
        </Text>
      </View>

      {/* Main Content */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#cc2e2e" />
          <Text style={{ marginTop: 16, color: '#64748B', fontSize: 16 }}>Loading your profile...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Ionicons name="cloud-offline-outline" size={80} color="#94A3B8" />
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E293B', marginTop: 20 }}>
            Unable to load profile
          </Text>
          <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 22 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            style={{
              marginTop: 30,
              backgroundColor: '#cc2e2e',
              paddingHorizontal: 40,
              paddingVertical: 16,
              borderRadius: 30,
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !user ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#94A3B8' }}>No profile data</Text>
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
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Profile Card */}
          <View style={{
            backgroundColor: '#FFF',
            margin: 16,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <View style={{ position: 'relative', marginBottom: 20 }}>
              <View style={{
                width: 130,
                height: 130,
                borderRadius: 65,
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
                    <Ionicons name="person" size={60} color="#94A3B8" />
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
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 4,
                  borderColor: '#FFF',
                }}
              >
                <Ionicons name="camera" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 26, fontWeight: '800', color: '#1A202C', marginBottom: 6 }}>
              {user.name || 'User'}
            </Text>
            <Text style={{ fontSize: 16, color: '#64748B' }}>
              {user.email || 'No email added'}
            </Text>
            <Text style={{ fontSize: 15, color: '#94A3B8', marginTop: 8 }}>
              {user.phone}
            </Text>
          </View>

          {/* Menu Items */}
          <View style={{ backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 20, overflow: 'hidden' }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 20,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}
              onPress={() => router.push('/profile/profile-edit')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#ECFDF5',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Ionicons name="person-outline" size={26} color="#10B981" />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#1E293B', marginLeft: 16 }}>
                  Edit Profile
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 20,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}
              onPress={() => router.push('/vehicle-details')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#ECFDF5',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Ionicons name="car-sport" size={26} color="#10B981" />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#1E293B', marginLeft: 16 }}>
                  My Vehicle
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  }}
  onPress={openPrivacyPolicy}
>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View
      style={{
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Ionicons name="document-text-outline" size={26} color="#2563EB" />
    </View>

    <Text
      style={{
        fontSize: 17,
        fontWeight: '600',
        color: '#1E293B',
        marginLeft: 16,
      }}
    >
      Privacy Policy
    </Text>
  </View>

  <Ionicons name="open-outline" size={22} color="#94A3B8" />
</TouchableOpacity>


            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 20,
                paddingHorizontal: 20,
              }}
              onPress={() => setLogoutModal(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#FEF2F2',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Ionicons name="log-out-outline" size={26} color="#EF4444" />
                </View>
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#EF4444', marginLeft: 16 }}>
                  Logout
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
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
          padding: 20,
        }}>
          <View style={{
            backgroundColor: '#FFF',
            borderRadius: 24,
            padding: 32,
            width: '100%',
            maxWidth: 380,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 20,
          }}>
            <Ionicons name="log-out-outline" size={70} color="#EF4444" />
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#1E293B', marginTop: 20 }}>
              Logout?
            </Text>
            <Text style={{ fontSize: 16, color: '#64748B', textAlign: 'center', marginTop: 12, lineHeight: 24 }}>
              Are you sure you want to log out of your account?
            </Text>

            <View style={{ width: '100%', marginTop: 32, gap: 12 }}>
              <TouchableOpacity
                onPress={handleLogout}
                style={{
                  backgroundColor: '#EF4444',
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 17 }}>
                  Yes, Logout
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setLogoutModal(false)}
                style={{
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#374151', fontWeight: '700', fontSize: 17 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ height: 30, backgroundColor: '#fff' }} />

      <Toast />
    </SafeAreaView>
  );
}