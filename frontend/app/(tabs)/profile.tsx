import { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ComponentProps } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { AppHeader } from '@/components/common/AppHeader';
import { Layout, Radius, Shadows } from '@/constants/designSystem';

// Stat Pill Component
function StatPill({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={16} color="#0d9488" />
      <View style={styles.statTextContainer}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

// Section Header Component
function SectionHeader({ icon, title }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color="#0d9488" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// Info Row Component
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ShortcutCard({
  icon,
  title,
  description,
  onPress,
  tint = '#0d9488',
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  onPress: () => void;
  tint?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.shortcutCard, pressed && { opacity: 0.85 }]}>
      <View style={[styles.shortcutIcon, { backgroundColor: `${tint}18` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={styles.shortcutTextWrap}>
        <Text style={styles.shortcutTitle}>{title}</Text>
        <Text style={styles.shortcutDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { resetOnboarding } = useOnboardingStore();

  const [age, setAge] = useState(user?.profile.age ? String(user.profile.age) : '');
  const [heightCm, setHeightCm] = useState(user?.profile.heightCm ? String(user.profile.heightCm) : '');
  const [weightKg, setWeightKg] = useState(user?.profile.weightKg ? String(user.profile.weightKg) : '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profile.profilePictureUrl ?? '');
  const uploadProgress = useAuthStore((s) => s.uploadProgress);

  useEffect(() => {
    setAge(user?.profile.age ? String(user.profile.age) : '');
    setHeightCm(user?.profile.heightCm ? String(user.profile.heightCm) : '');
    setWeightKg(user?.profile.weightKg ? String(user.profile.weightKg) : '');
    setProfilePictureUrl(user?.profile.profilePictureUrl ?? '');
  }, [user]);

  const h = Number(heightCm);
  const w = Number(weightKg);
  const bmi = h > 0 && w > 0 ? (w / Math.pow(h / 100, 2)).toFixed(1) : null;
  const bmiCategory = bmi
    ? Number(bmi) < 18.5 ? 'Underweight' : Number(bmi) < 25 ? 'Normal' : Number(bmi) < 30 ? 'Overweight' : 'Obese'
    : null;
  const bmiColor = bmi
    ? Number(bmi) < 18.5 ? '#2563eb' : Number(bmi) < 25 ? '#10b981' : Number(bmi) < 30 ? '#f59e0b' : '#ef4444'
    : '#64748b';

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to upload a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].uri) {
      const uri = result.assets[0].uri;
      setProfilePictureUrl(uri);
      try {
        await useAuthStore.getState().uploadProfilePicture(uri);
      } catch (error) {
        Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not upload picture.');
      }
    }
  };

  const handleRetakeOnboarding = async () => {
    Alert.alert(
      'Re-run Onboarding?',
      'This will reset your onboarding data and restart the setup flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            router.replace('/(onboarding)/gender' as any);
          },
        },
      ]
    );
  };

  const firstName = user?.profile.name?.split(' ')[0] || 'Member';
  const hiddenRoutes = [
    { icon: 'settings-outline' as const, title: 'Settings', description: 'Notifications, reminders & preferences', route: '/settings' },
    { icon: 'notifications-outline' as const, title: 'Notifications', description: 'View your alerts and updates', route: '/notifications' },
    { icon: 'chatbubbles-outline' as const, title: 'AI Coach', description: 'Talk to your personalized coach', route: '/coach' },
    { icon: 'compass-outline' as const, title: 'Explore', description: 'Discover workouts and content', route: '/explore' },
    { icon: 'barbell-outline' as const, title: 'Exercises', description: 'Open the exercise library', route: '/exercises' },
    ...(user?.isAdmin ? [{ icon: 'shield-checkmark-outline' as const, title: 'Admin', description: 'Manage users and content', route: '/admin', tint: '#0f766e' }] : []),
  ];

  return (
    <View style={styles.page}>
      <AppHeader title="Profile" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero Avatar Card */}
        <Animated.View entering={FadeInDown.springify()}>
          <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={styles.heroCard}>
            {/* Avatar */}
            <Pressable onPress={handlePickImage} style={styles.avatarWrap}>
              <LinearGradient colors={['#0d9488', '#14b8a6']} style={styles.avatarBorder}>
                {profilePictureUrl ? (
                  <Image source={{ uri: profilePictureUrl }} style={styles.avatar} />
                ) : (
                  <LinearGradient colors={['#0f766e', '#0d9488']} style={styles.avatarFallback}>
                    <Text style={styles.avatarLetter}>{firstName.charAt(0)}</Text>
                  </LinearGradient>
                )}
              </LinearGradient>
              {uploadProgress !== null && (
                <View style={styles.uploadOverlay} pointerEvents="none">
                  {uploadProgress > 0 ? (
                    <Text style={styles.uploadPercent}>{Math.round(uploadProgress * 100)}%</Text>
                  ) : (
                    <ActivityIndicator size="small" color="#fff" />
                  )}
                </View>
              )}
              <View style={styles.cameraBtn}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </Pressable>

            <Text style={styles.heroName}>{user?.profile.name || 'FitRack Member'}</Text>
            <Text style={styles.heroContact}>{user?.email || user?.phone || ''}</Text>

            {/* Stat pills */}
            <View style={styles.statRow}>
              {heightCm && <StatPill icon="resize-outline" label="Height" value={`${heightCm}cm`} />}
              {weightKg && <StatPill icon="barbell-outline" label="Weight" value={`${weightKg}kg`} />}
              {age && <StatPill icon="calendar-outline" label="Age" value={age} />}
            </View>

            {/* BMI badge */}
            {bmi && (
              <View style={[styles.bmiBadge, { borderColor: bmiColor + '40' }]}>
                <Text style={[styles.bmiValue, { color: bmiColor }]}>{bmi}</Text>
                <Text style={styles.bmiCategory}>BMI · {bmiCategory}</Text>
              </View>
            )}

            {/* Calories target */}
            {user?.profile.dailyCalories && (
              <View style={styles.calBadge}>
                <Ionicons name="flame-outline" size={14} color="#f59e0b" />
                <Text style={styles.calText}>{user.profile.dailyCalories} kcal daily target</Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* AI Body Scan CTA */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.scanCta}>
          <LinearGradient colors={['rgba(13,148,136,0.08)', 'rgba(13,148,136,0.02)']} style={styles.scanCtaInner}>
            <LinearGradient colors={['#0d9488', '#14b8a6']} style={styles.scanCtaIcon}>
              <Ionicons name="body-outline" size={20} color="#fff" />
            </LinearGradient>
            <View style={styles.scanCtaContent}>
              <Text style={styles.scanCtaTitle}>AI Body Analysis</Text>
              <Text style={styles.scanCtaSub}>Get personalized insights & workout plan</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(modals)/scan' as any)} style={styles.scanCtaBtn}>
              <Text style={styles.scanCtaBtnText}>Scan →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Edit Profile Section */}
        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.card}>
          <SectionHeader icon="person-outline" title="Personal Information" />
          <View style={styles.infoGrid}>
            <InfoRow label="Name" value={user?.profile.name || '—'} />
            <InfoRow label="Age" value={user?.profile.age ? `${user.profile.age} years` : '—'} />
            <InfoRow label="Gender" value={user?.profile.gender ? user.profile.gender.charAt(0).toUpperCase() + user.profile.gender.slice(1) : '—'} />
            <InfoRow label="Height" value={user?.profile.heightCm ? `${user.profile.heightCm} cm` : '—'} />
            <InfoRow label="Weight" value={user?.profile.weightKg ? `${user.profile.weightKg} kg` : '—'} />
            <InfoRow label="Body Type" value={user?.profile.bodyType ? user.profile.bodyType.charAt(0).toUpperCase() + user.profile.bodyType.slice(1) : '—'} />
            <InfoRow label="Primary Goal" value={user?.fitnessGoals?.primaryGoal ? user.fitnessGoals.primaryGoal.replace('_', ' ') : '—'} />
            <InfoRow label="Workout Frequency" value={user?.fitnessGoals?.workoutFrequencyPerWeek ? `${user.fitnessGoals.workoutFrequencyPerWeek} days/week` : '—'} />
          </View>
        </Animated.View>

        {/* AI Preferences */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.card}>
          <SectionHeader icon="sparkles-outline" title="AI Preferences" />
          <View style={styles.prefRow}>
            <View style={styles.prefContent}>
              <Text style={styles.prefTitle}>Adaptive Difficulty</Text>
              <Text style={styles.prefDesc}>AI adjusts workout intensity based on your performance</Text>
            </View>
            <Switch
              value={user?.preferences.adaptiveDifficulty ?? true}
              onValueChange={async (val: boolean) => {
                try {
                  await useAuthStore.getState().updatePreferences({ adaptiveDifficulty: val });
                } catch {
                  Alert.alert('Update failed', 'Could not save AI preference.');
                }
              }}
              trackColor={{ false: '#e2e8f0', true: '#0d9488' }}
              thumbColor={user?.preferences.adaptiveDifficulty ? '#fff' : '#f8fafc'}
            />
          </View>
        </Animated.View>

        {/* More */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.card}>
          <SectionHeader icon="apps-outline" title="More" />
          <View style={styles.shortcutList}>
            {hiddenRoutes.map((item) => (
              <ShortcutCard
                key={item.route}
                icon={item.icon}
                title={item.title}
                description={item.description}
                tint={item.tint ?? '#0d9488'}
                onPress={() => router.push(item.route as any)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Actions Section */}
        <Animated.View entering={FadeInDown.delay(220).springify()} style={styles.actionsWrap}>
          <TouchableOpacity onPress={handleRetakeOnboarding} style={styles.retakeBtn}>
            <Ionicons name="refresh-outline" size={18} color="#0d9488" />
            <Text style={styles.retakeBtnText}>Re-take Body Assessment</Text>
          </TouchableOpacity>

          <Button label="Log Out" onPress={async () => {
            await logout();
            router.replace('/login');
          }} tone="danger" />
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  screen: { 
    flex: 1 
  },
  content: { 
    paddingBottom: Layout.floatingBottomPadding, 
    paddingTop: 8 
  },

  // Hero card
  heroCard: { 
    paddingTop: 32, 
    paddingBottom: 28, 
    paddingHorizontal: Layout.screenPaddingWide, 
    alignItems: 'center', 
    marginBottom: 16 
  },
  avatarWrap: { 
    marginBottom: 16, 
    position: 'relative' 
  },
  avatarBorder: { 
    width: 100, 
    height: 100, 
    borderRadius: Radius.full, 
    padding: 2 
  },
  avatar: { 
    width: 96, 
    height: 96, 
    borderRadius: Radius.full 
  },
  avatarFallback: { 
    width: 96, 
    height: 96, 
    borderRadius: Radius.full, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  avatarLetter: { 
    color: '#fff', 
    fontSize: 40,
    fontWeight: '700' 
  },
  cameraBtn: { 
    position: 'absolute', 
    bottom: 2, 
    right: 2, 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#0d9488', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: '#0a0f1e' 
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPercent: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  heroName: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: '500', 
    marginBottom: 4, 
    textAlign: 'center' 
  },
  heroContact: { 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: 13, 
    fontWeight: '400', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  statRow: { 
    flexDirection: 'row', 
    gap: 12, 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    marginBottom: 16 
  },
  statPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 24, 
    paddingHorizontal: 14, 
    paddingVertical: 8 
  },
  statTextContainer: {
    alignItems: 'flex-start',
  },
  statValue: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '500' 
  },
  statLabel: { 
    color: 'rgba(255,255,255,0.5)', 
    fontSize: 11, 
    fontWeight: '400' 
  },
  bmiBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    borderWidth: 1, 
    borderRadius: 24, 
    paddingHorizontal: 18, 
    paddingVertical: 8, 
    marginBottom: 12 
  },
  bmiValue: { 
    fontSize: 18, 
    fontWeight: '500' 
  },
  bmiCategory: { 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: 13, 
    fontWeight: '400' 
  },
  calBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: 'rgba(245,158,11,0.12)', 
    borderRadius: 20, 
    paddingHorizontal: 14, 
    paddingVertical: 6 
  },
  calText: { 
    color: '#f59e0b', 
    fontSize: 12, 
    fontWeight: '500' 
  },

  // Scan CTA
  scanCta: { 
    marginHorizontal: Layout.screenPadding, 
    marginBottom: 16, 
    borderRadius: Radius.xl, 
    overflow: 'hidden' 
  },
  scanCtaInner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: 'rgba(13,148,136,0.15)', 
    borderRadius: Radius.xl 
  },
  scanCtaIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: Radius.xl, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  scanCtaContent: {
    flex: 1,
  },
  scanCtaTitle: { 
    color: '#1e293b', 
    fontSize: 15, 
    fontWeight: '500', 
    marginBottom: 2 
  },
  scanCtaSub: { 
    color: '#64748b', 
    fontSize: 12, 
    fontWeight: '400' 
  },
  scanCtaBtn: { 
    backgroundColor: '#0d9488', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  scanCtaBtnText: { 
    color: '#fff', 
    fontSize: 13, 
    fontWeight: '500' 
  },

  // Cards
  card: { 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    marginHorizontal: 16, 
    padding: 20, 
    marginBottom: 16,
    ...Shadows.sm
  },
  cardHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 18 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  sectionTitle: { 
    color: '#1e293b', 
    fontSize: 16, 
    fontWeight: '500' 
  },
  editBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#f0fdfa', 
    borderRadius: Radius.full, 
    paddingHorizontal: 14, 
    paddingVertical: 6 
  },
  editBtnText: { 
    color: '#0d9488', 
    fontSize: 13, 
    fontWeight: '500' 
  },

  // Info grid
  infoGrid: { 
    gap: 12 
  },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  infoLabel: { 
    color: '#64748b', 
    fontSize: 14, 
    fontWeight: '400' 
  },
  infoValue: { 
    color: '#1e293b', 
    fontSize: 15, 
    fontWeight: '500' 
  },

  // Edit form
  editForm: {
    gap: 4,
  },
  fieldLabel: { 
    color: '#475569', 
    fontSize: 13, 
    fontWeight: '500', 
    marginBottom: 8, 
    marginTop: 4 
  },
  genderRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 16 
  },
  genderBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  genderBtnActive: { 
    borderColor: '#0d9488', 
    backgroundColor: '#0d9488' 
  },
  genderText: { 
    color: '#64748b', 
    fontWeight: '500', 
    fontSize: 13 
  },
  genderTextActive: { 
    color: '#ffffff' 
  },
  editActions: { 
    marginTop: 12, 
    gap: 10 
  },

  // Preferences
  prefRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14 
  },
  prefContent: {
    flex: 1,
  },
  prefTitle: { 
    color: '#1e293b', 
    fontSize: 15, 
    fontWeight: '500', 
    marginBottom: 2 
  },
  prefDesc: { 
    color: '#64748b', 
    fontSize: 12, 
    fontWeight: '400',
    lineHeight: 16
  },

  shortcutList: {
    gap: 10,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shortcutIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTextWrap: {
    flex: 1,
  },
  shortcutTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  shortcutDesc: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 16,
  },

  // Actions
  actionsWrap: { 
    paddingHorizontal: 16, 
    gap: 12 
  },
  retakeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 12 
  },
  retakeBtnText: { 
    color: '#0d9488', 
    fontSize: 14, 
    fontWeight: '500' 
  },
});
