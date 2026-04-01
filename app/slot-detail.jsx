// SlotDetailScreen.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import Toast from 'react-native-toast-message';
import { RefreshControl } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
 
// ─── Angle display labels ─────────────────────────────────────────────────────
// Maps the model's camelCase keys to readable labels shown in the carousel header
const ANGLE_LABELS = {
  front:     'Front',
  back:      'Back',
  leftSide:  'Left Side',
  rightSide: 'Right Side',
};

// ─── extractPhotos ────────────────────────────────────────────────────────────
// Converts the model's { front: {url, uploadedAt}, back: {...}, ... } shape
// into a flat array of { url, angle, label } keeping only angles that have a URL.
// Order is always: front → back → leftSide → rightSide
const extractPhotos = (photoSection) => {
  if (!photoSection) return [];
  const order = ['front', 'back', 'leftSide', 'rightSide'];
  return order
    .map((angle) => ({
      url:   photoSection[angle]?.url ?? null,
      angle,
      label: ANGLE_LABELS[angle],
    }))
    .filter((p) => Boolean(p.url)); // only keep uploaded photos
};

// ─────────────────────────────────────────────────────────────────────────────
// PhotoGallerySection
// Renders the Before or After block that matches the sketch:
//   ┌────────────────────────────────┐
//   │ [Before]                       │  ← label badge
//   │   <large primary photo>        │
//   │  ┌──────┐ ┌──────┐ ┌──────┐   │  ← thumbnail strip
//   │  │      │ │      │ │ +N   │   │
//   │  └──────┘ └──────┘ └──────┘   │
//   └────────────────────────────────┘
//
// Props:
//   title       – "Before" | "After"
//   badgeColor  – background colour of the title badge
//   photos      – array from extractPhotos()
//   onPhotoPress(startIndex) – opens the full-screen carousel at startIndex
// ─────────────────────────────────────────────────────────────────────────────
const PhotoGallerySection = ({ title, badgeColor, photos, onPhotoPress }) => {
  const hasPhotos = photos.length > 0;
 
  // Thumbnails shown in the strip: first 2 after the primary
  const thumbPhotos   = photos.slice(1, 3);   // indices 1 and 2
  const overflowCount = photos.length - 3;     // anything beyond index 2
 
  return (
    <View style={{ flex: 1 }}>
      {/* ── Primary (large) photo ── */}
      <TouchableOpacity
        onPress={() => hasPhotos && onPhotoPress(0)}
        disabled={!hasPhotos}
        activeOpacity={0.9}
        style={{ borderRadius: 16, overflow: 'hidden' }}
      >
        {hasPhotos ? (
          // Show the first uploaded photo as the hero image
          <Image
            source={{ uri: photos[0].url }}
            style={{ width: '100%', aspectRatio: 1, borderRadius: 16 }}
            resizeMode="cover"
          />
        ) : (
          // Placeholder when no photos exist yet
          <LinearGradient
            colors={title === 'Before' ? ['#F3F4F6', '#E5E7EB'] : ['#DBEAFE', '#BFDBFE']}
            style={{ aspectRatio: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}
          >
            <MaterialCommunityIcons
              name={title === 'Before' ? 'car-side' : 'car-sports'}
              size={48}
              color={title === 'Before' ? '#9CA3AF' : '#3B82F6'}
            />
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>No photos yet</Text>
          </LinearGradient>
        )}
 
        {/* Label badge pinned top-left */}
        <View style={{
          position: 'absolute', top: 12, left: 12,
          backgroundColor: badgeColor,
          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
        }}>
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>{title}</Text>
        </View>
 
        {/* Angle label for the primary photo, pinned bottom-left */}
        {hasPhotos && (
          <View style={{
            position: 'absolute', bottom: 8, left: 8,
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
          }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
              {photos[0].label}
            </Text>
          </View>
        )}
      </TouchableOpacity>
 
      {/* ── Thumbnail strip (only when there are 2+ photos) ── */}
      {photos.length > 1 && (
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          {thumbPhotos.map((photo, thumbIdx) => {
            const originalIndex = thumbIdx + 1; // offset because primary is index 0
            return (
              <TouchableOpacity
                key={photo.angle}
                onPress={() => onPhotoPress(originalIndex)}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  overflow: 'hidden',
                  aspectRatio: 1,
                  maxHeight: 64,
                }}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                {/* Angle micro-label */}
                <View style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  paddingVertical: 2, alignItems: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '600' }}>{photo.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
 
          {/* +N overflow badge – tapping opens carousel at index 3 */}
          {overflowCount > 0 && (
            <TouchableOpacity
              onPress={() => onPhotoPress(3)}
              activeOpacity={0.85}
              style={{
                flex: 1,
                borderRadius: 10,
                overflow: 'hidden',
                aspectRatio: 1,
                maxHeight: 64,
                backgroundColor: 'rgba(0,0,0,0.65)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Show the 4th photo blurred behind the count */}
              <Image
                source={{ uri: photos[3]?.url }}
                style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.4 }}
                resizeMode="cover"
              />
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
                +{overflowCount}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};
 
// ─────────────────────────────────────────────────────────────────────────────
// FullscreenCarousel
// Full-screen paged FlatList carousel that opens when the user taps a photo.
// Shows the angle label below the image and a dot indicator at the bottom.
// Closes via the X button or the Android back gesture.
//
// Props:
//   visible            – boolean
//   photos             – flat array { url, angle, label }
//   initialIndex       – which photo to start on
//   sectionTitle       – "Before" | "After" shown in the header
//   onClose            – callback to hide the modal
// ─────────────────────────────────────────────────────────────────────────────
const FullscreenCarousel = ({ visible, photos, initialIndex, sectionTitle, onClose }) => {
  const flatListRef     = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex ?? 0);
 
  // Scroll to the tapped photo once the FlatList has mounted
  useEffect(() => {
    if (visible && flatListRef.current && photos.length > 0) {
      // Small timeout lets the FlatList fully render before scrolling
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index:    initialIndex ?? 0,
          animated: false,
        });
        setCurrentIndex(initialIndex ?? 0);
      }, 80);
    }
  }, [visible, initialIndex]);
 
  if (!visible || photos.length === 0) return null;
 
  const handleScroll = (event) => {
    const offsetX    = event.nativeEvent.contentOffset.x;
    const newIndex   = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(newIndex);
  };
 
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
 
        {/* ── Top bar ── */}
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingTop:        Platform.OS === 'ios' ? 54 : 44,
          paddingBottom:     14,
          paddingHorizontal: 16,
          backgroundColor:   'rgba(0,0,0,0.5)',
        }}>
          {/* Section title + angle label */}
          <View>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {sectionTitle} Photos
            </Text>
            {photos[currentIndex] && (
              <Text style={{ color: '#D1D5DB', fontSize: 13, marginTop: 2 }}>
                {photos[currentIndex].label}  ·  {currentIndex + 1} / {photos.length}
              </Text>
            )}
          </View>
 
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: 'rgba(255,255,255,0.15)',
              justifyContent: 'center', alignItems: 'center',
            }}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
 
        {/* ── Paged photo list ── */}
        <FlatList
          ref={flatListRef}
          data={photos}
          keyExtractor={(item) => item.angle}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index,
          })}
          renderItem={({ item }) => (
            <View style={{
              width:           SCREEN_WIDTH,
              height:          SCREEN_HEIGHT,
              justifyContent:  'center',
              alignItems:      'center',
            }}>
              <Image
                source={{ uri: item.url }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 }}
                resizeMode="contain"
              />
              {/* Angle label beneath photo */}
              <View style={{
                marginTop:       16,
                backgroundColor: 'rgba(255,255,255,0.12)',
                paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
              }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                  {item.label}
                </Text>
              </View>
            </View>
          )}
        />
 
        {/* ── Dot indicator ── */}
        {photos.length > 1 && (
          <View style={{
            position:        'absolute',
            bottom:          Platform.OS === 'ios' ? 50 : 32,
            left: 0, right: 0,
            flexDirection:   'row',
            justifyContent:  'center',
            gap:             8,
          }}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={{
                  width:           i === currentIndex ? 20 : 8,
                  height:          8,
                  borderRadius:    4,
                  backgroundColor: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

export default function SlotDetailScreen() {
  const router = useRouter();
  const { subscriptionData } = useLocalSearchParams();
  const bookingAndSubscriptionIdData = subscriptionData ? JSON.parse(subscriptionData) : null;
  console.log('Received subscriptionData:', bookingAndSubscriptionIdData);

  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // ── Carousel state ─────────────────────────────────────────────────────────
  // carouselSection: 'before' | 'after'  – which section was tapped
  // carouselIndex:   number              – which photo inside that section
  const [carouselVisible, setCarouselVisible] = useState(false);
  const [carouselSection, setCarouselSection] = useState('before');
  const [carouselIndex, setCarouselIndex]     = useState(0);

  // ==================== FETCH SLOT DETAIL ====================
  const fetchSlot = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    if (isRefresh) setRefreshing(true);

    try {
      const res = await api.get(`/bookings/subscription-jobs/${bookingAndSubscriptionIdData?.id}`);   // ← Your backend endpoint
      setSlot(res.data);
      setError('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load slot details';
      setError(msg);
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (bookingAndSubscriptionIdData?.id) fetchSlot();
  }, [bookingAndSubscriptionIdData?.id]);

  const onRefresh = useCallback(() => {
    fetchSlot(true);
  }, [bookingAndSubscriptionIdData?.id]);

  // ── Photo arrays (derived from the slot once loaded) ──────────────────────
  const beforePhotos = extractPhotos(slot?.beforePhotos);
  const afterPhotos  = extractPhotos(slot?.afterPhotos);
 
  // ── Open carousel helper ───────────────────────────────────────────────────
  const openCarousel = (section, index) => {
    setCarouselSection(section);
    setCarouselIndex(index);
    setCarouselVisible(true);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#EF4444" />
      </SafeAreaView>
    );
  }

  if (error && !slot) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Ionicons name="alert-circle-outline" size={80} color="#EF4444" />
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16 }}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={{ marginTop: 24, backgroundColor: '#EF4444', padding: 14, borderRadius: 12 }}>
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isCompleted = slot?.status === 'completed';
  console.log('Fetched slot details:', slot);

  // Photos exist only once the partner has uploaded at least one
  const hasAnyBeforePhoto = beforePhotos.length > 0;
  const hasAnyAfterPhoto  = afterPhotos.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }} edges={['top']}>
      {/* Header - YOUR EXACT UI */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFF',
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: '#1F2937',
        }}>
          Service Details
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EF4444']} />}
      >
        {/* ══════════════════════════════════════════════════════════════
            Before & After Photo Gallery
            Matches sketch: side-by-side cards, large primary + thumbnail strip
            ════════════════════════════════════════════════════════════ */}
        <View style={{ flexDirection: 'row', padding: 16, gap: 12 }}>
          {/* Before section */}
          <View style={{ flex: 1 }}>
            <PhotoGallerySection
              title="Before"
              badgeColor="#1F2937"
              photos={beforePhotos}
              onPhotoPress={(index) => openCarousel('before', index)}
            />
          </View>
 
          {/* After section */}
          <View style={{ flex: 1 }}>
            <PhotoGallerySection
              title="After"
              badgeColor="#3B82F6"
              photos={afterPhotos}
              onPhotoPress={(index) => openCarousel('after', index)}
            />
          </View>
        </View>
 
        {/* Small info hint when no photos exist yet */}
        {!hasAnyBeforePhoto && !hasAnyAfterPhoto && (
          <View style={{
            marginHorizontal: 16, marginTop: -4, marginBottom: 12,
            backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10,
            flexDirection: 'row', alignItems: 'center', gap: 8,
          }}>
            <Ionicons name="information-circle-outline" size={18} color="#D97706" />
            <Text style={{ fontSize: 12, color: '#92400E', flex: 1, lineHeight: 17 }}>
              Photos will appear here once the partner uploads them before and after the service.
            </Text>
          </View>
        )}

        {/* Service Info Card - YOUR EXACT UI + Real Data */}
        <View style={{ backgroundColor: '#FFF', marginHorizontal: 16, padding: 24, borderRadius: 16 }}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 4 }}>
              Date: {slot?.date}
            </Text>
            <Text style={{ fontSize: 16, color: '#6B7280' }}>
              Time: {slot?.time}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              backgroundColor: slot?.status === 'completed' ? '#D1FAE5' : '#FEF3C7',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: slot?.status === 'completed' ? '#059669' : '#D97706',
              }}>
                {slot?.status?.toUpperCase()}
              </Text>
            </View>

            {isCompleted && (
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>
                Completed at {slot?.completedAt || 'N/A'}
              </Text>
            )}
          </View>
        </View>

        {/* ── IS SLOT RESCHEDULED ─────────────────────────────────── */}
          {slot?.isRescheduled === true && (
          <View style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D', borderBottomWidth: 1, borderBottomColor: '#FCD34D', margin: 16, padding: 16, borderRadius: 12, flexDirection: 'row' }}>
            <FontAwesome6 name="clock-rotate-left" size={24} color="#D97706" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: '#92400E', fontWeight: '700', fontSize: 16 }}>This Service Slot has Rescheduled</Text>
              <Text style={{ color: '#92400E', fontSize: 16, marginTop: 4 }}>from {new Date(slot?.beforeRescheduledDate).toLocaleDateString('en-GB')} {`--->`} {new Date(slot?.scheduledDate).toLocaleDateString('en-GB')}</Text>
            </View>
          </View>
          )}

        {/* Assigned Partner */}
<View style={{ paddingHorizontal: 16, marginTop: 24 }}>
  <Text
    style={{
      fontSize: 18,
      fontWeight: "700",
      color: "#1F2937",
      marginBottom: 12,
    }}
  >
    Assigned Partner
  </Text>

  {slot?.partner ? (
    // ✅ Existing Partner Card — unchanged
    <View
      style={{
        backgroundColor: "#FFF",
        padding: 20,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#FEE2E2",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="person" size={28} color="#EF4444" />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#1F2937",
            marginBottom: 4,
          }}
        >
          {slot?.partner?.name}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Ionicons name="call" size={16} color="#EF4444" />
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#6B7280" }}>
            {slot?.partner?.phone}
          </Text>
        </View>
      </View>
    </View>
  ) : (
    // ✅ No Partner Assigned — Highlighted Message
    <View
      style={{
        backgroundColor: "#FFFBEB",
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: "#FCD34D",
        borderStyle: "dashed",
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: "#FEF3C7",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="person-outline" size={26} color="#D97706" />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: "#92400E",
            marginBottom: 4,
          }}
        >
          No Partner Assigned Yet
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: "#B45309",
            fontWeight: "500",
            lineHeight: 18,
          }}
        >
          We will assign a partner to your booking soon!
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#FEF3C7",
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 20,
        }}
      >
        <Ionicons name="time-outline" size={20} color="#D97706" />
      </View>
    </View>
  )}
</View>

        {/* Service Location - YOUR EXACT UI */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>Service Location</Text>
          <View style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="location" size={24} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
                {bookingAndSubscriptionIdData?.subscriptionBookingDetails?.serviceLocation.address}
              </Text>
              <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{bookingAndSubscriptionIdData?.subscriptionBookingDetails?.serviceLocation.label}</Text>
            </View>
          </View>
        </View>

        {/* Service Details - YOUR EXACT UI + Real Data */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>Service Details</Text>
          <View style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 16, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, color: '#6B7280' }}>Service Type</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>{slot?.type || 'Exterior Wash'}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, color: '#6B7280' }}>Duration</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#1F2937' }}>60 minutes</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, color: '#6B7280' }}>Status</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: slot?.status === 'completed' ? '#059669' : '#D97706', }}>{slot?.status?.toUpperCase() || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Buttons - YOUR EXACT UI */}
      <View style={{
        position: 'absolute',
        bottom: 5,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 16,
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
      }}>

        <TouchableOpacity style={{
          flex: 1,
          backgroundColor: '#EF4444',
          padding: 16,
          borderRadius: 12,
          alignItems: 'center',
        }}
          onPress={() => router.push("/services")}
        >
          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Book New Service</Text>
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════════════
          Full-screen carousel modal
          Mounts above everything; FlatList pages through the photos
          of whichever section the user tapped (before or after).
          ════════════════════════════════════════════════════════════ */}
      <FullscreenCarousel
        visible={carouselVisible}
        photos={carouselSection === 'before' ? beforePhotos : afterPhotos}
        initialIndex={carouselIndex}
        sectionTitle={carouselSection === 'before' ? 'Before' : 'After'}
        onClose={() => setCarouselVisible(false)}
      />
    </SafeAreaView>
  );
}