import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { ThemeProvider } from '../hooks/use-theme-color';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { useNutritionStore } from '@/store/nutritionStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useNotificationStore } from '@/store/notificationStore';

export default function RootLayout() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { initialize, isHydrated, user, checkInactivity, touchActivity } = useAuthStore();
  const hydrationReminder = useNutritionStore((state) => state.hydrationReminder);
  const workoutPlans = useWorkoutStore((state) => state.plans);
  const initializeNotifications = useNotificationStore((state) => state.initialize);
  const syncNotifications = useNotificationStore((state) => state.syncWithContext);
  const notificationsHydrated = useNotificationStore((state) => state.isHydrated);
  const clearNotifications = useNotificationStore((state) => state.clear);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        touchActivity();
        void checkInactivity();
      }
    });

    const interval = setInterval(() => {
      void checkInactivity();
    }, 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [checkInactivity, touchActivity]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/login');
      return;
    }

    if (user && (inAuthGroup || pathname === '/')) {
      router.replace('/(tabs)/home');
    }
  }, [isHydrated, pathname, router, segments, user]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

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
      void initializeNotifications(context);
      return;
    }

    void syncNotifications(context);
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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="admin" />
          <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
        </Stack>
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
});
