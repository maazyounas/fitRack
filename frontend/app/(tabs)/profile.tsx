
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { validateNumberRange, validateRequired } from '@/utils/validators';

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={14} color="#0d9488" />
      <View>
        <Text style={styles.statVal}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color="#0d9488" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, isLoading, logout, touchActivity } = useAuthStore();
  const { resetOnboarding } = useOnboardingStore();

  const [name, setName] = useState(user?.profile.name ?? '');
  const [age, setAge] = useState(user?.profile.age ? String(user.profile.age) : '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user?.profile.gender ?? 'male');
  const [heightCm, setHeightCm] = useState(user?.profile.heightCm ? String(user.profile.heightCm) : '');
  const [weightKg, setWeightKg] = useState(user?.profile.weightKg ? String(user.profile.weightKg) : '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profile.profilePictureUrl ?? '');
  const [editing, setEditing] = useState(false);

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

  const handleSave = async () => {
    const issues = [
      validateRequired(name, 'Name'),
      validateNumberRange(age, 'Age', 1, 120),
      validateNumberRange(heightCm, 'Height', 50, 300),
      validateNumberRange(weightKg, 'Weight', 20, 500),
    ].filter(Boolean);

    if (issues.length) {
      Alert.alert('Check your profile', issues.join('\n'));
      return;
    }

    try {
      touchActivity();
      await updateProfile({
        name: name.trim(),
        age: age ? Number(age) : undefined,
        gender,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
      });
      setEditing(false);
      Alert.alert('✓ Saved', 'Your profile has been updated.');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Hero Avatar Card ─────────────────────────────────────────────────── */}
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
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </Pressable>

          <Text style={styles.heroName}>{user?.profile.name || 'FitRack Member'}</Text>
          <Text style={styles.heroContact}>{user?.email || user?.phone || ''}</Text>

          {/* Stat pills */}
          <View style={styles.statRow}>
            {heightCm ? <StatPill icon="resize-outline" label="Height" value={`${heightCm}cm`} /> : null}
            {weightKg ? <StatPill icon="barbell-outline" label="Weight" value={`${weightKg}kg`} /> : null}
            {age ? <StatPill icon="calendar-outline" label="Age" value={age} /> : null}
          </View>

          {/* BMI badge */}
          {bmi && (
            <View style={[styles.bmiBadge, { borderColor: bmiColor + '50' }]}>
              <Text style={[styles.bmiVal, { color: bmiColor }]}>{bmi}</Text>
              <Text style={styles.bmiCat}>BMI · {bmiCategory}</Text>
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

      {/* ── AI Body Scan CTA ─────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.scanCta}>
        <LinearGradient colors={['rgba(13,148,136,0.1)', 'rgba(13,148,136,0.04)']} style={styles.scanCtaInner}>
          <LinearGradient colors={['#0d9488', '#14b8a6']} style={styles.scanCtaIcon}>
            <Ionicons name="body-outline" size={20} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.scanCtaTitle}>AI Body Analysis</Text>
            <Text style={styles.scanCtaSub}>Get your body type, insights, and personalised plan</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(modals)/scan' as any)}
            style={styles.scanCtaBtn}
          >
            <Text style={styles.scanCtaBtnText}>Scan</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* ── Edit Profile ─────────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <SectionHeader icon="person-outline" title="Personal Info" />
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
              <Ionicons name="pencil" size={14} color="#0d9488" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <Input label="Full name" onChangeText={setName} value={name} />
            <Input keyboardType="number-pad" label="Age" onChangeText={setAge} value={age} />

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {(['male', 'female', 'other'] as const).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                >
                  <Text style={[styles.genderTxt, gender === g && styles.genderTxtActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Input keyboardType="decimal-pad" label="Height (cm)" onChangeText={setHeightCm} value={heightCm} />
            <Input keyboardType="decimal-pad" label="Weight (kg)" onChangeText={setWeightKg} value={weightKg} />

            <View style={styles.editActions}>
              <PremiumButton label="Save Changes" loading={isLoading} onPress={handleSave} />
              <PremiumButton label="Cancel" tone="ghost" size="md" onPress={() => setEditing(false)} />
            </View>
          </>
        ) : (
          <View style={styles.infoGrid}>
            {[
              { label: 'Name', value: user?.profile.name || '—' },
              { label: 'Age', value: age ? `${age} yrs` : '—' },
              { label: 'Gender', value: gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '—' },
              { label: 'Height', value: heightCm ? `${heightCm} cm` : '—' },
              { label: 'Weight', value: weightKg ? `${weightKg} kg` : '—' },
            ].map((item) => (
              <View key={item.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}
      </Animated.View>

      {/* ── AI Preferences ────────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.card}>
        <SectionHeader icon="sparkles-outline" title="AI Preferences" />
        <View style={styles.prefRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.prefTitle}>Adaptive Difficulty</Text>
            <Text style={styles.prefDesc}>AI auto-adjusts workout intensity based on your performance</Text>
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

      {/* ── Actions ───────────────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.actionsWrap}>
        <Button label="Open Settings" onPress={() => router.push('/settings' as any)} tone="secondary" />

        <TouchableOpacity onPress={handleRetakeOnboarding} style={styles.retakeBtn}>
          <Ionicons name="refresh-outline" size={16} color="#0d9488" />
          <Text style={styles.retakeBtnText}>Re-take Body Assessment</Text>
        </TouchableOpacity>

        <Button
          label="Log Out"
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
          tone="danger"
        />
      </Animated.View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f7f5' },
  content: { paddingBottom: 40 },

  // Hero card
  heroCard: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, alignItems: 'center', marginBottom: 16 },
  avatarWrap: { marginBottom: 16, position: 'relative' },
  avatarBorder: { width: 104, height: 104, borderRadius: 52, padding: 3 },
  avatar: { width: 98, height: 98, borderRadius: 49 },
  avatarFallback: { width: 98, height: 98, borderRadius: 49, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontSize: 36, fontWeight: '900' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#0d9488', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0a0f1e' },
  heroName: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  heroContact: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  statRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 14 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  statVal: { color: '#fff', fontSize: 14, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10 },
  bmiBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 10 },
  bmiVal: { fontSize: 20, fontWeight: '900' },
  bmiCat: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  calBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  calText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },

  // Scan CTA
  scanCta: { marginHorizontal: 16, marginBottom: 14, borderRadius: 18, overflow: 'hidden' },
  scanCtaInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(13,148,136,0.2)', borderRadius: 18 },
  scanCtaIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scanCtaTitle: { color: '#0f172a', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  scanCtaSub: { color: '#64748b', fontSize: 12, lineHeight: 16 },
  scanCtaBtn: { backgroundColor: '#0d9488', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  scanCtaBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, padding: 18, marginBottom: 14, shadowColor: '#0f766e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdfa', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: '#0d9488', fontSize: 13, fontWeight: '700' },

  // Info grid
  infoGrid: { gap: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  infoValue: { color: '#0f172a', fontSize: 14, fontWeight: '700' },

  // Edit fields
  fieldLabel: { color: '#374151', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  genderBtnActive: { borderColor: '#0f766e', backgroundColor: '#0f766e' },
  genderTxt: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  genderTxtActive: { color: '#fff' },
  editActions: { marginTop: 8, gap: 8 },

  // Preferences
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prefTitle: { color: '#0f172a', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  prefDesc: { color: '#64748b', fontSize: 12, lineHeight: 16 },

  // Actions
  actionsWrap: { paddingHorizontal: 16, gap: 10 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  retakeBtnText: { color: '#0d9488', fontSize: 14, fontWeight: '700' },
});
