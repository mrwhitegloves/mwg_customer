// app/service.tsx
import api from '@/services/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useSelector } from "react-redux";
import { font, icon, radius, spacing } from '../../services/ui';

export default function ServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const vehicleVersion = useSelector((state) => state.vehicle.version);

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchServices = async (isPullToRefresh = false) => {
    if (!isPullToRefresh) {
      setLoading(true);
      setError(null);
    }
    setRefreshing(true);

    try {
      const response = await api.get('/services/allServicesByVehicle');

      // Safety: ensure response is array
      const data = Array.isArray(response.data) ? response.data : [];

      if (data.length === 0) {
        setServices([]);
        setError(null);
      } else {
        const formatted = data.map((s) => ({
          _id: s._id || Math.random().toString(),
          name: s.name || 'Service',
          description: s.description || '',
          durationMinutes: s.durationMinutes || 60,
          basePrice: s.basePrice,
          finalPrice: s.basePrice || 0,
          imageUrl: s.imageUrl || 'https://via.placeholder.com/150',
          featuresList: Array.isArray(s.featuresList) ? s.featuresList : [],
          rating: s.rating || 4.5,
          reviews: s.numReviews || 0,
          discountPercent: s.discountPercent || 0,
        }));
        setServices(formatted);
        setError(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to load services';
      setError(msg);
      setServices([]);
      Toast.show({
        type: 'error',
        text1: 'Network Error',
        text2: msg,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [vehicleVersion]);

  const onRefresh = useCallback(() => {
    fetchServices(true);
  }, []);

  const renderServiceItem = ({ item }) => {
    console.log('Rendering service item:', item);
    const visibleFeatures = item.featuresList.slice(0, 3);
    const moreCount = item.featuresList.length - 3;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          backgroundColor: '#FFF',
          // borderRadius: 18,
          // padding: 18,
          // marginBottom: 16,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
          // marginHorizontal: spacing.md,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 6,
          // paddingBottom: insets.bottom,
        }}
        onPress={() => router.push(`/service-detail?id=${item._id}`)}
      >
        {/* Left: Details */}
        <View style={{ flex: 1, marginRight: spacing.md }}>
          <Text style={{ fontSize: font.xl, fontWeight: '800', color: '#1A202C' }}>
            {item.name}
          </Text>

          <View style={{ marginTop: spacing.sm }}>
            {visibleFeatures.map((feat, i) => (
              <Text key={i} style={{ fontSize: font.sm, color: '#2ECC71', marginVertical: spacing.xs * 0.3 }} numberOfLines={1}>
                <Ionicons name="checkmark-circle" size={icon.md} color="#2ECC71" /> {feat}
              </Text>
            ))}
            {moreCount > 0 && (
              <Text style={{ fontSize: font.sm, color: '#5B6DF5', marginTop: spacing.sm, fontWeight: '600' }}>
                +{moreCount} more features
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }}>
            <Ionicons name="star" size={icon.md} color="#FFD700" />
            <Text style={{ fontSize: font.md, fontWeight: '700', color: '#1A202C', marginLeft: spacing.xs }}>
              {item.rating}
            </Text>
            <Text style={{ fontSize: font.sm, color: '#718096', marginLeft: spacing.xs }}>
              ({item.reviews.toLocaleString()} reviews)
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }}>
            <Ionicons name="time" size={icon.md} color="#0073ffff" />
            <Text style={{ fontSize: font.sm, fontWeight: '600', color: '#414347ff', marginLeft: spacing.xs }}>
              Durations: {item.durationMinutes} minutes
            </Text>
          </View>
        </View>

        {/* Right: Image + Price + CTA */}
        <View style={{ flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between'  }}>
          <View style={{ alignItems: 'flex-end' }}>
          <Image
            source={{ uri: item.imageUrl }}
            style={{ 
              width: spacing.xxl * 4, 
              height: spacing.xxl * 3, 
              borderRadius: radius.md 
            }}
            resizeMode="cover"
          />

          <Text style={{ fontSize: font.xxl, fontWeight: '900', color: '#EF4444', marginTop: spacing.sm }}>
            ₹{item.finalPrice}
          </Text>
          <Text style={{ fontSize: font.xs, color: '#718096' }}>per service</Text>
          </View>

          {item.name === 'Monthly Subscription' ? (
            <TouchableOpacity
            style={{
              backgroundColor: '#EF4444',
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              marginTop: spacing.md,
            }}
            onPress={() =>
              router.push({
                pathname: '/subscriptionCheckout',
                params: { services: JSON.stringify(item) },
              })
            }
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: font.md }}>Book Now</Text>
          </TouchableOpacity>
          ) : (
            <TouchableOpacity
            style={{
              backgroundColor: '#EF4444',
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              marginTop: spacing.md,
            }}
            onPress={() =>
              router.push({
                pathname: '/checkout',
                params: { services: JSON.stringify(item) },
              })
            }
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: font.md }}>Book Now</Text>
          </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', paddingBottom: spacing.xl }} edges={["top", "left", "right", "bottom"]}>
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
          Services
        </Text>
      </View>

      {/* Main List */}
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: spacing.sm, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#EF4444']}
            tintColor="#EF4444"
          />
        }
        ListEmptyComponent={
          !loading && !refreshing && !error ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl }}>
              <Ionicons name="car-sport-outline" size={icon.xl * 2} color="#CBD5E1" />
              <Text style={{ fontSize: font.xl, fontWeight: '600', color: '#64748B', marginTop: spacing.xl }}>
                No services found
              </Text>
              <Text style={{ fontSize: font.md, color: '#94A3B8', textAlign: 'center', marginTop:spacing.md }}>
                Pull down to refresh or check your internet
              </Text>
              <TouchableOpacity
                onPress={onRefresh}
                style={{
                  marginTop: spacing.xl,
                  backgroundColor: '#EF4444',
                  paddingHorizontal: spacing.xxl,
                  paddingVertical: spacing.lg,
                  borderRadius: radius.pill,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Full-Screen Loading */}
      {loading && !refreshing && (
        <View style={{
          // ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(255,255,255,0.95)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
        }}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={{ marginTop: spacing.lg, fontSize: font.lg, color: '#64748B' }}>
            Loading services...
          </Text>
        </View>
      )}

      {/* Full-Screen Error */}
      {error && !loading && !refreshing && (
        <View style={{
          // ...StyleSheet.absoluteFillObject,
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.98)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.xxl,
          zIndex: 100,
        }}>
          <MaterialIcons name="wifi-off" size={icon.xl * 2} color="#EF4444" />
          <Text style={{ fontSize: font.xxl, fontWeight: '700', color: '#1E293B', marginTop: spacing.xl }}>
            Connection Failed
          </Text>
          <Text style={{ fontSize: font.md, color: '#64748B', textAlign: 'center', marginTop: spacing.md }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            style={{
              marginTop: spacing.xxl,
              backgroundColor: '#EF4444',
              paddingHorizontal: spacing.xxl * 2,
              paddingVertical: spacing.lg,
              borderRadius: radius.pill,
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: font.lg }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* <View style={{ height: spacing.xxl * 2.8, backgroundColor: '#fff' }} /> */}
    </SafeAreaView>
  );
}