import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUiStore } from '@/store/uiStore';
import { useTranslation } from '@/hooks/useTranslation';

type Notification = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'workout' | 'nutrition' | 'community' | 'system';
};

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'New Badge Unlocked! 🏆', body: 'Congratulations! You earned the "7-Day Streak" badge.', time: '2h ago', read: false, type: 'system' },
  { id: '2', title: 'Workout Reminder', body: "It's time for your Upper Body session. Let's get it!", time: '5h ago', read: true, type: 'workout' },
  { id: '3', title: 'Meal Suggestion', body: 'Based on your remaining macros, how about a high-protein salad?', time: '1d ago', read: true, type: 'nutrition' },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [showPreferences, setShowPreferences] = useState(false);
  const { t } = useTranslation();

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={[styles.card, !item.read && styles.unreadCard]}>
      <View style={[styles.iconBox, { backgroundColor: getIconColor(item.type) + '20' }]}>
        <Ionicons name={getIconName(item.type)} size={20} color={getIconColor(item.type)} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </View>
  );

  const getIconName = (type: string) => {
    switch (type) {
      case 'workout': return 'fitness';
      case 'nutrition': return 'restaurant';
      case 'community': return 'people';
      default: return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'workout': return '#0f766e';
      case 'nutrition': return '#f59e0b';
      case 'community': return '#8b5cf6';
      default: return '#3b82f6';
    }
  };

  if (showPreferences) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setShowPreferences(false)}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </Pressable>
          <Text style={styles.headerTitle}>Notification Settings</Text>
        </View>

        <ScrollView style={styles.prefList}>
          <View style={styles.prefItem}>
            <View>
              <Text style={styles.prefTitle}>Workout Reminders</Text>
              <Text style={styles.prefSubtitle}>Daily nudges to stay consistent</Text>
            </View>
            <Switch value={true} trackColor={{ true: '#0f766e' }} />
          </View>
          <View style={styles.prefItem}>
            <View>
              <Text style={styles.prefTitle}>Hydration Alerts</Text>
              <Text style={styles.prefSubtitle}>Stay on top of your water intake</Text>
            </View>
            <Switch value={true} trackColor={{ true: '#0f766e' }} />
          </View>
          <View style={styles.prefItem}>
            <View>
              <Text style={styles.prefTitle}>Community Activity</Text>
              <Text style={styles.prefSubtitle}>Likes, comments, and follows</Text>
            </View>
            <Switch value={false} trackColor={{ true: '#0f766e' }} />
          </View>
          <View style={styles.prefItem}>
            <View>
              <Text style={styles.prefTitle}>Milestone Celebrations</Text>
              <Text style={styles.prefSubtitle}>Confetti for your achievements</Text>
            </View>
            <Switch value={true} trackColor={{ true: '#0f766e' }} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Pressable onPress={markAllRead}>
            <Ionicons name="checkmark-done" size={22} color="#0f766e" />
          </Pressable>
          <Pressable onPress={() => setShowPreferences(true)}>
            <Ionicons name="settings-outline" size={22} color="#64748b" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyText}>All caught up!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  list: { padding: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 12, alignItems: 'center' },
  unreadCard: { backgroundColor: '#f0fdfa' },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, marginLeft: 16 },
  title: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  body: { fontSize: 13, color: '#64748b', marginTop: 2, lineHeight: 18 },
  time: { fontSize: 11, color: '#94a3b8', marginTop: 8, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0f766e' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 16, fontWeight: '600' },
  prefList: { padding: 16 },
  prefItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 12 },
  prefTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  prefSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
