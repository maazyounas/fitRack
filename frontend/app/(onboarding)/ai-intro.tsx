/**
 * Step 4 — AI Body Analysis Introduction
 * Explains AI scan, privacy-first approach. Animated scanning loop.
 */

import { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { saveOnboardingToBackend } from '@/services/api/bodyAnalysisApi';

// ─── Scanning Animation ───────────────────────────────────────────────────────
function ScanAnimation() {
  const scanY = useSharedValue(0);
  const opacity = useSharedValue(0.7);
  const cornerScale = useSharedValue(1);

  useEffect(() => {
    // Scan line sweeping up-down
    scanY.value = withRepeat(
      withSequence(
        withTiming(160, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 900 }), withTiming(0.3, { duration: 900 })),
      -1,
      false
    );
    cornerScale.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
      false
    );
  }, []);

  const scanStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scanY.value }], opacity: opacity.value }));
  const cornerStyle = useAnimatedStyle(() => ({ transform: [{ scale: cornerScale.value }] }));

  return (
    <View style={scanStyles.container}>
      {/* Silhouette placeholder */}
      <View style={scanStyles.silhouetteBox}>
        <Ionicons name="person-outline" size={80} color="rgba(13,148,136,0.3)" />
      </View>

      {/* Animated corners */}
      <Animated.View style={[StyleSheet.absoluteFill, cornerStyle]}>
        {/* Top-left */}
        <View style={[scanStyles.corner, scanStyles.tl]} />
        {/* Top-right */}
        <View style={[scanStyles.corner, scanStyles.tr]} />
        {/* Bottom-left */}
        <View style={[scanStyles.corner, scanStyles.bl]} />
        {/* Bottom-right */}
        <View style={[scanStyles.corner, scanStyles.br]} />
      </Animated.View>

      {/* Scan line */}
      <Animated.View style={[scanStyles.scanLine, scanStyle]}>
        <LinearGradient
          colors={['transparent', '#0d9488', '#14b8a6', '#0d9488', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, height: 2 }}
        />
      </Animated.View>
    </View>
  );
}

const scanStyles = StyleSheet.create({
  container: { width: 200, height: 240, alignSelf: 'center', position: 'relative', alignItems: 'center', justifyContent: 'center', marginVertical: 32 },
  silhouetteBox: { alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#0d9488', borderWidth: 3 },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 6 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, zIndex: 10 },
});

// ─── Feature Rows ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: 'shield-checkmark-outline', title: 'Privacy First', desc: 'All image processing happens on your device. Nothing is uploaded.' },
  { icon: 'body-outline', title: 'Body Type AI', desc: 'Detects Ectomorph, Mesomorph, or Endomorph from posture & proportions.' },
  { icon: 'sparkles-outline', title: 'Instant Plan', desc: 'Get personalized workouts & nutrition tailored to your body type.' },
] as const;

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AiIntroScreen() {
  const router = useRouter();
  const { completeOnboarding, metrics, gender, goals } = useOnboardingStore();
  const { updateProfile } = useAuthStore();

  const syncData = async () => {
    await completeOnboarding();
    try {
      if (metrics && gender) {
        // 1. Sync to standard profile endpoint
        await updateProfile({
          gender,
          heightCm: metrics.heightCm,
          weightKg: metrics.weightKg,
          age: metrics.age,
        });

        // 2. Sync to dedicated onboarding endpoint for deep analysis
        await saveOnboardingToBackend({
          gender,
          heightCm: metrics.heightCm,
          weightKg: metrics.weightKg,
          age: metrics.age,
          activityLevel: metrics.activityLevel,
          experience: metrics.experience,
          goals,
          wristCm: metrics.wristCm,
        });
      }
    } catch (err) {
      console.warn('Backend sync failed, but onboarding completed locally:', err);
    }
  };

  const handleGetScanned = async () => {
    await syncData();
    router.replace('/(modals)/scan' as any);
  };

  const handleSkip = async () => {
    await syncData();
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
      <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={StyleSheet.absoluteFill} />

      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
        <Text style={styles.progressLabel}>4 of 4</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>AI ANALYSIS</Text>
        <Text style={styles.title}>Meet your{'\n'}AI Body Coach</Text>
        <Text style={styles.subtitle}>
          One quick scan is all we need to unlock your fully personalised fitness plan.
        </Text>

        <ScanAnimation />

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.featureIcon}>
                <Ionicons name={f.icon} size={20} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PremiumButton label="Get AI Scanned" onPress={handleGetScanned} />
        <PremiumButton
          label="Skip for now"
          tone="ghost"
          size="md"
          onPress={handleSkip}
          style={{ marginTop: 8 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f1e' },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  progressTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#0d9488', borderRadius: 2 },
  progressLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  eyebrow: { color: '#2dd4bf', fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 8 },
  title: { color: '#fff', fontSize: 34, fontWeight: '800', lineHeight: 40, marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 20 },
  features: { gap: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  featureDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 18 },
  footer: { paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12, gap: 0 },
});
