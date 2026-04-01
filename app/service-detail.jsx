// app/ServiceDetailScreen.js
import { font, icon, spacing } from '@/services/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchServiceById,
  selectCurrentService,
  selectServiceDetailError,
  selectServiceDetailLoading,
  selectServices,
} from '@/store/slices/serviceSlice';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { id } = useLocalSearchParams();
  const serviceId = Array.isArray(id) ? id[0] : id;

  // Redux state
  const service = useAppSelector(selectCurrentService);
  const loading = useAppSelector(selectServiceDetailLoading);
  const error = useAppSelector(selectServiceDetailError);
  const allServices = useAppSelector(selectServices);

  // Fetch on mount
  useEffect(() => {
    if (serviceId) {
      dispatch(fetchServiceById(serviceId));
    }
  }, [serviceId, dispatch]);

  // Related services
  const relatedServices = allServices
    .filter((s) => s._id !== serviceId && s.vehicleCategory === service?.vehicleCategory)
    .slice(0, 5);

  // ────── LOADING ──────
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', paddingBottom: insets.bottom }}>
        <ActivityIndicator size="large" color="#cc2e2e" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading service...</Text>
      </SafeAreaView>
    );
  }

  // ────── ERROR ──────
  if (error || !service) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', paddingBottom: insets.bottom }}>
        <Ionicons name="alert-circle-outline" size={48} color="#cc2e2e" />
        <Text style={{ marginTop: 12, fontSize: 16, color: '#cc2e2e' }}>
          {error || 'Service not found'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, padding: 12, backgroundColor: '#cc2e2e', borderRadius: 8 }}
        >
          <Text style={{ color: '#FFF' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ────── RENDER RELATED ITEM ──────
  const renderRelatedItem = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginRight: 12,
        width: 160,
        elevation: 2,
        overflow: 'hidden',
      }}
      onPress={() => router.push(`/service-detail?id=${item._id}`)}
    >
      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
      <View style={{ padding: 8 }}>
        <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '500' }}>{item.name}</Text>
        <Text style={{ fontSize: 13, color: '#FF0000', fontWeight: 'bold' }}>₹{item.basePrice}</Text>

        {item.name === 'Monthly Subscription' ? (
          <TouchableOpacity style={{ backgroundColor: '#df3737', padding: 8, borderRadius: 6, marginTop: 6, alignItems: 'center' }} onPress={() => router.push({
                        pathname: '/subscriptionCheckout',
                        params: { services: JSON.stringify(item) }
                      })}>
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Book Now</Text>
        </TouchableOpacity>
        ) : (
          <TouchableOpacity style={{ backgroundColor: '#df3737', padding: 8, borderRadius: 6, marginTop: 6, alignItems: 'center' }} onPress={() => router.push({
                        pathname: '/checkout',
                        params: { services: JSON.stringify(item) }
                      })}>
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>Book Now</Text>
        </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }} edges={["top", "left", "right", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: '#FFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E2E8F0',
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={icon.lg} color="#1A202C" />
          </TouchableOpacity>
          <Text style={{ fontSize: font.xl, fontWeight: '700', color: '#1A202C', flex: 1, marginLeft: spacing.lg }}>
            Service Details
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero Image */}
          <View style={{ height: 300 }}>
            <Image
              source={{ uri: service.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          <View style={{ padding: 20 }}>
            {/* Title */}
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 6 }}>{service?.name}</Text>

            {/* Description */}
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#8a8a8aff', marginBottom: 12 }}>{service?.description}</Text>

            {/* Rating Section */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 6 }}>
                {service.rating} <Text style={{ fontSize: 14, fontWeight: '400', color: '#999' }}>({service.numReviews})</Text>
              </Text>
            </View>

            {/* Features */}
            <View style={{ marginBottom: 14 }}>
              {service.featuresList?.map((feature, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#E8F8F5',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name="checkmark" size={18} color="#2ECC71" />
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, color: '#666', lineHeight: 22 }}>{feature}</Text>
                </View>
              ))}
            </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <Ionicons name="time" size={18} color="#0073ffff" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#414347ff', marginLeft: 6 }}>
              Durations: {service.durationMinutes} minutes
            </Text>
          </View>

            {/* Price & Book */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 20,
                backgroundColor: '#F9F9F9',
                borderRadius: 12,
                marginBottom: 32,
              }}
            >
              <View>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#333' }}>
                  ₹{service.basePrice}
                </Text>
                <Text style={{ fontSize: 12, color: '#999' }}>Price exclusive of taxes</Text>
              </View>

              {service.name === 'Monthly Subscription' ? (
                <TouchableOpacity
                style={{
                  backgroundColor: '#cc2e2e',
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  borderRadius: 12,
                  elevation: 4,
                }}

                onPress={() => router.push({
              pathname: '/subscriptionCheckout',
              params: { services: JSON.stringify(service) }
            })}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Book Now</Text>
              </TouchableOpacity>
              ) : (
                <TouchableOpacity
                style={{
                  backgroundColor: '#cc2e2e',
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  borderRadius: 12,
                  elevation: 4,
                }}

                onPress={() => router.push({
              pathname: '/checkout',
              params: { services: JSON.stringify(service) }
            })}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Book Now</Text>
              </TouchableOpacity>
              )}
            </View>

            {/* Related Services */}
            {relatedServices.length > 0 && (
              <View>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>You may also like</Text>
                <FlatList
                  data={relatedServices}
                  renderItem={renderRelatedItem}
                  keyExtractor={(item) => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
