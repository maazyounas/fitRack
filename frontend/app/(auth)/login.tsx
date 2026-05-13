import { useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { validateRequired } from '@/utils/validators';

export default function LoginScreen() {
  const router = useRouter();
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
      const normalizedIdentifier = identifier.trim().includes('@')
        ? identifier.trim().toLowerCase()
        : identifier.trim().replace(/[^\d+]/g, '');

      await login(normalizedIdentifier, password, rememberMe);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unable to log in.');
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
        {/* Hero gradient banner */}
        <LinearGradient
          colors={['#0d9488', '#0f766e', '#115e59']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.logoRing}>
            <Ionicons name="fitness" size={32} color="#fff" />
          </View>
          <Text style={styles.eyebrow}>FITRACK</Text>
          <Text style={styles.heroTitle}>Welcome back</Text>
          <Text style={styles.heroSub}>
            Sign in securely with JWT sessions and inactivity protection.
          </Text>
        </LinearGradient>

        {/* Card */}
        <View style={styles.card}>
          {/* Identifier */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email or Phone</Text>
            <View style={[styles.inputRow, errors.identifier ? styles.inputError : null]}>
              <Ionicons name="person-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <Input
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(t) => { setIdentifier(t); setErrors((e) => ({ ...e, identifier: null })); }}
                placeholder="you@example.com or +923001234567"
                value={identifier}
                style={styles.bareInput}
              />
            </View>
            {errors.identifier ? <Text style={styles.errorText}>{errors.identifier}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputRow, errors.password ? styles.inputError : null]}>
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <Input
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: null })); }}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={password}
                style={styles.bareInput}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          {/* Remember Me */}
          <View style={styles.rememberRow}>
            <View style={styles.rememberLeft}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#0f766e" />
              <Text style={styles.rememberLabel}>Remember me</Text>
            </View>
            <Switch
              value={rememberMe}
              onValueChange={(v) => setRememberMe(v)}
              trackColor={{ false: '#cbd5e1', true: '#0d9488' }}
              thumbColor={rememberMe ? '#fff' : '#f8fafc'}
            />
          </View>
          <Text style={styles.rememberHint}>
            {rememberMe
              ? 'Session saved — you stay logged in between app launches.'
              : 'Ephemeral — you will need to log in again next launch.'}
          </Text>

          <Button label="Log In" loading={isLoading} onPress={handleLogin} />

          <Pressable onPress={() => router.push('/forgot-password')} style={styles.linkWrap}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/signup')} style={styles.footerWrap}>
          <Text style={styles.footer}>
            Don't have an account?{' '}
            <Text style={styles.footerAccent}>Sign up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f1f5f9' },
  container: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  // Hero
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
  eyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: -24,
    padding: 24,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
    gap: 4,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
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
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputIcon: {
    marginRight: 8,
  },
  bareInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    fontSize: 15,
    color: '#1e293b',
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 2,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rememberLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  rememberHint: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 16,
    lineHeight: 16,
  },
  linkWrap: {
    marginTop: 12,
    alignItems: 'center',
  },
  link: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '600',
  },
  footerWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  footer: {
    color: '#64748b',
    fontSize: 14,
  },
  footerAccent: {
    color: '#0f766e',
    fontWeight: '700',
  },
});
