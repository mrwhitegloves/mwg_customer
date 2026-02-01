// app/payment.jsx
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookingData } = useLocalSearchParams();

  // CORRECT: bookingData is a STRING → JSON.parse it
  const data = bookingData ? JSON.parse(bookingData) : null;

  const [method, setMethod] = useState('pay after service');
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [franchiseAvailable, setFranchiseAvailable] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [showPayOnlineOnly, setShowPayOnlineOnly] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewHtml, setWebViewHtml] = useState(null);
  const [networkError, setNetworkError] = useState(false);

  // ────── CHECK FRANCHISE AVAILABILITY ──────
  useEffect(() => {
    const checkFranchise = async () => {
      const pincode = data?.userSelectedAddress?.postalCode;

      if (!pincode) {
        showErrorAndRedirect('Postal code missing from address');
        return;
      }

      try {
        const res = await api.get(`/admin/franchise/check-availability?pincode=${pincode}`);
        setFranchiseAvailable(res.data.available);
      } catch (err) {
        setNetworkError(true);
      } finally {
        setCheckingAvailability(false);
      }
    };

    if (data) checkFranchise();
  }, [data?.userSelectedAddress?.postalCode]);

  // ────── TOAST + REDIRECT ──────
  const showErrorAndRedirect = (message) => {
    Toast.show({
      type: 'error',
      text1: 'Service not available in your location',
      // text2: message,
      position: 'top',
      visibilityTime: 4000,
      topOffset: 60,
    });

    // setTimeout(() => {
      router.back();
    // }, 2500);
  };

  // ────── ERROR UI: No Service / Network Issue ──────
  if (checkingAvailability) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', paddingBottom: insets.bottom }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Checking service in your area...</Text>
      </SafeAreaView>
    );
  }

  if (networkError || franchiseAvailable === false || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', padding: 24, paddingBottom: insets.bottom }}>
        <StatusBar barStyle="dark-content" />
        <Ionicons name="warning-outline" size={64} color="#ef4444" />
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937', marginTop: 24, textAlign: 'center' }}>
          {networkError ? "No Internet Connection" : "Service Not Available"}
        </Text>
        <Text style={{ fontSize: 15, color: '#6b7280', textAlign: 'center', marginTop: 12, lineHeight: 22 }}>
          {networkError
            ? "Please check your internet and try again."
            : "We’re not serving this area yet. We’ll be there soon!"}
        </Text>
        <TouchableOpacity
          style={{ marginTop: 32, backgroundColor: '#22c55e', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 }}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /* --------------------------------------------------------------
     PAY AFTER SERVICE
  -------------------------------------------------------------- */
  const handlePayAfter = async () => {
    setLoading(true);
    try {
      const payload = {
        services: [{
          serviceId: data.service._id,
          name: data.service.name,
          description: data.service.description,
          price: data.total,
          imageUrl: data.service.imageUrl,
          servicePrice: data.servicePrice,
          tax: data.tax,
          charges: data.charges,
          discount: data.discount,
          couponCode: data.couponCode || null,
          durationMinutes: data?.service?.durationMinutes,
          featuresList: data.service.featuresList,
        }],
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        deliveryAddressId: data.deliveryAddressId,
        vehicleId: data.vehicleId,
        paymentType: 'pay after service',
        paymentMode: 'cash',
      };
      const res = await api.post('/bookings', payload);
      // router.replace(`/bookingConfirmed?bookingId=${res.data.booking._id}`);
      // ────── BUILD BOOKING OBJECT ONCE ──────
    const bookingInfo = {
      booking: res.data.booking,
      paymentType: 'pay after service',
      paymentMode: 'cash',
    };

    // ────── SEND AS JSON STRING (ONLY ONCE!) ──────
    router.replace({
        pathname: '/BookingSuccessScreen',
        params: { bookingData: JSON.stringify(bookingInfo) },
      });

      Toast.show({
        type: 'success',
        text1: 'Booking Confirmed!',
        text2: 'Partner will arrive soon',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Booking Failed',
        text2: err.response?.data?.error || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------------
     PAY ONLINE 
  -------------------------------------------------------------- */
  const initiatePayment = async () => {
    setLoading(true);
    try {
      const amount = data.total;
      const res = await api.post('/payments/create-order', {
        amount,
        userId: data.currentUser?._id,
      });
      setPaymentId(res.data.payment._id);
      openRazorpay(res.data.orderId, amount);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Payment Failed',
        text2: err.response?.data?.error || 'Try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  const openRazorpay = (orderId, amount) => {
  const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY;
  const phone = data.userSelectedAddress?.phone;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>body{margin:0;padding:0}</style>
</head>
<body>
  <script>
    const options = {
      key: '${razorpayKey}',
      amount: ${amount * 100},
      order_id: '${orderId}',
      name: 'MrWhiteGloves',
      description: 'Car Wash Booking',
      prefill: { contact: '${phone}' },
      theme: { color: '#4A90E2' },
      handler: (response) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'success',
          payload: response
        }));
      },
      modal: {
        ondismiss: () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cancel' }));
        }
      }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  </script>
</body>
</html>
  `;

  setWebViewHtml(html);
  setShowWebView(true);
};

  const verifyAndCreateBooking = async (response, amount) => {
    try {
      await api.post('/payments/verify', {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        paymentId,
      });


      const bookingPayload = {
        services: [{
          serviceId: data.service._id,
          name: data.service.name,
          price: data.total,
          servicePrice: data.servicePrice,
          tax: data.tax,
          charges: data.charges,
          discount: data.discount,
          couponCode: data.couponCode || null,
          durationMinutes: data?.service?.durationMinutes,
        }],
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        deliveryAddressId: data.deliveryAddressId,
        vehicleId: data.vehicleId,
        paymentType: 'pay online',
        paymentMode: 'online',
        onlinePaymentId: paymentId,
        onlineAmount: amount,
      };


      const bookingRes = await api.post('/bookings', bookingPayload);
      // router.replace(`/bookingConfirmed?bookingId=${bookingRes.data.booking._id}`);
      // ────── BUILD BOOKING OBJECT ONCE ──────
    const bookingInfo = {
      booking: bookingRes.data.booking,
      paymentType: 'pay after service',
      paymentMode: 'cash',
    };

    // ────── SEND AS JSON STRING (ONLY ONCE!) ──────
    router.replace({
        pathname: '/BookingSuccessScreen',
        params: { bookingData: JSON.stringify(bookingInfo) },
      });

      Toast.show({
        type: 'success',
        text1: 'Payment Successful!',
        text2: 'Booking confirmed',
      });
    } catch (err) {
      await api.post('/payments/failed', { paymentId, reason: 'Booking failed' });
      Toast.show({
        type: 'error',
        text1: 'Booking Failed',
        text2: 'Payment received. Refund in 3-5 days.',
      });
    }
  };

  const retryPayOnline = () => {
    setShowPayOnlineOnly(false);
    initiatePayment();
  };

  /* --------------------------------------------------------------
     UI
  -------------------------------------------------------------- */
  if (!data) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: insets.bottom }}>
        <Text>Invalid booking data</Text>
      </SafeAreaView>
    );
  }

  if (checkingAvailability) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f9fafb', paddingBottom: insets.bottom }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ textAlign: 'center', marginTop: 16, color: '#666' }}>
          Checking service availability...
        </Text>
      </SafeAreaView>
    );
  }

  if (franchiseAvailable === false) {
    return null; // Redirect handled
  }

  return (
    <>{checkingAvailability === true ? (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f9fafb', paddingBottom: insets.bottom }}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ textAlign: 'center', marginTop: 16, color: '#666' }}>
          Checking service availability...
        </Text>
      </SafeAreaView>
      ) : (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', paddingBottom: insets.bottom }}>
      <StatusBar barStyle="dark-content" />

      {/* Show WebView Full Screen */}
    {showWebView && webViewHtml ? (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' }}>
          <TouchableOpacity onPress={() => setShowWebView(false)}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>Secure Payment</Text>
        </View>
        <WebView
          source={{ html: webViewHtml }}
          onMessage={(event) => {
            try {
              const msg = JSON.parse(event.nativeEvent.data);
              if (msg.type === 'success') {
                verifyAndCreateBooking(msg.payload, data.total);
                setShowWebView(false);
              } else if (msg.type === 'cancel') {
                setShowWebView(false);
                setShowPayOnlineOnly(true);
              }
            } catch (e) {
              console.log("Parse error:", e);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#22c55e" />
            </View>
          )}
        />
      </View>
    ) : (
      <>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '600', flex: 1, textAlign: 'center' }}>
          Payment
        </Text>
      </View>

      {/* Payment Options */}
      {!showPayOnlineOnly ? (
        <>
          <View style={{ padding: 16 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                backgroundColor: '#fff',
                padding: 20,
                borderRadius: 12,
                marginBottom: 16,
              }}
              onPress={() => setMethod('pay after service')}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#22c55e',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {method === 'pay after service' && (
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e' }} />
                )}
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={{ fontWeight: '600' }}>Pay After Service</Text>
                <Text style={{ color: '#666' }}>Pay when partner arrives</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                backgroundColor: '#fff',
                padding: 20,
                borderRadius: 12,
              }}
              onPress={() => setMethod('pay online')}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#22c55e',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {method === 'pay online' && (
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e' }} />
                )}
              </View>
              <View style={{ marginLeft: 16 }}>
                <Text style={{ fontWeight: '600' }}>Pay Online Now</Text>
                <Text style={{ color: '#666' }}>UPI, Card, Wallet</Text>
              </View>
            </TouchableOpacity>

            {method === 'pay online' && (
              <View style={{ marginTop: 16, backgroundColor: '#fff', padding: 16, borderRadius: 12 }}>
                <Text style={{ fontWeight: '600' }}>Amount: ₹{data.total}</Text>
              </View>
            )}
          </View>

          <View style={{ padding: 16, backgroundColor: '#fff' }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#22c55e',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
              }}
              onPress={method === 'pay online' ? initiatePayment : handlePayAfter}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600' }}>CONFIRM & BOOK</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
          <Text style={{ textAlign: 'center', marginBottom: 16 }}>
            Payment failed. Try again.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#22c55e',
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
            onPress={retryPayOnline}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600' }}>RETRY PAYMENT</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Toast />
</>
    )}
    </SafeAreaView>
    )}
    </>
  );
}