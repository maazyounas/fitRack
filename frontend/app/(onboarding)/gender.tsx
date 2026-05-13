/**
 * Step 1 — Gender Selection
 * Premium cards with body silhouette, glow selection, spring animation.
 */

import { useEffect } from 'react';
import {
  Dimensions,
  Pressable,
  SafeAreaView,
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
  }, [selected]);

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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0f1e" />
      <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={StyleSheet.absoluteFill} />

      {/* Progress pill */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '25%' }]} />
        </View>
        <Text style={styles.progressLabel}>1 of 4</Text>
      </View>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PERSONALIZATION</Text>
          <Text style={styles.title}>What's your{'\n'}biological sex?</Text>
          <Text style={styles.subtitle}>
            This helps us accurately calibrate your AI body analysis and personalized plan.
          </Text>
        </View>

        {/* Cards */}
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

        {/* Privacy note */}
        <View style={styles.privacyRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#2dd4bf" />
          <Text style={styles.privacyText}>
            Used only for analysis — never shared or sold.
          </Text>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <PremiumButton
          label="Continue"
          disabled={!gender}
          onPress={() => router.push('/(onboarding)/metrics')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f1e' },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: 2,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  header: {
    marginBottom: 40,
  },
  eyebrow: {
    color: '#2dd4bf',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    lineHeight: 22,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  glowBorder: {
    borderRadius: 24,
    padding: 1.5,
    zIndex: -1,
  },
  cardInner: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    alignItems: 'center',
    gap: 12,
    minHeight: 200,
    justifyContent: 'center',
  },
  cardSelected: {
    backgroundColor: 'rgba(13,148,136,0.12)',
    borderColor: 'transparent',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 20,
    fontWeight: '800',
  },
  cardLabelActive: {
    color: '#fff',
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(45,212,191,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  privacyText: {
    color: '#2dd4bf',
    fontSize: 12,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 16,
  },
});
