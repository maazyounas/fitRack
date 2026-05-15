import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  { id: '4', title: 'Hydration Goal Achieved! 💧', body: 'You reached your daily water intake target.', time: '2d ago', read: false, type: 'nutrition' },
];

// Notification Card Component
function NotificationCard({ notification, onPress }: { notification: Notification; onPress?: () => void }) {
  const getIconConfig = (type: string) => {
    switch (type) {
      case 'workout':
        return { name: 'barbell-outline', color: '#0d9488', gradient: ['#0d9488', '#14b8a6'] as const };
      case 'nutrition':
        return { name: 'restaurant-outline', color: '#f59e0b', gradient: ['#f59e0b', '#fbbf24'] as const };
      case 'community':
        return { name: 'people-outline', color: '#8b5cf6', gradient: ['#8b5cf6', '#a78bfa'] as const };
      default:
        return { name: 'notifications-outline', color: '#3b82f6', gradient: ['#3b82f6', '#60a5fa'] as const };
    }
  };

  const iconConfig = getIconConfig(notification.type);

  return (
    <Pressable onPress={onPress} style={[styles.card, !notification.read && styles.cardUnread]}>
      <LinearGradient colors={iconConfig.gradient} style={styles.iconContainer}>
        <Ionicons name={iconConfig.name as any} size={22} color="#ffffff" />
      </LinearGradient>
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, !notification.read && styles.cardTitleUnread]}>
            {notification.title}
          </Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.cardBody}>{notification.body}</Text>
        <View style={styles.cardFooter}>
          <Ionicons name="time-outline" size={12} color="#94a3b8" />
          <Text style={styles.cardTime}>{notification.time}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// Preference Item Component
function PreferenceItem({ 
  icon, 
  title, 
  description, 
  value, 
  onValueChange 
}: { 
  icon: string; 
  title: string; 
  description: string; 
  value: boolean; 
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.prefItem}>
      <View style={styles.prefItemLeft}>
        <View style={styles.prefIcon}>
          <Ionicons name={icon as any} size={20} color="#0d9488" />
        </View>
        <View style={styles.prefContent}>
          <Text style={styles.prefTitle}>{title}</Text>
          <Text style={styles.prefDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e2e8f0', true: '#0d9488' }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [showPreferences, setShowPreferences] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  if (showPreferences) {
    return (
      <View style={styles.container}>
        <View style={styles.headerWithBack}>
          <Pressable onPress={() => setShowPreferences(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </Pressable>
          <Text style={styles.headerTitle}>Notification Settings</Text>
        </View>
        
        <ScrollView style={styles.prefContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.prefHeader}>
            <Ionicons name="notifications-outline" size={48} color="#0d9488" />
            <Text style={styles.prefHeaderTitle}>Manage Alerts</Text>
            <Text style={styles.prefHeaderSubtitle}>Choose what you want to be notified about</Text>
          </View>

          <View style={styles.prefSection}>
            <PreferenceItem
              icon="fitness-outline"
              title="Workout Reminders"
              description="Daily nudges to stay consistent with your workouts"
              value={true}
              onValueChange={() => {}}
            />
            <PreferenceItem
              icon="water-outline"
              title="Hydration Alerts"
              description="Stay on top of your daily water intake"
              value={true}
              onValueChange={() => {}}
            />
            <PreferenceItem
              icon="people-outline"
              title="Community Activity"
              description="Likes, comments, and new followers"
              value={false}
              onValueChange={() => {}}
            />
            <PreferenceItem
              icon="trophy-outline"
              title="Milestone Celebrations"
              description="Celebrate your achievements and badges"
              value={true}
              onValueChange={() => {}}
            />
            <PreferenceItem
              icon="restaurant-outline"
              title="Meal Reminders"
              description="Never miss a meal with timely reminders"
              value={true}
              onValueChange={() => {}}
            />
          </View>

          <View style={styles.prefFooter}>
            <Text style={styles.prefFooterText}>
              You can always adjust these settings later in the app
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {notifications.length > 0 && (
            <Pressable onPress={markAllRead} style={styles.headerButton}>
              <Ionicons name="checkmark-done-outline" size={20} color="#0d9488" />
              <Text style={styles.headerButtonText}>Mark all read</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setShowPreferences(true)} style={styles.headerButton}>
            <Ionicons name="settings-outline" size={20} color="#64748b" />
            <Text style={[styles.headerButtonText, { color: '#64748b' }]}></Text>
          </Pressable>
        </View>
      </View>

      {notifications.length > 0 && (
        <View style={styles.toolbar}>
          <Pressable onPress={clearAll} style={styles.toolbarButton}>
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.toolbarButtonText}>Clear all</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard 
            notification={item} 
            onPress={() => markAsRead(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <LinearGradient 
              colors={['#f8fafc', '#f1f5f9']} 
              style={styles.emptyStateGradient}
            >
              <View style={styles.emptyStateIcon}>
                <Ionicons name="notifications-off-outline" size={56} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyStateTitle}>All caught up! 🎉</Text>
              <Text style={styles.emptyStateSubtitle}>
                You have no new notifications at the moment
              </Text>
            </LinearGradient>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Header Styles
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -36,
    backgroundColor: '#0d9488',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  headerButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0d9488',
  },
  
  // Toolbar Styles
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  toolbarButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
  },
  
  // List Styles
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Card Styles
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: '#f0fdfa',
    borderLeftWidth: 3,
    borderLeftColor: '#0d9488',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },
  cardTitleUnread: {
    fontWeight: '600',
    color: '#0f172a',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0d9488',
    marginLeft: 8,
  },
  cardBody: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTime: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94a3b8',
  },
  
  // Empty State Styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyStateGradient: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Preferences Styles
  prefContainer: {
    flex: 1,
  },
  prefHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  prefHeaderTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 6,
  },
  prefHeaderSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748b',
    textAlign: 'center',
  },
  prefSection: {
    padding: 16,
    gap: 12,
  },
  prefItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  prefItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  prefIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefContent: {
    flex: 1,
  },
  prefTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  prefDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748b',
    lineHeight: 16,
  },
  prefFooter: {
    padding: 24,
    alignItems: 'center',
  },
  prefFooterText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94a3b8',
    textAlign: 'center',
  },
});