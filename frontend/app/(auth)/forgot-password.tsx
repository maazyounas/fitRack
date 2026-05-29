import { useState } from 'react';
import {
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { requestPasswordReset, resetPassword } from '@/services/api/auth';
import { AUTH_THEME } from '@/utils/authTheme';
import { getAuthResponsiveMetrics } from '@/utils/responsive';
import { validateOtp, validatePassword, validateRequired } from '@/utils/validators';

type FieldErrors = {
  identifier?: string | null;
  otp?: string | null;
  newPassword?: string | null;
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const metrics = getAuthResponsiveMetrics(width);
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const setField = (field: keyof FieldErrors, setValue: (v: string) => void) => (value: string) => {
    setErrors((e) => ({ ...e, [field]: null }));
    setValue(value);
  };

  const handleRequest = async () => {
    const identifierError = validateRequired(identifier, 'Email or phone');
    if (identifierError) {
      setErrors({ identifier: identifierError });
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedIdentifier = identifier.trim().includes('@')
        ? identifier.trim().toLowerCase()
        : identifier.trim().replace(/[^\d+]/g, '');

      await requestPasswordReset(normalizedIdentifier);
      setStep('reset');
    } catch (error) {
      Alert.alert('Request failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    const nextErrors: FieldErrors = {
      otp: validateOtp(otp),
      newPassword: validatePassword(newPassword),
    };
    setErrors(nextErrors);
    if (nextErrors.otp || nextErrors.newPassword) return;

    setIsSubmitting(true);
    try {
      const normalizedIdentifier = identifier.trim().includes('@')
        ? identifier.trim().toLowerCase()
        : identifier.trim().replace(/[^\d+]/g, '');

      await resetPassword({ identifier: normalizedIdentifier, otp, newPassword });
      Alert.alert(
        'Password Updated',
        'Your password was changed successfully. Please log in again.',
        [{ text: 'Log In', onPress: () => router.replace('/login') }]
      );
    } catch (error) {
      Alert.alert('Reset failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
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
            <Ionicons
              name={step === 'request' ? 'key-outline' : 'lock-open-outline'}
              size={metrics.isCompact ? 26 : 28}
              color="#fff"
            />
          </View>
          <Text style={[styles.heroTitle, { fontSize: metrics.heroTitleSize - 2 }]}>
            {step === 'request' ? 'Password Recovery' : 'Set New Password'}
          </Text>
          <Text style={[styles.heroSub, { fontSize: metrics.heroSubSize, maxWidth: metrics.heroSubMaxWidth }]}>
            {step === 'request'
              ? 'Enter your email or phone and we\'ll send you a one-time code.'
              : 'Enter the OTP and choose a strong new password.'}
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
          {/* Identifier field — always visible */}
          <View style={[styles.fieldGroup, { marginBottom: metrics.fieldGroupMarginBottom }]}>
            <Text style={[styles.label, { fontSize: metrics.labelSize }]}>Email or Phone</Text>
            <View style={[styles.inputRow, { minHeight: metrics.inputMinHeight, paddingHorizontal: metrics.inputHorizontalPadding }, errors.identifier ? styles.inputError : null]}>
              <Ionicons name="at-outline" size={metrics.iconSize} color="#94a3b8" style={[styles.icon, { marginRight: metrics.iconSpacing }]} />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setField('identifier', setIdentifier)}
                placeholderTextColor="#94a3b8"
                placeholder="Email or phone"
                value={identifier}
                editable={step === 'request'}
                style={[styles.bare, { fontSize: metrics.bareFontSize }, step === 'reset' && styles.bareDisabled]}
              />
              {step === 'reset' && (
                <Ionicons name="checkmark-circle" size={metrics.iconSize} color="#10b981" />
              )}
            </View>
            {errors.identifier ? <Text style={styles.errTxt}>{errors.identifier}</Text> : null}
          </View>

          {step === 'request' ? (
            <>
              <Button label="Send OTP" loading={isSubmitting} onPress={handleRequest} />
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={metrics.isCompact ? 15 : 16} color={AUTH_THEME.primary} />
                <Text style={[styles.infoTxt, { fontSize: metrics.helperTextSize, lineHeight: metrics.helperLineHeight }]}>
                  For security, the response is the same whether the account exists or not.
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* OTP */}
              <View style={[styles.fieldGroup, { marginBottom: metrics.fieldGroupMarginBottom }]}>
                <Text style={[styles.label, { fontSize: metrics.labelSize }]}>Verification Code</Text>
                <View style={[styles.inputRow, { minHeight: metrics.inputMinHeight, paddingHorizontal: metrics.inputHorizontalPadding }, errors.otp ? styles.inputError : null]}>
                  <Ionicons name="keypad-outline" size={metrics.iconSize} color="#94a3b8" style={[styles.icon, { marginRight: metrics.iconSpacing }]} />
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={6}
                    onChangeText={setField('otp', setOtp)}
                    placeholderTextColor="#94a3b8"
                    placeholder="OTP code"
                    value={otp}
                    style={[styles.bare, styles.otpInput, { fontSize: metrics.otpFontSize, letterSpacing: metrics.otpLetterSpacing }]}
                  />
                </View>
                {errors.otp ? <Text style={styles.errTxt}>{errors.otp}</Text> : null}
              </View>

              {/* New Password */}
              <View style={[styles.fieldGroup, { marginBottom: metrics.fieldGroupMarginBottom }]}>
                <Text style={[styles.label, { fontSize: metrics.labelSize }]}>New Password</Text>
                <View style={[styles.inputRow, { minHeight: metrics.inputMinHeight, paddingHorizontal: metrics.inputHorizontalPadding }, errors.newPassword ? styles.inputError : null]}>
                  <Ionicons name="lock-closed-outline" size={metrics.iconSize} color="#94a3b8" style={[styles.icon, { marginRight: metrics.iconSpacing }]} />
                  <TextInput
                    onChangeText={setField('newPassword', setNewPassword)}
                    placeholderTextColor="#94a3b8"
                    placeholder="New password"
                    secureTextEntry={!showPassword}
                    value={newPassword}
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
                {errors.newPassword ? <Text style={styles.errTxt}>{errors.newPassword}</Text> : null}
              </View>

              <View style={[styles.actionStack, { gap: metrics.isCompact ? 12 : 16 }]}>
                <Button label="Reset Password" loading={isSubmitting} onPress={handleReset} />

                <Pressable onPress={() => { setStep('request'); setOtp(''); setErrors({}); }} style={styles.backWrap}>
                  <Ionicons name="arrow-back-outline" size={14} color={AUTH_THEME.primary} />
                  <Text style={[styles.backTxt, { fontSize: metrics.footerTextSize }]}>Back — Request a new OTP</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        <Pressable onPress={() => router.replace('/login')} style={[styles.footerWrap, { marginTop: metrics.footerTopMargin }]}>
          <Text style={[styles.footer, { fontSize: metrics.footerTextSize }]}>
            Remember it?{' '}
            <Text style={styles.footerAccent}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0fdfa' },
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
    padding: 0,
    color: '#1e293b',
    height: '100%',
  },
  bareDisabled: { color: '#64748b' },
  eyeBtn: { padding: 4 },
  otpInput: { letterSpacing: 8, fontSize: 20, fontWeight: '700' },
  errTxt: { color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  infoTxt: { flex: 1, color: AUTH_THEME.primaryDark, fontSize: 12, lineHeight: 18 },
  actionStack: {
    marginTop: 4,
  },
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  backTxt: { color: AUTH_THEME.primary, fontSize: 13, fontWeight: '600' },
  footerWrap: { marginTop: 24, alignItems: 'center' },
  footer: { color: '#64748b', fontSize: 14 },
  footerAccent: { color: AUTH_THEME.primary, fontWeight: '700' },
});
