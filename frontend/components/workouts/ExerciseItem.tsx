import { useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutExercise } from '@/types/workout';

type ExerciseItemProps = {
  exercise: WorkoutExercise;
  index: number;
  total: number;
  onEdit: (index: number, field: keyof WorkoutExercise, value: string) => void;
  onDuplicate?: (index: number) => void;
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
};

const ITEM_HEIGHT = 180;

export function ExerciseItem({
  exercise,
  index,
  total,
  onEdit,
  onDuplicate,
  onRemove,
  onReorder,
}: ExerciseItemProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      Animated.spring(scale, {
        toValue: 1.02,
        friction: 3,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderMove: Animated.event([null, { dy: translateY }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (_event, gesture) => {
      const offset = Math.round(gesture.dy / ITEM_HEIGHT);
      const nextIndex = Math.max(0, Math.min(total - 1, index + offset));
      
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
      translateY.setValue(0);
      
      if (nextIndex !== index) {
        onReorder(index, nextIndex);
      }
    },
  });

  const incrementValue = (field: keyof WorkoutExercise, current: number, step: number = 1) => {
    const newValue = current + step;
    if (newValue >= 1) {
      onEdit(index, field, String(newValue));
    }
  };

  const decrementValue = (field: keyof WorkoutExercise, current: number, step: number = 1) => {
    const newValue = current - step;
    if (newValue >= 1) {
      onEdit(index, field, String(newValue));
    }
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ translateY }, { scale }] }]}>
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={[styles.header, isCompact && styles.headerCompact]}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{exercise.name || `Exercise ${index + 1}`}</Text>
          <View style={[styles.metaContainer, isCompact && styles.metaContainerCompact]}>
            <View style={styles.metaPill}>
              <Ionicons name="body-outline" size={12} color="#64748b" />
              <Text style={styles.meta}>{exercise.muscleGroup}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="fitness-outline" size={12} color="#64748b" />
              <Text style={styles.meta}>{exercise.equipment}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="flash-outline" size={12} color="#64748b" />
              <Text style={styles.meta}>{exercise.intensity}</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.actions, isCompact && styles.actionsCompact]}>
          <Pressable {...responder.panHandlers} style={styles.dragHandle}>
            <Ionicons name="menu" size={20} color="#64748b" />
          </Pressable>
          {onDuplicate && (
            <Pressable onPress={() => onDuplicate(index)} style={styles.duplicateButton}>
              <Ionicons name="copy-outline" size={18} color="#0d9488" />
            </Pressable>
          )}
          <Pressable onPress={() => onRemove(index)} style={styles.removeButton}>
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.formGrid, isCompact && styles.formGridCompact]}>
        <TextInput
          onChangeText={(value) => onEdit(index, 'name', value)}
          placeholder="Exercise name"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={exercise.name}
        />
        <TextInput
          onChangeText={(value) => onEdit(index, 'muscleGroup', value)}
          placeholder="Muscle group"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={exercise.muscleGroup}
        />
        <TextInput
          onChangeText={(value) => onEdit(index, 'equipment', value)}
          placeholder="Equipment"
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={exercise.equipment}
        />
      </View>

      <View style={[styles.quickStats, isCompact && styles.quickStatsCompact]}>
        <View style={styles.statControl}>
          <Text style={styles.statLabel}>Sets</Text>
          <View style={styles.statButtons}>
            <Pressable onPress={() => decrementValue('sets', exercise.sets)} style={styles.statBtn}>
              <Ionicons name="remove" size={16} color="#475569" />
            </Pressable>
            <Text style={styles.statValue}>{exercise.sets}</Text>
            <Pressable onPress={() => incrementValue('sets', exercise.sets)} style={styles.statBtn}>
              <Ionicons name="add" size={16} color="#475569" />
            </Pressable>
          </View>
        </View>

        <View style={styles.statControl}>
          <Text style={styles.statLabel}>Reps</Text>
          <View style={styles.statButtons}>
            <Pressable onPress={() => decrementValue('reps', exercise.reps)} style={styles.statBtn}>
              <Ionicons name="remove" size={16} color="#475569" />
            </Pressable>
            <Text style={styles.statValue}>{exercise.reps}</Text>
            <Pressable onPress={() => incrementValue('reps', exercise.reps)} style={styles.statBtn}>
              <Ionicons name="add" size={16} color="#475569" />
            </Pressable>
          </View>
        </View>

        <View style={styles.statControl}>
          <Text style={styles.statLabel}>Rest</Text>
          <View style={styles.statButtons}>
            <Pressable onPress={() => decrementValue('restSeconds', exercise.restSeconds, 15)} style={styles.statBtn}>
              <Ionicons name="remove" size={16} color="#475569" />
            </Pressable>
            <Text style={styles.statValue}>{exercise.restSeconds}s</Text>
            <Pressable onPress={() => incrementValue('restSeconds', exercise.restSeconds, 15)} style={styles.statBtn}>
              <Ionicons name="add" size={16} color="#475569" />
            </Pressable>
          </View>
        </View>
      </View>
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
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  headerCompact: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaContainerCompact: {
    gap: 5,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  meta: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionsCompact: {
    gap: 6,
  },
  dragHandle: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  removeButton: {
    padding: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
  },
  duplicateButton: {
    padding: 6,
    backgroundColor: '#f0fdfa',
    borderRadius: 10,
  },
  formGrid: {
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  formGridCompact: {
    paddingHorizontal: 14,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '400',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quickStatsCompact: {
    flexDirection: 'column',
    gap: 8,
  },
  statControl: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 10,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '400',
    marginBottom: 6,
  },
  statButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
});