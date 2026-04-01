import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { icon } from '../../services/ui';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ff0000',
        tabBarButton: HapticTab,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          // borderTopWidth: 1,
          borderTopColor: '#eee',
          // height: spacing.xxl * 2 + insets.bottom,
          // height: 60 + insets.bottom,
          // paddingBottom: insets.bottom + 8,
          // paddingTop: 8,
          position: 'absolute',
        },
        // tabBarLabelStyle: {
        //   fontSize: font.sm,
        //   fontWeight: '600',
        //   marginBottom: spacing.xs,
        // },
        // tabBarItemStyle: {
        //   paddingVertical: spacing.xs,
        // },
        // tabBarIconStyle: {
        //   marginTop: spacing.xs,
        // },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="house.fill" size={icon.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="paperplane.fill" size={icon.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="cart" size={icon.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'Subscription',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="calendar" size={icon.lg} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol name="person" size={icon.lg} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}