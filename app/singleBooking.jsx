// app/singleBooking.jsx
import api from "@/services/api";
import { connectSocket } from "@/services/socket"; // Your socket service
import {
  Entypo,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { font, icon, radius, spacing } from '@/services/ui';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  Linking,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const STATUS_STEPS = [
  { key: "confirmed", title: "Order Confirmed", icon: "checkmark-circle" },
  { key: "enroute", title: "Partner On The Way", icon: "car-sport" },
  { key: "arrived", title: "Partner Arrived", icon: "location" },
  { key: "in-progress", title: "Service Started", icon: "water" },
  { key: "completed", title: "Service Completed", icon: "star" },
];

export default function SingleBookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchBooking = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
      setError("");
    }
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res.data);
      setError("");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load booking";
      setError(msg);
      Toast.show({ type: "error", text1: "Error", text2: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  console.log("Booking data:", booking);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBooking(true);
  }, [id]);

  // Socket Connection
  useEffect(() => {
    fetchBooking();
    let cleanup = () => {};

    const setupSocket = async () => {
      const currentSocket = await connectSocket(); // ← Wait for connection!
      if (!currentSocket) {
        console.log("Socket failed to connect");
        return;
      }

      currentSocket.emit("joinBooking", id);

      const handleStatusUpdate = (data) => {
        console.log("handleStatusUpdate called with data:", data);
        if (data.bookingId === id || data._id === id) {
          setBooking((prev) => ({
            ...prev,
            ...data,
            status: data.status,
          }));
          onRefresh();
          Toast.show({
            type: "success",
            text1: "Status Updated",
            text2:
              STATUS_STEPS.find((s) => s.key === data.status)?.title ||
              "Booking updated",
          });
        }
      };

      currentSocket.on("booking.status.updated", handleStatusUpdate);

      cleanup = () => {
        currentSocket.off("booking.status.updated", handleStatusUpdate);
      };
    };

    setupSocket();

    return () => cleanup();
  }, [id]);

  const currentStepIndex = booking
    ? STATUS_STEPS.findIndex((step) => step.key === booking.status)
    : -1;

  if (loading && !refreshing) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: insets.bottom,
        }}
      >
        <ActivityIndicator size="large" color="#cc2e2e" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
          Loading your booking...
        </Text>
      </SafeAreaView>
    );
  }

  if (error && !booking) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
          paddingBottom: insets.bottom,
        }}
      >
        <Ionicons name="cloud-offline" size={80} color="#94A3B8" />
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#1E293B",
            marginTop: 20,
          }}
        >
          Connection Lost
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#64748B",
            textAlign: "center",
            marginTop: 8,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={{
            marginTop: 24,
            backgroundColor: "#cc2e2e",
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 30,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F8FAFC",
        paddingBottom: insets.bottom,
      }}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 18,
          backgroundColor: "#FFF",
          borderBottomWidth: 1,
          borderBottomColor: "#E2E8F0",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1A202C" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: "#1A202C",
            marginLeft: 20,
            flex: 1,
          }}
        >
          Booking Status
        </Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#cc2e2e"]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Booking ID & Date */}
        <View style={{ backgroundColor: "#FFF", padding: 10 }}>
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#cc2e2e" }}>
            #{booking?.bookingId || id}
          </Text>
          <Text style={{ fontSize: 15, color: "#64748B", marginTop: 4 }}>
            {new Date(booking?.scheduledDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            at {booking.scheduledTime}
          </Text>
        </View>

        {/* Pending Status Banner */}
        {booking?.status === "pending" && (
          <View
            style={{
              backgroundColor: "#fef4e8ff",
              margin: 16,
              padding: 16,
              borderRadius: 12,
              flexDirection: "row",
            }}
          >
            <MaterialIcons name="pending-actions" size={28} color="#F97316" />
            <Text
              style={{ marginLeft: 12, fontWeight: "700", color: "#f97416ff" }}
            >
              Service partner will be assigned soon!
            </Text>
          </View>
        )}

        {/* Expired Status Banner */}
        {booking?.status === "expired" && (
          <View
            style={{
              backgroundColor: "#fff0f0ff",
              margin: 16,
              padding: 16,
              borderRadius: 12,
              flexDirection: "row",
            }}
          >
            <Entypo name="circle-with-cross" size={28} color="#f91616ff" />
            <Text
              style={{ marginLeft: 12, fontWeight: "700", color: "#f91616ff" }}
            >
              Your booking is expired!
            </Text>
          </View>
        )}

        {/* Timeline */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 32 }}>
          {STATUS_STEPS.map((step, index) => {
            const isActive = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <View
                key={step.key}
                style={{ flexDirection: "row", marginBottom: 8 }}
              >
                {/* Left: Circle + Line */}
                <View style={{ alignItems: "center", marginRight: 20 }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 28,
                      backgroundColor: isActive ? "#cc2e2e" : "#E5E7EB",
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: isCurrent ? 4 : 0,
                      borderColor: "#991B1B",
                    }}
                  >
                    <Ionicons
                      name={step.icon}
                      size={18}
                      color={isActive ? "#FFF" : "#9CA3A8"}
                    />
                  </View>
                  {index < STATUS_STEPS.length - 1 && (
                    <View
                      style={{
                        width: 2,
                        height: 40,
                        backgroundColor:
                          index < currentStepIndex ? "#cc2e2e" : "#E5E7EB",
                        marginTop: 8,
                      }}
                    />
                  )}
                </View>

                {/* Right: Text */}
                <View
                  style={{
                    flex: 1,
                    paddingTop: 2,
                    justifyContent: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isCurrent ? "800" : "600",
                      color: isActive ? "#1A202C" : "#9CA3A8",
                    }}
                  >
                    {step.title}
                  </Text>
                  {isCurrent && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#cc2e2e",
                        marginTop: 4,
                        fontWeight: "600",
                      }}
                    >
                      Happening now
                    </Text>
                  )}
                  {index === currentStepIndex + 1 && (
                    <Text
                      style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}
                    >
                      Next step
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Partner */}
        {booking?.partner?._id && (
        <View style={{ backgroundColor: "#FFFFFF", marginHorizontal: 2, marginTop: 16, padding: 16, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2}}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Service Partner</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
              <MaterialIcons name="person-4" size={32} color="#cc2e2e" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 16 }}>{booking.partner?.name || 'N/A'}</Text>
              <Text>{booking.partner?.phone || 'N/A'}</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${booking.partner.phone}`)}>
              <Ionicons name="call" size={28} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>
        )}

        {/* Service Summary */}
        <View style={{ backgroundColor: "#FFFFFF", marginHorizontal: 2, marginTop: 16, padding: 16, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2}}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: "#1A202C",
              marginBottom: 16,
            }}
          >
            Service Details
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <Image
              source={{
                uri:
                  booking?.services?.[0]?.serviceId?.imageUrl ||
                  "https://via.placeholder.com/80",
              }}
              style={{ width: 80, height: 80, borderRadius: 16 }}
            />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "700" }}>
                {booking?.services?.[0]?.serviceId?.name}
              </Text>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#505154ff" }}
              >
                {booking?.services?.[0]?.serviceId?.description}
              </Text>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "rgb(0, 0, 0)" }}
              >
                Duration: {booking?.services?.[0]?.durationMinutes} minutes
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "900",
                  color: "#cc2e2e",
                  marginTop: 4,
                }}
              >
                ₹{booking?.pricing?.total}
              </Text>
            </View>
          </View>

          {booking?.status === "completed" && (
            <View
              style={{
                backgroundColor: "#ECFDF5",
                padding: 20,
                borderRadius: 16,
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: "#065F46",
                  marginTop: 12,
                }}
              >
                Service Completed Successfully!
              </Text>
            </View>
          )}
        </View>

        {/* Booking Details */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            marginHorizontal: 2,
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
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
            Booking Details
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
                  backgroundColor: "#EF4444",
                  borderRadius: 8,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}
                >
                  {new Date(booking.scheduledDate).getDate()}
                </Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}>
                Scheduled Date
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  lineHeight: 22,
                }}
              >
                {new Date(booking.scheduledDate).toLocaleDateString("en-GB")}
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
                  backgroundColor: "#F3F4F6",
                  borderRadius: 24,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="time-outline" size={24} color="#9CA3AF" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}>
                Scheduled Time
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  lineHeight: 22,
                }}
              >
                {booking.scheduledTime}
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
                  backgroundColor: "#EF4444",
                  borderRadius: 24,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="location" size={20} color="#FFFFFF" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}>
                Booking Address
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  lineHeight: 22,
                }}
              >
                {booking.serviceLocation?.address || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Details */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            overflow: 'hidden',
            marginHorizontal: 2,
            marginTop: 16,
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
                <Text>₹{booking?.pricing?.servicePrice}.00</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text>GST (18%)</Text>
                <Text>₹{booking?.pricing?.tax}.00</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text>Convenience Fee</Text>
                <Text>₹{booking?.pricing?.charges}.00</Text>
              </View>
              {booking?.pricing?.discount > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: "#16a34a" }}>Discount</Text>
                  <Text style={{ color: "#16a34a", fontWeight: "700" }}>
                    -₹{booking?.pricing?.discount}
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
                  ₹{booking?.pricing?.total}.00
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
                {booking?.paymentType === "pay online"
                  ? "Online Payment "
                  : "Offline Payment "}
                {booking?.paymentSplit?.status === 'completed' && (<Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#F97316",
                  marginBottom: 2,
                }}
              >(Paid)</Text>)}
              </Text>
              <Text style={{ fontSize: 13, color: "#9CA3AF" }}>
                {booking?.paymentType === "pay online"
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
                {booking?.paymentType === "pay online" ? "ONLINE" : "OFFLINE"}
              </Text>
            </View>
            {booking?.paymentType === "pay online" && (
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

            {booking?.paymentSplit?.status === 'completed' && (
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
        This service payment has paid.
      </Text>
    </View>
  )}
        </View>

        {/* ── Payment history (completed) ───────────────────────── */}
          {booking?.paymentSplit && booking?.paymentSplit?.status === 'completed' && (
            <View style={{ backgroundColor: '#fff', marginTop: 16, marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <MaterialIcons name="history" size={24} color="#1976D2" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#000', marginLeft: 8 }}>Payment History</Text>
              </View>
              {[
                { label: 'Booking Payment Online', amount: booking?.paymentSplit?.onlineAmount, date: booking?.paymentSplit?.onlinePaidAt,       note: 'System message: Total amount paid online by customer' },
                { label: 'Booking Payment Cash',   amount: booking?.paymentSplit?.cashAmount,   date: booking?.paymentSplit?.cashCollectedAt,    note: 'Cash payment paid' },
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

        {/* Create one Service Verification OTP section  */}
        {booking?.source !== "admin" && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              marginHorizontal: 2,
              marginTop: 16,
              padding: 16,
              borderRadius: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
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
              Service Verification OTP
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <View style={{ marginRight: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: "#EF4444",
                    borderRadius: 24,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <MaterialIcons name="verified" size={24} color="#F3F4F6" />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  Your Verification OTP
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: 70,
                  borderRadius: 12,
                  backgroundColor: "#E8F5E9",
                  borderWidth: 2,
                  borderColor: "#4CAF50",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 32, fontWeight: "700", color: "#2E7D32" }}
                >
                  {booking?.otp}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      {/* CTA */}
      <View style={{ padding: 10 }}>
        {booking?.status === "completed" ? (
          <TouchableOpacity
            style={{
              backgroundColor: "#cc2e2e",
              paddingVertical: 18,
              borderRadius: 30,
              alignItems: "center",
            }}
            onPress={() => router.push("/(tabs)/home")}
          >
            <Text style={{ color: "#FFF", fontWeight: "800", fontSize: 18 }}>
              Book Another Service
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{
              backgroundColor: "#1E293B",
              paddingVertical: 18,
              borderRadius: 30,
              alignItems: "center",
              opacity: 0.8,
            }}
            onPress={() => router.push("/(tabs)/home")}
          >
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>
              Go to Home
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Toast />
    </SafeAreaView>
  );
}
