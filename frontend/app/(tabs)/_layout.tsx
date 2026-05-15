import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

import { useAppPalette } from '@/hooks/useAppPalette';
import { useTranslation } from '@/hooks/useTranslation';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export default function TabLayout() {
  const palette = useAppPalette();
  const { t } = useTranslation();

  const fontScale = useUiStore((state) => state.fontScale);
  const user = useAuthStore((state) => state.user);

  const isAdmin = user?.isAdmin === true;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: '#0d9488',
        tabBarInactiveTintColor: '#94a3b8',

        tabBarShowLabel: true,

        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,

          height: 72,

          paddingTop: 10,
          paddingBottom: 10,

          backgroundColor: '#ffffff',

          borderTopWidth: 0,

          borderRadius: 26,

          shadowColor: '#0f172a',
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.08,
          shadowRadius: 18,
          elevation: 10,
        },

        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 4,
        },

        tabBarLabelStyle: {
          fontSize: 10 * fontScale,
          fontWeight: '600',
          marginTop: 2,
          marginBottom: 2,
        },

        headerStyle: {
          backgroundColor: palette.card,
        },

        headerTintColor: palette.text,
      }}
    >
      {/* ───────────────── Home ───────────────── */}
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs_home'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : styles.iconWrap}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* ───────────────── Workouts ───────────────── */}
      <Tabs.Screen
        name="workouts"
        options={{
          title: t('tabs_workouts'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : styles.iconWrap}>
              <Ionicons
                name={focused ? 'fitness' : 'fitness-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* ───────────────── Nutrition ───────────────── */}
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t('tabs_nutrition'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : styles.iconWrap}>
              <Ionicons
                name={focused ? 'restaurant' : 'restaurant-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* ───────────────── Progress ───────────────── */}
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs_progress'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : styles.iconWrap}>
              <Ionicons
                name={focused ? 'stats-chart' : 'stats-chart-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* ───────────────── Community ───────────────── */}
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs_community'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : styles.iconWrap}>
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: 'Notifications',
        }}
      />

      <Tabs.Screen
        name="coach"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="exercises"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,

    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: 'rgba(13,148,136,0.10)',
  },
});