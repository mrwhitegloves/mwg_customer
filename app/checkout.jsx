// app/checkout.jsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api from '../services/api';
import { generateNext14Days, generateTimeSlots, isTimeSlotEnabled } from '../services/dateTime';
import { useAppSelector } from '../store/hooks';

export default function CheckoutScreen() {
  const router = useRouter();
  const { services } = useLocalSearchParams();
  const parsedService = services ? JSON.parse(services) : null;
  const { user, token } = useAppSelector((state) => state.auth);

  const next14Days = generateNext14Days();
  const allTimeSlots = generateTimeSlots();

  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addressModal, setAddressModal] = useState(false);
  const [addAddressModal, setAddAddressModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponDropdownOpen, setCouponDropdownOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isEditAddress, setIsEditAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);


  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    label: 'Home',
  });

  // Single service price (no quantity)
  const servicePrice = parsedService?.basePrice || 0;
  const gst = Math.round(servicePrice * 0.18);
  const convenienceFee = 50;
  const totalAmount = servicePrice + gst + convenienceFee;

  useEffect(() => {
      const fetchUser = async () => {
        const res = await api.get('/auth/me');
        setCurrentUser(res.data.user);
      };

      if (token) {
      fetchUser();
    }
    }, [token]);
    
  // === FETCH ADDRESSES ===
  const fetchAddresses = async () => {
    try {
      const res = await api.get('/auth/delivery-address');
      setAddresses(res.data.deliveryAddresses);
      if (res.data.deliveryAddresses.length > 0) {
        setSelectedAddress(res.data.deliveryAddresses[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // === FETCH COUPONS BASED ON PINCODE & PRICE ===
useEffect(() => {
  const fetchCoupons = async () => {
    if (!selectedAddress?.postalCode || !servicePrice) return;
    console.log("selectedAddress",selectedAddress)
    console.log("servicePrice",servicePrice)

    try {
      const res = await api.get('/coupons/available', {
        params: {
          pincode: selectedAddress.postalCode,
          price: servicePrice,
        },
      });
      setAvailableCoupons(res.data.coupons || []);
    } catch (err) {
      console.log('No coupons available',err);
    }
  };

  fetchCoupons();
}, [selectedAddress, servicePrice]);
console.log('Available Coupons:', availableCoupons);

// === APPLY COUPON ===
const handleApplyCoupon = async () => {
  if (!couponCode.trim()) {
    Toast.show({ type: 'error', text1: 'Enter coupon code' });
    return;
  }

  setApplyingCoupon(true);
  try {
    const res = await api.post('/coupons/apply', {
      code: couponCode.trim().toUpperCase(),
      price: servicePrice,
      pincode: selectedAddress.postalCode,
    });

    setDiscount(res.data.discount);
    setSelectedCoupon({
      code: couponCode.toUpperCase(),
      discount: res.data.discount,
    });
    Toast.show({ type: 'success', text1: 'Coupon Applied!', text2: `Saved ₹${res.data.discount}` });
  } catch (err) {
    Toast.show({ type: 'error', text1: err.response?.data?.error || 'Invalid coupon' });
    setDiscount(0);
    setSelectedCoupon(null);
  } finally {
    setApplyingCoupon(false);
  }
};

  // === ADD ADDRESS ===
  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.street || !newAddress.city || !newAddress.postalCode) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    try {
      setLoading(true);
      let res;

    if (isEditAddress && editingAddressId) {
      // ✅ UPDATE ADDRESS
      res = await api.put(`/auth/delivery-address/${editingAddressId}`, newAddress);

      setAddresses((prev) =>
        prev.map((addr) =>
          addr._id === editingAddressId ? res.data.address : addr
        )
      );

      setSelectedAddress(res.data.address);
      Toast.show({ type: 'success', text1: 'Address updated successfully' });
    } else {
      // ✅ ADD ADDRESS (existing logic)
      res = await api.post('/auth/delivery-address', newAddress);
      const added = res.data.deliveryAddresses.at(-1);
      setAddresses((prev) => [...prev, added]);
      setSelectedAddress(added);
      Toast.show({ type: 'success', text1: 'Address added successfully' });
    }

    // RESET
    setAddAddressModal(false);
    setIsEditAddress(false);
    setEditingAddressId(null);
    setNewAddress({
      name: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      label: 'Home',
    });
    setAddressModal(false);
    
      // const added = res.data.deliveryAddresses[res.data.deliveryAddresses.length - 1];
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Failed to save address' });
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!selectedDate || !selectedTime || !selectedAddress || currentUser?.vehicles == null ) {
  let missingFields = [];

  if (!selectedDate) missingFields.push('date');
  if (!selectedTime) missingFields.push('time');
  if (!selectedAddress) missingFields.push('delivery address');
  if (currentUser?.vehicles == null) missingFields.push('vehicle');

  const message = `Please select ${missingFields.join(', ').replace(/, ([^,]*)$/, ' and $1')}`;
  
  Toast.show({ type: 'error', text1: 'Incomplete', text2: message });
  return;
}

    const selectedDateObj = next14Days.find(d => d.key === selectedDate)?.date;
    if (!selectedDateObj) return;

    const year = selectedDateObj.getFullYear();
    const month = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDateObj.getDate()).padStart(2, '0');
    const scheduledDate = `${year}-${month}-${day}`;


    router.push({
      pathname: '/payment',
      params: {
        bookingData: JSON.stringify({
          currentUser: currentUser,
          service: parsedService,
          scheduledDate,
          scheduledTime: selectedTime,
          deliveryAddressId: selectedAddress._id,
          vehicleId: currentUser?.vehicles?._id,
          vehicles: currentUser?.vehicles,
          paymentType: 'pay after service',
          paymentMode: 'cash',
          total: totalAmount - discount,
          servicePrice: servicePrice,
          tax: gst,
          charges: convenienceFee,
          discount: discount,
          couponCode: selectedCoupon ? selectedCoupon.code : null,
          userSelectedAddress: selectedAddress,
        }),
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '600' }}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Service */}
        <View style={{ flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <Image source={{ uri: parsedService?.imageUrl }} style={{ width: 80, height: 80, borderRadius: 8 }} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{parsedService?.name}</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', marginTop: 8 }}>₹{servicePrice}</Text>
          </View>
        </View>

        {/* Date */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', letterSpacing: 0.5, marginBottom: 12 }}>
            SERVICE DATE
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {next14Days.map(({ key, date }) => {
              const isSelected = selectedDate === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: isSelected ? '#EF4444' : '#F9FAFB',
                    borderWidth: 1,
                    borderColor: isSelected ? '#ea3939ff' : '#E5E7EB',
                    marginRight: 12,
                    alignItems: 'center',
                    minWidth: 80,
                  }}
                  onPress={() => setSelectedDate(key)}
                >
                  <Text style={{ fontSize: 14, color: isSelected ? '#FFFFFF' : '#6B7280' }}>
                    {date.toLocaleString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: isSelected ? '#FFFFFF' : '#111827' }}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', letterSpacing: 0.5, marginBottom: 12 }}>
            SERVICE TIME
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {allTimeSlots.map((slot) => {
              const enabled = isTimeSlotEnabled(slot, selectedDate);
              const isSelected = selectedTime === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  disabled={!enabled}
                  style={{
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 8,
                    backgroundColor: isSelected ? '#ffefefff' : '#F9FAFB',
                    borderWidth: 1,
                    borderColor: isSelected ? '#EF4444' : '#E5E7EB',
                    opacity: enabled ? 1 : 0.4,
                  }}
                  onPress={() => enabled && setSelectedTime(slot)}
                >
                  <Text
                    style={[
                      { fontSize: 14, color: isSelected ? '#EF4444' : '#111827' },
                      !enabled && { color: '#9CA3AF' },
                      isSelected && { fontWeight: '600' },
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Address */}
        <View style={{ padding: 16 }}>
          <Text style={{ fontWeight: '600', color: '#666', marginBottom: 12 }}>DELIVERY ADDRESS</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', padding: 16, backgroundColor: '#f9f9f9', borderRadius: 12, alignItems: 'flex-start' }}
            onPress={() => setAddressModal(true)}
          >
            {selectedAddress ? (
              <>
                <Ionicons name="location" size={24} color="#EF4444" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>{selectedAddress.name}</Text>
                  <Text style={{ fontSize: 13, color: '#666' }}>{selectedAddress.street}, {selectedAddress.city}</Text>
                  <Text style={{ fontSize: 13, color: '#666' }}>{selectedAddress?.state}, {selectedAddress?.postalCode}</Text>
                  <Text style={{ fontSize: 13, color: '#666' }}>{selectedAddress.phone}</Text>
                </View>
              </>
            ) : (
              <Text style={{ color: '#999', flex: 1 }}>Tap to select address</Text>
            )}
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Vehicle */}
        <View style={{ padding: 16 }}>
          <Text style={{ fontWeight: '600', color: '#666', marginBottom: 12 }}>VEHICLE DETAILS</Text>
          <View
            style={{ flexDirection: 'row', padding: 16, backgroundColor: '#f9f9f9', borderRadius: 12, alignItems: 'flex-start' }}
          >
            {currentUser?.vehicles && currentUser?.vehicles !== null ? (
              <>
                <Ionicons name="car" size={24} color="#EF4444" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>RC: {currentUser?.vehicles?.registrationNumber}</Text>
                  <Text style={{ fontSize: 13, color: '#666' }}>Brand: {currentUser?.vehicles?.make}</Text>
                  <Text style={{ fontSize: 13, color: '#666' }}>Model: {currentUser?.vehicles?.model}</Text>
                  <Text style={{ fontSize: 13, color: '#666' }}>Segment: {currentUser?.vehicles?.type}</Text>
                </View>
              </>
            ) : (
              <Text style={{ color: '#999', flex: 1 }}>Please add your vehicle details first</Text>
            )}
          </View>
        </View>

        {/* COUPONS SECTION */}
<View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#eee' }}>
  <Text style={{ fontWeight: '600', color: '#666', marginBottom: 12 }}>APPLY COUPON</Text>

  {/* Dropdown List of Available Coupons */}
  {availableCoupons.length > 0 && (
    <View style={{ marginBottom: 16 }}>
      <TouchableOpacity
        style={{
          backgroundColor: '#f0f9ff',
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#0ea5e9',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onPress={() => setCouponDropdownOpen(!couponDropdownOpen)}
      >
        <Text style={{ color: '#0369a1', fontWeight: '600' }}>
          {availableCoupons.length} coupon(s) available
        </Text>
        <Ionicons name={couponDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#0369a1" />
      </TouchableOpacity>

      {couponDropdownOpen && (
        <View style={{ marginTop: 8, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee' }}>
          {availableCoupons.map((coupon) => (
            <TouchableOpacity
              key={coupon._id}
              style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
              onPress={() => {
                setCouponCode(coupon.code);
                setCouponDropdownOpen(false);
                // handleApplyCoupon();
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', color: '#1e40af' }}>{coupon.code}</Text>
                <Text style={{ color: '#16a34a' }}>
                  {coupon.discountType === 'Percentage'
                    ? `${coupon.discountValue}% off`
                    : `₹${coupon.discountValue} off`}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {coupon.name} • Min ₹{coupon.minAmount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )}

  {/* Manual Coupon Input */}
  <View style={{ flexDirection: 'row', gap: 10 }}>
    <TextInput
      style={{
        flex: 1,
        color: '#1A202C',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#f9f9f9',
      }}
      placeholder="Enter coupon code"
      placeholderTextColor="#c4c3c3ff"
      value={couponCode}
      onChangeText={setCouponCode}
      autoCapitalize="characters"
    />
    <TouchableOpacity
      style={{
        backgroundColor: applyingCoupon ? '#94a3b8' : '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
      }}
      onPress={handleApplyCoupon}
      disabled={applyingCoupon}
    >
      {applyingCoupon ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ color: '#fff', fontWeight: '600' }}>APPLY</Text>
      )}
    </TouchableOpacity>
  </View>

  {/* Applied Coupon Display */}
  {selectedCoupon && (
    <View style={{ marginTop: 12, padding: 12, backgroundColor: '#dcfce7', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: '#166534', fontWeight: '600' }}>
        Coupon Applied: {selectedCoupon.code}
      </Text>
      <Text style={{ color: '#166534', fontWeight: '700' }}>
        -₹{selectedCoupon.discount}
      </Text>
    </View>
  )}
</View>

        {/* Bill */}
        <View style={{ padding: 16, marginBottom: 20 }}>
          <Text style={{ fontWeight: '600', color: '#666', marginBottom: 12 }}>BILL DETAILS</Text>
          <View style={{ backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>Service Price</Text>
              <Text>₹{servicePrice}.00</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>GST (18%)</Text>
              <Text>₹{gst}.00</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>Convenience Fee</Text>
              <Text>₹{convenienceFee}.00</Text>
            </View>
            {/* DISCOUNT */}
    {discount > 0 && (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: '#16a34a' }}>Discount Applied</Text>
        <Text style={{ color: '#16a34a', fontWeight: '700' }}>-₹{discount}</Text>
      </View>
    )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' }}>
              <Text style={{ fontWeight: '600' }}>Total Amount</Text>
              <Text style={{ fontWeight: '700', color: '#22C55E' }}>₹{totalAmount - discount}.00</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Proceed Button */}
      <View style={{ padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' }}>
        <TouchableOpacity
          style={{ backgroundColor: '#EF4444', padding: 16, borderRadius: 12, alignItems: 'center' }}
          onPress={handleProceed}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>PROCEED TO PAYMENT</Text>
        </TouchableOpacity>
      </View>

      {/* Address Modal */}
      <Modal visible={addressModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
              <Text style={{ fontWeight: '600', fontSize: 18 }}>Select Address</Text>
              <TouchableOpacity 
                onPress={() => setAddressModal(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {addresses.map((addr) => (
                <View
  key={addr._id}
  style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: selectedAddress?._id === addr._id ? '#EF4444' : '#f0f0f0', backgroundColor: selectedAddress?._id === addr._id ? '#ffefefff' : '#fff', borderColor: selectedAddress?._id === addr._id ? '#EF4444' : '#eee', borderWidth: selectedAddress?._id === addr._id ? 1 : 0, borderRadius: 8, margin: 8, marginBottom: selectedAddress?._id === addr._id ? 5 : 0 }}
>
                <TouchableOpacity
                  // style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: selectedAddress?._id === addr._id ? '#EF4444' : '#f0f0f0', backgroundColor: selectedAddress?._id === addr._id ? '#ffefefff' : '#fff', borderColor: selectedAddress?._id === addr._id ? '#EF4444' : '#eee', borderWidth: selectedAddress?._id === addr._id ? 1 : 0, borderRadius: 8, margin: 8, marginBottom: selectedAddress?._id === addr._id ? 5 : 0 }}
                  onPress={() => {
                    setSelectedAddress(addr);
                    setAddressModal(false);
                  }}
                >
                  <Text style={{ fontWeight: '600' }}>{addr.name}</Text>
                  <Text style={{ fontSize: 13, color: '#666' }}>{addr.street}, {addr.city}</Text>
                  <Text style={{ fontSize: 13, color: '#666' }}>{addr?.state}, {addr?.postalCode}</Text>
                  <Text style={{ fontSize: 13, color: '#666' }}>{addr.phone}</Text>
                </TouchableOpacity>

                {/* ✏️ EDIT BUTTON */}
  <TouchableOpacity
    style={{ position: 'absolute', top: 12, right: 12 }}
    onPress={() => {
      setIsEditAddress(true);
      setEditingAddressId(addr._id);
      setNewAddress({
        name: addr.name,
        phone: addr.phone,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        label: addr.label || 'Home',
      });
      setAddressModal(false);
      setAddAddressModal(true);
    }}
  >
    <Ionicons name="pencil" size={18} color="#2563EB" />
  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={{ backgroundColor: '#EF4444', margin: 16, padding: 14, borderRadius: 12, alignItems: 'center' }}
              onPress={() => {
                setAddressModal(false);
                setAddAddressModal(true);
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>+ Add New Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Address Modal */}
      {/* Add Address Modal - FULLY KEYBOARD-AWARE & SCROLLABLE */}
<Modal visible={addAddressModal} transparent animationType="slide">
  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
    <View
      style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '92%',
        // Remove flex:1 here — let KeyboardAwareScrollView handle it
      }}
    >
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        padding: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee' 
      }}>
        <Text style={{ fontWeight: '600', fontSize: 18 }}>
  {isEditAddress ? 'Edit Address' : 'Add Address'}
</Text>
        <TouchableOpacity 
          onPress={() => {
            setAddAddressModal(false);
            setIsEditAddress(false);
            setEditingAddressId(null);
            setNewAddress({
              name: '',
              phone: '',
              street: '',
              city: '',
              state: '',
              postalCode: '',
              label: 'Home',
            });
          }}
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* KEYBOARD AWARE SCROLL VIEW — THIS IS THE MAGIC */}
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraHeight={120}
        keyboardOpeningTime={250}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          placeholder="Name*"
          style={styles.input}
          placeholderTextColor="#999"
          value={newAddress.name}
          onChangeText={(t) => setNewAddress({ ...newAddress, name: t })}
        />
        <TextInput
          placeholder="Phone*"
          style={styles.input}
          placeholderTextColor="#999"
          value={newAddress.phone}
          onChangeText={(t) => setNewAddress({ ...newAddress, phone: t })}
          keyboardType="phone-pad"
        />
        <TextInput
          placeholder="Street*"
          style={styles.input}
          placeholderTextColor="#999"
          value={newAddress.street}
          onChangeText={(t) => setNewAddress({ ...newAddress, street: t })}
        />
        <TextInput
          placeholder="City*"
          style={styles.input}
          placeholderTextColor="#999"
          value={newAddress.city}
          onChangeText={(t) => setNewAddress({ ...newAddress, city: t })}
        />
        <TextInput
          placeholder="State (optional)"
          style={styles.input}
          placeholderTextColor="#999"
          value={newAddress.state}
          onChangeText={(t) => setNewAddress({ ...newAddress, state: t })}
        />
        <TextInput
          placeholder="Postal Code*"
          style={styles.input}
          placeholderTextColor="#999"
          value={newAddress.postalCode}
          onChangeText={(t) => setNewAddress({ ...newAddress, postalCode: t })}
          keyboardType="numeric"
        />

        {/* Address Label Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          {['Home', 'Office', 'Other'].map((label) => (
            <TouchableOpacity
              key={label}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: newAddress.label === label ? '#2563EB' : '#eee',
                backgroundColor: newAddress.label === label ? '#EFF6FF' : '#fff',
                alignItems: 'center',
              }}
              onPress={() => setNewAddress({ ...newAddress, label })}
            >
              <Text style={{ color: newAddress.label === label ? '#2563EB' : '#666' }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </KeyboardAwareScrollView>

      {/* FIXED BOTTOM BUTTONS (Always visible) */}
      <View style={{ 
        padding: 20, 
        paddingBottom: 30, 
        borderTopWidth: 1, 
        borderTopColor: '#eee',
        backgroundColor: '#fff'
      }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: '#fee2e2', padding: 16, borderRadius: 12 }}
            onPress={() => {
              setAddAddressModal(false);
              setIsEditAddress(false);
              setEditingAddressId(null);
              setNewAddress({
                name: '',
                phone: '',
                street: '',
                city: '',
                state: '',
                postalCode: '',
                label: 'Home',
              });
            }}
          >
            <Text style={{ color: '#ef4444', textAlign: 'center', fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: '#22c55e', padding: 16, borderRadius: 12 }}
            onPress={handleAddAddress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
</Modal>
    </SafeAreaView>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
};