import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, icon, spacing } from '../../services/ui';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ff0000',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          // height: spacing.xxl * 2 + insets.bottom,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8, // Push content above gesture bar
          // paddingTop: 8,
          position: 'absolute', // Ensures it respects safe area
        },
        tabBarLabelStyle: {
          fontSize: font.sm,
          fontWeight: '600',
          marginBottom: spacing.xs,
        },
        tabBarItemStyle: {
          paddingVertical: spacing.xs,
        },
        tabBarIconStyle: {
          marginTop: spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={icon.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={icon.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={icon.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={icon.lg} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}