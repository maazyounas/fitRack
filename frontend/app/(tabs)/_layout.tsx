import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.mutedText,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: 'transparent',
          height: 68,
          paddingTop: 6,
          paddingBottom: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 12,
        },
        headerStyle: {
          backgroundColor: palette.card,
        },
        headerTintColor: palette.text,
        tabBarLabelStyle: {
          fontSize: 10 * fontScale,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs_home'),
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: t('tabs_workouts'),
          tabBarIcon: ({ color }) => <Ionicons name="fitness" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t('tabs_nutrition'),
          tabBarIcon: ({ color }) => <Ionicons name="restaurant" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs_progress'),
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs_community'),
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />
      {isAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin Hub',
            tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark" size={24} color={color} />,
          }}
        />
      )}
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

