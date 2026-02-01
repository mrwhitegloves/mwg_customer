// app/BookingSuccessScreen.jsx
import { font, radius, spacing } from '@/services/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef } from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BookingSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookingData } = useLocalSearchParams();

  const player = useVideoPlayer(require('../assets/images/success_video.mp4'));
  const explosion = useRef(null);

  // Auto-play once when component mounts
  useEffect(() => {
    player.play();
    player.loop = false;
    player.muted = true;
    player.playbackRate = 1; // Slightly faster for celebration feel
    explosion.current?.start();
  }, [player]);

  const handleDone = () => {
    router.replace({
      pathname: '/bookingConfirmed',
      params: { bookingData: bookingData },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', paddingBottom: insets.bottom }}>
      <StatusBar barStyle="dark-content" />

      

      <VideoView
        player={player}
        style={{
          width: spacing.xxl * 8,
          height: spacing.xxl * 7,
          marginBottom: spacing.xxl * 2,
        }}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        nativeControls={false}
        contentFit="contain"
      />

      {/* Confetti Cannon — Falling particles from top */}
      <ConfettiCannon
        count={150}
        origin={{ x: 200, y: -10 }}  // From top-left corner
        autoStart={false}
        ref={explosion}
        fadeOut={true}
        explosionSpeed={1000}
        fallSpeed={3000}  // Slow fall for ~6-7 seconds visibility
        colors={['#FF0000', '#FFD700', '#00FF00', '#FF69B4', '#00BFFF', '#FFA500']}  // Red + festive colors
      />

      {/* Main Title */}
      <Text style={{
        fontSize: font.xxl * 1.4,
        fontWeight: '800',
        color: '#FF0000',
        textAlign: 'center',
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.xl,
      }}>
        Your Service is{'\n'}Booked!
      </Text>

      {/* Subtitle */}
      <Text style={{
        fontSize: font.lg,
        color: '#7c7c7cff',
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
        lineHeight: font.lg * 1.5,
      }}>
        Service provider will be assign soon.
      </Text>

      {/* Done Button */}
      <TouchableOpacity
        onPress={handleDone}
        style={{
          position: 'absolute',
          bottom: insets.bottom + spacing.xxl,
          left: spacing.xl,
          right: spacing.xl,
          backgroundColor: '#FF0000',
          paddingVertical: spacing.xl,
          borderRadius: radius.pill,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <Text style={{
          fontSize: font.xl,
          fontWeight: '700',
          color: '#FFFFFF',
        }}>
          Done
        </Text>
      </TouchableOpacity>
    </View>
  );
}