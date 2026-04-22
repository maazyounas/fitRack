import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WorkoutTemplate } from '@/types/workout';

export function TemplateSelector({
  templates,
  onUseTemplate,
}: {
  templates: WorkoutTemplate[];
  onUseTemplate: (template: WorkoutTemplate) => void;
}) {
  return (
    <View style={styles.wrapper}>
      {templates.map((template) => (
        <Pressable key={template.id} onPress={() => onUseTemplate(template)} style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{template.difficulty}</Text>
          </View>
          <Text style={styles.title}>{template.name}</Text>
          <Text style={styles.description}>{template.description}</Text>
          <Text style={styles.meta}>
            {template.exercises.length} exercises • {template.estimatedDurationMinutes} mins
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  card: {
    backgroundColor: '#fff7ed',
    borderRadius: 22,
    padding: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fed7aa',
    borderRadius: 999,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#9a3412',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  title: {
    color: '#7c2d12',
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    color: '#9a3412',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  meta: {
    color: '#c2410c',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
});
