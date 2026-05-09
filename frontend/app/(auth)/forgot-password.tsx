import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { requestPasswordReset, resetPassword } from '@/services/api/auth';
import { validateOtp, validatePassword, validateRequired } from '@/utils/validators';

type FieldErrors = {
  identifier?: string | null;
  otp?: string | null;
  newPassword?: string | null;
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
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
      await requestPasswordReset(identifier.trim());
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
      await resetPassword({ identifier: identifier.trim(), otp, newPassword });
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
          colors={['#0369a1', '#0284c7', '#0ea5e9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.logoRing}>
            <Ionicons
              name={step === 'request' ? 'key-outline' : 'lock-open-outline'}
              size={28}
              color="#fff"
            />
          </View>
          <Text style={styles.heroTitle}>
            {step === 'request' ? 'Password Recovery' : 'Set New Password'}
          </Text>
          <Text style={styles.heroSub}>
            {step === 'request'
              ? 'Enter your email or phone and we\'ll send you a one-time code.'
              : 'Enter the OTP and choose a strong new password.'}
          </Text>
        </LinearGradient>

        {/* Card */}
        <View style={styles.card}>
          {/* Identifier field — always visible */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email or Phone</Text>
            <View style={[styles.inputRow, errors.identifier ? styles.inputError : null]}>
              <Ionicons name="at-outline" size={18} color="#94a3b8" style={styles.icon} />
              <Input
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setField('identifier', setIdentifier)}
                placeholder="you@example.com or +923001234567"
                value={identifier}
                editable={step === 'request'}
                style={[styles.bare, step === 'reset' && styles.bareDisabled]}
              />
              {step === 'reset' && (
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              )}
            </View>
            {errors.identifier ? <Text style={styles.errTxt}>{errors.identifier}</Text> : null}
          </View>

          {step === 'request' ? (
            <>
              <Button label="Send OTP" loading={isSubmitting} onPress={handleRequest} />
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color="#0369a1" />
                <Text style={styles.infoTxt}>
                  For security, the response is the same whether the account exists or not.
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* OTP */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Verification Code</Text>
                <View style={[styles.inputRow, errors.otp ? styles.inputError : null]}>
                  <Ionicons name="keypad-outline" size={18} color="#94a3b8" style={styles.icon} />
                  <Input
                    keyboardType="number-pad"
                    maxLength={6}
                    onChangeText={setField('otp', setOtp)}
                    placeholder="1 2 3 4 5 6"
                    value={otp}
                    style={[styles.bare, styles.otpInput]}
                  />
                </View>
                {errors.otp ? <Text style={styles.errTxt}>{errors.otp}</Text> : null}
              </View>

              {/* New Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={[styles.inputRow, errors.newPassword ? styles.inputError : null]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.icon} />
                  <Input
                    onChangeText={setField('newPassword', setNewPassword)}
                    placeholder="8+ chars, upper, lower, number, symbol"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    style={styles.bare}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
                {errors.newPassword ? <Text style={styles.errTxt}>{errors.newPassword}</Text> : null}
              </View>

              <Button label="Reset Password" loading={isSubmitting} onPress={handleReset} />

              <Pressable onPress={() => { setStep('request'); setOtp(''); setErrors({}); }} style={styles.backWrap}>
                <Ionicons name="arrow-back-outline" size={14} color="#0369a1" />
                <Text style={styles.backTxt}>Back — Request a new OTP</Text>
              </Pressable>
            </>
          )}
        </View>

        <Pressable onPress={() => router.replace('/login')} style={styles.footerWrap}>
          <Text style={styles.footer}>
            Remember it?{' '}
            <Text style={styles.footerAccent}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0f9ff' },
  container: { flexGrow: 1, paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 48,
    paddingHorizontal: 24,
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
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: -24,
    padding: 24,
    shadowColor: '#0369a1',
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
    fontSize: 15,
    color: '#1e293b',
  },
  bareDisabled: { color: '#64748b' },
  eyeBtn: { padding: 4 },
  otpInput: { letterSpacing: 8, fontSize: 20, fontWeight: '700' },
  errTxt: { color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  infoTxt: { flex: 1, color: '#0369a1', fontSize: 12, lineHeight: 18 },
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  backTxt: { color: '#0369a1', fontSize: 13, fontWeight: '600' },
  footerWrap: { marginTop: 24, alignItems: 'center' },
  footer: { color: '#64748b', fontSize: 14 },
  footerAccent: { color: '#0369a1', fontWeight: '700' },
});
