import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useTranslation } from '@/hooks/useTranslation';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DailyReminder } from '@/types/notifications';
import { AppHeader } from '@/components/common/AppHeader';

// Section Header Component
function SettingsSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.sectionCard, { backgroundColor: cardColor }]}>
      <View style={[styles.sectionHeader, { borderBottomColor: borderColor }]}>
        <Ionicons name={icon as any} size={22} color="#0d9488" />
        <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

// Setting Row Component
function SettingRow({
  icon,
  label,
  description,
  value,
  onValueChange,
  rightElement,
}: {
  icon?: string;
  label: string;
  description?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  rightElement?: React.ReactNode;
}) {
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  return (
    <View style={[styles.settingRow, { borderBottomColor: borderColor }]}>
      <View style={styles.settingLeft}>
        {icon && (
          <View style={styles.settingIcon}>
            <Ionicons name={icon as any} size={20} color="#0d9488" />
          </View>
        )}
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: textColor }]}>{label}</Text>
          {description && <Text style={[styles.settingDescription, { color: mutedTextColor }]}>{description}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement ? rightElement : onValueChange && (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#e2e8f0', true: '#0d9488' }}
            thumbColor="#ffffff"
          />
        )}
      </View>
    </View>
  );
}

// Time Adjustment Buttons
function TimeAdjustButtons({ onAdjust }: { onAdjust: (patch: Partial<DailyReminder>) => void }) {
  const surfaceColor = useThemeColor({}, 'surface');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  return (
    <View style={styles.timeButtonGroup}>
      <TouchableOpacity style={[styles.timeButton, { backgroundColor: surfaceColor }]} onPress={() => onAdjust({ hour: -1 })}>
        <Text style={[styles.timeButtonText, { color: mutedTextColor }]}>-1h</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.timeButton, { backgroundColor: surfaceColor }]} onPress={() => onAdjust({ hour: 1 })}>
        <Text style={[styles.timeButtonText, { color: mutedTextColor }]}>+1h</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.timeButton, { backgroundColor: surfaceColor }]} onPress={() => onAdjust({ minute: -15 })}>
        <Text style={[styles.timeButtonText, { color: mutedTextColor }]}>-15m</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.timeButton, { backgroundColor: surfaceColor }]} onPress={() => onAdjust({ minute: 15 })}>
        <Text style={[styles.timeButtonText, { color: mutedTextColor }]}>+15m</Text>
      </TouchableOpacity>
    </View>
  );
}

function formatReminderTime(reminder: DailyReminder) {
  return `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`;
}

function ReminderSummaryRow({ label, value }: { label: string; value: string }) {
  const textColor = useThemeColor({}, 'text');
  const mutedTextColor = useThemeColor({}, 'mutedText');

  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: mutedTextColor }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t, isRTL, language } = useTranslation();
  const {
    user,
    updatePreferences,
    deactivateAccount,
    deleteAccount,
    loadImageConsent,
    touchActivity,
  } = useAuthStore();
  const hydrationReminder = useNutritionStore((state) => state.hydrationReminder);
  const saveGoals = useNutritionStore((state) => state.saveGoals);
  const workoutPlans = useWorkoutStore((state) => state.plans);
  const {
    settings: reminderSettings,
    status: notificationStatus,
    isSyncing: remindersSyncing,
    updateWorkoutReminder,
    updateMissedWorkoutAlert,
  } = useNotificationStore();

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadImageConsent();
  }, [loadImageConsent, user]);

  if (!user) {
    return null;
  }
  const { preferences } = user;

  const reminderContext = {
    notificationsEnabled: preferences.notificationsEnabled,
    hydrationReminder,
    workouts: workoutPlans,
  };
  const backendReminderSettings = user.notificationSettings;
  const reminderSnapshot = backendReminderSettings ?? reminderSettings;

  const handlePreferenceUpdate = async (nextValues: Partial<typeof preferences>) => {
    try {
      touchActivity();
      await updatePreferences(nextValues);
      if (nextValues.notificationsEnabled !== undefined) {
        await useNotificationStore.getState().syncWithContext({
          notificationsEnabled: nextValues.notificationsEnabled,
          hydrationReminder,
          workouts: workoutPlans,
        });
      }
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleDailyReminderUpdate = async (
    updater: (patch: Partial<DailyReminder>) => Promise<void>,
    patch: Partial<DailyReminder>
  ) => {
    try {
      touchActivity();
      await updater(patch);
    } catch (error) {
      Alert.alert('Reminder update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const buildAdjustedReminderPatch = (current: DailyReminder, patch: Partial<DailyReminder>) => ({
    hour: patch.hour !== undefined ? current.hour + patch.hour : current.hour,
    minute: patch.minute !== undefined ? current.minute + patch.minute : current.minute,
  });

  const handleDeactivate = async () => {
    try {
      touchActivity();
      await deactivateAccount();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Deactivation failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleDelete = async () => {
    try {
      touchActivity();
      await deleteAccount('DELETE');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Deletion failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const backgroundColor = useThemeColor({}, 'background');
  const mutedTextColor = useThemeColor({}, 'mutedText');
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={[styles.page, { backgroundColor }]}>
      <AppHeader title={t('settings_title')} />
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageSubtitle, { color: mutedTextColor }]}>
          {t('settings_subtitle')}
        </Text>

        {/* Accessibility Section */}
        <SettingsSection icon="accessibility-outline" title="Accessibility">
          <SettingRow
            icon="moon-outline"
            label="Dark Mode"
            description="Switch between light and dark theme"
            value={preferences.darkMode}
            onValueChange={(value) => handlePreferenceUpdate({ darkMode: value })}
          />
        </SettingsSection>

        {/* Voice Section */}
        <SettingsSection icon="mic-outline" title="Voice Control">
          <SettingRow
            icon="mic-circle-outline"
            label="Voice Commands"
            description="Control the app with your voice"
            value={preferences.voiceCommandsEnabled}
            onValueChange={(value) => handlePreferenceUpdate({ voiceCommandsEnabled: value })}
          />
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection icon="options-outline" title="Preferences">
          <SettingRow
            icon="scale-outline"
            label="Unit System"
            description={`Currently using ${preferences.unitSystem === 'metric' ? 'Metric (kg, cm)' : 'Imperial (lbs, ft)'}`}
            rightElement={
              <TouchableOpacity 
                style={styles.textButton}
                onPress={() => handlePreferenceUpdate({
                  unitSystem: preferences.unitSystem === 'metric' ? 'imperial' : 'metric',
                })}
              >
                <Text style={styles.textButtonLabel}>Switch</Text>
              </TouchableOpacity>
            }
          />
          
          <SettingRow
            icon="notifications-outline"
            label="Push Notifications"
            description="Receive alerts and reminders"
            value={preferences.notificationsEnabled}
            onValueChange={(value) => handlePreferenceUpdate({ notificationsEnabled: value })}
          />
        </SettingsSection>

        {/* Reminders Section */}
        <SettingsSection icon="alarm-outline" title="Reminders">
          <Text style={[styles.reminderInfo, { color: mutedTextColor }]}>
            Scheduled reminders for workouts, meals, and hydration
          </Text>
          
          <View style={[styles.statusBadge, { backgroundColor: surfaceColor }]}>
            <View style={[styles.statusDot, { backgroundColor: notificationStatus.permissionStatus === 'granted' ? '#10b981' : '#ef4444' }]} />
            <Text style={[styles.statusText, { color: mutedTextColor }]}>
              Permission: {notificationStatus.permissionStatus === 'granted' ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          {/* Workout Reminder */}
          <View style={styles.reminderGroup}>
            <SettingRow
              label="Workout Reminder"
              description={`Daily at ${String(reminderSettings.workoutReminder.hour).padStart(2, '0')}:${String(reminderSettings.workoutReminder.minute).padStart(2, '0')}`}
              value={reminderSettings.workoutReminder.enabled}
              onValueChange={(value) => handleDailyReminderUpdate(
                (patch) => updateWorkoutReminder(patch, reminderContext),
                { enabled: value }
              )}
            />
            <TimeAdjustButtons onAdjust={(delta) => handleDailyReminderUpdate(
              (patch) => updateWorkoutReminder(patch, reminderContext),
              buildAdjustedReminderPatch(reminderSettings.workoutReminder, delta)
            )} />
          </View>

          {/* Missed Workout Alert */}
          <View style={styles.reminderGroup}>
            <SettingRow
              label="Missed Workout Alert"
              description={`Evening check at ${String(reminderSettings.missedWorkoutAlert.hour).padStart(2, '0')}:${String(reminderSettings.missedWorkoutAlert.minute).padStart(2, '0')}`}
              value={reminderSettings.missedWorkoutAlert.enabled}
              onValueChange={(value) => handleDailyReminderUpdate(
                (patch) => updateMissedWorkoutAlert(patch, reminderContext),
                { enabled: value }
              )}
            />
            <TimeAdjustButtons onAdjust={(delta) => handleDailyReminderUpdate(
              (patch) => updateMissedWorkoutAlert(patch, reminderContext),
              buildAdjustedReminderPatch(reminderSettings.missedWorkoutAlert, delta)
            )} />
          </View>

          

          {/* Hydration Reminder */}
          <View style={styles.reminderGroup}>
            <SettingRow
              label="Hydration Reminder"
              description={`Every ${hydrationReminder.intervalMinutes} min, ${hydrationReminder.startHour}:00 - ${hydrationReminder.endHour}:00`}
              value={hydrationReminder.enabled}
              onValueChange={(value) => saveGoals({
                hydrationReminder: { ...hydrationReminder, enabled: value },
              })}
            />
          </View>

          {remindersSyncing && (
            <Text style={[styles.syncingText, { color: tintColor }]}>Updating reminders...</Text>
          )}
        </SettingsSection>

        {/* Saved Backend Snapshot */}
        <SettingsSection icon="server-outline" title="Backend Reminder Snapshot">
          <Text style={[styles.reminderInfo, { color: mutedTextColor }]}>
            These values are hydrated from the server user profile and saved back on change.
          </Text>
          <View style={[styles.snapshotCard, { backgroundColor: surfaceColor }]}>
            <ReminderSummaryRow
              label="Workout"
              value={`${reminderSnapshot.workoutReminder.enabled ? 'On' : 'Off'} · ${formatReminderTime(reminderSnapshot.workoutReminder)}`}
            />
            <ReminderSummaryRow
              label="Missed workout"
              value={`${reminderSnapshot.missedWorkoutAlert.enabled ? 'On' : 'Off'} · ${formatReminderTime(reminderSnapshot.missedWorkoutAlert)}`}
            />
            <ReminderSummaryRow
              label="Hydration"
              value={`${reminderSnapshot.hydrationAlert.enabled ? 'On' : 'Off'} · every ${reminderSnapshot.hydrationAlert.intervalMinutes} min`}
            />
            <ReminderSummaryRow
              label="Meals"
              value={`Breakfast ${reminderSnapshot.mealReminders.breakfast.enabled ? 'On' : 'Off'}, Lunch ${reminderSnapshot.mealReminders.lunch.enabled ? 'On' : 'Off'}, Dinner ${reminderSnapshot.mealReminders.dinner.enabled ? 'On' : 'Off'}`}
            />
          </View>
        </SettingsSection>

        {/* Account Section */}
        <SettingsSection icon="person-outline" title="Account Management">
          <TouchableOpacity
            style={[styles.accountButton, { borderBottomColor: borderColor }]}
            onPress={() => Alert.alert('Deactivate account', 'You can log back in later to restore access.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Deactivate', style: 'destructive', onPress: handleDeactivate },
            ])}
          >
            <Ionicons name="pause-circle-outline" size={20} color="#f59e0b" />
            <Text style={[styles.accountButtonText, { color: '#f59e0b' }]}>Deactivate Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.accountButton, styles.accountButtonDanger]}
            onPress={() => Alert.alert('Delete account', 'This permanently deletes all your data.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: handleDelete },
            ])}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={[styles.accountButtonText, { color: '#ef4444' }]}>Delete Account Permanently</Text>
          </TouchableOpacity>
        </SettingsSection>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748b',
    lineHeight: 16,
  },
  settingRight: {
    marginLeft: 12,
  },
  textButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0fdfa',
  },
  textButtonLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0d9488',
  },
  fontScaleButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  fontScaleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  fontScaleButtonPrimary: {
    backgroundColor: '#0d9488',
  },
  fontScaleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  fontScaleButtonTextPrimary: {
    color: '#ffffff',
  },
  voiceButtonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  voiceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  voiceButtonPrimary: {
    backgroundColor: '#0d9488',
  },
  voiceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  voiceButtonTextPrimary: {
    color: '#ffffff',
  },
  voiceStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  voiceStatusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#64748b',
    lineHeight: 18,
  },
  reminderInfo: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  reminderGroup: {
    marginBottom: 16,
  },
  timeButtonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginLeft: 44,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  syncingText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#0d9488',
    textAlign: 'center',
    marginTop: 8,
  },
  snapshotCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
  },
  privacyActions: {
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  privacyButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  privacyButtonDanger: {
    backgroundColor: '#fef2f2',
  },
  privacyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  privacyButtonTextDanger: {
    color: '#ef4444',
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  accountButtonDanger: {
    borderBottomWidth: 0,
  },
  accountButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f59e0b',
  },
  footer: {
    height: 20,
  },
});