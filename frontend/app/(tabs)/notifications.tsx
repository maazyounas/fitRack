import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useWorkoutStore } from '@/store/workoutStore';
import {
  clearPresentedNotificationsAsync,
  fetchPresentedNotificationsAsync,
} from '@/services/notifications';
import {
  buildNotificationFeed,
  type NotificationFeedItem,
  type NativeNotificationRecord,
} from '@/services/notifications/feed';
import { getSecureItem, removeSecureItem, setSecureItem } from '@/services/storage/secureStore';

const readIdsStorageKey = 'notification-read-ids';

function formatReminderTime(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const paddedMinute = String(minute).padStart(2, '0');
  return `${displayHour}:${paddedMinute} ${period}`;
}

function getIconConfig(type: NotificationFeedItem['type'], source: NotificationFeedItem['source']) {
  const dimmed = source === 'upcoming';

  switch (type) {
    case 'workout':
      return {
        name: 'barbell-outline',
        colors: dimmed ? ['#5eead4', '#14b8a6'] as const : ['#0d9488', '#14b8a6'] as const,
      };
    case 'nutrition':
      return {
        name: 'restaurant-outline',
        colors: dimmed ? ['#fcd34d', '#f59e0b'] as const : ['#f59e0b', '#fbbf24'] as const,
      };
    case 'community':
      return {
        name: 'people-outline',
        colors: dimmed ? ['#c4b5fd', '#8b5cf6'] as const : ['#8b5cf6', '#a78bfa'] as const,
      };
    default:
      return {
        name: 'notifications-outline',
        colors: dimmed ? ['#93c5fd', '#3b82f6'] as const : ['#3b82f6', '#60a5fa'] as const,
      };
  }
}

function NotificationCard({
  notification,
  onPress,
}: {
  notification: NotificationFeedItem;
  onPress?: () => void;
}) {
  const iconConfig = getIconConfig(notification.type, notification.source);

  return (
    <Pressable onPress={onPress} style={[styles.card, notification.source === 'upcoming' && styles.cardUpcoming, !notification.read && styles.cardUnread]}>
      <LinearGradient colors={iconConfig.colors} style={styles.iconContainer}>
        <Ionicons name={iconConfig.name as any} size={22} color="#ffffff" />
      </LinearGradient>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, !notification.read && styles.cardTitleUnread]}>{notification.title}</Text>
            <View style={[styles.sourceChip, notification.source === 'upcoming' ? styles.sourceUpcoming : styles.sourceDelivered]}>
              <Text style={styles.sourceChipText}>{notification.source === 'upcoming' ? 'Scheduled' : 'Recent'}</Text>
            </View>
          </View>
          {!notification.read && notification.source === 'delivered' && <View style={styles.unreadDot} />}
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

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={styles.summaryPillLabel}>{label}</Text>
      <Text style={styles.summaryPillValue}>{value}</Text>
    </View>
  );
}

function SectionHeader({ icon, title, action, onAction }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Ionicons name={icon} size={18} color="#0d9488" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { plans } = useWorkoutStore();
  const hydrationReminder = useNutritionStore((state) => state.hydrationReminder);
  const reminderSettings = useNotificationStore((state) => state.settings);
  const notificationStatus = useNotificationStore((state) => state.status);

  const [showPreferences, setShowPreferences] = useState(false);
  const [deliveredNotifications, setDeliveredNotifications] = useState<NativeNotificationRecord[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const notificationsEnabled = user?.preferences.notificationsEnabled ?? false;
  const effectiveReminderSettings = user?.notificationSettings ?? reminderSettings;

  const refreshNotifications = async () => {
    setIsRefreshing(true);
    try {
      const [storedReadIds, nativeNotifications] = await Promise.all([
        getSecureItem<string[]>(readIdsStorageKey),
        fetchPresentedNotificationsAsync(),
      ]);

      setReadIds(storedReadIds ?? []);
      setDeliveredNotifications(nativeNotifications);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      Alert.alert('Notifications', 'Unable to refresh notifications right now.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void refreshNotifications();
  }, [user?.id]);

  const feed = useMemo(() => {
    return buildNotificationFeed({
      deliveredNotifications,
      reminderSettings: effectiveReminderSettings,
      workouts: plans,
      notificationsEnabled,
      readIds,
    });
  }, [deliveredNotifications, effectiveReminderSettings, notificationsEnabled, plans, readIds]);

  const persistReadIds = async (nextIds: string[]) => {
    setReadIds(nextIds);
    if (nextIds.length > 0) {
      await setSecureItem(readIdsStorageKey, nextIds);
    } else {
      await removeSecureItem(readIdsStorageKey);
    }
  };

  const markAsRead = async (id: string) => {
    if (readIds.includes(id)) return;
    await persistReadIds([...readIds, id]);
  };

  const markAllRead = async () => {
    const nextIds = feed.recent.map((item) => item.id);
    await persistReadIds(nextIds);
  };

  const clearAll = async () => {
    try {
      await clearPresentedNotificationsAsync();
      await persistReadIds([]);
      setDeliveredNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      Alert.alert('Notifications', 'Unable to clear notifications right now.');
    }
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

        <ScrollView contentContainerStyle={styles.prefContainer} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#0f172a', '#0f766e']} style={styles.prefHero}>
            <Ionicons name="notifications-outline" size={44} color="#ffffff" />
            <Text style={styles.prefHeaderTitle}>Manage reminders</Text>
            <Text style={styles.prefHeaderSubtitle}>These are the live settings your reminders use.</Text>
          </LinearGradient>

          <View style={styles.prefSection}>
            <SummaryPill label="Push notifications" value={notificationsEnabled ? 'Enabled' : 'Paused'} />
            <SummaryPill label="Permission" value={notificationStatus.permissionStatus} />
            <SummaryPill label="Scheduled" value={String(notificationStatus.scheduledCount)} />
          </View>

          <View style={styles.prefSection}>
            <Text style={styles.prefSectionTitle}>Reminder schedule</Text>
            <View style={styles.prefRow}>
              <Text style={styles.prefRowLabel}>Workout</Text>
              <Text style={styles.prefRowValue}>
                {effectiveReminderSettings.workoutReminder.enabled
                  ? formatReminderTime(effectiveReminderSettings.workoutReminder.hour, effectiveReminderSettings.workoutReminder.minute)
                  : 'Off'}
              </Text>
            </View>
            <View style={styles.prefRow}>
              <Text style={styles.prefRowLabel}>Meals</Text>
              <Text style={styles.prefRowValue}>
                {[effectiveReminderSettings.mealReminders.breakfast, effectiveReminderSettings.mealReminders.lunch, effectiveReminderSettings.mealReminders.dinner, effectiveReminderSettings.mealReminders.snack]
                  .filter((item) => item.enabled)
                  .length > 0
                  ? 'Active'
                  : 'Off'}
              </Text>
            </View>
            <View style={styles.prefRow}>
              <Text style={styles.prefRowLabel}>Hydration</Text>
              <Text style={styles.prefRowValue}>{hydrationReminder.enabled ? `Every ${hydrationReminder.intervalMinutes} min` : 'Off'}</Text>
            </View>
          </View>

          <Pressable onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={18} color="#ffffff" />
            <Text style={styles.settingsButtonText}>Open full settings</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const hasRecent = feed.recent.length > 0;
  const hasUpcoming = feed.upcoming.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {notificationsEnabled ? 'Live reminders and device notifications.' : 'Push notifications are paused.'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => void refreshNotifications()} style={styles.headerIconButton}>
            <Ionicons name="refresh-outline" size={20} color="#0d9488" />
          </Pressable>
          <Pressable onPress={() => setShowPreferences(true)} style={styles.headerIconButton}>
            <Ionicons name="settings-outline" size={20} color="#64748b" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#0f172a', '#0d9488']} style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryLabel}>Inbox status</Text>
              <Text style={styles.summaryValue}>{feed.unreadCount} unread</Text>
            </View>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>{notificationStatus.permissionStatus}</Text>
            </View>
          </View>
          <View style={styles.summaryStats}>
            <SummaryPill label="Recent" value={String(feed.recent.length)} />
            <SummaryPill label="Upcoming" value={String(feed.upcoming.length)} />
            <SummaryPill label="Scheduled" value={String(notificationStatus.scheduledCount)} />
          </View>
        </LinearGradient>

        <View style={styles.actionsRow}>
          <Pressable onPress={() => void markAllRead()} style={[styles.actionButton, styles.actionButtonSoft]} disabled={!hasRecent}>
            <Ionicons name="checkmark-done-outline" size={16} color={hasRecent ? '#0d9488' : '#94a3b8'} />
            <Text style={[styles.actionText, !hasRecent && styles.actionTextDisabled]}>Mark all read</Text>
          </Pressable>
          <Pressable onPress={() => void clearAll()} style={[styles.actionButton, styles.actionButtonDanger]} disabled={!hasRecent}>
            <Ionicons name="trash-outline" size={16} color={hasRecent ? '#ef4444' : '#94a3b8'} />
            <Text style={[styles.actionText, styles.actionTextDanger, !hasRecent && styles.actionTextDisabled]}>Clear recent</Text>
          </Pressable>
        </View>

        <SectionHeader icon="notifications-outline" title="Recent notifications" action="Refresh" onAction={() => void refreshNotifications()} />
        {hasRecent ? (
          feed.recent.map((item) => (
            <NotificationCard key={item.id} notification={item} onPress={() => void markAsRead(item.id)} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={56} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No recent notifications</Text>
            <Text style={styles.emptyStateSubtitle}>You’ll see delivered push notifications here once they arrive.</Text>
          </View>
        )}

        <SectionHeader icon="time-outline" title="Upcoming reminders" />
        {hasUpcoming ? (
          feed.upcoming.map((item) => <NotificationCard key={item.id} notification={item} />)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="alarm-outline" size={56} color="#cbd5e1" />
            <Text style={styles.emptyStateTitle}>No reminders configured</Text>
            <Text style={styles.emptyStateSubtitle}>Enable workout, meal, or hydration reminders in settings.</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  summaryBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  summaryBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  summaryPill: {
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryPillLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryPillValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonSoft: {
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  actionButtonDanger: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionTextDanger: {
    color: '#ef4444',
  },
  actionTextDisabled: {
    color: '#94a3b8',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionAction: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sectionActionText: {
    color: '#0d9488',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
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
  cardUpcoming: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleRow: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flexShrink: 1,
  },
  cardTitleUnread: {
    color: '#0d9488',
  },
  sourceChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  sourceUpcoming: {
    backgroundColor: '#ecfeff',
  },
  sourceDelivered: {
    backgroundColor: '#eff6ff',
  },
  sourceChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0d9488',
    marginTop: 5,
  },
  cardBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTime: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyStateSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
  },
  headerWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
  },
  prefContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  prefHero: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  prefHeaderTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
  },
  prefHeaderSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  prefSection: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  prefSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  prefRowLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  prefRowValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  settingsButton: {
    backgroundColor: '#0d9488',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});