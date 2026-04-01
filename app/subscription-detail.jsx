// SubscriptionDetailScreen.jsx
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { font, icon, radius, spacing } from '@/services/ui';
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "../services/api";

export default function SubscriptionDetailScreen() {
  const router = useRouter();
  const { bookingData } = useLocalSearchParams();
  const bookingAndSubscriptionId = bookingData ? JSON.parse(bookingData) : null;

  const [subscription, setSubscription] = useState(null);
  const [subscriptionBooking, setSubscriptionBooking] = useState(null);
  const [adminBookingVehicle, setAdminBookingVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Active Slots");

  // ==================== FETCH SUBSCRIPTION DETAIL ====================
  const fetchSubscription = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    if (isRefresh) setRefreshing(true);

    try {
      const res = await api.get(
        `/bookings/subscription/${bookingAndSubscriptionId?.subscriptionId}`,
      );
      setSubscription(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load subscription";
      Toast.show({ type: "error", text1: "Error", text2: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==================== FETCH SUBSCRIPTION BOOKING ====================
  const fetchSubscriptionBooking = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    if (isRefresh) setRefreshing(true);

    try {
      const res = await api.get(
        `/bookings/${bookingAndSubscriptionId?.bookingId}`,
      );
      const data = res.data;
      setSubscriptionBooking(data);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load booking";
      setSubscriptionBooking(null);
      Toast.show({ type: "error", text1: "Error", text2: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await api.get(
          `/partners/vehicle/${bookingAndSubscriptionId.vehicleId}`,
        );
        console.log("vehicle res: ", res);
        setAdminBookingVehicle(res.data.vehicle);
      } catch (err) {
        Toast.show({ type: "error", text1: "Failed to load booking vehicle" });
      }
    };

    if (
      subscriptionBooking?.source === "admin" &&
      bookingAndSubscriptionId.vehicleId
    ) {
      fetchVehicle();
    }
  }, [
    subscriptionBooking?.vehicle,
    subscriptionBooking?.source,
    bookingAndSubscriptionId.vehicleId,
  ]);

  // Load on mount
  useEffect(() => {
    if (bookingAndSubscriptionId?.subscriptionId) fetchSubscription();

    if (bookingAndSubscriptionId?.bookingId) fetchSubscriptionBooking();
  }, [
    bookingAndSubscriptionId?.subscriptionId,
    bookingAndSubscriptionId?.bookingId,
  ]);

  const onRefresh = useCallback(() => {
    fetchSubscription(true);
    fetchSubscriptionBooking(true);
  }, [
    bookingAndSubscriptionId?.subscriptionId,
    bookingAndSubscriptionId?.bookingId,
  ]);

  console.log("Subscription Detail:", subscriptionBooking);
  console.log("subscription: ", subscription)

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#F8F9FA",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#EF4444" />
      </SafeAreaView>
    );
  }

  if (!subscription) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Text>Subscription not found</Text>
      </SafeAreaView>
    );
  }

  // Filter & limit to maximum 3 slots per tab (as per your requirement)
  const allSlots = subscription.serviceSlots || [];

  const activeSlots = allSlots
    .filter((s) =>
      ["pending", "confirmed", "enroute", "arrived", "in-progress"].includes(
        s.status,
      ),
    )
    .slice(0, 3);

  const completedSlots = allSlots
    .filter((s) => s.status === "completed")
    .slice(0, 3);

  const rescheduledSlots = allSlots
    .filter((s) => s.status === "rescheduled" || s.isRescheduled === true)
    .slice(0, 3);

  const currentSlots =
    activeTab === "Active Slots"
      ? activeSlots
      : activeTab === "Completed Slots"
        ? completedSlots
        : rescheduledSlots;

  const completedWashes = subscription.totalWashes - subscription.remainingWashes;
  const totalWashes = subscription.totalWashes;
  const totalPendingSlots = allSlots.filter((s) =>
    ["pending", "confirmed", "enroute", "arrived", "rescheduled"].includes(
      s.status,
    ),
  );
  const totalInProgressSlots = allSlots.filter((s) =>
    ["in-progress"].includes(s.status),
  );
  const percentage = Math.round((completedWashes / totalWashes) * 100);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F8F9FA" }}
      edges={["top"]}
    >
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
          Subscription Details
        </Text>
      </View>

      <ScrollView
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={["#EF4444"]}
    />
  }
>
  <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 12 }}>

    {/* ── CURRENT PROGRESS CARD ── */}
    <View style={{ borderRadius: 20, overflow: 'hidden' }}>

      {/* ✅ Expired Banner */}
      {subscription?.status === 'expired' && (
        <View style={{
          backgroundColor: '#FEF3C7',
          borderBottomWidth: 1,
          borderBottomColor: '#FCD34D',
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Ionicons name="alert-circle" size={16} color="#D97706" />
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: '#92400E', letterSpacing: 0.2 }}>
            This subscription has expired
          </Text>
          <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end' }} onPress={() => router.push({ pathname: "/services" })}>
          <Text style={{ fontSize: 11, color: '#B45309', fontWeight: '600' }}>
            Renew Now →
          </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ✅ Completed Banner */}
      {subscription?.status === 'completed' && (
        <View style={{
          backgroundColor: '#D1FAE5',
          borderBottomWidth: 1,
          borderBottomColor: '#6EE7B7',
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: '#065F46', letterSpacing: 0.2 }}>
            All washes completed!
          </Text>
          <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end' }} onPress={() => router.push({ pathname: "/services" })}>
          <Text style={{ fontSize: 11, color: '#047857', fontWeight: '600' }}>
            Resubscribe →
          </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ✅ Cancelled Banner */}
      {subscription?.status === 'cancelled' && (
        <View style={{
          backgroundColor: '#FECACA',
          borderBottomWidth: 1,
          borderBottomColor: '#FCA5A5',
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Ionicons name="checkmark-circle" size={16} color="#DC2626" />
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: '#DC2626', letterSpacing: 0.2 }}>
            This subscription has been cancelled
          </Text>
          <TouchableOpacity style={{ flex: 1, alignItems: 'flex-end' }} onPress={() => router.push({ pathname: "/services" })}>
          <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '600' }}>
            Rebooked →
          </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Card Body */}
      <LinearGradient
        colors={
          subscription?.status === 'completed'
            ? ['#059669', '#047857']
            : subscription?.status === 'expired'
            ? ['#92400E', '#78350F']
            : ['#16A34A', '#15803D']
        }
        style={{ padding: 20 }}
      >
        {/* Label */}
        <Text style={{
          fontSize: 11,
          fontWeight: '700',
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: 1.5,
          marginBottom: 10,
        }}>
          CURRENT PROGRESS
        </Text>

        {/* Washes Count */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 42, fontWeight: '800', color: '#FFFFFF', lineHeight: 46 }}>
            {completedWashes} of {totalWashes}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
            Washes Done
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={{
          height: 6,
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <View style={{
            height: '100%',
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            width: `${Math.min((completedWashes / totalWashes) * 100, 100)}%`,
          }} />
        </View>

        {/* Progress % label */}
        <Text style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)',
          marginTop: 8,
          fontWeight: '500',
        }}>
          {Math.round((completedWashes / totalWashes) * 100)}% complete
        </Text>
      </LinearGradient>
    </View>

    {/* ── SUBSCRIPTION PLAN CARD ── */}
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    }}>
      {/* Label */}
      <Text style={{
        fontSize: 11,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 1.5,
        marginBottom: 8,
      }}>
        SUBSCRIPTION PLAN
      </Text>

      {/* Plan Name */}
      <Text style={{
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
      }}>
        {subscription.service?.name || 'Monthly Subscription'}
      </Text>
      <Text style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#1c222e',
        marginBottom: 4,
      }}>
        ID: #{subscription?.subscriptionId}
      </Text>

      {/* Vehicle */}
      <Text style={{
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 14,
      }}>
        For {subscriptionBooking?.vehicleDetails?.make} {subscriptionBooking?.vehicleDetails?.model}
      </Text>

      {/* Badges */}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {/* Service Type Badge */}
        <View style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor: '#EFF6FF',
          borderWidth: 1,
          borderColor: '#BFDBFE',
        }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#1D4ED8', letterSpacing: 0.5 }}>
            {subscription.service?.name?.toUpperCase() || 'PREMIUM SERVICE'}
          </Text>
        </View>

        {/* Status Badge */}
        <View style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          backgroundColor:
            subscription?.status === 'completed' ? '#D1FAE5' :
            subscription?.status === 'expired'   ? '#FEF3C7' :
            subscription?.status === 'cancelled' ? '#FECACA' : '#D1FAE5',
          borderWidth: 1,
          borderColor:
            subscription?.status === 'completed' ? '#6EE7B7' :
            subscription?.status === 'expired'   ? '#FCD34D' :
            subscription?.status === 'cancelled' ? '#FCA5A5' : '#6EE7B7',
        }}>
          <Text style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.5,
            color:
              subscription?.status === 'completed' ? '#065F46' :
              subscription?.status === 'expired'   ? '#92400E' :
              subscription?.status === 'cancelled' ? '#991B1B' : '#065F46',
          }}>
            {subscription?.status?.toUpperCase() || 'ACTIVE'}
          </Text>
        </View>
      </View>
    </View>

  </View>

        {/* Analytics Cards */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            gap: 12,
            marginTop: 10,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#FFF",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
            onPress={() => router.push({ pathname: "/all-service-slots", 
                params: { 
                  subscriptionData: JSON.stringify({
                  id: bookingAndSubscriptionId?.subscriptionId,
                  subscriptionDetails: subscription,
                  subscriptionBookingDetails: subscriptionBooking,
                  activeTab: "Completed",
                  })
                } 
              })}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#EF4444",
                marginBottom: 4,
              }}
            >
              {completedWashes}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontWeight: "500",
              }}
            >
              Completed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#FFF",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
            onPress={() => router.push({ pathname: "/all-service-slots", 
                params: { 
                  subscriptionData: JSON.stringify({
                  id: bookingAndSubscriptionId?.subscriptionId,
                  subscriptionDetails: subscription,
                  subscriptionBookingDetails: subscriptionBooking,
                  activeTab: "Active",
                  })
                } 
              })}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#EF4444",
                marginBottom: 4,
              }}
            >
              {totalInProgressSlots.length}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontWeight: "500",
              }}
            >
              In Progress
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#FFF",
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
            onPress={() => router.push({ pathname: "/all-service-slots", 
                params: { 
                  subscriptionData: JSON.stringify({
                  id: bookingAndSubscriptionId?.subscriptionId,
                  subscriptionDetails: subscription,
                  subscriptionBookingDetails: subscriptionBooking,
                  activeTab: "Active",
                  })
                } 
              })}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#EF4444",
                marginBottom: 4,
              }}
            >
              {totalPendingSlots.length}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontWeight: "500",
              }}
            >
              Pending
            </Text>
          </TouchableOpacity>
        </View>

        {/* Booking Details */}
        <View style={{ backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Booking Details</Text>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#EF4444', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="car-wash" size={20} color="#FFFFFF" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Service</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>
                {subscriptionBooking?.services[0]?.name || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#F3F4F6', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={24} color="#EF4444" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Service Time</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>{subscriptionBooking?.scheduledTime}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#EF4444', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>{new Date(subscription?.startDate).getDate()}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Service Start Date</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>{new Date(subscription?.startDate).toLocaleDateString('en-GB')}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#EF4444', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>{new Date(subscription?.endDate).getDate()}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Service Last Date</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>{new Date(subscription?.endDate).toLocaleDateString('en-GB')}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#F3F4F6', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="location" size={24} color="#EF4444" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Service Location</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>{subscriptionBooking?.serviceLocation.address}</Text>
            </View>
          </View>
        </View>

        {/* Payment Details */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            overflow: 'hidden',
            marginHorizontal: 16,
            marginTop: 16,
            // padding: 16,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <View style={{ padding: spacing.lg }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Payment Details
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                backgroundColor: "#F0FDF4",
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <FontAwesome name="rupee" size={24} color="#22C55E" />
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#f9f9f9",
                paddingTop: 2,
                borderRadius: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text>Service Price</Text>
                <Text>₹{subscriptionBooking?.pricing?.servicePrice}.00</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text>GST (18%)</Text>
                <Text>₹{subscriptionBooking?.pricing?.tax}.00</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text>Convenience Fee</Text>
                <Text>₹{subscriptionBooking?.pricing?.charges}.00</Text>
              </View>
              {subscriptionBooking?.pricing?.discount > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: "#16a34a" }}>Discount</Text>
                  <Text style={{ color: "#16a34a", fontWeight: "700" }}>
                    -₹{subscriptionBooking?.pricing?.discount}
                  </Text>
                </View>
              )}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: "#eee",
                }}
              >
                <Text style={{ fontWeight: "600" }}>Total Amount</Text>
                <Text style={{ fontWeight: "700", color: "#22C55E" }}>
                  ₹{subscriptionBooking?.pricing?.total}.00
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: "#F0FDF4",
                borderRadius: 24,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <MaterialCommunityIcons
                name="cash-multiple"
                size={24}
                color="#22C55E"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 2,
                }}
              >
                {subscriptionBooking?.paymentType === "pay online"
                  ? "Online Payment "
                  : "Offline Payment "}
                  {subscriptionBooking?.paymentSplit?.status === 'completed' && (<Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#F97316",
                  marginBottom: 2,
                }}
              >(Paid)</Text>)}
              </Text>
              <Text style={{ fontSize: 13, color: "#9CA3AF" }}>
                {subscriptionBooking?.paymentType === "pay online"
                  ? "Your payment completed"
                  : "Pay when service provider arrives"}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#F97316",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  letterSpacing: 0.5,
                }}
              >
                {subscriptionBooking?.paymentType === "pay online"
                  ? "ONLINE"
                  : "OFFLINE"}
              </Text>
            </View>
            {subscriptionBooking?.paymentType === "pay online" && (
              <View
                style={{
                  paddingHorizontal: 1,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Ionicons
                  name="checkmark-done-circle"
                  size={24}
                  color="#F97316"
                />
              </View>
            )}
          </View>
          </View>

          {subscriptionBooking?.paymentSplit?.status === 'completed' && (
    <View
      style={{
        paddingVertical: 10,
        paddingHorizontal: spacing.lg,
        backgroundColor: '#D1FAE5',
        borderTopWidth: 1,
        borderTopColor: '#6EE7B7',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Ionicons name="checkmark-done-circle" size={18} color="#065F46" />
      <Text
        style={{
          fontSize: font.sm,
          fontWeight: '700',
          color: '#065F46',
          letterSpacing: 0.3,
        }}
      >
        This subscription payment has paid.
      </Text>
    </View>
  )}
        </View>

      {/* ── Payment history (completed) ───────────────────────── */}
          {subscriptionBooking?.paymentSplit && subscriptionBooking?.paymentSplit?.status === 'completed' && (
            <View style={{ backgroundColor: '#fff', marginTop: 16, marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialIcons name="history" size={24} color="#1976D2" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#000', marginLeft: 8 }}>Payment History</Text>
              </View>
              {[
                { label: 'Booking Payment Online', amount: subscriptionBooking?.paymentSplit?.onlineAmount, date: subscriptionBooking?.paymentSplit?.onlinePaidAt,       note: 'System message: Total amount paid online by customer' },
                { label: 'Booking Payment Cash',   amount: subscriptionBooking?.paymentSplit?.cashAmount,   date: subscriptionBooking?.paymentSplit?.cashCollectedAt,    note: 'Cash payment paid' },
              ].map(({ label, amount, date, note }) => (
                <View key={label} style={{ flexDirection: 'row', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <MaterialIcons name="account-balance-wallet" size={24} color="#2E7D32" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>{label}</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#2E7D32' }}>₹{amount}.00</Text>
                    </View>
                    {date && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, color: '#999', flex: 1 }}>
                          {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' • '}
                          {new Date(date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </Text>
                        <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', color: '#2E7D32' }}>PAID</Text>
                        </View>
                      </View>
                    )}
                    <Text style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>{note}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

        {/* Vehicle Details */}
        <View
          style={{
            backgroundColor: "#fff",
            marginHorizontal: 16,
            marginTop: 8,
            padding: 16,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Vehicle Details
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <View style={{ marginRight: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#fef1f1ff",
                  borderRadius: 24,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="car-hatchback"
                  size={24}
                  color="#EF4444"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}>
                Company Name
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  lineHeight: 22,
                }}
              >
                {subscriptionBooking?.source === "admin"
                  ? adminBookingVehicle?.make || "N/A"
                  : subscriptionBooking?.vehicleDetails?.make || "N/A"}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <View style={{ marginRight: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#fef1f1ff",
                  borderRadius: 24,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="car-select"
                  size={24}
                  color="#EF4444"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}>
                Model
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  lineHeight: 22,
                }}
              >
                {subscriptionBooking?.source === "admin"
                  ? adminBookingVehicle?.model || "N/A"
                  : subscriptionBooking?.vehicleDetails?.model || "N/A"}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <View style={{ marginRight: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#fef1f1ff",
                  borderRadius: 24,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialIcons name="segment" size={24} color="#EF4444" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}>
                Segment
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  lineHeight: 22,
                }}
              >
                {subscriptionBooking?.source === "admin"
                  ? adminBookingVehicle?.type || "N/A"
                  : subscriptionBooking?.vehicleDetails?.type || "N/A"}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <View style={{ marginRight: 12 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#fef1f1ff",
                  borderRadius: 24,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MaterialIcons name="numbers" size={24} color="#EF4444" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}>
                RC Number
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  lineHeight: 22,
                }}
              >
                {subscriptionBooking?.source === "admin"
                  ? adminBookingVehicle?.rc_number || "N/A"
                  : subscriptionBooking?.vehicleDetails?.rc_number || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Assigned Partner */}
<View style={{ paddingHorizontal: 16, marginTop: 24 }}>
  <Text
    style={{
      fontSize: 18,
      fontWeight: "700",
      color: "#1F2937",
      marginBottom: 12,
    }}
  >
    Assigned Partner
  </Text>

  {subscription?.partner ? (
    // ✅ Existing Partner Card — unchanged
    <View
      style={{
        backgroundColor: "#FFF",
        padding: 20,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#FEE2E2",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="person" size={28} color="#EF4444" />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#1F2937",
            marginBottom: 4,
          }}
        >
          {subscription?.partner?.name}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Ionicons name="call" size={16} color="#EF4444" />
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#6B7280" }}>
            {subscription?.partner?.phone}
          </Text>
        </View>
      </View>
    </View>
  ) : (
    // ✅ No Partner Assigned — Highlighted Message
    <View
      style={{
        backgroundColor: "#FFFBEB",
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: "#FCD34D",
        borderStyle: "dashed",
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: "#FEF3C7",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="person-outline" size={26} color="#D97706" />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: "#92400E",
            marginBottom: 4,
          }}
        >
          No Partner Assigned Yet
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#B45309",
            fontWeight: "500",
            lineHeight: 18,
          }}
        >
          We will assign a partner to your booking soon!
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#FEF3C7",
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 20,
        }}
      >
        <Ionicons name="time-outline" size={20} color="#D97706" />
      </View>
    </View>
  )}
</View>

        {/* View All Slots Button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#EF4444",
            marginHorizontal: 16,
            marginTop: 24,
            padding: 18,
            borderRadius: 12,
            alignItems: "center",
          }}
          // onPress={() =>
          //   router.push(
          //     `/all-service-slots?id=${bookingAndSubscriptionId?.subscriptionId}`,
          //   )
          // }
          onPress={() => router.push({ pathname: "/all-service-slots", 
                params: { 
                  subscriptionData: JSON.stringify({
                  id: bookingAndSubscriptionId?.subscriptionId,
                  subscriptionDetails: subscription,
                  subscriptionBookingDetails: subscriptionBooking,
                  })
                } 
              })}
        >
          <Text
            style={{
              color: "#FFF",
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            View All Service Slots
          </Text>
        </TouchableOpacity>

        {/* Service Slots Tabs */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            gap: 12,
            marginTop: 24,
          }}
        >
          {["Active Slots", "Completed Slots", "Rescheduled"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                {
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderBottomWidth: 2,
                  borderBottomColor: "transparent",
                },
                activeTab === tab && { borderBottomColor: "#EF4444" },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  {
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#9CA3AF",
                  },
                  activeTab === tab && { color: "#EF4444" },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Slots List */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {currentSlots.length > 0 ? (
            currentSlots.map((slot) => (
              <TouchableOpacity
                key={slot._id}
                style={{
                  backgroundColor: "#FFF",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                // onPress={() => router.push(`/slot-detail?id=${slot._id}`)}
                onPress={() => router.push({ pathname: "/slot-detail", 
                params: { 
                  subscriptionData: JSON.stringify({
                  id: slot._id,
                  subscriptionDetails: subscription,
                  subscriptionBookingDetails: subscriptionBooking,
                  })
                } 
              })}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: "#EF4444",
                      marginRight: 12,
                      marginTop: 4,
                    }}
                  />

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: "#1F2937",
                        marginBottom: 4,
                      }}
                    >
                      {new Date(slot?.scheduledDate).toLocaleDateString(
                        "en-IN",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}{" "}
                      •{" "}
                      {slot.timeSlot === "early-morning"
                        ? "6-9 AM"
                        : slot.timeSlot === "late-morning"
                          ? "10-12 AM"
                          : slot.timeSlot === "afternoon"
                            ? "1-3 PM"
                            : "4-6 PM"}
                    </Text>

                    <Text
                      style={{
                        fontSize: 13,
                        color: "#6B7280",
                        marginBottom: 2,
                      }}
                    >
                      {slot.serviceType}
                    </Text>

                    {subscription.partner && (
                      <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
                        Partner: {subscription.partner.name}
                      </Text>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    {
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                    },
                    slot.status === "Completed"
                      ? { backgroundColor: "#DBEAFE" }
                      : slot.status === "Rescheduled"
                        ? { backgroundColor: "#FEF3C7" }
                        : { backgroundColor: "#D1FAE5" },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: "#059669",
                    }}
                  >
                    {slot.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text
              style={{ textAlign: "center", color: "#9CA3AF", padding: 20 }}
            >
              No slots in this category yet
            </Text>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
