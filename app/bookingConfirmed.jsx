import { FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import { getSocket } from '../services/socket';

const BookingConfirmedScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookingData } = useLocalSearchParams();

  const [parsedData, setParsedData] = useState(null);

  useEffect(() => {
    if (bookingData) {
      try {
        const parsed = JSON.parse(bookingData);
        setParsedData(parsed);
      } catch (e) {
        console.error("Failed to parse bookingData:", e);
      }
    }
  }, [bookingData]);

  // Customer Booking Confirmation Screen
useEffect(() => {
  const socket = getSocket();
  if (socket && parsedData?.booking?._id) {
    socket.emit('joinBooking', parsedData?.booking?._id);  // ← Joins room early

    socket.on('bookingAccepted', (data) => {
      Toast.show({ type: 'info', text1: 'Partner Assigned!', text2: 'Your partner is on the way!' });
      // router.push(/tracking/${parsedData._id});
    });

    return () => {
      socket.off('bookingAccepted');
    };
  }
}, [parsedData]);

  // ────── SHOW LOADING UNTIL PARSED ──────
  if (!parsedData) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: insets.bottom }}>
        <ActivityIndicator size="large" color="#c52222" />
      </SafeAreaView>
    );
  }

  const { booking } = parsedData;

  console.log('Parsed Booking Data in booking confirmed screen:', booking); // Debug log

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0',
        }}
      >
        <TouchableOpacity style={{ paddingVertical: 8 }} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12, paddingLeft: 12 }}>
          
          <View style={{ alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#000000ff' }}>Booking Confirmed</Text>
            <Text style={{ fontSize: 14, color: '#000000ff', opacity: 0.9 }}>Order: {booking?.bookingId}</Text>
          </View>
        </View>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Delivery Details */}
        <View style={{ backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Booking Details</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#EF4444', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFFFFF' }}>{new Date(booking.scheduledDate).getDate()}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Scheduled Date</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>{new Date(booking.scheduledDate).toLocaleDateString('en-GB')}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#F3F4F6', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={24} color="#9CA3AF" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Scheduled Time</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>{booking.scheduledTime}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#EF4444', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="location" size={20} color="#FFFFFF" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 4 }}>Booking Address</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', lineHeight: 22 }}>
                {booking.serviceLocation?.address || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Details */}
        <View style={{ backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Payment Details</Text>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, backgroundColor: '#F0FDF4', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <FontAwesome name="rupee" size={24} color="#22C55E" />
            </View>
            <View style={{ flex: 1, backgroundColor: '#f9f9f9', paddingTop: 2, borderRadius: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>Service Price</Text>
              <Text>₹{booking?.pricing?.servicePrice}.00</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>GST (18%)</Text>
              <Text>₹{booking?.pricing?.tax}.00</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>Convenience Fee</Text>
              <Text>₹{booking?.pricing?.charges}.00</Text>
            </View>
            {booking?.pricing?.discount > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#16a34a' }}>Discount</Text>
                    <Text style={{ color: '#16a34a', fontWeight: '700' }}>-₹{booking?.pricing?.discount}</Text>
                  </View>
                )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' }}>
              <Text style={{ fontWeight: '600' }}>Total Amount</Text>
              <Text style={{ fontWeight: '700', color: '#22C55E' }}>₹{booking?.pricing?.total}.00</Text>
            </View>
          </View>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 12 }}>
            <View style={{ width: 48, height: 48, backgroundColor: '#F0FDF4', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#22C55E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>{booking?.paymentType === 'pay online' ? ("Online Payment") : ("Offline Payment")}</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{booking?.paymentType === 'pay online' ? ("Your payment completed") : ("Pay when service provider arrives")}</Text>
            </View>
            <View style={{ backgroundColor: '#F97316', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 }}>{booking?.paymentType === 'pay online' ? ("ONLINE") : ("OFFLINE")}</Text>
            </View>
            {booking?.paymentType === 'pay online' && (
            <View style={{ paddingHorizontal: 1, paddingVertical: 6, borderRadius: 6 }}>
              <Ionicons name="checkmark-done-circle" size={24} color="#F97316" />
            </View>
            )}
          </View>

          {/* <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, marginHorizontal: -4, borderRadius: 24, backgroundColor: '#FEF3C7', borderWidth: 2, borderColor: '#FCD34D' }}>
            <View style={{ width: 48, height: 48, backgroundColor: '#F0FDF4', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#22C55E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>Offline Payment</Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>Pay when service provider arrives</Text>
            </View>
          </View> */}
        </View>

        {/* Create one Service Verification OTP section  */}
        <View style={{ backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>Service Verification OTP</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ marginRight: 12 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#EF4444', borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialIcons name="verified" size={24} color="#F3F4F6" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 }}>Your Verification OTP</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ width: '100%', height: 70, borderRadius: 12, backgroundColor: '#E8F5E9', borderWidth: 2, borderColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 32, fontWeight: '700', color: '#2E7D32' }}>{booking?.otp}</Text>
              </View>
          </View>
        </View>

        {/* What's Next */}
        <View style={{ backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 }}>{`What's Next?`}</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, backgroundColor: '#EF4444', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>1</Text>
            </View>
            <View style={{ flex: 1, paddingTop: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 }}>Service Provider Assigned</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>{`We'll assign a verified service provider to your service`}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, backgroundColor: '#EF4444', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>2</Text>
            </View>
            <View style={{ flex: 1, paddingTop: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 }}>Service Provider Contact</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                {`You'll receive a call from the service provider`}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, backgroundColor: '#EF4444', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>3</Text>
            </View>
            <View style={{ flex: 1, paddingTop: 2 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 }}>Service Completion</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                Service will be completed as per your schedule
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      {/* <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 }}>
        <TouchableOpacity style={{ backgroundColor: '#c52222ff', paddingVertical: 16, borderRadius: 12, marginBottom: 10, alignItems: 'center' }} onPress={() => router.push('/services')}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 }}>Continue More Services</Text>
        </TouchableOpacity>
      </View> */}
      <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' }}>
        <TouchableOpacity
          style={{ backgroundColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center' }}
          onPress={() => router.push('/services')}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Continue More Services</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookingConfirmedScreen;