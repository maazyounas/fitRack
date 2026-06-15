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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { Layout, Radius, Shadows, Typography } from '@/constants/designSystem';

// ─────────────────────────────────────────────────────────────
// Pulse Notification Dot
// ─────────────────────────────────────────────────────────────
function PulseDot() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.7, { duration: 700 }),
        withTiming(1, { duration: 700 })
      ),
      -1,
      false
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 1 / scale.value,
  }));

  return <Animated.View style={[styles.pulseDot, animatedStyle]} />;
}

interface AppHeaderProps {
  title?: string;
  showGreeting?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showGreeting = true,
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const avatarUrl = user?.profile?.profilePictureUrl;

  return (
    <LinearGradient
      colors={['#0f766e', '#115e59', '#134e4a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}
    >
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Top Row */}
        <View style={styles.headerRow}>
        {/* Left Side */}
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="fitness" size={22} color="#fff" />
          </View>

          <View>
            <Text style={styles.brandText}>FITRACK</Text>
          </View>
        </View>

        {/* Right Side */}
        <View style={styles.rightSection}>
          {/* Notification */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/notifications' as any)}
            style={styles.iconWrapper}
          >
            <Ionicons
              name="notifications-outline"
              size={25}
              color="#ffffff"
            />

            <View style={styles.notificationBadge}>
              <PulseDot />
            </View>
          </TouchableOpacity>

          {/* Profile */}
          <Pressable
            onPress={() => router.push('/profile' as any)}
            style={styles.profileWrapper}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.profileIconContainer}>
                <Ionicons name="person" size={20} color="#ffffff" />
              </View>
            )}
          </Pressable>
        </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 18,
    paddingHorizontal: Layout.screenPadding,

    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
    ...Shadows.lg,
  },
  safeArea: { flex: 1 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // ───────────────── Left Section ─────────────────
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  logoContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  brandText: {
    color: '#ffffff',
    ...Typography.h3,
    letterSpacing: 0.8,
  },

  greetingText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },

  nameText: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // ───────────────── Right Section ─────────────────
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },

  iconWrapper: {
    position: 'relative',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: -1,
    width: 9,
    height: 9,
  },

  pulseDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#ef4444',
  },

  // ───────────────── Profile ─────────────────
  profileWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  profileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
});
