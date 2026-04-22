import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WorkoutPlan } from '@/types/workout';

export function WorkoutCard({
  workout,
  selected,
  onPress,
}: {
  workout: WorkoutPlan;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected ? styles.cardSelected : null]}>
      <View style={styles.header}>
        <Text style={styles.title}>{workout.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{workout.difficulty}</Text>
        </View>
      </View>
      <Text style={styles.description}>{workout.description || 'Custom workout plan'}</Text>
      <Text style={styles.meta}>
        {workout.exercises.length} exercises • {workout.estimatedDurationMinutes} mins
      </Text>
      {workout.missedCount ? (
        <Text style={styles.warning}>{workout.missedCount} missed workout notifications pending</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    marginBottom: 12,
    padding: 18,
  },
  cardSelected: {
    borderColor: '#0f766e',
    borderWidth: 2,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#0f172a',
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    paddingRight: 12,
  },
  badge: {
    backgroundColor: '#ccfbf1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#115e59',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  description: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  meta: {
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
  warning: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
});
