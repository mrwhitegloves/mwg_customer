// app/Subscription.jsx
import api from '@/services/api';
import { font, icon, radius, spacing } from '@/services/ui';
import { useAppSelector } from '@/store/hooks';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('pending');
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cancelModal, setCancelModal] = useState({ visible: false, subscriptionId: null });

  // ==================== FETCH SUBSCRIPTIONS ====================
  const fetchSubscriptions = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    if (isRefresh) setRefreshing(true);
    setError('');

    try {
      const res = await api.get('/bookings/my/subscriptions');   // ← Your backend endpoint
      const data = res.data || [];

      if (!Array.isArray(data)) {
        setSubscriptions([]);
        setError('Invalid data received');
      } else {
        setSubscriptions(data);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load subscriptions';
      setError(msg);
      setSubscriptions([]);
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  console.log("Fetched Subscriptions:", subscriptions);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const onRefresh = useCallback(() => {
    setError('');
    fetchSubscriptions(true);
  }, []);

  const confirmCancel = (subscriptionId) => {
    setCancelModal({ visible: true, subscriptionId });
  };

  const cancelSubscription = async () => {
    const { subscriptionId } = cancelModal;
    setCancelModal({ ...cancelModal, visible: false });

    try {
      await api.patch(`/bookings/${subscriptionId}/cancel-subscription`);
      Toast.show({ type: 'success', text1: 'Cancelled', text2: 'Subscription cancelled successfully' });
      fetchSubscriptions();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: err.response?.data?.error || 'Cannot cancel subscription',
      });
    }
  };

  const canCancel = (plan) => {
    console.log("Checking cancellability for plan:", plan);
    if (!['pending', 'confirmed'].includes(plan.status)) return false;
    const created = new Date(plan.createdAt).getTime();
    const now = Date.now();
    return (now - created) <= 10 * 60 * 1000; // 10 minutes
  };

  // ==================== FILTER LOGIC ====================
  const filteredPlans = subscriptions.filter(plan =>
    activeTab === 'pending' ? ['pending', 'confirmed', 'enroute', 'arrived', 'in-progress', 'expired'].includes(plan.status) :
    activeTab === 'completed' ? plan.status === 'completed' :
    plan.status === 'cancelled'
  );

  const percentage = (completed, total) => Math.round((completed / total) * 100);

  // ==================== RENDER ITEM (YOUR EXACT UI) ====================
  const renderPlan = (plan) => {
    const isCancellable = canCancel(plan);

    return (
    <TouchableOpacity
      key={plan?._id}
      style={{
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        marginTop: 16,
      }}
      // onPress={() => router.push(`/subscription-detail?id=${plan?._id}`)}
      onPress={() => router.push({ pathname: "/subscription-detail", 
        params: { 
          bookingData: JSON.stringify({
        bookingId: plan?._id,
        subscriptionId: plan?.monthlySubscription?._id,
        vehicleId: plan?.vehicle,
          })
       } 
      })}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.98)']}
        style={{ padding: 20 }}
      >
        {/* ✅ Expired Banner - Only shows when status is 'Expired' */}
  {plan?.status === 'expired' && (
    <View
      style={{
        marginHorizontal: -20,
        marginTop: -20,
        marginBottom: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#FEF3C7',
        borderBottomWidth: 1,
        borderBottomColor: '#FCD34D',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Ionicons name="alert-circle" size={16} color="#D97706" />
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: '#92400E',
          letterSpacing: 0.3,
        }}
      >
        This subscription has expired
      </Text>
      <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end' }} onPress={() => router.push({ pathname: "/services" })}>
        <Text style={{ fontSize: 11, color: '#B45309', fontWeight: '500' }}>
          Book Now →
        </Text>
      </TouchableOpacity>
    </View>
  )}

  {/* ✅ Cancelled Banner - Only shows when status is 'Expired' */}
  {plan?.status === 'cancelled' && (
    <View
      style={{
        marginHorizontal: -20,
        marginTop: -20,
        marginBottom: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#FECACA',
        borderBottomWidth: 1,
        borderBottomColor: '#FCA5A5',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Ionicons name="alert-circle" size={16} color="#DC2626" />
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: '#DC2626',
          letterSpacing: 0.3,
        }}
      >
        This subscription has been cancelled
      </Text>
      <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end' }} onPress={() => router.push({ pathname: "/services" })}>
        <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '500' }}>
          Book Now →
        </Text>
      </TouchableOpacity>
    </View>
  )}
        {/* Card Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: 6,
            }}>
              {plan?.services[0]?.name}
            </Text>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}>
              <Ionicons name="car-sport" size={16} color="#666" />
              <Text style={{
                fontSize: 14,
                color: '#666',
                fontWeight: '500',
              }}>
                {plan?.vehicleDetails?.make} {plan?.vehicleDetails?.maker_model} ({plan?.vehicleDetails?.year})
              </Text>
            </View>
          </View>

          <View
            style={[
              {
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              },
              plan?.status === 'Pending' && { backgroundColor: '#D1FAE5' },
              plan?.status === 'Completed' && { backgroundColor: '#DBEAFE' },
              plan?.status === 'Cancelled' ? { backgroundColor: '#FECACA' } : { backgroundColor: '#DBEAFE' },
            ]}
          >
            <Text
              style={[
                { fontSize: 12, fontWeight: '600' },
                plan?.status === 'Pending' && { color: '#059669' },
                plan?.status === 'Completed' && { color: '#2563EB' },
                plan?.status === 'Cancelled' ? { color: '#DC2626' } : { color: '#2563EB' },
              ]}
            >
              {plan?.status}
            </Text>
          </View>
        </View>

        {/* Progress Section - YOUR EXACT UI */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        }}>
          {/* Progress Circle */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#FEE2E2',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 4,
            borderColor: '#EF4444',
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#EF4444',
            }}>
              {plan?.monthlySubscription.totalWashes - plan?.monthlySubscription.remainingWashes}/{plan?.monthlySubscription.totalWashes}
            </Text>
            <Text style={{
              fontSize: 11,
              color: '#991B1B',
              fontWeight: '500',
            }}>
              Washes
            </Text>
          </View>

          {/* Progress Details */}
          <View style={{ flex: 1 }}>
            <View style={{
              height: 8,
              backgroundColor: '#F3F4F6',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 8,
            }}>
              <View
                style={{
                  height: '100%',
                  backgroundColor: '#EF4444',
                  borderRadius: 4,
                  width: `${percentage(plan?.monthlySubscription.totalWashes - plan?.monthlySubscription.remainingWashes, plan?.monthlySubscription.totalWashes || 10)}%`,
                }}
              />
            </View>

            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: '#1F2937',
              marginBottom: 12,
            }}>
              {percentage(plan?.monthlySubscription.totalWashes - plan?.monthlySubscription.remainingWashes, plan?.monthlySubscription.totalWashes)}% Complete
            </Text>

            <View style={{
              flexDirection: 'row',
              gap: 16,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}>
                <Ionicons name="calendar-outline" size={14} color="#999" />
                <Text style={{ fontSize: 13, color: '#666' }}>
                  {plan?.monthlySubscription.startDate ? new Date(plan?.monthlySubscription.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' • ' + plan?.scheduledTime : 'Plan Ended'}
                </Text>
              </View>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}>
                <Ionicons name="wallet-outline" size={14} color="#999" />
                <Text style={{ fontSize: 13, color: '#666' }}>
                  ₹{plan?.pricing.total || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>

          <View style={{ marginLeft: 'auto' }}>
            {['pending', 'confirmed'].includes(plan.status) && (
              <TouchableOpacity
                onPress={() => confirmCancel(plan._id)}
                disabled={!isCancellable}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.pill,
                  backgroundColor: isCancellable ? '#EF4444' : '#E5E7EB',
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: font.md }}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
    )
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header - YOUR EXACT UI */}
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
          Subscription Plans
        </Text>
      </View>

      {/* Filter Tabs - YOUR EXACT UI */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 24,
      }}>
        {[
          { key: 'pending', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={{ paddingVertical: 12, position: 'relative' }}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },
              activeTab === tab.key && { color: '#EF4444' },
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && (
              <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                backgroundColor: '#EF4444',
                borderRadius: 2,
              }} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content with Real Data */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
            Loading your plans...
          </Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Ionicons name="cloud-offline-outline" size={80} color="#9CA3AF" />
          <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 24 }}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={{ marginTop: 24, backgroundColor: '#EF4444', padding: 14, borderRadius: 12 }}>
            <Text style={{ color: '#FFF', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EF4444']} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredPlans.length > 0 ? (
            filteredPlans.map(renderPlan)
          ) : (
            /* Your exact empty state */
            <View style={{
              alignItems: 'center',
              paddingTop: 80,
              paddingHorizontal: 32,
            }}>
              <View style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: '#FEE2E2',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}>
                <MaterialCommunityIcons name="car-wash" size={64} color="#EF4444" />
              </View>

              <Text style={{
                fontSize: 22,
                fontWeight: '700',
                color: '#1F2937',
                marginBottom: 12,
              }}>
                No {activeTab.toLowerCase()} plans yet
              </Text>

              <Text style={{
                fontSize: 15,
                color: '#6B7280',
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: 32,
              }}>
                Subscribe to a monthly plan and enjoy hassle-free car care
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: '#EF4444',
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 12,
                }}
                onPress={() => router.push({ pathname: "/services" })}
              >
                <Text style={{
                  color: '#FFF',
                  fontSize: 16,
                  fontWeight: '700',
                }}>
                  Subscribe Now
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
                onPress={() => setCancelModal({ visible: false, subscriptionId: null })}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F3F4F6' }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: '#374151' }}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cancelSubscription}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#EF4444' }}
              >
                <Text style={{ textAlign: 'center', fontWeight: '600', color: '#FFF' }}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}