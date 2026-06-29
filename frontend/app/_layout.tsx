import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AppState, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useRef } from 'react';
import { ThemeProvider } from '../hooks/use-theme-color';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { useNutritionStore } from '@/store/nutritionStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useOnboardingStore } from '@/store/onboardingStore';

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
  } = useAuthStore();
  const onboardingSnapshot = useAuthStore((state) => state.onboardingSnapshot);
  const {
    initialize: initOnboarding,
    isHydrated: onboardingHydrated,
  } = useOnboardingStore();
  const hydrationReminder = useNutritionStore((state) => state.hydrationReminder);
  const workoutPlans = useWorkoutStore((state) => state.plans);
  const initializeNotifications = useNotificationStore((state) => state.initialize);
  const syncNotifications = useNotificationStore((state) => state.syncWithContext);
  const notificationsHydrated = useNotificationStore((state) => state.isHydrated);
  const clearNotifications = useNotificationStore((state) => state.clear);
  const initializeStarted = useRef(false);

  const fullyHydrated = isHydrated && onboardingHydrated;
  const completedOnboarding = Boolean(
    user?.profile?.onboardingCompleted || user?.onboardingCompleted || user?.fitnessGoals?.setupCompleted
  );

  useEffect(() => {
    if (initializeStarted.current) return;
    initializeStarted.current = true;

    initialize().catch(err => {
      console.error('Auth initialization failed:', err);
    });
    initOnboarding().catch(err => {
      console.error('Onboarding initialization failed:', err);
    });
  }, [initialize, initOnboarding]);

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
    if (!fullyHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const isAdminRoute = pathname === '/admin';

    // Not logged in → go to login
    if (!user && !inAuthGroup) {
      router.replace('/login');
      return;
    }

    // Logged in but not an admin → keep admin route hidden and redirect away
    if (user && !user.isAdmin && isAdminRoute) {
      router.replace('/(tabs)/home');
      return;
    }

    // Logged in but onboarding not done → start onboarding (except if already there)
    if (user && !completedOnboarding && !inOnboardingGroup && !inAuthGroup) {
      router.replace('/(onboarding)/gender' as any);
      return;
    }

    // Logged in and onboarding done → go to home
    if (user && completedOnboarding && (inAuthGroup || inOnboardingGroup || pathname === '/')) {
      router.replace('/(tabs)/home');
    }
  }, [completedOnboarding, fullyHydrated, pathname, router, segments, user]);

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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(onboarding)" />
          {user?.isAdmin && <Stack.Screen name="admin" />}
          <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
        </Stack>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
