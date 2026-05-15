/**
 * Step 4 — AI Body Analysis Introduction
 * Explains AI scan, privacy-first approach. Animated scanning loop.
 */

import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
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
  }, [cornerScale, opacity, scanY]);

  const scanStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scanY.value }], opacity: opacity.value }));
  const cornerStyle = useAnimatedStyle(() => ({ transform: [{ scale: cornerScale.value }] }));

  return (
    <View style={scanStyles.container}>
      <View style={scanStyles.silhouetteBox}>
        <Ionicons name="person-outline" size={80} color="#cbd5e1" />
      </View>

      <Animated.View style={[StyleSheet.absoluteFill, cornerStyle]}>
        <View style={[scanStyles.corner, scanStyles.tl]} />
        <View style={[scanStyles.corner, scanStyles.tr]} />
        <View style={[scanStyles.corner, scanStyles.bl]} />
        <View style={[scanStyles.corner, scanStyles.br]} />
      </Animated.View>

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
  container: { width: 200, height: 240, alignSelf: 'center', position: 'relative', alignItems: 'center', justifyContent: 'center', marginVertical: 24 },
  silhouetteBox: { alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#0d9488', borderWidth: 3 },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 6 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, zIndex: 10 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function AiIntroScreen() {
  const router = useRouter();
  const { completeOnboarding, metrics, gender, goals } = useOnboardingStore();
  const { updateProfile } = useAuthStore();

  const syncData = async () => {
    await completeOnboarding();
    try {
      if (metrics && gender) {
        await updateProfile({
          gender,
          heightCm: metrics.heightCm,
          weightKg: metrics.weightKg,
          age: metrics.age,
        });

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
      console.warn('Backend sync failed, locally completed:', err);
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
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Hero Banner */}
      <LinearGradient
        colors={['#0d9488', '#0f766e', '#115e59']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.progressLabel}>Final Step</Text>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>AI ANALYSIS</Text>
            <Text style={styles.title}>AI Body Coach</Text>
            <Text style={styles.subtitle}>
              One quick scan is all we need to unlock your fully personalised fitness plan.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <ScanAnimation />

          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={20} color="#0d9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 160 }} />
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
    </View>
  );
}

const FEATURES = [
  {
    title: 'Precise Metrics',
    desc: 'Get accurate body fat %, BMI, and muscle mass estimates.',
    icon: 'analytics-outline' as const,
  },
  {
    title: 'Privacy First',
    desc: 'Your photos never leave your device. Analysis is done securely.',
    icon: 'shield-checkmark-outline' as const,
  },
  {
    title: 'Smart Progress',
    desc: 'Track changes over time with visual comparisons and trends.',
    icon: 'trending-up-outline' as const,
  },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  hero: {
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: { marginTop: 20 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  progressTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  progressLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700' },
  eyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', lineHeight: 38, marginBottom: 10 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, maxWidth: '90%' },
  card: { backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 20, marginTop: -40, padding: 24, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  scrollContent: { paddingTop: 0 },
  features: { gap: 16, marginTop: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featureIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdfa', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ccfbf1' },
  featureTitle: { color: '#1e293b', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  featureDesc: { color: '#64748b', fontSize: 13, lineHeight: 18 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16, backgroundColor: '#f1f5f9' },
});
