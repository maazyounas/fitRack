import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppPalette } from '@/hooks/useAppPalette';

interface RatingComponentProps {
  currentRating: number | null;
  onRatePress: (score: number) => void;
  disabled?: boolean;
}

export const RatingComponent: React.FC<RatingComponentProps> = ({
  currentRating,
  onRatePress,
  disabled = false,
}) => {
  const palette = useAppPalette();

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => !disabled && onRatePress(star)}
          disabled={disabled}
          style={styles.starButton}>
          <Ionicons
            name={currentRating && currentRating >= star ? 'star' : 'star-outline'}
            size={32}
            color={currentRating && currentRating >= star ? '#FFB800' : palette.mutedText}
          />
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  starButton: {
    padding: 4,
  },
});
