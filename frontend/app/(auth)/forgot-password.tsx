import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { requestPasswordReset, resetPassword } from '@/services/api/auth';
import { validateOtp, validatePassword, validateRequired } from '@/utils/validators';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequest = async () => {
    const identifierError = validateRequired(identifier, 'Email or phone');
    if (identifierError) {
      Alert.alert('Missing details', identifierError);
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(identifier.trim());
      setStep('reset');
      Alert.alert('OTP sent', 'Enter the OTP and set a new strong password.');
    } catch (error) {
      Alert.alert('Request failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    const otpError = validateOtp(otp);
    const passwordError = validatePassword(newPassword);

    if (otpError || passwordError) {
      Alert.alert('Check details', [otpError, passwordError].filter(Boolean).join('\n'));
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ identifier: identifier.trim(), otp, newPassword });
      Alert.alert('Password updated', 'Your password changed successfully. Please log in again.');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Reset failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Password recovery</Text>
      <Text style={styles.subtitle}>Request an OTP, validate it, and set a strong new password.</Text>

      <View style={styles.card}>
        <Input
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email or phone"
          onChangeText={setIdentifier}
          placeholder="you@example.com"
          value={identifier}
        />

        {step === 'reset' ? (
          <>
            <Input
              keyboardType="number-pad"
              label="OTP"
              onChangeText={setOtp}
              placeholder="123456"
              value={otp}
            />
            <Input
              label="New password"
              onChangeText={setNewPassword}
              placeholder="New strong password"
              secureTextEntry
              value={newPassword}
            />
            <Button label="Reset Password" loading={isSubmitting} onPress={handleReset} />
          </>
        ) : (
          <Button label="Send OTP" loading={isSubmitting} onPress={handleRequest} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
  },
});
