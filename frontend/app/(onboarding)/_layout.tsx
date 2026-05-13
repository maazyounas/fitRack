import { Stack } from 'expo-router';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

const { width } = Dimensions.get('window');

const STEPS = ['Gender', 'Metrics', 'Goals', 'AI Scan'];

// We expose step progress via a simple param-less approach using pathname matching
// The layout just renders the progress bar; each screen is responsible for its step index.

export { OnboardingProgressBar };

function OnboardingProgressBar({ step }: { step: number }) {
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withTiming((step / STEPS.length) * (width - 48), { duration: 400 });
  }, [step]);

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
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="gender" />
      <Stack.Screen name="metrics" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="ai-intro" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0a0f1e',
  },
  track: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: 2,
  },
  stepLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
