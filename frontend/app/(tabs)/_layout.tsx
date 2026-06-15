import { Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppPalette } from '@/hooks/useAppPalette';
import { useTranslation } from '@/hooks/useTranslation';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { Layout, Radius, Shadows } from '@/constants/designSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TabLayout() {
  const palette = useAppPalette();
  const { t } = useTranslation();

  const fontScale = useUiStore((state) => state.fontScale);
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();

  const isAdmin = user?.isAdmin === true;
  const isCompact = SCREEN_WIDTH < 390;
  const tabBarHeight = isCompact ? 64 : Layout.tabBarHeight;
  const tabIconSize = isCompact ? 20 : 22;
  const tabLabelSize = isCompact ? 9 : Math.min(11 * fontScale, 13);
  const hideTabBar = pathname === '/admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: '#0d9488',
        tabBarInactiveTintColor: '#94a3b8',

        tabBarShowLabel: !isCompact,

        tabBarStyle: {
          position: 'absolute',
          left: Layout.screenPadding,
          right: Layout.screenPadding,
          bottom: Layout.tabBarBottomGap,

          height: tabBarHeight,

          paddingTop: isCompact ? 6 : 8,
          paddingBottom: isCompact ? 8 : 10,

          backgroundColor: '#ffffff',

          borderTopWidth: 0,

          borderRadius: Radius.xxxl,
          ...Shadows.lg,

          // For better visual separation
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.03)',
          display: hideTabBar ? 'none' : 'flex',
        },

        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          paddingVertical: 2,
          borderRadius: 24,
        },

        tabBarLabelStyle: {
          fontSize: tabLabelSize,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: 0,
          letterSpacing: -0.2,
        },

        headerStyle: {
          backgroundColor: palette.card,
        },

        headerTintColor: palette.text,
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs_home'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <LinearGradient
                colors={focused ? ['#0d9488', '#0f766e'] : ['transparent', 'transparent']}
                style={styles.iconGradient}
              >
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={tabIconSize}
                  color={color}
                />
              </LinearGradient>
            </View>
          ),
        }}
      />

      {/* Workouts Tab */}
      <Tabs.Screen
        name="workouts"
        options={{
          title: t('tabs_workouts'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <LinearGradient
                colors={focused ? ['#0d9488', '#0f766e'] : ['transparent', 'transparent']}
                style={styles.iconGradient}
              >
                <Ionicons
                  name={focused ? 'fitness' : 'fitness-outline'}
                  size={tabIconSize}
                  color={color}
                />
              </LinearGradient>
            </View>
          ),
        }}
      />


      {/* Nutrition Tab */}
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t('tabs_nutrition'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <LinearGradient
                colors={focused ? ['#0d9488', '#0f766e'] : ['transparent', 'transparent']}
                style={styles.iconGradient}
              >
                <Ionicons
                  name={focused ? 'restaurant' : 'restaurant-outline'}
                  size={tabIconSize}
                  color={color}
                />
              </LinearGradient>
            </View>
          ),
        }}
      />

      {/* Progress Tab */}
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs_progress'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <LinearGradient
                colors={focused ? ['#0d9488', '#0f766e'] : ['transparent', 'transparent']}
                style={styles.iconGradient}
              >
                <Ionicons
                  name={focused ? 'stats-chart' : 'stats-chart-outline'}
                  size={tabIconSize}
                  color={color}
                />
              </LinearGradient>
            </View>
          ),
        }}
      />

      {/* Community Tab */}
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs_community'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <LinearGradient
                colors={focused ? ['#0d9488', '#0f766e'] : ['transparent', 'transparent']}
                style={styles.iconGradient}
              >
                <Ionicons
                  name={focused ? 'people' : 'people-outline'}
                  size={tabIconSize}
                  color={color}
                />
              </LinearGradient>
            </View>
          ),
        }}
      />

      {/* Admin screen stays hidden from the bottom bar */}
      <Tabs.Screen
        name="admin"
        options={{
          href: null,
          title: 'Admin',
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'Settings',
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
          title: t('tabs_explore'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <LinearGradient
                colors={focused ? ['#0d9488', '#0f766e'] : ['transparent', 'transparent']}
                style={styles.iconGradient}
              >
                <Ionicons
                  name={focused ? 'compass' : 'compass-outline'}
                  size={tabIconSize}
                  color={color}
                />
              </LinearGradient>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs_profile'),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <LinearGradient
                colors={focused ? ['#0d9488', '#0f766e'] : ['transparent', 'transparent']}
                style={styles.iconGradient}
              >
                <Ionicons
                  name={focused ? 'person' : 'person-outline'}
                  size={tabIconSize}
                  color={color}
                />
              </LinearGradient>
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
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
  },
  activeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(13,148,136,0.12)',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminIconContainer: {
    backgroundColor: 'rgba(13,148,136,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(13,148,136,0.18)',
  },
});
