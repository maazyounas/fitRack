import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppPalette } from '@/hooks/useAppPalette';

interface RatingComponentProps {
  currentRating: number | null;
  onRatePress: (score: number) => void;
  disabled?: boolean;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const RatingComponent: React.FC<RatingComponentProps> = ({
  currentRating,
  onRatePress,
  disabled = false,
  showLabel = true,
  size = 'medium',
}) => {
  const palette = useAppPalette();
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [animations] = useState(
    [1, 2, 3, 4, 5].map(() => new Animated.Value(1))
  );

  const getStarSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 40;
      default: return 32;
    }
  };

  const getStarSpacing = () => {
    switch (size) {
      case 'small': return 6;
      case 'large': return 12;
      default: return 8;
    }
  };

  const getRatingText = (rating: number | null) => {
    if (!rating) return 'Tap to rate';
    switch (rating) {
      case 1: return 'Poor • Needs improvement';
      case 2: return 'Fair • Could be better';
      case 3: return 'Good • Solid exercise';
      case 4: return 'Very Good • Highly effective';
      case 5: return 'Excellent • Favorite exercise';
      default: return 'Tap to rate';
    }
  };

  const getRatingEmoji = (rating: number | null) => {
    if (!rating) return '🤔';
    switch (rating) {
      case 1: return '😕';
      case 2: return '😐';
      case 3: return '🙂';
      case 4: return '😊';
      case 5: return '🤩';
      default: return '🤔';
    }
  };

  const animateStar = (star: number, isPressed: boolean) => {
    Animated.sequence([
      Animated.spring(animations[star - 1], {
        toValue: isPressed ? 1.2 : 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(animations[star - 1], {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleStarPress = (star: number) => {
    if (disabled) return;
    animateStar(star, true);
    onRatePress(star);
  };

  const displayRating = hoveredStar !== null ? hoveredStar : currentRating;
  const starSize = getStarSize();
  const starSpacing = getStarSpacing();

  return (
    <View style={styles.container}>
      {/* Rating Label */}
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.ratingEmoji}>{getRatingEmoji(currentRating)}</Text>
          <Text style={[styles.ratingLabel, { color: palette.mutedText }]}>
            {getRatingText(currentRating)}
          </Text>
        </View>
      )}

      {/* Stars */}
      <View style={[styles.starsContainer, { gap: starSpacing }]}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => handleStarPress(star)}
            onHoverIn={() => setHoveredStar(star)}
            onHoverOut={() => setHoveredStar(null)}
            disabled={disabled}
            style={styles.starButton}
          >
            <Animated.View
              style={{
                transform: [{ scale: animations[star - 1] }],
              }}
            >
              {displayRating && displayRating >= star ? (
                <LinearGradient
                  colors={['#fbbf24', '#f59e0b']}
                  style={[styles.starGradient, { width: starSize, height: starSize, borderRadius: starSize / 2 }]}
                >
                  <Ionicons
                    name="star"
                    size={starSize - 6}
                    color="#ffffff"
                  />
                </LinearGradient>
              ) : (
                <Ionicons
                  name={hoveredStar !== null && hoveredStar >= star ? 'star' : 'star-outline'}
                  size={starSize}
                  color={
                    hoveredStar !== null && hoveredStar >= star
                      ? '#fbbf24'
                      : displayRating && displayRating >= star
                      ? '#f59e0b'
                      : palette.mutedText
                  }
                />
              )}
            </Animated.View>
          </Pressable>
        ))}
      </View>

      {/* Rating Stats (if available) */}
      {currentRating && (
        <View style={styles.statsContainer}>
          <View style={styles.statBadge}>
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text style={styles.statText}>
              {currentRating.toFixed(1)} / 5.0
            </Text>
          </View>
        </View>
      )}

      {/* Disabled Overlay */}
      {disabled && (
        <View style={styles.disabledOverlay}>
          <Text style={styles.disabledText}>Rating disabled</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    position: 'relative',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ratingEmoji: {
    fontSize: 20,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starButton: {
    padding: 2,
  },
  starGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    marginTop: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#d97706',
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});