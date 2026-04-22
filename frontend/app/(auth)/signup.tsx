import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { validateEmail, validateOtp, validatePassword, validatePhone, validateRequired } from '@/utils/validators';

export default function SignupScreen() {
  const router = useRouter();
  const { register, verifyOtp, isLoading, touchActivity } = useAuthStore();
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const verificationPurpose = useMemo(
    () => (email.trim() ? 'verify-email' : 'verify-phone'),
    [email]
  );

  const handleRegister = async () => {
    const nextErrors = {
      name: validateRequired(name, 'Name'),
      email: email ? validateEmail(email) : null,
      phone: !email ? validatePhone(phone) || validateRequired(phone, 'Phone') : validatePhone(phone),
      password: validatePassword(password),
    };

    if (nextErrors.name || nextErrors.email || nextErrors.phone || nextErrors.password) {
      Alert.alert(
        'Check your details',
        [nextErrors.name, nextErrors.email, nextErrors.phone, nextErrors.password]
          .filter(Boolean)
          .join('\n')
      );
      return;
    }

    try {
      touchActivity();
      await register({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
      });
      setStep('verify');
      Alert.alert('Account created', 'Enter the 6-digit OTP sent to verify your account.');
    } catch (error) {
      Alert.alert('Signup failed', error instanceof Error ? error.message : 'Unable to sign up.');
    }
  };

  const handleVerify = async () => {
    const otpError = validateOtp(otp);
    if (otpError) {
      Alert.alert('Invalid OTP', otpError);
      return;
    }

    try {
      touchActivity();
      await verifyOtp({
        identifier: email.trim() || phone.trim(),
        otp,
        purpose: verificationPurpose,
      });
      await useAuthStore.getState().login(email.trim() || phone.trim(), password);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Verification failed', error instanceof Error ? error.message : 'Try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{step === 'register' ? 'Create your FITRACK account' : 'Verify your account'}</Text>
      <Text style={styles.subtitle}>
        {step === 'register'
          ? 'Register with email or phone, then verify with OTP before entering your dashboard.'
          : 'We sent a verification code to your chosen contact method.'}
      </Text>

      <View style={styles.card}>
        {step === 'register' ? (
          <>
            <Input label="Full name" onChangeText={setName} placeholder="Areeba Khan" value={name} />
            <Input
              autoCapitalize="none"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="you@example.com"
              value={email}
            />
            <Input
              keyboardType="phone-pad"
              label="Phone"
              onChangeText={setPhone}
              placeholder="+923001234567"
              value={phone}
            />
            <Input
              label="Password"
              onChangeText={setPassword}
              placeholder="Strong password"
              secureTextEntry
              value={password}
            />
            <Text style={styles.helper}>Use 8+ characters with uppercase, lowercase, number, and symbol.</Text>
            <Button label="Create Account" loading={isLoading} onPress={handleRegister} />
          </>
        ) : (
          <>
            <Input
              keyboardType="number-pad"
              label="Verification OTP"
              onChangeText={setOtp}
              placeholder="123456"
              value={otp}
            />
            <Button label="Verify And Continue" loading={isLoading} onPress={handleVerify} />
            <Button label="Back" onPress={() => setStep('register')} tone="secondary" />
          </>
        )}
      </View>

      <Pressable onPress={() => router.replace('/login')}>
        <Text style={styles.footer}>Already have an account? Log in</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff7ed',
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#7c2d12',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9a3412',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffedd5',
    borderRadius: 24,
    gap: 4,
    padding: 20,
  },
  helper: {
    color: '#9a3412',
    fontSize: 13,
    marginBottom: 14,
  },
  footer: {
    color: '#7c2d12',
    fontSize: 15,
    marginTop: 18,
    textAlign: 'center',
  },
});
