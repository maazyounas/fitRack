import { Stack } from 'expo-router';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Layout, Radius } from '@/constants/designSystem';

const { width } = Dimensions.get('window');

const STEPS = ['Gender', 'Metrics', 'Goals', 'AI Scan'];

// We expose step progress via a simple param-less approach using pathname matching
// The layout just renders the progress bar; each screen is responsible for its step index.

export { OnboardingProgressBar };

function OnboardingProgressBar({ step }: { step: number }) {
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withTiming((step / STEPS.length) * (width - 48), { duration: 400 });
  }, [step, fillWidth]);

  const fillStyle = useAnimatedStyle(() => ({ width: fillWidth.value }));

  return (
    <View style={styles.barWrap}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <Text style={styles.stepLabel}>{step} / {STEPS.length}</Text>
    </View>
  );
}

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#f1f5f9' },
      }}
    >
      <Stack.Screen name="gender" />
      <Stack.Screen name="metrics" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="ai-intro" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f1f5f9',
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: Radius.full,
  },
  stepLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
