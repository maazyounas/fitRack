import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  withSpring
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export function StreakFire({ streak }: { streak: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.fireContainer, animatedStyle]}>
        <Ionicons name="flame" size={40} color="#f97316" />
      </Animated.View>
      <View style={styles.streakInfo}>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>Day Streak</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    padding: 16,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#ffedd5',
    marginBottom: 16,
  },
  fireContainer: {
    marginRight: 12,
  },
  streakInfo: {
    justifyContent: 'center',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#c2410c',
    lineHeight: 36,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9a3412',
    textTransform: 'uppercase',
  },
});
