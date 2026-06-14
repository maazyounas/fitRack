import { Pressable, StyleSheet, Text, useWindowDimensions, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutPlan } from '@/types/workout';
import { useAppPalette } from '@/hooks/useAppPalette';

export function WorkoutCard({
  workout,
  selected,
  onPress,
}: {
  workout: WorkoutPlan;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { width } = useWindowDimensions();
  const palette = useAppPalette();
  const compact = width < 380;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#64748b';
    }
  };

  const difficultyColor = getDifficultyColor(workout.difficulty);
  const gradient = selected
    ? ['#0f172a', '#0f766e', '#14b8a6']
    : [`${difficultyColor}18`, '#ffffff'];

  const isGradientLight = gradient.some(c => {
    try {
      return c.toLowerCase().includes('ffffff') || c.toLowerCase().startsWith('#fff');
    } catch (e) { return false; }
  });

  const scale = new Animated.Value(1);
  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={({ pressed }) => [
            styles.card,
            compact ? styles.cardCompact : null,
            selected && styles.cardSelected,
            pressed && styles.cardPressed,
          ]}
        >
          <LinearGradient
            colors={gradient}
            style={[styles.cardGradient, compact ? styles.cardGradientCompact : null]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          />

          <View style={[styles.accentStrip, { backgroundColor: difficultyColor }]} />

          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text
                style={[
                  styles.title,
                  compact ? styles.titleCompact : null,
                  (selected && !isGradientLight) ? styles.titleSelected : null,
                ]}
              >
                {workout.name}
              </Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: selected ? 'rgba(255,255,255,0.14)' : `${difficultyColor}15` },
                ]}
              >
                <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
                <Text style={[styles.difficultyText, { color: (selected && !isGradientLight) ? '#ffffff' : difficultyColor }]}> 
                  {workout.difficulty}
                </Text>
              </View>
            </View>

            {selected && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#0d9488" />
              </View>
            )}
          </View>

          <Text
            style={[
              styles.description,
              compact ? styles.descriptionCompact : null,
              (selected && !isGradientLight) ? styles.descriptionSelected : null,
            ]}
            numberOfLines={3}
          >
            {workout.description || 'Custom workout plan designed for your fitness journey'}
          </Text>

          <View style={[styles.stats, compact ? styles.statsCompact : null]}>
            <View style={styles.statItem}>
              <Ionicons name="repeat-outline" size={14} color={(selected && !isGradientLight) ? 'rgba(255,255,255,0.7)' : '#64748b'} />
              <Text style={[styles.statText, (selected && !isGradientLight) ? styles.statTextSelected : null]}>
                {workout.exercises.length} exercises
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={(selected && !isGradientLight) ? 'rgba(255,255,255,0.7)' : '#64748b'} />
              <Text style={[styles.statText, (selected && !isGradientLight) ? styles.statTextSelected : null]}>
                {workout.estimatedDurationMinutes} min
              </Text>
            </View>
          </View>

          {workout.missedCount ? (
            <View style={styles.warningContainer}>
              <Ionicons name="alert-circle" size={14} color="#f59e0b" />
              <Text style={styles.warningText}>
                {workout.missedCount} missed {workout.missedCount === 1 ? 'notification' : 'notifications'}
              </Text>
            </View>
          ) : null}

          {selected && (
            <View style={styles.selectIndicator}>
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            </View>
          )}
        </Pressable>
      </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardSelected: {
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardGradient: {
    padding: 16,
    minHeight: 112,
  },
  cardCompact: {
    marginHorizontal: 0,
  },
  cardGradientCompact: {
    padding: 14,
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    opacity: 0.95,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleSection: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: 16,
  },
  titleSelected: {
    color: '#ffffff',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0f172a',
  },
  selectedBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 4,
    borderRadius: 12,
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  descriptionCompact: {
    lineHeight: 17,
    marginBottom: 10,
  },
  descriptionSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  statsCompact: {
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#475569',
  },
  statTextSelected: {
    color: 'rgba(255,255,255,0.7)',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  warningText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#f59e0b',
  },
  selectIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
});