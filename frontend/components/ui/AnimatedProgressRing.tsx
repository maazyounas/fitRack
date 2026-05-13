/**
 * AnimatedProgressRing — SVG-based circular progress ring with Reanimated.
 * Used for confidence scores, fitness scores, macro breakdowns.
 */

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** Value from 0 to 1 */
  progress: number;
  /** Outer diameter in pixels */
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  labelColor?: string;
  duration?: number;
  gradientId?: string;
  useGradient?: boolean;
};

export function AnimatedProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color = '#0d9488',
  trackColor = 'rgba(255,255,255,0.1)',
  label,
  sublabel,
  labelColor = '#fff',
  duration = 1200,
  gradientId = 'ringGradient',
  useGradient = false,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {useGradient && (
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0d9488" stopOpacity={1} />
              <Stop offset="100%" stopColor="#14b8a6" stopOpacity={1} />
            </LinearGradient>
          </Defs>
        )}
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={useGradient ? `url(#${gradientId})` : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation={-90}
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      {/* Center labels */}
      {(label !== undefined || sublabel !== undefined) && (
        <View style={styles.labelWrap}>
          {label !== undefined && (
            <Text style={[styles.label, { color: labelColor, fontSize: size * 0.18 }]}>
              {label}
            </Text>
          )}
          {sublabel !== undefined && (
            <Text style={[styles.sublabel, { color: labelColor, fontSize: size * 0.1 }]}>
              {sublabel}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: undefined,
  },
  sublabel: {
    fontWeight: '600',
    opacity: 0.75,
    textAlign: 'center',
    marginTop: 2,
  },
});
