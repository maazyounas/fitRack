import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { AUTH_THEME } from '@/utils/authTheme';
import { getAuthResponsiveMetrics } from '@/utils/responsive';
import { validateRequired } from '@/utils/validators';

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const metrics = getAuthResponsiveMetrics(width);
  const { login, isLoading, touchActivity, rememberMe, setRememberMe } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string | null; password?: string | null }>({});

  const handleLogin = async () => {
    const nextErrors = {
      identifier: validateRequired(identifier, 'Email or phone'),
      password: validateRequired(password, 'Password'),
    };

    setErrors(nextErrors);
    if (nextErrors.identifier || nextErrors.password) return;

    try {
      touchActivity();
      await login(identifier.trim(), password, rememberMe);
      const currentUser = useAuthStore.getState().user;
      const onboardingDone = Boolean(
        currentUser?.onboardingCompleted ||
          currentUser?.fitnessGoals?.setupCompleted ||
          useAuthStore.getState().onboardingSnapshot
      );
      router.replace(
        currentUser?.isAdmin
          ? '/(tabs)/admin'
          : onboardingDone
            ? '/(tabs)/home'
            : '/(onboarding)/gender'
      );
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unable to log in.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <LinearGradient colors={AUTH_THEME.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: metrics.heroPaddingTop, paddingBottom: metrics.heroPaddingBottom, paddingHorizontal: metrics.heroHorizontalPadding }]}>
          <View style={[styles.logoRing, { padding: metrics.isCompact ? 14 : 16, marginBottom: metrics.isCompact ? 12 : 16 }]}>
            <Ionicons name="fitness" size={metrics.isCompact ? 28 : 32} color="#fff" />
          </View>
          <Text style={[styles.eyebrow, { fontSize: metrics.isCompact ? 10 : 11, letterSpacing: metrics.isCompact ? 2.5 : 3 }]}>FITRACK</Text>
          <Text style={[styles.heroTitle, { fontSize: metrics.heroTitleSize }]}>Welcome back</Text>
          <Text style={[styles.heroSub, { fontSize: metrics.heroSubSize, maxWidth: metrics.heroSubMaxWidth }]}>Sign in securely with JWT sessions and inactivity protection.</Text>
        </LinearGradient>

        <View style={[styles.card, { marginHorizontal: metrics.cardMarginHorizontal, padding: metrics.cardPadding, borderRadius: metrics.cardRadius, maxWidth: metrics.isTablet ? 560 : 680, width: '100%', alignSelf: 'center' }]}>
          <View style={[styles.fieldGroup, { marginBottom: metrics.fieldGroupMarginBottom }]}>
            <Text style={[styles.label, { fontSize: metrics.labelSize }]}>Email or Phone</Text>
            <View style={[styles.inputRow, { minHeight: metrics.inputMinHeight, paddingHorizontal: metrics.inputHorizontalPadding }, errors.identifier ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={metrics.iconSize} color="#64748b" style={[styles.inputIcon, { marginRight: metrics.iconSpacing }]} />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#64748b"
                onChangeText={(text) => {
                  setIdentifier(text);
                  setErrors((current) => ({ ...current, identifier: null }));
                }}
                placeholder="Email or phone"
                value={identifier}
                style={[styles.bareInput, { fontSize: metrics.bareFontSize }]}
              />
            </View>
            {errors.identifier ? <Text style={styles.errorText}>{errors.identifier}</Text> : null}
          </View>

          <View style={[styles.fieldGroup, { marginBottom: metrics.fieldGroupMarginBottom }]}>
            <Text style={[styles.label, { fontSize: metrics.labelSize }]}>Password</Text>
            <View style={[styles.inputRow, { minHeight: metrics.inputMinHeight, paddingHorizontal: metrics.inputHorizontalPadding }, errors.password ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={metrics.iconSize} color="#64748b" style={[styles.inputIcon, { marginRight: metrics.iconSpacing }]} />
              <TextInput
                onChangeText={(text) => {
                  setPassword(text);
                  setErrors((current) => ({ ...current, password: null }));
                }}
                placeholderTextColor="#64748b"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={password}
                style={[styles.bareInput, { fontSize: metrics.bareFontSize }]}
              />
              <TouchableOpacity onPress={() => setShowPassword((value) => !value)} style={[styles.eyeBtn, { padding: metrics.eyePadding }]}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={metrics.isCompact ? 18 : 20} color="#64748b" />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <View style={[styles.rememberRow, metrics.isCompact ? styles.rememberRowCompact : null]}>
            <View style={styles.rememberLeft}>
              <Ionicons name="shield-checkmark-outline" size={metrics.isCompact ? 15 : 16} color={AUTH_THEME.primary} />
              <Text style={[styles.rememberLabel, { fontSize: metrics.labelSize }]}>Remember me</Text>
            </View>
            <Switch value={rememberMe} onValueChange={(value) => setRememberMe(value)} trackColor={{ false: '#cbd5e1', true: '#0d9488' }} thumbColor={rememberMe ? '#fff' : '#f8fafc'} />
          </View>

          <Text style={[styles.rememberHint, { fontSize: metrics.helperTextSize, lineHeight: metrics.helperLineHeight }]}>
            {rememberMe ? 'Session saved — you stay logged in between app launches.' : 'Ephemeral — you will need to log in again next launch.'}
          </Text>

          <Button label="Log In" loading={isLoading} onPress={handleLogin} />

          <Pressable onPress={() => router.push('/forgot-password')} style={[styles.linkWrap, { marginTop: metrics.fieldGroupMarginBottom }]}>
            <Text style={[styles.link, { fontSize: metrics.footerTextSize }]}>Forgot password?</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/signup')} style={styles.footerWrap}>
            <Text style={[styles.footer, { fontSize: metrics.footerTextSize }]}>Don&apos;t have an account? <Text style={styles.footerAccent}>Sign up</Text></Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flexGrow: 1, paddingBottom: 40 },
  hero: { alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  logoRing: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 50, marginBottom: 16 },
  eyebrow: { color: 'rgba(255,255,255,0.74)', fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.82)', lineHeight: 20, textAlign: 'center' },
  card: { backgroundColor: '#fff', marginTop: -24, shadowColor: AUTH_THEME.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6, gap: 4 },
  fieldGroup: { marginBottom: 12 },
  label: { color: '#475569', fontWeight: '600', marginLeft: 2 },
  inputRow: { alignItems: 'center', backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', height: 50 },
  inputError: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
  inputIcon: { marginRight: 8 },
  bareInput: { backgroundColor: 'transparent', flex: 1, minWidth: 0, paddingHorizontal: 0, paddingVertical: 0, color: '#0f172a', height: '100%' },
  eyeBtn: { flexShrink: 0 },
  errorText: { color: '#ef4444', fontSize: 12, marginLeft: 4, marginTop: 4 },
  rememberRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, marginTop: 4 },
  rememberRowCompact: { flexWrap: 'wrap', rowGap: 8 },
  rememberLeft: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  rememberLabel: { color: '#475569', fontWeight: '600' },
  rememberHint: { color: '#475569', marginBottom: 16 },
  linkWrap: { alignItems: 'center', marginTop: 12 },
  link: { color: AUTH_THEME.primary, fontWeight: '600' },
  footerWrap: { alignItems: 'center', marginTop: 24 },
  footer: { color: '#475569', textAlign: 'center' },
  footerAccent: { color: AUTH_THEME.primary, fontWeight: '700' },
});
