/**
 * CameraOverlay — Animated scan frame with real-time guidance text.
 * Uses corner brackets, sweep animation, and pose quality indicator.
 */

import { useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const FRAME_W = width * 0.75;
const FRAME_H = height * 0.55;

export type GuidanceMessage = {
  text: string;
  severity: 'ok' | 'warn' | 'error';
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

type Props = {
  /** Guidance to display to the user */
  guidance?: GuidanceMessage;
  /** 0-1 quality score */
  quality?: number;
  /** Scanning line is active */
  scanning?: boolean;
};

export function CameraOverlay({
  guidance = { text: 'Center your body', severity: 'ok', icon: 'body-outline' },
  quality = 0,
  scanning = false,
}: Props) {
  const scanY = useSharedValue(0);
  const scanOpacity = useSharedValue(0);
  const cornerBrightness = useSharedValue(0.6);

  useEffect(() => {
    // Animate corners pulse
    cornerBrightness.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.5, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (scanning) {
      scanOpacity.value = withTiming(1, { duration: 200 });
      scanY.value = withRepeat(
        withSequence(
          withTiming(FRAME_H - 4, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      scanOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [scanning]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
    opacity: scanOpacity.value,
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    opacity: cornerBrightness.value,
  }));

  const guidanceColor = guidance.severity === 'ok' ? '#2dd4bf' : guidance.severity === 'warn' ? '#f59e0b' : '#ef4444';

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Dim edges around frame */}
      <View style={styles.dimTop} />
      <View style={styles.dimBottom} />
      <View style={styles.dimLeft} />
      <View style={styles.dimRight} />

      {/* Scan frame */}
      <View style={styles.frame}>
        {/* Corners */}
        <Animated.View style={[StyleSheet.absoluteFill, cornerStyle]}>
          <View style={[styles.corner, styles.tl, { borderColor: guidanceColor }]} />
          <View style={[styles.corner, styles.tr, { borderColor: guidanceColor }]} />
          <View style={[styles.corner, styles.bl, { borderColor: guidanceColor }]} />
          <View style={[styles.corner, styles.br, { borderColor: guidanceColor }]} />
        </Animated.View>

        {/* Scan sweep line */}
        <Animated.View style={[styles.scanLine, scanLineStyle]}>
          <LinearGradient
            colors={['transparent', guidanceColor, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, height: 2 }}
          />
        </Animated.View>
      </View>

      {/* Guidance pill */}
      <View style={[styles.guidancePill, { borderColor: guidanceColor + '44' }]}>
        <Ionicons name={guidance.icon} size={16} color={guidanceColor} />
        <Text style={[styles.guidanceText, { color: guidanceColor }]}>{guidance.text}</Text>
      </View>

      {/* Quality bar */}
      {quality > 0 && (
        <View style={styles.qualityWrap}>
          <Text style={styles.qualityLabel}>Signal Quality</Text>
          <View style={styles.qualityTrack}>
            <View style={[styles.qualityFill, { width: `${quality * 100}%`, backgroundColor: quality > 0.6 ? '#0d9488' : quality > 0.3 ? '#f59e0b' : '#ef4444' }]} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  dimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: (height - FRAME_H) / 2, backgroundColor: 'rgba(0,0,0,0.55)' },
  dimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: (height - FRAME_H) / 2, backgroundColor: 'rgba(0,0,0,0.55)' },
  dimLeft: { position: 'absolute', left: 0, top: (height - FRAME_H) / 2, width: (width - FRAME_W) / 2, height: FRAME_H, backgroundColor: 'rgba(0,0,0,0.55)' },
  dimRight: { position: 'absolute', right: 0, top: (height - FRAME_H) / 2, width: (width - FRAME_W) / 2, height: FRAME_H, backgroundColor: 'rgba(0,0,0,0.55)' },
  frame: { width: FRAME_W, height: FRAME_H, position: 'relative', overflow: 'hidden' },
  corner: { position: 'absolute', width: 30, height: 30, borderWidth: 3 },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 4 },
  scanLine: { position: 'absolute', left: 0, right: 0 },
  guidancePill: { position: 'absolute', bottom: (height - FRAME_H) / 2 - 60, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1 },
  guidanceText: { fontSize: 14, fontWeight: '700' },
  qualityWrap: { position: 'absolute', bottom: (height - FRAME_H) / 2 - 110, left: 40, right: 40, gap: 4 },
  qualityLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center' },
  qualityTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' },
  qualityFill: { height: '100%', borderRadius: 2 },
});
