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
const FRAME_W = width * 0.8;
const FRAME_H = height * 0.5;

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
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Animate corners pulse
    cornerBrightness.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Pulse scale for guidance pill
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, [cornerBrightness, pulseScale]);

  useEffect(() => {
    if (scanning) {
      scanOpacity.value = withTiming(1, { duration: 300 });
      scanY.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(FRAME_H - 4, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scanOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [scanning, scanOpacity, scanY]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
    opacity: scanOpacity.value,
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    opacity: cornerBrightness.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const getGuidanceConfig = (severity: GuidanceMessage['severity']) => {
    switch (severity) {
      case 'ok':
        return {
          color: '#10b981',
          bgGradient: ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)'] as const,
          iconBg: '#10b98120',
        };
      case 'warn':
        return {
          color: '#f59e0b',
          bgGradient: ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)'] as const,
          iconBg: '#f59e0b20',
        };
      case 'error':
        return {
          color: '#ef4444',
          bgGradient: ['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)'] as const,
          iconBg: '#ef444420',
        };
      default:
        return {
          color: '#10b981',
          bgGradient: ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)'] as const,
          iconBg: '#10b98120',
        };
    }
  };

  const qualityColor = quality > 0.7 ? '#10b981' : quality > 0.4 ? '#f59e0b' : '#ef4444';
  const qualityLabel = quality > 0.7 ? 'Good' : quality > 0.4 ? 'Fair' : 'Poor';
  const guidanceConfig = getGuidanceConfig(guidance.severity);

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Dim edges around frame - using gradient for smoother transition */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
        style={styles.dimTop}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
        style={styles.dimBottom}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
        style={styles.dimLeft}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
        style={styles.dimRight}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      {/* Scan frame */}
      <View style={styles.frame}>
        {/* Corner borders with animated brightness */}
        <Animated.View style={[StyleSheet.absoluteFill, cornerStyle]}>
          <View style={[styles.corner, styles.tl, { borderColor: guidanceConfig.color }]} />
          <View style={[styles.corner, styles.tr, { borderColor: guidanceConfig.color }]} />
          <View style={[styles.corner, styles.bl, { borderColor: guidanceConfig.color }]} />
          <View style={[styles.corner, styles.br, { borderColor: guidanceConfig.color }]} />
        </Animated.View>

        {/* Inner frame border */}
        <View style={[styles.innerFrame, { borderColor: `${guidanceConfig.color}30` }]} />

        {/* Scan sweep line */}
        <Animated.View style={[styles.scanLine, scanLineStyle]}>
          <LinearGradient
            colors={['transparent', guidanceConfig.color, guidanceConfig.color, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scanGradient}
          />
        </Animated.View>
      </View>

      {/* Guidance pill with animation */}
      <Animated.View style={[styles.guidancePill, pulseStyle, { borderColor: `${guidanceConfig.color}30` }]}>
        <LinearGradient
          colors={guidanceConfig.bgGradient}
          style={styles.guidanceGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={[styles.guidanceIcon, { backgroundColor: guidanceConfig.iconBg }]}>
            <Ionicons name={guidance.icon} size={18} color={guidanceConfig.color} />
          </View>
          <Text style={[styles.guidanceText, { color: guidanceConfig.color }]}>
            {guidance.text}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Quality indicator */}
      {quality > 0 && (
        <View style={styles.qualityContainer}>
          <View style={styles.qualityHeader}>
            <Text style={styles.qualityLabel}>Signal Quality</Text>
            <View style={[styles.qualityBadge, { backgroundColor: `${qualityColor}20` }]}>
              <Text style={[styles.qualityBadgeText, { color: qualityColor }]}>
                {qualityLabel}
              </Text>
            </View>
          </View>
          
          <View style={styles.qualityTrack}>
            <LinearGradient
              colors={['#ef4444', '#f59e0b', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.qualityGradient}
            />
            <View style={[styles.qualityFill, { width: `${quality * 100}%`, backgroundColor: qualityColor }]} />
          </View>
          
          <Text style={styles.qualityPercent}>{Math.round(quality * 100)}%</Text>
        </View>
      )}

      {/* Instruction hint */}
      <View style={styles.hintContainer}>
        <Ionicons name="hand-left-outline" size={14} color="rgba(255,255,255,0.4)" />
        <Text style={styles.hintText}>Keep still for best results</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: (height - FRAME_H) / 2,
  },
  dimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: (height - FRAME_H) / 2,
  },
  dimLeft: {
    position: 'absolute',
    left: 0,
    top: (height - FRAME_H) / 2,
    width: (width - FRAME_W) / 2,
    height: FRAME_H,
  },
  dimRight: {
    position: 'absolute',
    right: 0,
    top: (height - FRAME_H) / 2,
    width: (width - FRAME_W) / 2,
    height: FRAME_H,
  },
  frame: {
    width: FRAME_W,
    height: FRAME_H,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 8,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderWidth: 3,
  },
  tl: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
  },
  tr: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 8,
  },
  br: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 8,
  },
  innerFrame: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
  },
  scanGradient: {
    flex: 1,
    height: 2,
  },
  guidancePill: {
    position: 'absolute',
    bottom: (height - FRAME_H) / 2 - 70,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  guidanceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  guidanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidanceText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  qualityContainer: {
    position: 'absolute',
    bottom: (height - FRAME_H) / 2 - 130,
    left: 40,
    right: 40,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 12,
    backdropFilter: 'blur(10px)',
  },
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  qualityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  qualityTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  qualityGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  qualityFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 2,
  },
  qualityPercent: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'right',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '400',
  },
});