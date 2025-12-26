// app/Booking.jsx
import api from '@/services/api';
import { useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function BookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('pending');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cancelModal, setCancelModal] = useState({ visible: false, bookingId: null });

  const fetchBookings = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    if (isRefresh) setRefreshing(true);
    // setRefreshing(true);
    setError('');

    try {
      const res = await api.get('/bookings/my');
      const data = res.data || [];

      if (!Array.isArray(data)) {
        setBookings([]);
        setError('Invalid data received');
      } else {
        setBookings(data);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load bookings';
      setError(msg);
      setBookings([]);
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = useCallback(() => {
    setError('');
    fetchBookings(true);
  }, []);

  const confirmCancel = (bookingId) => {
    setCancelModal({ visible: true, bookingId });
  };

  const cancelBooking = async () => {
    const { bookingId } = cancelModal;
    setCancelModal({ ...cancelModal, visible: false });

    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      Toast.show({ type: 'success', text1: 'Cancelled', text2: 'Booking cancelled successfully' });
      fetchBookings();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: err.response?.data?.error || 'Cannot cancel booking',
      });
    }
  };

  const canCancel = (booking) => {
    if (!['pending', 'confirmed'].includes(booking.status)) return false;
    const created = new Date(booking.createdAt).getTime();
    const now = Date.now();
    return (now - created) <= 10 * 60 * 1000; // 10 minutes
  };

  const filteredBookings = bookings.filter(b =>
    activeTab === 'pending' ? ['pending', 'confirmed', 'enroute', 'arrived', 'in-progress', 'expired'].includes(b.status) :
    activeTab === 'completed' ? b.status === 'completed' :
    b.status === 'cancelled'
  );

  const renderItem = (booking) => {
    const isCancellable = canCancel(booking);
    const serviceNames = booking.services?.map(s => s.serviceId?.name || 'Service').join(', ') || 'Service';
    const total = booking.services?.reduce((sum, s) => sum + (s.price || 0), 0) || 0;
    const image = booking.services?.[0]?.serviceId?.imageUrl;
    const vehicle = booking.vehicleDetails || {};

    return (
      <View
        key={booking._id}
        style={{
          backgroundColor: '#FFF',
          borderRadius: 16,
          padding: 18,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 4,
          // paddingBottom: insets.bottom,
        }}
      >
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            backgroundColor: '#F3F4F6',
            overflow: 'hidden',
            marginRight: 16,
          }}>
            {image ? (
              <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="car-outline" size={32} color="#9CA3AF" />
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>
              {serviceNames}
            </Text>
            <Text style={{ fontSize: 14, color: '#4B5563', marginTop: 4 }}>
              {vehicle.make || 'Vehicle'} {vehicle.model || ''} {vehicle.year ? `(${vehicle.year})` : ''}
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              {new Date(booking.scheduledDate).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              })} • {booking.scheduledTime}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
              {booking.serviceLocation?.address}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>₹{total}</Text>
            <View style={{
              marginTop: 8,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor:
                booking.status === 'completed' ? '#D1FAE5' :
                booking.status === 'cancelled' ? '#FECACA' :
                booking.status === 'pending' ? '#FEF3C7' : '#DBEAFE',
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color:
                  booking.status === 'completed' ? '#059669' :
                  booking.status === 'cancelled' ? '#DC2626' :
                  booking.status === 'pending' ? '#D97706' : '#2563EB',
              }}>
                {booking.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {['pending', 'confirmed'].includes(booking.status) && (
              <TouchableOpacity
                onPress={() => confirmCancel(booking._id)}
                disabled={!isCancellable}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: isCancellable ? '#EF4444' : '#E5E7EB',
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => router.push(`/singleBooking?id=${booking._id}`)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: '#F3F4F6',
                borderWidth: 1,
                borderColor: '#D1D5DB',
              }}
            >
              <Text style={{ color: '#374151', fontWeight: '600', fontSize: 13 }}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB', paddingBottom: insets.bottom, }} edges={['top']}>
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
          My Bookings
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', padding: 12, backgroundColor: '#FFF', gap: 10 }}>
        {[
          { key: 'pending', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 16,
              backgroundColor: activeTab === tab.key ? '#EF4444' : '#F3F4F6',
              borderWidth: 1,
              borderColor: activeTab === tab.key ? '#EF4444' : '#D1D5DB',
            }}
          >
            <Text style={{
              textAlign: 'center',
              fontWeight: '600',
              color: activeTab === tab.key ? '#FFF' : '#374151',
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
    <ActivityIndicator size="large" color="#EF4444" />
    <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280', fontWeight: '500' }}>
      Loading your bookings...
    </Text>
  </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="cloud-offline-outline" size={64} color="#9CA3AF" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            style={{
              marginTop: 20,
              backgroundColor: '#EF4444',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 30,
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="receipt-outline" size={70} color="#D1D5DB" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 16 }}>
            No {activeTab === 'pending' ? 'active' : activeTab} bookings
          </Text>
          <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8 }}>
            {activeTab === 'pending' ? 'Book your first car wash!' : 'Your history will appear here'}
          </Text>
        </View>
      ) : (
        <ScrollView
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EF4444']} />
    }
    contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
  >
    {filteredBookings.map(renderItem)}
  </ScrollView>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal visible={cancelModal.visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '85%', alignItems: 'center' }}>
            <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
            <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 16, color: '#1F2937' }}>
              Cancel Booking?
            </Text>
            <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 12 }}>
              This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
              <TouchableOpacity
                onPress={() => setCancelModal({ visible: false, bookingId: null })}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F3F4F6' }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: '#374151' }}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cancelBooking}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#EF4444' }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: '#FFF' }}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={{ height: 30, backgroundColor: '#fff' }} />
    </SafeAreaView>
  );
}