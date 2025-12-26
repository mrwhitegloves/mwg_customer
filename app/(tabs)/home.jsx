// app/home.jsx
import api from "@/services/api";
import { connectSocket } from "@/services/socket";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchServices,
  selectServices,
  selectServicesLoading,
} from "../../store/slices/serviceSlice";
import { vehicleUpdated } from "../../store/slices/vehicleSlice";

const banners = [
  { id: 1, image: require("../../assets/images/banner1.png") },
  { id: 2, image: require("../../assets/images/banner2.png") },
  { id: 3, image: require("../../assets/images/banner3.png") },
  { id: 4, image: require("../../assets/images/banner4.png") },
];

// ────── REUSABLE STYLES ──────
const inputContainer = {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F5F5F5",
  borderRadius: 12,
  paddingHorizontal: 16,
  marginBottom: 16,
  height: 56,
};

const inputStyle = {
  flex: 1,
  fontSize: 16,
  color: "#333",
};

const submitButton = {
  backgroundColor: "#22c55e",
  padding: 16,
  borderRadius: 12,
  alignItems: "center",
  marginTop: 10,
};

const submitText = {
  color: "#fff",
  fontWeight: "600",
  fontSize: 16,
};

const Home = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const services = useAppSelector(selectServices);
  const servicesLoading = useAppSelector(selectServicesLoading);
  const { user, token } = useAppSelector((state) => state.auth);

  const [vehicleModal, setVehicleModal] = useState(false);
  const [locationModal, setLocationModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // ────── VEHICLE FORM STATE ──────
  const [rcNumber, setRcNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animation
  const fadeAnim = new Animated.Value(0);

  // ────── FETCH USER WITH ERROR HANDLING & REFRESH ──────
  const fetchUser = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoadingUser(true);
    setUserError("");
    try {
      const res = await api.get("/auth/me");
      setCurrentUser(res.data.user || null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load profile";
      setUserError(msg);
      Toast.show({ type: "error", text1: "Error", text2: msg });
    } finally {
      setLoadingUser(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  // ────── INITIAL LOAD + PULL TO REFRESH ──────
  useEffect(() => {
    if (token) {
      fetchUser();
      if (services.length === 0) dispatch(fetchServices());
    }
  }, [token, dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUser(true);
    dispatch(fetchServices());
  }, [fetchUser, dispatch]);

  // ────── SOCKET CONNECTION (unchanged) ──────
  useEffect(() => {
    const init = async () => {
      const sock = await connectSocket();
      if (sock) {
        sock.on("bookingAccepted", (data) => {
          Toast.show({
            type: "success",
            text1: "Partner Assigned!",
            text2: data.message,
          });
        });
        sock.on("bookingStatusUpdate", (data) => {
          console.log("Status:", data.status);
        });
      }
    };
    init();
  }, []);

  // ────── OPEN VEHICLE MODAL (with prefill if exists) ──────
  // const openVehicleModal = () => {
  //   setVehicleModal(true);
  //   if (currentUser?.vehicles) {
  //     // Pre‑fill form
  //     setRcNumber(currentUser.vehicles.registrationNumber || "");
  //     const brand = brands.find((b) => b.name === currentUser.vehicles.make);
  //     if (brand) {
  //       setSelectedBrand(brand);
  //       // Models will load automatically via useEffect
  //       setSelectedModel(currentUser.vehicles.model);
  //     }
  //   } else {
  //     // Reset form
  //     setRcNumber("");
  //     setSelectedBrand(null);
  //     setSelectedModel("");
  //   }
  //   Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  // };

  // ────── OPEN VEHICLE MODAL (with prefill if exists) ──────
  const openVehicleModal = () => {
    setIsEditing(false); // Reset editing mode
    setRcNumber("");

    if (currentUser?.vehicles) {
      // Just open modal with tags (no prefill yet)
      setVehicleModal(true);
    } else {
      // No vehicle → directly go to add form
      setIsEditing(true);
      setVehicleModal(true);
    }

    // Always start animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // const closeModal = () => {
  //   Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
  //     setVehicleModal(false);
  //     setLocationModal(false);
  //   });
  // };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVehicleModal(false);
      setLocationModal(false);
      setIsEditing(false); // Reset on close
      setRcNumber("");
    });
  };

  // ────── SUBMIT VEHICLE (Add or Update) ──────
  const handleVehicleSubmit = async () => {
    if (!rcNumber.trim())
      return Toast.show({ type: "error", text1: "Enter RC Number" });

    setIsSubmitting(true);
    try {
      // ← ONLY RC NUMBER IS SENT NOW
      await api.post("/auth/vehicle", {
        rcNumber: rcNumber.trim().toUpperCase(),
      });

      await fetchUser();
      dispatch(vehicleUpdated());
      onRefresh();
      Toast.show({ type: "success", text1: "Vehicle added successfully!" });
      closeModal();
    } catch (error) {
      console.log("Error in vehicle submit", error);
      const msg = error.response?.data?.error || "Invalid RC number";
      Toast.show({ type: "error", text1: "Failed", text2: msg });
    } finally {
      setIsSubmitting(false);
      onRefresh();
      closeModal();
    }
  };

  const updateLocation = async (place) => {
    try {
      const { lat, lng } = place.geometry.location;
      const address = place.formatted_address;
      await api.patch("/auth/update-location", {
        location: { latitude: lat, longitude: lng },
        address,
      });
      Toast.show({ type: "success", text1: "Location updated!" });
      closeModal();
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to update location" });
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F8FAFC",
        paddingBottom: insets.bottom,
      }}
      edges={["top", "left", "right", "bottom"]}
    >
      <StatusBar barStyle="light-content" />
      {/* Header Background */}
      <Image
        source={require("../../assets/images/bg-design4.png")}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 200,
          width: "100%",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          zIndex: 0,
        }}
        resizeMode="cover"
      />

      {/* Header */}
      <View style={{ paddingTop: 10, paddingHorizontal: 16, zIndex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Location */}
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/homeLocation" })}
            style={{ flexDirection: "row", alignItems: "center" }}
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={22} color="#fff" />
            <View style={{ marginLeft: 6 }}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                Location
              </Text>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                {currentUser?.addresses[0]?.city || "Add location"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#fff" />
          </TouchableOpacity>

          {/* Vehicle + Notification */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={openVehicleModal}
              style={{ marginRight: 16, backgroundColor: "#ff0000b6", padding: 4, borderRadius: 20 }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={
                  currentUser?.vehicles?.type === "Two wheeler" ? "bike" : "car"
                }
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            {/* <TouchableOpacity activeOpacity={0.8}>
              <Ionicons
                onPress={() => router.push({ pathname: "/location-finding" })}
                name="notifications-outline"
                size={22}
                color="#fff"
              />
            </TouchableOpacity> */}
          </View>
        </View>

        {/* Search */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#FC1F10",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            marginTop: 16,
          }}
        >
          <Ionicons name="search-outline" size={18} color="#666" />
          <TextInput
            placeholder="Looking for car wash..."
            placeholderTextColor="#999"
            style={{
              marginLeft: 8,
              flex: 1,
              fontSize: 14,
              paddingVertical: 10,
              color: "#1A202C",
            }}
          />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 16 }}
        >
          {(() => {
            const isBike = currentUser?.vehicles?.type === "Two wheeler";

            const categories = isBike
              ? [
                  { name: "Full Wash", icon: "snowflake" },
                  { name: "Exterior Wash", icon: "flash" },
                  { name: "Bike Wash", icon: "motorbike" },
                  { name: "Detailing", icon: "hammer" },
                  { name: "Foam Wash", icon: "hand-wash" },
                ]
              : [
                  { name: "Full Wash", icon: "snowflake" },
                  { name: "Exterior Wash", icon: "flash" },
                  { name: "Interior Wash", icon: "washing-machine" },
                  { name: "Detailing", icon: "hammer" },
                  { name: "Foam Wash", icon: "hand-wash" },
                ];

            return categories.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={{ alignItems: "center", marginRight: 20 }}
                onPress={() => router.push({ pathname: "/services" })}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: "#ffffffff",
                  }}
                >
                  <View
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: "#df3737",
                    }}
                  >
                    <MaterialCommunityIcons
                      name={cat.icon}
                      size={22}
                      color="#ffffffff"
                    />
                  </View>
                </View>
                <Text
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#333",
                    fontWeight: "500",
                  }}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ));
          })()}
        </ScrollView>
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
        style={{ marginTop: 16 }}
      >
        {/* Spotlight */}
        <Text
          style={{
            paddingHorizontal: 16,
            fontSize: 16,
            fontWeight: "500",
            color: "#333",
          }}
        >
          Under <Text style={{ color: "#df3737" }}>Spotlight</Text>
        </Text>

        {/* Banner */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 16 }}
        >
          {banners.map((banner) => (
            <Image
              key={banner.id}
              source={banner.image}
              style={{
                width: 340,
                height: 160,
                borderRadius: 12,
                marginHorizontal: 10,
              }}
              resizeMode="stretch"
            />
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "500", color: "#333" }}>
            Quick <Text style={{ color: "#df3737" }}>Actions</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
            style={{ marginTop: 8 }}
          >
            {[
              {
                title: 
                  currentUser?.vehicles?.type === "Two wheeler"
                    ? "BIKE WASH"
                    : "BASIC WASH",
                price:
                  currentUser?.vehicles?.type === "Two wheeler"
                    ? "₹149"
                    : currentUser?.vehicles?.type === "Hatchback"
                    ? "₹399"
                    : currentUser?.vehicles?.type === "Sedan"
                    ? "₹499"
                    : "₹599",
                icon: 
                  currentUser?.vehicles?.type === "Two wheeler"
                    ? require("../../assets/images/wash.png")
                    : require("../../assets/images/Basic Wash2.png"),
                color: "#df3737",
              },
              {
                title: 
                  currentUser?.vehicles?.type === "Two wheeler"
                    ? "WASH & POLISH"
                    : "STANDARD WASH",
                price:
                  currentUser?.vehicles?.type === "Two wheeler"
                    ? "₹249"
                    : currentUser?.vehicles?.type === "Hatchback"
                    ? "₹799"
                    : currentUser?.vehicles?.type === "Sedan"
                    ? "₹899"
                    : "₹999",
                icon: 
                  currentUser?.vehicles?.type === "Two wheeler"
                    ? require("../../assets/images/polish.png")
                    : require("../../assets/images/Standard Wash2.png"),
                color: "#df3737",
              },
              {
                title: 
                currentUser?.vehicles?.type === "Two wheeler"
                    ? "BIKE DETAILING"
                    : "PREMIUM WASH",
                price:
                  currentUser?.vehicles?.type === "Two wheeler"
                    ? "₹499"
                    : currentUser?.vehicles?.type === "Hatchback"
                    ? "₹2499"
                    : currentUser?.vehicles?.type === "Sedan"
                    ? "₹2999"
                    : "₹3499",
                icon: 
                  currentUser?.vehicles?.type === "Two wheeler"
                    ? require("../../assets/images/detailing.png")
                    : require("../../assets/images/Premium Wash2.png"),
                color: "#df3737",
              },
            ].map((a) => (
              <TouchableOpacity
                key={a.title}
                style={{
                  width: 122,
                  height: 110,
                  backgroundColor: "#ffffffff",
                  borderRadius: 12,
                  marginRight: 12,
                  padding: 8,
                  justifyContent: "center",
                  position: "relative",
                  borderWidth: 1,
                  borderColor: "#df3737",
                }}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: "/services" })}
              >
                <Image
                  source={a.icon}
                  size={30}
                  style={{
                    width: 40,
                    height: 40,
                    position: "absolute",
                    top: 5,
                    left: "37%",
                  }}
                  resizeMode="stretch"
                />
                {/* <Ionicons name={a.icon} size={40} color="#5E72E4" style={{ position: "absolute", top: -20, left: "20%" }} /> */}
                <Text
                  style={{
                    fontSize: 12.5,
                    textAlign: "center",
                    fontWeight: "800",
                    color: "#000000",
                    marginTop: 24,
                  }}
                >
                  {a.title}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    textAlign: "center",
                    color: "#000000ff",
                  }}
                >
                  Start with {a.price}
                </Text>
                <View
                  style={{
                    position: "absolute",
                    bottom: 6,
                    right: 8,
                    backgroundColor: "#000000ff",
                    borderRadius: 20,
                    padding: 2,
                  }}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={13}
                    color="#ffffffff"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Vehicle Details */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: "#333",
              }}
            >
              Vehicle <Text style={{ color: "#df3737" }}>Details</Text>
            </Text>

            <TouchableOpacity
              style={{
                backgroundColor: "#000000ff",
                borderRadius: 20,
                padding: 4,
              }}
              onPress={() => router.push({ pathname: "/vehicle-details" })}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-forward" size={13} color="#fff" />
            </TouchableOpacity>
          </View>

          {loadingUser ? (
            <View
              style={{
                height: 120,
                backgroundColor: "#fff",
                borderRadius: 12,
                marginTop: 16,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#df3737",
              }}
            >
              <ActivityIndicator color="#df3737" />
            </View>
          ) : userError ? (
            <View
              style={{
                height: 120,
                backgroundColor: "#fff",
                borderRadius: 12,
                marginTop: 16,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#df3737",
              }}
            >
              <Ionicons name="alert-circle" size={40} color="#ef4444" />
              <Text style={{ marginTop: 8, color: "#ef4444" }}>
                Failed to load vehicle
              </Text>
              <TouchableOpacity
                onPress={() => fetchUser(true)}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: "#cc2e2e", fontWeight: "600" }}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : !currentUser?.vehicles ? (
            <TouchableOpacity
              onPress={openVehicleModal}
              style={{
                height: 120,
                backgroundColor: "#fff",
                borderRadius: 12,
                marginTop: 16,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#df3737",
              }}
            >
              <Ionicons name="car-outline" size={40} color="#df3737" />
              <Text
                style={{ marginTop: 8, fontWeight: "600", color: "#df3737" }}
              >
                Add Your Vehicle
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{ flexDirection: "row", marginTop: 16 }}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: "/vehicle-details" })}
            >
              <View
                style={{
                  width: "100%",
                  // height: 120,
                  backgroundColor: "#ffffffff",
                  borderRadius: 12,
                  marginRight: 12,
                  paddingLeft: 8,
                  paddingTop: 10,
                  borderWidth: 1,
                  borderColor: "#df3737",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                }}
              >
                {/* <Ionicons name={a.icon} size={40} color="#5E72E4" style={{ position: "absolute", top: -20, left: "20%" }} /> */}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#000000ff",
                  }}
                >
                  RC:{" "}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#df3737",
                    }}
                  >
                    {currentUser?.vehicles?.registrationNumber || "N/A"}
                  </Text>
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#000000ff",
                  }}
                >
                  Brand:{" "}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#df3737",
                    }}
                  >
                    {currentUser?.vehicles?.make || "N/A"}
                  </Text>
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#000000ff",
                  }}
                >
                  Model:{" "}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#df3737",
                    }}
                  >
                    {currentUser?.vehicles?.model || "N/A"}
                  </Text>
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#000000ff",
                  }}
                >
                  Insurance number :{" "}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#df3737",
                    }}
                  >
                    {currentUser?.vehicles?.insurance_policy_number || "N/A"}
                  </Text>
                </Text>
                {(() => {
                  const iso = currentUser?.vehicles?.insurance_upto;
                  if (!iso) return null;
                  const d = new Date(iso);
                  const day = String(d.getDate()).padStart(2, "0");
                  const month = String(d.getMonth() + 1).padStart(2, "0");
                  const year = d.getFullYear();
                  const formatted = `${day}-${month}-${year}`; // 01-02-2026
                  return (
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#000000ff",
                      }}
                    >
                      Insurance upto:{" "}
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#df3737",
                        }}
                      >
                        {formatted || "N/A"}
                      </Text>
                    </Text>
                  );
                })()}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Most Booked */}
        <View
          style={{ paddingHorizontal: 16, marginTop: 20, marginBottom: 20 }}
        >
          <Text style={{ fontSize: 16, fontWeight: "500", color: "#333" }}>
            Most <Text style={{ color: "#df3737" }}>Booked</Text>
          </Text>
          {servicesLoading ? (
            <View style={{ flexDirection: "row", marginTop: 16 }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    width: 180,
                    height: 220,
                    backgroundColor: "#f0f0f0",
                    borderRadius: 12,
                    marginRight: 12,
                  }}
                />
              ))}
            </View>
          ) : services.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Ionicons name="sad-outline" size={60} color="#ccc" />
              <Text style={{ marginTop: 12, color: "#999" }}>
                No services available
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 16 }}
            >
              {services.map((service) => (
                <TouchableOpacity
                  key={service._id}
                  onPress={() =>
                    router.push(`/service-detail?id=${service._id}`)
                  }
                  style={{
                    backgroundColor: "#f9f9f9",
                    borderRadius: 12,
                    marginRight: 12,
                    width: 180,
                    overflow: "hidden",
                    elevation: 2,
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{
                      uri:
                        service.imageUrl || "https://via.placeholder.com/150",
                    }}
                    style={{ width: "100%", height: 120 }}
                    resizeMode="cover"
                  />
                  <View style={{ padding: 10 }}>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 13, fontWeight: "600" }}
                    >
                      {service.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#df3737",
                        fontWeight: "bold",
                      }}
                    >
                      ₹{service.basePrice}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#666" }}>
                      {service.numReviews || 0}+ bookings
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 4,
                      }}
                    >
                      <Text style={{ color: "#f1d221", fontWeight: "bold" }}>
                        ★ {service.rating || 4.8}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#df3737",
                        padding: 8,
                        borderRadius: 8,
                        marginTop: 8,
                        alignItems: "center",
                      }}
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push({
                          pathname: "/checkout",
                          params: { services: JSON.stringify(service) },
                        })
                      }
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "bold",
                          fontSize: 12,
                        }}
                      >
                        Book Now
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* ────── VEHICLE MODAL (READ-ONLY TAGS → EDIT FORM) ────── */}
      <Modal visible={vehicleModal} transparent={true} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: "90%",
              }}
            >
              {/* Header */}
              <View
                style={{
                  padding: 20,
                  borderBottomWidth: 1,
                  borderColor: "#eee",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "600" }}>
                  {currentUser?.vehicles && !isEditing
                    ? "Vehicle Details"
                    : currentUser?.vehicles
                    ? "Update Vehicle"
                    : "Add Vehicle"}
                </Text>
                <TouchableOpacity activeOpacity={0.8} onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {/* KEYBOARD AWARE SCROLL VIEW — THIS IS THE MAGIC */}
              <KeyboardAwareScrollView
                enableOnAndroid={true}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
              >
                {/* ── CASE 1: NO VEHICLE → SHOW ADD BUTTON ── */}
                {!currentUser?.vehicles && !isEditing ? (
                  <TouchableOpacity
                    style={[submitButton, { marginTop: 0 }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setIsEditing(true);
                      setRcNumber("");
                    }}
                  >
                    <Text style={submitText}>Add Vehicle</Text>
                  </TouchableOpacity>
                ) : (
                  /* ── CASE 2: VEHICLE EXISTS → SHOW TAGS ── */
                  <View>
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#f9f0f0ff",
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                        marginBottom: 12,
                        flexDirection: "row",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                      activeOpacity={0.8}
                      onPress={() => {
                        setIsEditing(true);
                        setRcNumber(
                          currentUser.vehicles.registrationNumber || ""
                        );
                      }}
                    >
                      <View>
                        <Text style={{ fontWeight: "600", color: "#000000ff" }}>
                          RC:{" "}
                          <Text style={{ color: "#df3737" }}>
                            {currentUser.vehicles.registrationNumber}
                          </Text>
                        </Text>
                        <Text style={{ fontWeight: "600", color: "#000000ff" }}>
                          Brand:{" "}
                          <Text style={{ color: "#df3737" }}>
                            {currentUser.vehicles.make}
                          </Text>
                        </Text>
                        <Text style={{ fontWeight: "600", color: "#000000ff" }}>
                          Model:{" "}
                          <Text style={{ color: "#df3737" }}>
                            {currentUser.vehicles.model}
                          </Text>
                        </Text>
                        <Text style={{ fontWeight: "600", color: "#000000ff" }}>
                          Segment:{" "}
                          <Text style={{ color: "#df3737" }}>
                            {currentUser.vehicles.type}
                          </Text>
                        </Text>
                      </View>
                      <Ionicons name="pencil" size={18} color="#df3737" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── EDIT / ADD FORM ── */}
                {isEditing && (
                  <>
                    <View style={inputContainer}>
                      <TextInput
                        style={inputStyle}
                        placeholder="RC Number * (e.g., DL10AB1234)"
                        placeholderTextColor="#CCC"
                        value={rcNumber}
                        onChangeText={setRcNumber}
                        autoCapitalize="characters"
                        autoFocus={true} // Auto focus on open
                      />
                      <Ionicons name="card-outline" size={20} color="#999" />
                    </View>

                    <TouchableOpacity
                      style={[submitButton, isSubmitting && { opacity: 0.7 }]}
                      onPress={handleVehicleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={submitText}>
                          {currentUser?.vehicles
                            ? "Update Vehicle"
                            : "Add Vehicle"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </KeyboardAwareScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* LOCATION MODAL (unchanged) */}
      <Modal visible={locationModal} transparent animationType="none">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "#fff",
              marginTop: 100,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              opacity: fadeAnim,
            }}
          >
            <View
              style={{ padding: 20, borderBottomWidth: 1, borderColor: "#eee" }}
            >
              <Text style={{ fontSize: 18, fontWeight: "600" }}>
                Update Location
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                style={{ position: "absolute", right: 20, top: 20 }}
              >
                <Ionicons name="close" size={24} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, padding: 16 }}>
              <GooglePlacesAutocomplete
                placeholder="Search your location..."
                fetchDetails={true}
                onPress={(data, details) => updateLocation(details)}
                query={{ key: "YOUR_GOOGLE_PLACES_API_KEY", language: "en" }}
                styles={{
                  textInput: {
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 12,
                    padding: 12,
                    fontSize: 16,
                  },
                }}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
      {/* <View style={{ height: 30, backgroundColor: '#fff' }} /> */}
    </SafeAreaView>
  );
};

export default Home;
