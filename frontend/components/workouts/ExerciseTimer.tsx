import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppPalette } from '@/hooks/useAppPalette';

interface ExerciseTimerProps {
  initialSeconds: number;
  onComplete: () => void;
  autoStart?: boolean;
  onTick?: (seconds: number) => void;
}

export const ExerciseTimer: React.FC<ExerciseTimerProps> = ({
  initialSeconds,
  onComplete,
  autoStart = true,
  onTick,
}) => {
  const palette = useAppPalette();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    let interval: any = null;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            onComplete();
            return 0;
          }
          const newSeconds = prev - 1;
          onTick?.(newSeconds);
          return newSeconds;
        });
        
        const progress = 1 - seconds / initialSeconds;
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 100,
          useNativeDriver: false,
        }).start();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds, onComplete, onTick, initialSeconds, progressAnim]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = 1 - seconds / initialSeconds;

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setSeconds(initialSeconds);
    setIsRunning(false);
    setIsComplete(false);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const circumference = 2 * Math.PI * 85;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      {/* Circular Progress */}
      <View style={styles.circleContainer}>
        <View style={styles.circleBackground}>
          <View style={[styles.circle, { borderColor: '#e2e8f0' }]} />
        </View>
        
        <Animated.View style={[
          styles.progressRing,
          {
            transform: [{ rotate: '-90deg' }],
          }
        ]}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="#0d9488"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
        </Animated.View>

        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </Text>
          {isComplete && (
            <View style={styles.completeBadge}>
              <Text style={styles.completeText}>Complete!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable onPress={toggleTimer} style={styles.controlButton}>
          <LinearGradient
            colors={['#0d9488', '#0f766e']}
            style={styles.controlGradient}>
            <Ionicons
              name={isRunning ? 'pause' : 'play'}
              size={28}
              color="#ffffff"
            />
          </LinearGradient>
          <Text style={styles.controlLabel}>{isRunning ? 'Pause' : 'Start'}</Text>
        </Pressable>

        <Pressable onPress={resetTimer} style={styles.controlButton}>
          <View style={[styles.controlIcon, { backgroundColor: '#f1f5f9' }]}>
            <Ionicons name="reload" size={24} color="#64748b" />
          </View>
          <Text style={styles.controlLabel}>Reset</Text>
        </Pressable>
      </View>

      {/* Progress Text */}
      <View style={styles.progressText}>
        <Text style={styles.progressLabel}>
          {Math.round(progress * 100)}% complete
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  circleContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  circleBackground: {
    position: 'absolute',
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
  },
  progressRing: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  timeContainer: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 44,
    fontWeight: '600',
    color: '#1e293b',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  completeBadge: {
    marginTop: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  completeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  controls: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    marginBottom: 20,
  },
  controlButton: {
    alignItems: 'center',
    gap: 8,
  },
  controlGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  controlIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  progressText: {
    width: '100%',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: 2,
  },
});