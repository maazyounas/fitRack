import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider } from '../hooks/use-theme-color';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { useNutritionStore } from '@/store/nutritionStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useNotificationStore } from '@/store/notificationStore';
import { SESSION_TIMEOUT_MS, SESSION_WARNING_MS } from '@/constants/config';

// ─── Session Warning Banner ───────────────────────────────────────────────────

function SessionWarningBanner() {
  const { sessionWarning, dismissSessionWarning, logout, lastActivityAt, touchActivity } = useAuthStore();
  const opacity = useRef(new Animated.Value(0)).current;
  const secondsLeft = Math.ceil(
    Math.max(0, SESSION_TIMEOUT_MS - (Date.now() - lastActivityAt)) / 1000
  );

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: sessionWarning ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [sessionWarning]);

  if (!sessionWarning) return null;

  return (
    <Animated.View style={[styles.warningBanner, { opacity }]}>
      <Ionicons name="time-outline" size={18} color="#fff" />
      <Text style={styles.warningText}>
        Session expires in ~{secondsLeft}s due to inactivity
      </Text>
      <Pressable onPress={touchActivity} style={styles.warningBtn}>
        <Text style={styles.warningBtnTxt}>Stay</Text>
      </Pressable>
      <Pressable onPress={logout} style={[styles.warningBtn, styles.warningLogout]}>
        <Text style={styles.warningBtnTxt}>Log out</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Root Layout ─────────────────────────────────────────────────────────────

export default function RootLayout() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const {
    initialize,
    isHydrated,
    user,
    checkInactivity,
    touchActivity,
    sessionWarning,
  } = useAuthStore();
  const hydrationReminder = useNutritionStore((state) => state.hydrationReminder);
  const workoutPlans = useWorkoutStore((state) => state.plans);
  const initializeNotifications = useNotificationStore((state) => state.initialize);
  const syncNotifications = useNotificationStore((state) => state.syncWithContext);
  const notificationsHydrated = useNotificationStore((state) => state.isHydrated);
  const clearNotifications = useNotificationStore((state) => state.clear);

  useEffect(() => {
    initialize().catch(err => {
      console.error('Auth initialization failed:', err);
    });
  }, [initialize]);

  // Inactivity check — every 30 seconds + on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        touchActivity();
        void checkInactivity();
      }
    });

    // Check more frequently (every 30s) so warning appears on time
    const interval = setInterval(() => {
      void checkInactivity();
    }, 30 * 1000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [checkInactivity, touchActivity]);

  // Navigation guard
  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/login');
      return;
    }

    if (user && (inAuthGroup || pathname === '/')) {
      router.replace('/(tabs)/home');
    }
  }, [isHydrated, pathname, router, segments, user]);

  // Notifications sync
  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      void clearNotifications();
      return;
    }

    const context = {
      notificationsEnabled: user.preferences.notificationsEnabled,
      hydrationReminder,
      workouts: workoutPlans,
    };

    if (!notificationsHydrated) {
      initializeNotifications(context).catch(err => {
        console.error('Notification initialization failed:', err);
      });
      return;
    }

    syncNotifications(context).catch(err => {
      console.error('Notification sync failed:', err);
    });
  }, [
    clearNotifications,
    hydrationReminder,
    initializeNotifications,
    isHydrated,
    notificationsHydrated,
    syncNotifications,
    user,
    workoutPlans,
  ]);

  return (
    <ThemeProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {!isHydrated ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      ) : (
        <GestureHandlerRootView style={{ flex: 1 }}>
          {/* Session warning banner renders above the Stack */}
          {user && <SessionWarningBanner />}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
          </Stack>
        </GestureHandlerRootView>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    alignItems: 'center',
    backgroundColor: '#f4f7f5',
    flex: 1,
    justifyContent: 'center',
  },
  warningBanner: {
    backgroundColor: '#b45309',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    zIndex: 999,
  },
  warningText: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  warningBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  warningLogout: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  warningBtnTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
