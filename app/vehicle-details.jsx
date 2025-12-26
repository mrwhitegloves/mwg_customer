// app/vehicle-details.jsx
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { font, icon, radius, spacing } from '../services/ui';

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vehicle, setVehicle] = useState(null); // ← Single vehicle only
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchVehicle = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
      setError('');
    }
    try {
      const res = await api.get('/auth/me');
      const fetchedVehicle = res.data.user?.vehicles || null;
      setVehicle(fetchedVehicle);
      setError('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load your vehicle';
      setError(msg);
      setVehicle(null);
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, []);


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVehicle(true);
  }, []);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#cc2e2e" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Loading your car details...</Text>
      </SafeAreaView>
    );
  }

  if (error && !vehicle) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Ionicons name="car-outline" size={80} color="#94A3B8" />
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1E293B', marginTop: 20 }}>No Vehicle Found</Text>
        <Text style={{ fontSize: 15, color: '#64748B', textAlign: 'center', marginTop: 8 }}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={{ marginTop: 24, backgroundColor: '#cc2e2e', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
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
            My Vehicle
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Ionicons name="car-sport-outline" size={100} color="#CBD5E1" />
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#64748B', marginTop: 24 }}>
            No Vehicle Added Yet
          </Text>
          <Text style={{ fontSize: 15, color: '#94A3B8', textAlign: 'center', marginTop: 12 }}>
            Add your car to book services faster
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', paddingBottom: insets.bottom, }} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        backgroundColor: '#FFF',
        borderBottomColor: '#E2E8F0',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={icon.lg} color="#1A202C" />
        </TouchableOpacity>
        <Text style={{ fontSize: font.xl, fontWeight: '800', color: '#1A202C', marginLeft: spacing.md, flex: 1 }}>
          My Vehicle
        </Text>
        <View style={{ backgroundColor: '#cc2e2e', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: font.sm }}>ACTIVE</Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#cc2e2e']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={{
          backgroundColor: '#FFF',
          marginHorizontal: spacing.md,
          marginTop: spacing.md,
          borderRadius: radius.xl,
          padding: spacing.lg,
          marginBottom: spacing.md,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 12,
          borderWidth: 3,
          borderColor: '#cc2e2e',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <Ionicons name="car-sport" size={icon.xl} color="#cc2e2e" />
            {/* <View style={{ flex: 1, marginLeft: 12 }}> */}
              <Text style={{ fontSize: font.lg, fontWeight: '900', color: '#cc2e2e', marginLeft: spacing.sm, flex: 1 }} numberOfLines={5} adjustsFontSizeToFit minimumFontScale={0.85}>
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </Text>
            {/* </View> */}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <Entypo name="user" size={icon.md} color="#000000" />
            <Text style={{ fontSize: font.md, fontWeight: '700', color: '#cc2e2e', marginLeft: spacing.sm, flex: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              Owner: {vehicle?.owner_name || '—'}
            </Text>
          </View>

          {/* Responsive 3-column grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: '#F8FAFC', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <MaterialCommunityIcons name="invert-colors" size={icon.sm} color='#64748B' />
                <Text style={{ fontSize: font.xs, color: '#94A3B8', marginLeft: spacing.xs }}>Color</Text>
              </View>
              <Text style={{ fontSize: font.sm, fontWeight: '700', color: '#1A202C' }} numberOfLines={3}>
                {vehicle?.color || '—'}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: '#F8FAFC', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <MaterialCommunityIcons name="fuel" size={icon.sm} color="#10B981" />
                <Text style={{ fontSize: font.xs, color: '#94A3B8', marginLeft: spacing.xs }}>Fuel</Text>
              </View>
              <Text style={{ fontSize: font.sm, fontWeight: '700', color: '#1A202C' }}>
                {vehicle?.fuel_type || '—'}
              </Text>
            </View>

            <View style={{ flex: 1, backgroundColor: '#F8FAFC', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                <MaterialCommunityIcons name="car-hatchback" size={icon.sm} color="#000000" />
                <Text style={{ fontSize: font.xs, color: '#94A3B8', marginLeft: spacing.xs }}>Segment</Text>
              </View>
              <Text style={{ fontSize: font.sm, fontWeight: '700', color: '#1A202C' }}>
                {vehicle?.type || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Details Sections */}
        <View style={{ paddingHorizontal: 16 }}>
          <Section title="Registration & Insurance">
            <InfoRow icon="card" label="RC Number" value={vehicle.rc_number} />
            <InfoRow icon="calendar" label="RC Valid Upto" value={formatDate(vehicle.fit_up_to)} />
            <InfoRow icon="shield" label="Insurance Upto" value={formatDate(vehicle.insurance_upto)} />
            <InfoRow icon="document-text" label="PUCC Upto (Pollution)" value={formatDate(vehicle.pucc_upto)} />
            <InfoRow icon="map" label="Registered At" value={vehicle.registered_at} />
          </Section>

          <Section title="Technical Details">
            <InfoRow icon="cog" label="Engine No." value={vehicle.vehicle_engine_number} />
            <InfoRow icon="construct" label="Chassis No." value={vehicle.vehicle_chasi_number} />
            <InfoRow icon="speedometer" label="Cubic Capacity" value={`${vehicle.cubic_capacity} cc`} />
            <InfoRow icon="help-buoy-sharp" label="Gross Weight" value={`${vehicle.vehicle_gross_weight} kg`} />
          </Section>

          <Section title="Tax & Permit">
            <InfoRow icon="logo-euro" label="Tax Paid Upto" value={formatDate(vehicle.tax_upto)} />
            <InfoRow icon="ticket" label="Permit No." value={vehicle.permit_number || 'N/A'} />
            <InfoRow icon="calendar" label="Permit Valid Upto" value={formatDate(vehicle.permit_valid_upto)} />
          </Section>

          <Section title="Non-Use & Challan Info">
            <InfoRow icon="pause-circle-sharp" label="Non-Use Status" value={vehicle.non_use_status || 'N/A'} />
            <InfoRow icon="calendar" label="Non-Use From" value={formatDate(vehicle.non_use_from) || 'N/A'} />
            <InfoRow icon="calendar-outline" label="Non-Use To" value={formatDate(vehicle.non_use_to) || 'N/A'} />
            <InfoRow icon="alert-circle-sharp" label="Challan Details" value={vehicle.challan_details || 'N/A'} />
          </Section>

          <Section title="Permit Details">
            <InfoRow icon="card-outline" label="Permit Number" value={vehicle.permit_number || 'N/A'} />
            <InfoRow icon="pricetags" label="Permit Type" value={vehicle.permit_type || 'N/A'} />
            <InfoRow icon="today" label="Permit Issue Date" value={formatDate(vehicle.permit_issue_date) || 'N/A'} />
            <InfoRow icon="play-forward" label="Permit Valid From" value={formatDate(vehicle.permit_valid_from) || 'N/A'} />
            <InfoRow icon="stopwatch" label="Permit Valid Till" value={formatDate(vehicle.permit_valid_upto) || 'N/A'} />
            <InfoRow icon="globe-outline" label="National Permit Number" value={vehicle.national_permit_number || 'N/A'} />
            <InfoRow icon="flag" label="National Permit Valid Till" value={formatDate(vehicle.national_permit_upto) || 'N/A'} />
            <InfoRow icon="person-circle" label="National Permit Issued By" value={vehicle.national_permit_issued_by || 'N/A'} />
          </Section>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable Components
const InfoItem = ({ icon, label, value, color = '#64748B' }) => (
  <View style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ fontSize: 13, color: '#94A3B8', marginLeft: 6 }}>{label}</Text>
    </View>
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A202C' }}>{value || '—'}</Text>
  </View>
);

const InfoRow = ({ icon, label, value }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
    <Ionicons name={icon} size={22} color="#cc2e2e" style={{ width: 40 }} />
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 14, color: '#64748B' }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A202C', marginTop: 4 }}>{value || '—'}</Text>
    </View>
  </View>
);

const Section = ({ title, children }) => (
  <View style={{
    backgroundColor: '#FFF',
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  }}>
    <View style={{ backgroundColor: '#cc2e2e', padding: spacing.md }}>
      <Text style={{ fontSize: font.lg, fontWeight: '800', color: '#FFF' }}>{title}</Text>
    </View>
    <View style={{ paddingHorizontal: spacing.lg }}>
      {children}
    </View>
  </View>
);