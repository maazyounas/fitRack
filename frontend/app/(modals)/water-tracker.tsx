import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNutritionStore } from '@/store/nutritionStore';

const reminderIntervals = [60, 90, 120, 180];
const quickAmounts = [250, 500, 750];

export default function WaterTrackerModal() {
  const router = useRouter();
  const { dailyReport, goals, hydrationReminder, addWater, saveGoals, isSaving } = useNutritionStore();
  const [manualAmount, setManualAmount] = useState('300');
  const [enabled, setEnabled] = useState(hydrationReminder.enabled);
  const [interval, setInterval] = useState(hydrationReminder.intervalMinutes);

  async function handleQuickAdd(amountMl: number) {
    await addWater(amountMl);
  }

  async function handleSaveReminder() {
    await saveGoals({
      hydrationReminder: {
        enabled,
        intervalMinutes: interval,
      },
    });
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Hydration Tracker</Text>
      <Text style={styles.subtitle}>Log water intake and control reminder timing.</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Today</Text>
        <Text style={styles.summaryValue}>
          {dailyReport.waterConsumedMl} / {goals.waterMl} mL
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Quick add</Text>
      <View style={styles.quickRow}>
        {quickAmounts.map((amount) => (
          <Pressable key={amount} style={styles.quickButton} onPress={() => handleQuickAdd(amount)}>
            <Text style={styles.quickButtonText}>+ {amount} mL</Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="Custom amount (mL)"
        keyboardType="number-pad"
        value={manualAmount}
        onChangeText={setManualAmount}
      />
      <Button label="Log Custom Water" onPress={() => handleQuickAdd(Number(manualAmount) || 0)} loading={isSaving} />

      <Text style={[styles.sectionTitle, styles.reminderSpacing]}>Hydration reminders</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleText}>{enabled ? 'Enabled' : 'Disabled'}</Text>
        <Pressable style={[styles.toggle, enabled ? styles.toggleOn : null]} onPress={() => setEnabled((value) => !value)}>
          <View style={[styles.toggleKnob, enabled ? styles.toggleKnobOn : null]} />
        </Pressable>
      </View>

      <View style={styles.intervalRow}>
        {reminderIntervals.map((minutes) => (
          <Pressable
            key={minutes}
            onPress={() => setInterval(minutes)}
            style={[styles.intervalChip, interval === minutes ? styles.intervalChipActive : null]}
          >
            <Text style={[styles.intervalChipText, interval === minutes ? styles.intervalChipTextActive : null]}>
              {minutes} min
            </Text>
          </Pressable>
        ))}
      </View>

      <Button label="Save Reminder Settings" onPress={handleSaveReminder} loading={isSaving} />
      <View style={styles.spacer} />
      <Button label="Close" onPress={() => router.back()} tone="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 18,
  },
  summaryCard: {
    backgroundColor: '#082f49',
    borderRadius: 24,
    marginBottom: 18,
    padding: 18,
  },
  summaryLabel: {
    color: '#bae6fd',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: '#f0f9ff',
    fontSize: 28,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  quickButton: {
    backgroundColor: '#cffafe',
    borderRadius: 16,
    flex: 1,
    padding: 14,
  },
  quickButtonText: {
    color: '#155e75',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  reminderSpacing: {
    marginTop: 20,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  toggleText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  toggle: {
    backgroundColor: '#cbd5e1',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 4,
    width: 62,
  },
  toggleOn: {
    backgroundColor: '#0f766e',
  },
  toggleKnob: {
    backgroundColor: '#fff',
    borderRadius: 999,
    height: 26,
    width: 26,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  intervalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  intervalChip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  intervalChipActive: {
    backgroundColor: '#0f766e',
  },
  intervalChipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  intervalChipTextActive: {
    color: '#fff',
  },
  spacer: {
    height: 12,
  },
});
