import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { useAppSelector } from '../store/hooks';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '../store/store';
import SplashScreen from './(onboarding)/splash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import InAppUpdates, { IAUUpdateKind } from 'react-native-in-app-updates';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGuard() {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        let currentToken = token;
        if (!currentToken) {
          currentToken = await AsyncStorage.getItem("authToken");
        }
        if (!token) {
          router.replace("/login");
        }
      } catch (err) {
        console.warn("Token invalid or API error:", err);
        await AsyncStorage.removeItem("authToken");
        router.replace("/login");
      }
    };

    // Show splash for at least 1 seconds
    const timer = setTimeout(() => {
      checkAuth();
    }, 1000);

    return () => clearTimeout(timer);
  }, [token]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    checkUpdate();
    checkNewAppUpdate();
  }, []);

  const checkUpdate = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch (e) {
      console.log('Update check failed:', e);
    }
  };

  const checkNewAppUpdate = async () => {
  try {
    const inAppUpdates = new InAppUpdates(false); // false = not debug
    const result = await inAppUpdates.checkNeedsUpdate();

    if (result.shouldUpdate) {
      // FLEXIBLE = background download, user can keep using app
      // IMMEDIATE = fullscreen forced update
      await inAppUpdates.startUpdate({ updateType: IAUUpdateKind.FLEXIBLE });
    }
  } catch (e) {
    console.log('New App Update check failed:', e);
  }
};

  return (
    <Provider store={store}>
      <PersistGate loading={<SplashScreen />} persistor={persistor}>
      <AuthGuard />
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <GestureHandlerRootView>
            <BottomSheetModalProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* Add other screens */}
            <Stack.Screen name="profile-form" options={{ headerShown: false }} />
            <Stack.Screen name="vehicle-form" options={{ headerShown: false }} />
            <Stack.Screen name="location-form" options={{ headerShown: false }} />
            <Stack.Screen name="checkout" options={{ headerShown: false }} />
            <Stack.Screen name="bookingConfirmed" options={{ headerShown: false }} />
            <Stack.Screen name="payment" options={{ headerShown: false }} />
          </Stack>
          <Toast />
          </BottomSheetModalProvider>
          </GestureHandlerRootView>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}