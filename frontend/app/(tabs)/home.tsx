import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

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
      <View className="p-6">
        <Text className="text-2xl font-bold">Hello, {user?.profile.name || 'Fitness Enthusiast'}!</Text>
        <Text className="text-gray-500 mt-1">Ready to crush your goals today?</Text>
      </View>

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
