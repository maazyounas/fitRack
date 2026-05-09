import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { fetchWeeklyInsights, fetchWorkoutRecommendations } from '../../services/api/ai';

export default function HomeScreen() {
  const router = useRouter();
  const { user, tokens } = useAuthStore();
  const [insights, setInsights] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !user.fitnessGoals?.setupCompleted) {
      router.push('/(modals)/goals-setup' as any);
    }
  }, [user, router]);

  useEffect(() => {
    async function loadData() {
      if (!tokens?.accessToken) return;
      setLoading(true);
      try {
        const [insightsRes, recRes] = await Promise.all([
          fetchWeeklyInsights(tokens.accessToken),
          fetchWorkoutRecommendations(tokens.accessToken)
        ]);
        setInsights(insightsRes.insights);
        setRecommendation(recRes.recommendation);
      } catch (err) {
        console.error('Failed to load dashboard AI data', err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [tokens?.accessToken]);

  const quickActions = [
    { icon: 'barbell', label: 'Start Workout', route: '/(modals)/workout-builder' },
    { icon: 'library', label: 'Exercise Library', route: '/(modals)/exercise-library' },
    { icon: 'restaurant', label: 'Log Meal', route: '/(modals)/meal-logger' },
    { icon: 'analytics', label: 'Track Progress', route: '/progress' },
    { icon: 'chatbubbles', label: 'AI Coach', route: '/coach' },
    ...(user?.isAdmin
      ? [{ icon: Platform.OS === 'web' ? 'shield-checkmark' : 'shield', label: 'Admin Hub', route: '/admin' }]
      : []),
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text className="text-2xl font-bold">Hello, {user?.profile.name || 'Fitness Enthusiast'}!</Text>
          <Text className="text-gray-500 mt-1">Ready to crush your goals today?</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/notifications' as any)}
          style={styles.notifButton}
        >
          <Ionicons name="notifications-outline" size={24} color="#0f172a" />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      {recommendation?.banner && (
        <TouchableOpacity 
          onPress={() => router.push('/coach' as any)}
          className="mx-6 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 p-4 rounded-2xl mb-6 flex-row items-center"
        >
          <View className="bg-teal-500 p-2 rounded-full mr-4">
            <Ionicons name="sparkles" size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-teal-900 dark:text-teal-100 font-bold text-sm">SMART RECOMMENDATION</Text>
            <Text className="text-teal-800 dark:text-teal-200 text-xs mt-1">{recommendation.banner}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#0d9488" />
        </TouchableOpacity>
      )}

      {insights.length > 0 && (
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-3">AI Weekly Insights</Text>
          <View className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm">
            {insights.map((insight, idx) => (
              <View key={idx} className="flex-row items-center mb-3 last:mb-0">
                <Ionicons 
                  name={insight.type === 'warning' ? 'alert-circle' : insight.type === 'celebration' ? 'trophy' : 'bulb'} 
                  size={18} 
                  color={insight.type === 'warning' ? '#f59e0b' : insight.type === 'celebration' ? '#10b981' : '#3b82f6'} 
                  className="mr-3"
                />
                <Text className="flex-1 text-sm text-gray-700 dark:text-gray-300">{insight.text}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="px-4 flex-row flex-wrap justify-between">
        {quickActions.map((action, idx) => (
          <TouchableOpacity
            key={idx}
            className="w-[48%] bg-white dark:bg-gray-800 p-4 rounded-xl mb-4 shadow-sm"
            onPress={() => router.push(action.route as any)}
          >
            <Ionicons name={action.icon as any} size={32} color="#3b82f6" />
            <Text className="mt-2 font-semibold">{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="p-4 bg-white dark:bg-gray-800 mx-4 rounded-xl mb-4">
        <Text className="text-lg font-bold mb-2">Today&apos;s Workout</Text>
        <Text className="text-gray-500">Upper Body Strength</Text>
        <View className="flex-row justify-between mt-2">
          <Text>4 exercises</Text>
          <Text>45 mins</Text>
        </View>
        <TouchableOpacity className="mt-3 bg-blue-500 p-2 rounded-lg">
          <Text className="text-white text-center">Start Workout</Text>
        </TouchableOpacity>
      </View>

      <View className="p-4 bg-white dark:bg-gray-800 mx-4 rounded-xl mb-4">
        <Text className="text-lg font-bold mb-2">Today&apos;s Nutrition</Text>
        <View className="flex-row justify-between">
          <Text>Calories: 1,240 / {user?.profile.dailyCalories || 2_000}</Text>
          <Text>Protein: 85g / 150g</Text>
        </View>
        <View className="h-2 bg-gray-200 rounded-full mt-2">
          <View className="h-2 bg-blue-500 rounded-full w-[62%]" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  notifBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
  }
});
