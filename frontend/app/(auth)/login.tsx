import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { validateRequired } from '@/utils/validators';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, touchActivity } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string | null; password?: string | null }>({});

  const handleLogin = async () => {
    const nextErrors = {
      identifier: validateRequired(identifier, 'Email or phone'),
      password: validateRequired(password, 'Password'),
    };

    setErrors(nextErrors);
    if (nextErrors.identifier || nextErrors.password) {
      return;
    }

    try {
      touchActivity();
      await login(identifier.trim(), password);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unable to log in.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>FITRACK</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Secure login with JWT sessions and inactivity protection.</Text>
      </View>

      <View style={styles.card}>
        <Input
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email or phone"
          onChangeText={setIdentifier}
          placeholder="you@example.com or +923001234567"
          value={identifier}
          error={errors.identifier}
        />
        <Input
          label="Password"
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
          error={errors.password}
        />
        <Button label="Log In" loading={isLoading} onPress={handleLogin} />

        <Pressable onPress={() => router.push('/forgot-password')} style={styles.linkWrap}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => router.push('/signup')}>
        <Text style={styles.footer}>Need an account? Sign up</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f4f7f5',
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    marginBottom: 28,
  },
  eyebrow: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0f172a',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#e7f4ef',
    borderRadius: 24,
    padding: 20,
  },
  linkWrap: {
    marginTop: 16,
  },
  link: {
    color: '#0f766e',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    color: '#334155',
    fontSize: 15,
    marginTop: 18,
    textAlign: 'center',
  },
});
