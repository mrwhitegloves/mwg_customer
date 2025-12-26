// app/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
  // Always show splash first — it will handle auth, onboarding, etc.
  return <Redirect href="/(onboarding)/splash" />;
}

// Optional: Show a minimal loader if needed
// But not required — splash will show immediately

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Redirect } from 'expo-router';
// import { useEffect, useState } from 'react';
// import { ActivityIndicator, LogBox, StyleSheet, View } from 'react-native';
// import 'react-native-get-random-values';


// // ✅ Global Error Handler (safe for TS)
// declare const global: any;
// if (global?.ErrorUtils?.setGlobalHandler) {
//   global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
//     console.log('GLOBAL ERROR →', error.message);
//     console.log('STACK →', error.stack);
//   });
// }

// LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);

// export default function Index() {
//   const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null); // null = loading

//   useEffect(() => {
//     const checkOnboardingStatus = async () => {
//       try {
//         const value = await AsyncStorage.getItem('hasOnboarded');
//         console.log("value", value)
//         // If key doesn't exist (null), it's first launch
//         setIsFirstLaunch(value === null);
//       } catch (error) {
//         console.error('Error reading AsyncStorage:', error);
//         // On error, default to main app (non-first launch)
//         setIsFirstLaunch(false);
//       }
//     };

//     checkOnboardingStatus();
//   }, []); // Run once on mount

//   // Loading state: Show a spinner (or your splash screen) while checking storage
//   if (isFirstLaunch === null) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#ff9d00" /> {/* Customize color */}
//       </View>
//     );
//   }

//   // Redirect based on flag
//   if (isFirstLaunch) {
//     console.log("isFirstLaunch true")
//     // First launch: Go to onboarding (adjust path if using multi-page, e.g., '/(onboarding)/page1')
//     return <Redirect href="/(onboarding)/splash" />;
//   } else {
//     console.log("isFirstLaunch false")
//     // Subsequent launches: Go to main app
//     return <Redirect href="/(tabs)/home" />;
//   }
// }

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#FFF',
//   },
// });