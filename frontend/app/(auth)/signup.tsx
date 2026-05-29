import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
import {
  validateEmail,
  validateOtp,
  validatePassword,
  validatePhone,
  validateRequired,
} from '@/utils/validators';

// ─── Password Strength Meter ─────────────────────────────────────────────────

function getPasswordStrength(password: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '#e2e8f0' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z\d]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
  if (score === 2 || score === 3) return { level: 2, label: 'Fair', color: '#f59e0b' };
  return { level: 3, label: 'Strong', color: '#10b981' };
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const { level, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <View style={meterStyles.wrap}>
      <View style={meterStyles.bars}>
        {([1, 2, 3] as const).map((bar) => (
          <View
            key={bar}
            style={[
              meterStyles.bar,
              { backgroundColor: bar <= level ? color : '#e2e8f0' },
            ]}
          />
        ))}
      </View>
      <Text style={[meterStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

const meterStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 4 },
  label: { fontSize: 11, fontWeight: '700', width: 44, textAlign: 'right' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

type FieldErrors = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  password?: string | null;
  otp?: string | null;
};

export default function SignupScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const metrics = getAuthResponsiveMetrics(width);
  const { register, verifyOtp, resendOtp, isLoading, touchActivity } = useAuthStore();

  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [resendCooldown, setResendCooldown] = useState(0);

  const verificationPurpose = useMemo(
    () => {
      return email.trim() ? 'verify-email' : 'verify-phone';
    },
    [email]
  );

  const setField = (field: keyof FieldErrors) => (value: string) => {
    setErrors((e) => ({ ...e, [field]: null }));
    if (field === 'name') setName(value);
    else if (field === 'email') setEmail(value);
    else if (field === 'phone') setPhone(value);
    else if (field === 'password') setPassword(value);
    else if (field === 'otp') setOtp(value);
  };

  const handleRegister = async () => {
    const nextErrors: FieldErrors = {
      name: validateRequired(name, 'Full name'),
      email: email ? validateEmail(email) : null,
      phone: !email
        ? validatePhone(phone) || validateRequired(phone, 'Phone')
        : validatePhone(phone),
      password: validatePassword(password),
    };

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    try {
      touchActivity();
      const response = await register({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
      });

      const debugOtp = response.debugOtp?.email ?? response.debugOtp?.phone;
      if (debugOtp) {
        setOtp(debugOtp);
        Alert.alert('Development OTP', `OTP auto-filled for local testing: ${debugOtp}`);
      }

      setStep('verify');
    } catch (error) {
      Alert.alert('Signup failed', error instanceof Error ? error.message : 'Unable to sign up.');
    }
  };

  const handleVerify = async () => {
    const otpError = validateOtp(otp);
    if (otpError) {
      setErrors((e) => ({ ...e, otp: otpError }));
      return;
    }

    try {
      touchActivity();
      const identifier = verificationPurpose === 'verify-email' 
        ? email.trim().toLowerCase() 
        : phone.trim().replace(/[^\d+]/g, '');

      await verifyOtp({
        identifier,
        otp,
        purpose: verificationPurpose,
      });
      await useAuthStore.getState().login(identifier, password, true);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Verification failed', error instanceof Error ? error.message : 'Try again.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const identifier = verificationPurpose === 'verify-email' 
        ? email.trim().toLowerCase() 
        : phone.trim().replace(/[^\d+]/g, '');

      await resendOtp({
        identifier,
        purpose: verificationPurpose,
      });
      Alert.alert('OTP Resent', 'A new 6-digit code has been sent.');
      // 60-second cooldown
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (error) {
      Alert.alert('Resend failed', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={AUTH_THEME.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.hero,
            {
              paddingTop: metrics.heroPaddingTop,
              paddingBottom: metrics.heroPaddingBottom,
              paddingHorizontal: metrics.heroHorizontalPadding,
            },
          ]}
        >
          <View style={[styles.logoRing, { padding: metrics.isCompact ? 14 : 16, marginBottom: metrics.isCompact ? 12 : 16 }]}>
            <Ionicons name={step === 'register' ? 'person-add-outline' : 'shield-checkmark-outline'} size={metrics.isCompact ? 26 : 28} color="#fff" />
          </View>
          <Text style={[styles.heroTitle, { fontSize: metrics.heroTitleSize - 2 }]}>
            {step === 'register' ? 'Create Account' : 'Verify Identity'}
          </Text>
          <Text style={[styles.heroSub, { fontSize: metrics.heroSubSize, maxWidth: metrics.heroSubMaxWidth }]}>
            {step === 'register'
              ? 'Register with email or phone — then verify with OTP.'
              : `We sent a 6-digit code to ${email.trim() || phone.trim()}.`}
          </Text>
        </LinearGradient>

        {/* Card */}
        <View
          style={[
            styles.card,
            {
              marginHorizontal: metrics.cardMarginHorizontal,
              padding: metrics.cardPadding,
              borderRadius: metrics.cardRadius,
              maxWidth: metrics.isTablet ? 600 : 680,
              width: '100%',
              alignSelf: 'center',
            },
          ]}
        >
          {step === 'register' ? (
            <>
              {/* Name */}
              <View style={[styles.fieldGroup, { marginBottom: metrics.fieldGroupMarginBottom }]}>
                <Text style={[styles.label, { fontSize: metrics.labelSize }]}>Full Name</Text>
                <View style={[styles.inputRow, { minHeight: metrics.inputMinHeight, paddingHorizontal: metrics.inputHorizontalPadding }, errors.name ? styles.inputError : null]}>
                  <Ionicons name="person-outline" size={metrics.iconSize} color="#94a3b8" style={[styles.icon, { marginRight: metrics.iconSpacing }]} />
                  <TextInput
                    onChangeText={setField('name')}
                    placeholderTextColor="#94a3b8"
                    placeholder="Full name"
                    value={name}
                    style={[styles.bare, { fontSize: metrics.bareFontSize }]}
                  />
                </View>
                {errors.name ? <Text style={styles.errTxt}>{errors.name}</Text> : null}
              </View>

              {/* Email */}
              <View style={[styles.fieldGroup, { marginBottom: metrics.fieldGroupMarginBottom }]}>
                <Text style={[styles.label, { fontSize: metrics.labelSize }]}>Email</Text>
                <View style={[styles.inputRow, { minHeight: metrics.inputMinHeight, paddingHorizontal: metrics.inputHorizontalPadding }, errors.email ? styles.inputError : null]}>
                  <Ionicons name="mail-outline" size={metrics.iconSize} color="#94a3b8" style={[styles.icon, { marginRight: metrics.iconSpacing }]} />
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setField('email')}
                    placeholderTextColor="#94a3b8"
                    placeholder="Email"
                    value={email}
                    style={[styles.bare, { fontSize: metrics.bareFontSize }]}
                  />
                </View>
                {errors.email ? <Text style={styles.errTxt}>{errors.email}</Text> : null}
              </View>

              {/* Phone */}
              <View style={[styles.fieldGroup, { marginBottom: metrics.fieldGroupMarginBottom }]}>
                <Text style={[styles.label, { fontSize: metrics.labelSize }]}>Phone {email ? '(optional)' : '(required if no email)'}</Text>
                <View style={[styles.inputRow, { minHeight: metrics.inputMinHeight, paddingHorizontal: metrics.inputHorizontalPadding }, errors.phone ? styles.inputError : null]}>
                  <Ionicons name="call-outline" size={metrics.iconSize} color="#94a3b8" style={[styles.icon, { marginRight: metrics.iconSpacing }]} />
                  <TextInput
                    keyboardType="phone-pad"
                    onChangeText={setField('phone')}
                    placeholderTextColor="#94a3b8"
                    placeholder="Phone number"
                    value={phone}
                    style={[styles.bare, { fontSize: metrics.bareFontSize }]}
                  />
                </View>
                {errors.phone ? <Text style={styles.errTxt}>{errors.phone}</Text> : null}
              </View>

              {/* Password */}
              <View style={[styles.fieldGroup, { marginBottom: metrics.fieldGroupMarginBottom }]}>
                <Text style={[styles.label, { fontSize: metrics.labelSize }]}>Password</Text>
                <View style={[styles.inputRow, { minHeight: metrics.inputMinHeight, paddingHorizontal: metrics.inputHorizontalPadding }, errors.password ? styles.inputError : null]}>
                  <Ionicons name="lock-closed-outline" size={metrics.iconSize} color="#94a3b8" style={[styles.icon, { marginRight: metrics.iconSpacing }]} />
                  <TextInput
                    onChangeText={setField('password')}
                    placeholderTextColor="#94a3b8"
                    placeholder="Create password"
                    secureTextEntry={!showPassword}
                    value={password}
                    style={[styles.bare, { fontSize: metrics.bareFontSize }]}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={[styles.eyeBtn, { padding: metrics.eyePadding }]}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={metrics.isCompact ? 18 : 20}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
                <PasswordStrengthMeter password={password} />
                {errors.password ? <Text style={styles.errTxt}>{errors.password}</Text> : null}
              </View>

              <Button label="Create Account" loading={isLoading} onPress={handleRegister} />
            </>
          ) : (
            <>
              {/* OTP Input */}
              <View style={styles.otpHint}>
                <Ionicons name="information-circle-outline" size={metrics.isCompact ? 15 : 16} color={AUTH_THEME.primary} />
                <Text style={[styles.otpHintTxt, { fontSize: metrics.otpHintSize, lineHeight: metrics.helperLineHeight }]}>
                  Enter the 6-digit code sent to your {verificationPurpose === 'verify-email' ? 'email' : 'phone'}.
                  It expires in 10 minutes.
                </Text>
              </View>

              <View style={[styles.fieldGroup, { marginBottom: metrics.fieldGroupMarginBottom }]}>
                <Text style={[styles.label, { fontSize: metrics.labelSize }]}>Verification Code</Text>
                <View style={[styles.inputRow, { minHeight: metrics.inputMinHeight, paddingHorizontal: metrics.inputHorizontalPadding }, errors.otp ? styles.inputError : null]}>
                  <Ionicons name="keypad-outline" size={metrics.iconSize} color="#94a3b8" style={[styles.icon, { marginRight: metrics.iconSpacing }]} />
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={6}
                    onChangeText={setField('otp')}
                    placeholderTextColor="#94a3b8"
                    placeholder="OTP code"
                    value={otp}
                    style={[styles.bare, styles.otpInput, { fontSize: metrics.otpFontSize, letterSpacing: metrics.otpLetterSpacing }]}
                  />
                </View>
                {errors.otp ? <Text style={styles.errTxt}>{errors.otp}</Text> : null}
              </View>

              <Button label="Verify & Continue" loading={isLoading} onPress={handleVerify} />

              {/* Resend OTP */}
              <Pressable
                onPress={handleResend}
                disabled={resendCooldown > 0 || isLoading}
                style={styles.resendWrap}
              >
                <Text style={[styles.resendTxt, { fontSize: metrics.footerTextSize }, resendCooldown > 0 && styles.resendDisabled]}>
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't receive it? Resend OTP"}
                </Text>
              </Pressable>

              <Button
                label="Back to Registration"
                onPress={() => { setStep('register'); setOtp(''); setErrors({}); }}
                tone="secondary"
              />
            </>
          )}
        </View>

        <Pressable onPress={() => router.replace('/login')} style={[styles.footerWrap, { marginTop: metrics.footerTopMargin }]}>
          <Text style={[styles.footer, { fontSize: metrics.footerTextSize }]}>
            Already have an account?{' '}
            <Text style={styles.footerAccent}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f3ff' },
  container: { flexGrow: 1, paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoRing: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 50,
    padding: 16,
    marginBottom: 16,
  },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    marginTop: -24,
    shadowColor: AUTH_THEME.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    gap: 4,
  },
  fieldGroup: { marginBottom: 12 },
  label: { color: '#374151', fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    minHeight: 50,
  },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  icon: { marginRight: 8 },
  bare: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    minWidth: 0,
    flexShrink: 1,
    padding: 0,
    color: '#1e293b',
    height: '100%',
  },
  eyeBtn: { padding: 4, flexShrink: 0 },
  errTxt: { color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
  otpHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  otpHintTxt: { flex: 1, color: AUTH_THEME.primaryDark, fontSize: 13, lineHeight: 18 },
  otpInput: { letterSpacing: 3, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  resendWrap: { alignItems: 'center', paddingVertical: 10 },
  resendTxt: { color: AUTH_THEME.primary, fontSize: 13, fontWeight: '600' },
  resendDisabled: { color: '#94a3b8' },
  footerWrap: { marginTop: 24, alignItems: 'center' },
  footer: { color: '#64748b', fontSize: 14 },
  footerAccent: { color: AUTH_THEME.primary, fontWeight: '700' },
});
