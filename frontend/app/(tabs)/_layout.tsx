import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppPalette } from '@/hooks/useAppPalette';
import { useTranslation } from '@/hooks/useTranslation';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TabLayout() {
  const palette = useAppPalette();
  const { t } = useTranslation();

  const fontScale = useUiStore((state) => state.fontScale);
  const user = useAuthStore((state) => state.user);

  const isAdmin = user?.isAdmin === true;

  const tabBarHeight = 68;

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
          bottom: 16,

          height: tabBarHeight,

          paddingTop: 8,
          paddingBottom: 10,

          backgroundColor: '#ffffff',

          borderTopWidth: 0,

          borderRadius: 28,

          shadowColor: '#0f172a',
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 12,

          // For better visual separation
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.03)',
        },

        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 4,
          borderRadius: 24,
        },

        tabBarLabelStyle: {
          fontSize: Math.min(11 * fontScale, 13),
          fontWeight: '500',
          marginTop: 4,
          marginBottom: 2,
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
                  size={22}
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
                  size={22}
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
                  size={22}
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
                  size={22}
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
                  size={22}
                  color={color}
                />
              </LinearGradient>
            </View>
          ),
        }}
      />

      {/* Admin Tab (Conditional) */}
      {isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, focused }) => (
              <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
                <LinearGradient
                  colors={focused ? ['#0d9488', '#0f766e'] : ['transparent', 'transparent']}
                  style={styles.iconGradient}
                >
                  <Ionicons
                    name={focused ? 'shield' : 'shield-outline'}
                    size={22}
                    color={color}
                  />
                </LinearGradient>
              </View>
            ),
          }}
        />
      )}

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
});