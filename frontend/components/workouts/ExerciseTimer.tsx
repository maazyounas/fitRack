import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppPalette } from '@/hooks/useAppPalette';

interface ExerciseTimerProps {
  initialSeconds: number;
  onComplete: () => void;
  autoStart?: boolean;
}

export const ExerciseTimer: React.FC<ExerciseTimerProps> = ({
  initialSeconds,
  onComplete,
  autoStart = true,
}) => {
  const palette = useAppPalette();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    let interval: any = null;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds, onComplete]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = 1 - seconds / initialSeconds;

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  };

  return (
    <View style={styles.container}>
      {/* Circular Progress */}
      <View style={styles.circleContainer}>
        <View
          style={[
            styles.circle,
            {
              backgroundColor: palette.card,
              borderColor: palette.tint,
            },
          ]}>
          <Text style={[styles.timeText, { color: palette.text }]}>
            {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </Text>
        </View>
        {/* Progress indicator */}
        <View
          style={[
            styles.progressRing,
            {
              borderColor: palette.tint,
              opacity: progress > 0 ? 1 : 0.2,
            },
          ]}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          onPress={toggleTimer}
          style={[styles.button, { backgroundColor: palette.tint }]}>
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={24}
            color={palette.background}
          />
          <Text style={[styles.buttonText, { color: palette.background }]}>
            {isRunning ? 'Pause' : 'Start'}
          </Text>
        </Pressable>

        <Pressable
          onPress={resetTimer}
          style={[styles.button, { backgroundColor: palette.card }]}>
          <Ionicons name="reload" size={24} color={palette.text} />
          <Text style={[styles.buttonText, { color: palette.text }]}>Reset</Text>
        </Pressable>

        {seconds === 0 && (
          <Pressable onPress={onComplete} style={[styles.button, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="checkmark" size={24} color="#fff" />
            <Text style={[styles.buttonText, { color: '#fff' }]}>Done</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  circleContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  progressRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
  },
  timeText: {
    fontSize: 56,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
