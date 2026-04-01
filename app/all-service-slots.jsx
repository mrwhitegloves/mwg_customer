// AllServiceSlotsScreen.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
 RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { font, icon, radius, spacing } from '@/services/ui';
import { Ionicons, MaterialCommunityIcons, Fontisto, FontAwesome6 } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "../services/api";
import Toast from "react-native-toast-message";


export default function AllServiceSlotsScreen() {
  const router = useRouter();
  const { subscriptionData } = useLocalSearchParams(); 
  const bookingAndSubscriptionIdData = subscriptionData ? JSON.parse(subscriptionData) : null;
  console.log('Received subscriptionData:', bookingAndSubscriptionIdData);

  const [activeTab, setActiveTab] = useState("Active");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ==================== FETCH ALL SLOTS ====================
  const fetchSlots = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    if (isRefresh) setRefreshing(true);
    setError("");

    try {
      const res = await api.get(`/bookings/subscription/${bookingAndSubscriptionIdData?.id}/slots`); // ← Corrected path
      setSlots(res.data || []);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load service slots";
      setError(msg);
      setSlots([]);
      Toast.show({ type: "error", text1: "Error", text2: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (bookingAndSubscriptionIdData?.activeTab) {
      setActiveTab(bookingAndSubscriptionIdData.activeTab);
    }

    if (bookingAndSubscriptionIdData?.id) fetchSlots();
  }, [bookingAndSubscriptionIdData?.id]);

  const onRefresh = useCallback(() => {
    fetchSlots(true);
  }, [bookingAndSubscriptionIdData?.id]);

  // ==================== FILTER LOGIC ====================
  const filteredSlots = slots.filter((slot) =>
    activeTab === "Active"
      ? ["pending", "confirmed", "in-progress"].includes(slot.status)
      : activeTab === "Completed"
        ? slot.status === "completed"
        : slot.status === "rescheduled" || slot.isRescheduled === true,
  );

  // ==================== SMART DATE DISPLAY ====================
  const getSmartDate = (dateStr) => {
  const today = new Date();

  // Convert "18 Mar 2026" → proper Date
  const [day, monthStr, year] = dateStr.split(" ");

  const months = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3,
    May: 4, Jun: 5, Jul: 6, Aug: 7,
    Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  const slotDate = new Date(year, months[monthStr], day);

  console.log("Parsed Slot Date:", slotDate);

  // Remove time part (important fix)
  today.setHours(0, 0, 0, 0);
  slotDate.setHours(0, 0, 0, 0);

  const diffTime = slotDate - today;
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 0) return "Today Service";
  if (diffDays === 1) return "Tomorrow Service";

  return dateStr;
};

  // ==================== PULSING DOT FOR IN-PROGRESS ====================
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  React.useEffect(() => {
    startPulse();
  }, []);

  const renderDot = (status) => {
    if (status === "in-progress") {
      return (
        <Animated.View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#1bb23c", // bright green
            transform: [{ scale: pulseAnim }],
          }}
        />
      );
    }
    return (
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: status === "pending" ? "#FBBF24" : status === "completed" ? "#1bb23c" : "#EF4444",
          marginRight: 12,
          marginTop: 4,
        }}
      />
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F8F9FA" }}
      edges={["top"]}
    >
      {/* Header - YOUR EXACT UI */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          backgroundColor: "#FFF",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#1F2937",
          }}
        >
          All Service Slots
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Tabs - YOUR EXACT UI */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#FFF",
          paddingHorizontal: 16,
          paddingBottom: 8,
          gap: 24,
        }}
      >
        {["Active", "Completed", "Rescheduled"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={{ paddingVertical: 12, position: "relative" }}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                { fontSize: 15, fontWeight: "600", color: "#9CA3AF" },
                activeTab === tab && { color: "#EF4444" },
              ]}
            >
              {tab}
            </Text>

            {activeTab === tab && (
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  backgroundColor: "#EF4444",
                  borderRadius: 2,
                }}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content with Real Logic */}
      {loading && !refreshing ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={{ marginTop: 12, color: "#6B7280" }}>
            Loading service slots...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#EF4444"]}
            />
          }
        >
          {filteredSlots.length > 0 ? (
            filteredSlots.map((slot) => (
              <TouchableOpacity
                key={slot._id || slot.id}
                style={{
                  backgroundColor: "#FFF",
                  overflow: 'hidden',
                  marginHorizontal: 16,
                  marginBottom: 12,
                  marginTop: 12,
                  borderRadius: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                // onPress={() => router.push(`/slot-detail?id=${slot._id}`)}
                onPress={() => router.push({ pathname: "/slot-detail", 
                params: { 
                  subscriptionData: JSON.stringify({
                  id: slot._id,
                  subscriptionDetails: bookingAndSubscriptionIdData.subscriptionDetails,
                  subscriptionBookingDetails: bookingAndSubscriptionIdData.subscriptionBookingDetails,
                  })
                } 
              })}
                activeOpacity={0.7}
              >
                {slot?.isRescheduled === true && (
                    <View
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: spacing.lg,
                        backgroundColor: '#FEF3C7',
                        borderBottomWidth: 1,
                        borderBottomColor: '#FCD34D',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <FontAwesome6 name="clock-rotate-left" size={18} color="#D97706" />
                      <Text
                        style={{
                          fontSize: font.sm,
                          fontWeight: '700',
                          color: '#92400E',
                          letterSpacing: 0.3,
                        }}
                      >
                        This service slot has rescheduled.
                      </Text>
                    </View>
                  )}

                <View style={{ padding: spacing.lg }}>
                {/* Slot Header - YOUR EXACT UI + Enhanced Dot */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {renderDot(slot.status)}
                    <View>
                      <Text
                        style={[
                          {
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#d00c0c",
                        },
                        slot.status === "completed" ? {
                        color: "#1bb23c",
                      } : {
                        color: "#d00c0c",
                      },
                      ]}
                      >
                        Job ID: #{slot.jobId}
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: "#1F2937",
                          marginBottom: 4,
                        }}
                      >
                        {getSmartDate(slot.date)}{" "}•{" "}{slot.time}
                      </Text>

                    </View>
                  </View>

                  <View
                    style={[
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                      },
                      slot.status === "completed" && {
                        backgroundColor: "#aaffbd",
                      },
                      slot.status === "in-progress" && {
                        backgroundColor: "#D1FAE5",
                      },
                      slot.status === "pending" && {
                        backgroundColor: "#FEF3C7",
                      },
                      slot.status === "enroute" && {
                        backgroundColor: "#fec7c7",
                      },
                      slot.status === "arrived" && {
                        backgroundColor: "#c7fef1",
                      },
                      slot.status === "rescheduled" && {
                        backgroundColor: "#FCE7F3",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#1F2937",
                      }}
                    >
                      {slot.status}
                    </Text>
                  </View>
                </View>

                {/* Slot Body - YOUR EXACT UI */}
                <View style={{ gap: 8 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="car-wash"
                      size={18}
                      color="#6B7280"
                    />
                    <Text style={{ fontSize: 14, color: "#6B7280" }}>
                      {slot.type}
                    </Text>
                  </View>

                  {slot.partner && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Fontisto
                        name="person"
                        size={18}
                        color="#6B7280"
                      />
                      <Text style={{ fontSize: 14, color: "#6B7280" }}>
                        Partner: {slot.partner}
                      </Text>
                    </View>
                  )}

                  {slot.original && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 4,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: "#F3F4F6",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#EF4444",
                          fontWeight: "500",
                        }}
                      >
                        Original: {slot.original}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color="#EF4444"
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#EF4444",
                          fontWeight: "500",
                        }}
                      >
                        New: {slot.date}
                      </Text>
                    </View>
                  )}
                </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            /* Beautiful Empty State */
            <View
              style={{
                alignItems: "center",
                paddingTop: 100,
                paddingHorizontal: 32,
              }}
            >
              <MaterialCommunityIcons
                name="calendar-blank"
                size={80}
                color="#D1D5DB"
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#6B7280",
                  marginTop: 20,
                }}
              >
                No slots in this category yet
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: "#9CA3AF",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                {activeTab === "Active"
                  ? "All slots are completed or rescheduled"
                  : "Nothing here yet"}
              </Text>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
