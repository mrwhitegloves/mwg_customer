// app/login.jsx
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAppDispatch } from '../store/hooks';
import { loginSuccess } from '../store/slices/authSlice';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const otpInputRef = useRef(null);

  const [phoneNumber, setPhoneNumber] = useState(''); // Only 10 digits
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showOtp, setShowOtp] = useState('');

  const fullPhone = `91${phoneNumber.replace(/\D/g, '')}`; // Always +91 + number

  const changeNumber = () => {
  setIsOtpSent(false);
  setOtp('');
  setError('');
  setResendTimer(0);
  setShowOtp('');
};


  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/send-otp', { phone: fullPhone });
      setIsOtpSent(true);
      setShowOtp(response?.data?.user?.otp)
      startResendTimer();
      otpInputRef.current?.focus();
      Toast.show({
        type: 'success',
        text1: 'OTP Sent!',
        text2: `Check your ${fullPhone} whatsapp number`
      });
    } catch (err) {
      console.log("login error: ",err)
      const msg = err.response?.data?.error || 'Failed to send OTP. Try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-otp', { phone: fullPhone, otp });
      const { token, user, redirect } = response.data;

      dispatch(loginSuccess({ token, user }));
      await AsyncStorage.setItem('authToken', token);

      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: `Logged in as ${user.name || fullPhone}`
      });

      router.replace(redirect || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = () => {
    if (resendTimer > 0) return;
    sendOtp();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingBottom: insets.bottom }}>
      <StatusBar barStyle="dark-content" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20 }}>
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
            <Ionicons name="arrow-back" size={28} color="#000" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#1A202C', marginBottom: 8 }}>
            Welcome Back
          </Text>
          <Text style={{ fontSize: 16, color: '#64748B', marginBottom: 32 }}>
            Login With Your <Text style={{ fontSize: 16, fontWeight: '500', color: '#e31111ff', marginBottom: 32 }}>Registered Whatsapp Number</Text>
          </Text>

          {/* Phone Input with +91 Fixed */}
          <View style={{ marginBottom: 16 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: 16,
              height: 58,
              borderWidth: 1,
              borderColor: error && !isOtpSent ? '#EF4444' : '#E2E8F0',
              overflow: 'hidden'
            }}>
              {/* +91 Fixed */}
              <View style={{
                backgroundColor: '#E0E7FF',
                paddingHorizontal: 16,
                justifyContent: 'center',
                height: '100%',
                borderRightWidth: 1,
                borderRightColor: '#C7D2FE'
              }}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: '#4F46E5' }}>+91</Text>
              </View>

              {/* Number Input */}
              <TextInput
                placeholder="98765 43210"
                value={phoneNumber}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, '').slice(0, 10);
                  setPhoneNumber(digits);
                  setError('');
                }}
                placeholderTextColor="#c4c3c3ff"
                keyboardType="numeric"
                maxLength={10}
                style={{
                  flex: 1,
                  fontSize: 18,
                  color: '#1A202C',
                  paddingHorizontal: 16,
                  letterSpacing: 1
                }}
                editable={!isOtpSent}
                selectTextOnFocus={!isOtpSent}
              />
              {isOtpSent && (
                <View style={{ paddingRight: 16 }}>
                  <Ionicons name="checkmark-circle" size={26} color="#10B981" />
                </View>
              )}
            </View>
            {/* Change Number Button (Only after OTP sent) */}
{isOtpSent && (
  <TouchableOpacity
    onPress={changeNumber}
    style={{
      marginTop: 8,
      alignSelf: 'flex-end',
      flexDirection: 'row',
      alignItems: 'center'
    }}
  >
    <Ionicons name="create-outline" size={18} color="#5B6DF5" />
    <Text style={{
      color: '#5B6DF5',
      fontWeight: '600',
      fontSize: 14,
      marginLeft: 6
    }}>
      Change number
    </Text>
  </TouchableOpacity>
)}


            {/* Send OTP Button */}
            {!isOtpSent && (
              <TouchableOpacity
                onPress={sendOtp}
                disabled={loading || phoneNumber.length !== 10}
                style={{
                  backgroundColor: phoneNumber.length === 10 ? '#5B6DF5' : '#94A3B8',
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  marginTop: 12,
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Send OTP</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* OTP Input */}
          {isOtpSent && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 8 }}>
                Enter the 6-digit OTP here:
              </Text>
              <View style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 58,
                borderWidth: 1,
                borderColor: error ? '#EF4444' : '#E2E8F0',
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Ionicons name="lock-closed-outline" size={22} color="#64748B" style={{ marginRight: 12 }} />
                <TextInput
                  ref={otpInputRef}
                  placeholder="------"
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                    setError('');
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholderTextColor="#c4c3c3ff"
                  style={{ flex: 1, fontSize: 22, letterSpacing: 10, color: '#1A202C' }}
                />
              </View>

              {/* Resend OTP */}
              <TouchableOpacity
                onPress={resendOtp}
                disabled={resendTimer > 0}
                style={{ alignSelf: 'flex-end', marginTop: 8 }}
              >
                <Text style={{
                  color: resendTimer > 0 ? '#94A3B8' : '#5B6DF5',
                  fontWeight: '600',
                  fontSize: 14
                }}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Message */}
          {error ? (
            <View style={{
              backgroundColor: '#FEE2E2',
              padding: 14,
              borderRadius: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={{ color: '#991B1B', marginLeft: 8, fontSize: 14, flex: 1 }}>
                {error}
              </Text>
              <TouchableOpacity onPress={() => setError('')}>
                <Ionicons name="close" size={20} color="#991B1B" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Verify Button */}
          {isOtpSent && (
            <TouchableOpacity
              onPress={verifyOtp}
              disabled={loading || otp.length !== 6}
              style={{
                backgroundColor: otp.length === 6 ? '#10B981' : '#94A3B8',
                paddingVertical: 18,
                borderRadius: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>
                    Verify & Login
                  </Text>
                  <Ionicons name="log-in" size={22} color="#fff" style={{ marginLeft: 10 }} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}