import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAppPalette } from '@/hooks/useAppPalette';
import { useFontScale } from '@/hooks/useFontScale';
import { useTranslation } from '@/hooks/useTranslation';
import { DailyReminder } from '@/types/notifications';
import { parseVoiceRoute, speakText, startVoiceRecognition } from '@/services/voice';

function PreferenceRow({
  label,
  description,
  value,
  onValueChange,
  palette,
  fontScale,
  align,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  palette: ReturnType<typeof useAppPalette>;
  fontScale: number;
  align: 'left' | 'right';
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceCopy}>
        <Text style={[styles.preferenceLabel, { color: palette.text, fontSize: 16 * fontScale, textAlign: align }]}>
          {label}
        </Text>
        <Text
          style={[
            styles.preferenceDescription,
            { color: palette.mutedText, fontSize: 14 * fontScale, textAlign: align },
          ]}
        >
          {description}
        </Text>
      </View>
      <Switch onValueChange={onValueChange} value={value} />
    </View>
  );
}

function ReminderTimeControls({
  onAdjust,
}: {
  onAdjust: (patch: Partial<DailyReminder>) => void;
}) {
  return (
    <View style={styles.timeButtons}>
      <Button label="-1h" onPress={() => onAdjust({ hour: -1 })} tone="secondary" />
      <Button label="+1h" onPress={() => onAdjust({ hour: 1 })} tone="secondary" />
      <Button label="-15m" onPress={() => onAdjust({ minute: -15 })} tone="secondary" />
      <Button label="+15m" onPress={() => onAdjust({ minute: 15 })} tone="secondary" />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const palette = useAppPalette();
  const fontScale = useFontScale();
  const { t, isRTL, language } = useTranslation();
  const {
    user,
    imageConsent,
    updatePreferences,
    deactivateAccount,
    deleteAccount,
    loadImageConsent,
    saveImageConsent,
    revokeImageConsent,
    deleteStoredImages,
    isLoading,
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
    updateMealReminder,
  } = useNotificationStore();
  const [voiceStatus, setVoiceStatus] = useState('');

  useEffect(() => {
    void loadImageConsent();
  }, [loadImageConsent]);

  if (!user) {
    return null;
  }

  const align = isRTL ? 'right' : 'left';
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
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: palette.background }]}>
      <Text style={[styles.title, { color: palette.text, fontSize: 30 * fontScale, textAlign: align }]}>
        {t('settings_title')}
      </Text>
      <Text style={[styles.subtitle, { color: palette.mutedText, fontSize: 15 * fontScale, textAlign: align }]}>
        {t('settings_subtitle')}
      </Text>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 18 * fontScale, textAlign: align }]}>
          {t('settings_accessibility')}
        </Text>
        <Button
          label={`${t('settings_language')}: ${
            preferences.autoDetectLanguage
              ? `${t('settings_language_auto')}`
              : preferences.language === 'en'
                ? t('settings_english')
                : t('settings_urdu')
          }`}
          onPress={() =>
            void handlePreferenceUpdate({
              language: preferences.language === 'en' ? 'ur' : 'en',
              autoDetectLanguage: false,
            })
          }
          tone="secondary"
        />
        <PreferenceRow
          align={align}
          description={t('settings_language_desc')}
          fontScale={fontScale}
          label={t('settings_language_auto')}
          onValueChange={(value) => void handlePreferenceUpdate({ autoDetectLanguage: value })}
          palette={palette}
          value={preferences.autoDetectLanguage}
        />
        <PreferenceRow
          align={align}
          description={t('settings_dark_mode_desc')}
          fontScale={fontScale}
          label={t('settings_dark_mode')}
          onValueChange={(value) => void handlePreferenceUpdate({ darkMode: value })}
          palette={palette}
          value={preferences.darkMode}
        />
        <PreferenceRow
          align={align}
          description={t('settings_high_contrast_desc')}
          fontScale={fontScale}
          label={t('settings_high_contrast')}
          onValueChange={(value) => void handlePreferenceUpdate({ highContrastMode: value })}
          palette={palette}
          value={preferences.highContrastMode}
        />
        <PreferenceRow
          align={align}
          description={`${t('settings_large_text_desc')} (${preferences.fontScale.toFixed(1)}x)`}
          fontScale={fontScale}
          label={t('settings_large_text')}
          onValueChange={(value) =>
            void handlePreferenceUpdate({ fontScale: value ? Math.max(1.2, preferences.fontScale) : 1 })
          }
          palette={palette}
          value={preferences.fontScale > 1}
        />
        <View style={styles.timeButtons}>
          <Button
            label={`${t('settings_font_scale')} -`}
            onPress={() => void handlePreferenceUpdate({ fontScale: Math.max(1, preferences.fontScale - 0.1) })}
            tone="secondary"
          />
          <Button
            label={`${t('settings_font_scale')} +`}
            onPress={() => void handlePreferenceUpdate({ fontScale: Math.min(1.4, preferences.fontScale + 0.1) })}
            tone="secondary"
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 18 * fontScale, textAlign: align }]}>
          {t('settings_voice')}
        </Text>
        <PreferenceRow
          align={align}
          description={t('settings_voice_commands_desc')}
          fontScale={fontScale}
          label={t('settings_voice_commands')}
          onValueChange={(value) => void handlePreferenceUpdate({ voiceCommandsEnabled: value })}
          palette={palette}
          value={preferences.voiceCommandsEnabled}
        />
        <PreferenceRow
          align={align}
          description={t('settings_tts_desc')}
          fontScale={fontScale}
          label={t('settings_tts')}
          onValueChange={(value) => void handlePreferenceUpdate({ textToSpeechEnabled: value })}
          palette={palette}
          value={preferences.textToSpeechEnabled}
        />
        <View style={styles.timeButtons}>
          <Button label={t('settings_preview_voice')} onPress={() => void handleVoicePreview()} tone="secondary" />
          <Button
            label={t('settings_try_voice')}
            onPress={() => void handleTryVoiceCommand()}
            tone="secondary"
          />
        </View>
        <Text style={[styles.voiceStatus, { color: palette.mutedText, fontSize: 14 * fontScale, textAlign: align }]}>
          {t('settings_voice_status')}: {voiceStatus || t('voice_not_supported')}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 18 * fontScale, textAlign: align }]}>
          {t('settings_preferences')}
        </Text>
        <Button
          label={`${t('settings_unit_system')}: ${
            preferences.unitSystem === 'metric' ? t('settings_metric') : t('settings_imperial')
          }`}
          onPress={() =>
            void handlePreferenceUpdate({
              unitSystem: preferences.unitSystem === 'metric' ? 'imperial' : 'metric',
            })
          }
          tone="secondary"
        />
        <PreferenceRow
          align={align}
          description={t('settings_notifications_desc')}
          fontScale={fontScale}
          label={t('settings_notifications')}
          onValueChange={(value) => void handlePreferenceUpdate({ notificationsEnabled: value })}
          palette={palette}
          value={preferences.notificationsEnabled}
        />
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 18 * fontScale, textAlign: align }]}>
          Reminders & Notifications
        </Text>
        <Text style={[styles.securityNote, { color: palette.mutedText, fontSize: 15 * fontScale, textAlign: align }]}>
          Expo notifications are scheduled on-device for workouts, meals, hydration, and missed workout check-ins.
        </Text>
        <Text style={[styles.imageSummary, { color: palette.text, fontSize: 14 * fontScale, textAlign: align }]}>
          Permission: {notificationStatus.permissionStatus} | Scheduled alerts: {notificationStatus.scheduledCount}
        </Text>
        <Text
          style={[styles.preferenceDescription, { color: palette.mutedText, fontSize: 14 * fontScale, textAlign: align }]}
        >
          Expo push token: {notificationStatus.expoPushToken ?? 'Unavailable in this build or not yet configured.'}
        </Text>

        <PreferenceRow
          align={align}
          description={`Daily workout prompt at ${String(reminderSettings.workoutReminder.hour).padStart(2, '0')}:${String(reminderSettings.workoutReminder.minute).padStart(2, '0')}.`}
          fontScale={fontScale}
          label="Workout reminders"
          onValueChange={(value) =>
            void handleDailyReminderUpdate(
              (patch) => updateWorkoutReminder(patch, reminderContext),
              { enabled: value }
            )
          }
          palette={palette}
          value={reminderSettings.workoutReminder.enabled}
        />
        <ReminderTimeControls
          onAdjust={(delta) =>
            void handleDailyReminderUpdate(
              (patch) => updateWorkoutReminder(patch, reminderContext),
              buildAdjustedReminderPatch(reminderSettings.workoutReminder, delta)
            )
          }
        />

        <PreferenceRow
          align={align}
          description={`Evening missed-workout check at ${String(reminderSettings.missedWorkoutAlert.hour).padStart(2, '0')}:${String(reminderSettings.missedWorkoutAlert.minute).padStart(2, '0')}.`}
          fontScale={fontScale}
          label="Missed workout alerts"
          onValueChange={(value) =>
            void handleDailyReminderUpdate(
              (patch) => updateMissedWorkoutAlert(patch, reminderContext),
              { enabled: value }
            )
          }
          palette={palette}
          value={reminderSettings.missedWorkoutAlert.enabled}
        />
        <ReminderTimeControls
          onAdjust={(delta) =>
            void handleDailyReminderUpdate(
              (patch) => updateMissedWorkoutAlert(patch, reminderContext),
              buildAdjustedReminderPatch(reminderSettings.missedWorkoutAlert, delta)
            )
          }
        />

        <PreferenceRow
          align={align}
          description={`Scheduled for ${String(reminderSettings.mealReminders.breakfast.hour).padStart(2, '0')}:${String(reminderSettings.mealReminders.breakfast.minute).padStart(2, '0')}.`}
          fontScale={fontScale}
          label="Breakfast reminder"
          onValueChange={(value) => void updateMealReminder('breakfast', { enabled: value }, reminderContext)}
          palette={palette}
          value={reminderSettings.mealReminders.breakfast.enabled}
        />
        <ReminderTimeControls
          onAdjust={(delta) =>
            void updateMealReminder(
              'breakfast',
              buildAdjustedReminderPatch(reminderSettings.mealReminders.breakfast, delta),
              reminderContext
            )
          }
        />
        <PreferenceRow
          align={align}
          description={`Scheduled for ${String(reminderSettings.mealReminders.lunch.hour).padStart(2, '0')}:${String(reminderSettings.mealReminders.lunch.minute).padStart(2, '0')}.`}
          fontScale={fontScale}
          label="Lunch reminder"
          onValueChange={(value) => void updateMealReminder('lunch', { enabled: value }, reminderContext)}
          palette={palette}
          value={reminderSettings.mealReminders.lunch.enabled}
        />
        <ReminderTimeControls
          onAdjust={(delta) =>
            void updateMealReminder(
              'lunch',
              buildAdjustedReminderPatch(reminderSettings.mealReminders.lunch, delta),
              reminderContext
            )
          }
        />
        <PreferenceRow
          align={align}
          description={`Scheduled for ${String(reminderSettings.mealReminders.dinner.hour).padStart(2, '0')}:${String(reminderSettings.mealReminders.dinner.minute).padStart(2, '0')}.`}
          fontScale={fontScale}
          label="Dinner reminder"
          onValueChange={(value) => void updateMealReminder('dinner', { enabled: value }, reminderContext)}
          palette={palette}
          value={reminderSettings.mealReminders.dinner.enabled}
        />
        <ReminderTimeControls
          onAdjust={(delta) =>
            void updateMealReminder(
              'dinner',
              buildAdjustedReminderPatch(reminderSettings.mealReminders.dinner, delta),
              reminderContext
            )
          }
        />
        <PreferenceRow
          align={align}
          description={`Every ${hydrationReminder.intervalMinutes} min from ${String(hydrationReminder.startHour).padStart(2, '0')}:00 to ${String(hydrationReminder.endHour).padStart(2, '0')}:00.`}
          fontScale={fontScale}
          label="Hydration alerts"
          onValueChange={(value) =>
            void saveGoals({
              hydrationReminder: { ...hydrationReminder, enabled: value },
            })
          }
          palette={palette}
          value={hydrationReminder.enabled}
        />
        {remindersSyncing ? (
          <Text style={[styles.voiceStatus, { color: palette.mutedText, fontSize: 14 * fontScale, textAlign: align }]}>
            Updating scheduled reminders...
          </Text>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 18 * fontScale, textAlign: align }]}>
          Security
        </Text>
        <Text style={[styles.securityNote, { color: palette.mutedText, fontSize: 15 * fontScale, textAlign: align }]}>
          Sessions auto-expire after inactivity, tokens are stored in secure storage, and password resets use OTP verification.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 18 * fontScale, textAlign: align }]}>
          Image Upload Consent
        </Text>
        <Text style={[styles.securityNote, { color: palette.mutedText, fontSize: 15 * fontScale, textAlign: align }]}>
          Before any image upload, FITRACK explains how images are used and lets you choose local or cloud processing.
          Images are not stored unless you explicitly allow storage.
        </Text>
        <PreferenceRow
          align={align}
          description="Turn this on before upload-based features can process body, wrist, or profile images."
          fontScale={fontScale}
          label="I consent to image processing"
          onValueChange={(value) =>
            void saveImageConsent({
              consentGiven: value,
              usageExplanationAccepted: value || imageConsent?.usageExplanationAccepted,
            })
          }
          palette={palette}
          value={Boolean(imageConsent?.consentGiven)}
        />
        <PreferenceRow
          align={align}
          description="Acknowledges the explanation that images may be processed locally or in the cloud depending on your choice."
          fontScale={fontScale}
          label="I understand image usage"
          onValueChange={(value) => void saveImageConsent({ usageExplanationAccepted: value })}
          palette={palette}
          value={Boolean(imageConsent?.usageExplanationAccepted)}
        />
        <PreferenceRow
          align={align}
          description="Leave this off to prevent retention. Turning it off deletes any stored image records immediately."
          fontScale={fontScale}
          label="Allow image storage"
          onValueChange={(value) => void saveImageConsent({ storageAllowed: value })}
          palette={palette}
          value={Boolean(imageConsent?.storageAllowed)}
        />
        <Text style={[styles.imageSummary, { color: palette.text, fontSize: 14 * fontScale, textAlign: align }]}>
          Stored image records: {imageConsent?.storedImages.length ?? 0}
        </Text>
        <Button
          label="Withdraw Consent"
          loading={isLoading}
          onPress={() =>
            Alert.alert('Withdraw consent', 'This disables image processing consent and deletes stored image records immediately.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Withdraw', style: 'destructive', onPress: () => void revokeImageConsent() },
            ])
          }
          tone="secondary"
        />
        <View style={styles.buttonGap} />
        <Button
          label="Delete Stored Images Now"
          loading={isLoading}
          onPress={() =>
            Alert.alert('Delete stored images', 'This removes stored image records immediately.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => void deleteStoredImages() },
            ])
          }
          tone="danger"
        />
      </View>

      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 18 * fontScale, textAlign: align }]}>
          Account control
        </Text>
        <Button
          label="Deactivate Account"
          loading={isLoading}
          onPress={() =>
            Alert.alert('Deactivate account', 'You can log back in later to restore access.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Deactivate',
                style: 'destructive',
                onPress: () =>
                  void (async () => {
                    await deactivateAccount();
                    router.replace('/login');
                  })(),
              },
            ])
          }
          tone="secondary"
        />
        <View style={styles.buttonGap} />
        <Button
          label="Delete Account Permanently"
          loading={isLoading}
          onPress={() =>
            Alert.alert('Delete account', 'This permanently removes FITRACK user data. Tap Delete to continue.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () =>
                  void (async () => {
                    await deleteAccount('DELETE');
                    router.replace('/login');
                  })(),
              },
            ])
          }
          tone="danger"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 22,
    marginBottom: 18,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 14,
  },
  preferenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  preferenceCopy: {
    flex: 1,
    paddingRight: 16,
  },
  preferenceLabel: {
    fontWeight: '700',
    marginBottom: 4,
  },
  preferenceDescription: {
    lineHeight: 20,
  },
  securityNote: {
    lineHeight: 22,
  },
  timeButtons: {
    gap: 10,
    marginTop: 12,
  },
  imageSummary: {
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  voiceStatus: {
    lineHeight: 20,
    marginTop: 12,
  },
  buttonGap: {
    height: 12,
  },
});
