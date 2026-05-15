import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useTranslation } from '@/hooks/useTranslation';
import { DailyReminder } from '@/types/notifications';
import { parseVoiceRoute, speakText, startVoiceRecognition } from '@/services/voice';
import { AppHeader } from '@/components/common/AppHeader';

// Section Header Component
function SettingsSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={22} color="#0d9488" />
        <Text style={styles.sectionTitle}>{title}</Text>
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
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        {icon && (
          <View style={styles.settingIcon}>
            <Ionicons name={icon as any} size={20} color="#0d9488" />
          </View>
        )}
        <View style={styles.settingContent}>
          <Text style={styles.settingLabel}>{label}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
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
  return (
    <View style={styles.timeButtonGroup}>
      <TouchableOpacity style={styles.timeButton} onPress={() => onAdjust({ hour: -1 })}>
        <Text style={styles.timeButtonText}>-1h</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.timeButton} onPress={() => onAdjust({ hour: 1 })}>
        <Text style={styles.timeButtonText}>+1h</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.timeButton} onPress={() => onAdjust({ minute: -15 })}>
        <Text style={styles.timeButtonText}>-15m</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.timeButton} onPress={() => onAdjust({ minute: 15 })}>
        <Text style={styles.timeButtonText}>+15m</Text>
      </TouchableOpacity>
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
  const [voiceStatus, setVoiceStatus] = useState('');

  useEffect(() => {
    void loadImageConsent();
  }, [loadImageConsent]);

  if (!user) {
    return null;
  }
  const { preferences } = user;

  const reminderContext = {
    notificationsEnabled: preferences.notificationsEnabled,
    hydrationReminder,
    workouts: workoutPlans,
  };

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

  const handleVoicePreview = async () => {
    if (!preferences.textToSpeechEnabled) {
      Alert.alert('Text to speech is off', 'Enable text to speech first to preview spoken guidance.');
      return;
    }
    await speakText(t('voice_preview_message'));
  };

  const handleTryVoiceCommand = async () => {
    setVoiceStatus(t('voice_listening'));
    const result = await startVoiceRecognition(language);

    if (!result.supported) {
      setVoiceStatus(t('voice_not_supported'));
      Alert.alert('Voice commands unavailable', t('voice_not_supported'));
      return;
    }

    if (!result.transcript) {
      setVoiceStatus(t('voice_no_match'));
      return;
    }

    const route = parseVoiceRoute(result.transcript);
    if (!route) {
      setVoiceStatus(`${t('voice_no_match')} "${result.transcript}"`);
      return;
    }

    setVoiceStatus(result.transcript);
    router.push(route as never);
  };

  return (
    <View style={styles.page}>
      <AppHeader title={t('settings_title')} />
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageSubtitle}>
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
          
          <SettingRow
            icon="volume-high-outline"
            label="Text to Speech"
            description="Enable spoken feedback and guidance"
            value={preferences.textToSpeechEnabled}
            onValueChange={(value) => handlePreferenceUpdate({ textToSpeechEnabled: value })}
          />
          
          <View style={styles.voiceButtonGroup}>
            <TouchableOpacity style={styles.voiceButton} onPress={handleVoicePreview}>
              <Ionicons name="play-outline" size={18} color="#0d9488" />
              <Text style={styles.voiceButtonText}>Preview Voice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.voiceButton, styles.voiceButtonPrimary]} onPress={handleTryVoiceCommand}>
              <Ionicons name="mic-outline" size={18} color="#fff" />
              <Text style={[styles.voiceButtonText, styles.voiceButtonTextPrimary]}>Try Voice Command</Text>
            </TouchableOpacity>
          </View>
          
          {voiceStatus && (
            <View style={styles.voiceStatusContainer}>
              <Ionicons name="chatbubble-outline" size={16} color="#64748b" />
              <Text style={styles.voiceStatusText}>{voiceStatus}</Text>
            </View>
          )}
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
          <Text style={styles.reminderInfo}>
            Scheduled reminders for workouts, meals, and hydration
          </Text>
          
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: notificationStatus.permissionStatus === 'granted' ? '#10b981' : '#ef4444' }]} />
            <Text style={styles.statusText}>
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
            <Text style={styles.syncingText}>Updating reminders...</Text>
          )}
        </SettingsSection>

        {/* Account Section */}
        <SettingsSection icon="person-outline" title="Account Management">
          <TouchableOpacity 
            style={styles.accountButton}
            onPress={() => Alert.alert('Deactivate account', 'You can log back in later to restore access.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Deactivate', style: 'destructive', onPress: () => deactivateAccount().then(() => router.replace('/login')) },
            ])}
          >
            <Ionicons name="pause-circle-outline" size={20} color="#f59e0b" />
            <Text style={[styles.accountButtonText, { color: '#f59e0b' }]}>Deactivate Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.accountButton, styles.accountButtonDanger]}
            onPress={() => Alert.alert('Delete account', 'This permanently deletes all your data.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteAccount('DELETE').then(() => router.replace('/login')) },
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