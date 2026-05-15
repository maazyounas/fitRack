/**
 * Step 1 — Gender Selection
 * Premium cards with body silhouette, glow selection, spring animation.
 */

import { useEffect } from 'react';
import {
  Dimensions,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useOnboardingStore, type OnboardingGender } from '@/store/onboardingStore';
import { PremiumButton } from '@/components/ui/PremiumButton';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48 - 16) / 2;

type GenderOption = {
  key: OnboardingGender;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  description: string;
  gradient: readonly [string, string, ...string[]];
};

const OPTIONS: GenderOption[] = [
  {
    key: 'male',
    label: 'Male',
    icon: 'man-outline',
    description: 'Optimized male body analysis',
    gradient: ['#0d9488', '#0f766e'],
  },
  {
    key: 'female',
    label: 'Female',
    icon: 'woman-outline',
    description: 'Optimized female body analysis',
    gradient: ['#7c3aed', '#6d28d9'],
  },
];

function GenderCard({
  option,
  selected,
  onSelect,
}: {
  option: GenderOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    borderOpacity.value = withTiming(selected ? 1 : 0, { duration: 250 });
  }, [selected, borderOpacity]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  return (
    <Pressable
      onPress={() => {
        scale.value = withSpring(0.93, { damping: 10 }, () => {
          scale.value = withSpring(1, { damping: 8 });
        });
        onSelect();
      }}
    >
      <Animated.View style={[{ width: CARD_W }, cardStyle]}>
        {/* Glow border */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.glowBorder, glowStyle]}>
          <LinearGradient
            colors={option.gradient}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={[styles.cardInner, selected && styles.cardSelected]}>
          {/* Icon background */}
          <LinearGradient
            colors={selected ? option.gradient : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
            style={styles.iconCircle}
          >
            <Ionicons
              name={option.icon}
              size={44}
              color={selected ? '#fff' : 'rgba(255,255,255,0.45)'}
            />
          </LinearGradient>

          <Text style={[styles.cardLabel, selected && styles.cardLabelActive]}>
            {option.label}
          </Text>
          <Text style={styles.cardDesc}>{option.description}</Text>

          {selected && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function GenderScreen() {
  const router = useRouter();
  const { gender, setGender } = useOnboardingStore();

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
          {/* Progress */}
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '25%' }]} />
            </View>
            <Text style={styles.progressLabel}>Step 1 of 4</Text>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>PERSONALIZATION</Text>
            <Text style={styles.title}>Select Gender</Text>
            <Text style={styles.subtitle}>
              This helps us accurately calibrate your AI body analysis and personalized plan.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main Content Card */}
      <View style={styles.card}>
        <View style={styles.cardsRow}>
          {OPTIONS.map((opt) => (
            <GenderCard
              key={opt.key}
              option={opt}
              selected={gender === opt.key}
              onSelect={() => setGender(opt.key)}
            />
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color="#64748b" />
          <Text style={styles.infoText}>
            Biological sex is required for accurate body fat and metabolic rate calculations.
          </Text>
        </View>
      </View>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <PremiumButton
          label="Continue"
          disabled={!gender}
          onPress={() => router.push('/(onboarding)/metrics')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  hero: {
    paddingTop: 20,
    paddingBottom: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: {
    marginTop: 20,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '90%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: -40,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  glowBorder: {
    borderRadius: 24,
    padding: 2,
    zIndex: -1,
  },
  cardInner: {
    backgroundColor: '#f8fafc',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 20,
    alignItems: 'center',
    gap: 12,
    minHeight: 180,
    justifyContent: 'center',
  },
  cardSelected: {
    backgroundColor: '#f0fdfa',
    borderColor: '#0d9488',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    color: '#64748b',
    fontSize: 18,
    fontWeight: '800',
  },
  cardLabelActive: {
    color: '#0d9488',
  },
  cardDesc: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: '#f1f5f9',
  },
});
