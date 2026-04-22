import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppPalette } from '@/hooks/useAppPalette';
import { useTranslation } from '@/hooks/useTranslation';
import { useUiStore } from '@/store/uiStore';

export default function TabLayout() {
  const palette = useAppPalette();
  const { t } = useTranslation();
  const fontScale = useUiStore((state) => state.fontScale);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.mutedText,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
        },
        headerStyle: {
          backgroundColor: palette.card,
        },
        headerTintColor: palette.text,
        tabBarLabelStyle: {
          fontSize: 12 * fontScale,
        },
        headerShown: true,
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
        name="coach"
        options={{
          title: t('tabs_coach'),
          tabBarIcon: ({ color }) => <Ionicons name="sparkles" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs_community'),
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs_profile'),
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs_settings'),
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
