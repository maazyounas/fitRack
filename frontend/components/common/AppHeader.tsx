import React, { useEffect } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAuthStore } from '@/store/authStore';

// ─── Pulse Dot Component ──────────────────────────────────────────────────────
function PulseDot() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.5, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 1 / scale.value,
  }));
  return <Animated.View style={[styles.pulseDot, style]} />;
}

interface AppHeaderProps {
  title?: string;
  showGreeting?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, showGreeting }) => {
  const router = useRouter();
  const { user } = useAuthStore();

  const firstName = user?.profile.name?.split(' ')[0] || 'Athlete';
  const avatarUrl = user?.profile.profilePictureUrl;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <LinearGradient colors={['#0d9488', '#0f766e', '#115e59']} style={styles.headerGradient}>
      <View style={styles.headerRow}>
        {/* Left: App Icon & Branding */}
        <View style={styles.leftSection}>
          <View style={styles.logoRing}>
            <Ionicons name="fitness" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.brandText}>FITRACK</Text>
            {showGreeting ? (
              <Text style={styles.subText}>{getGreeting()}, {firstName} 👋</Text>
            ) : title ? (
              <Text style={styles.subText}>{title}</Text>
            ) : null}
          </View>
        </View>

        {/* Right: Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/notifications' as any)}
            style={styles.iconBtn}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <View style={styles.notifDot}>
              <PulseDot />
            </View>
          </TouchableOpacity>

          <Pressable onPress={() => router.push('/profile' as any)}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#0d9488', '#14b8a6']} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{firstName.charAt(0)}</Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brandText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#0d9488',
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
