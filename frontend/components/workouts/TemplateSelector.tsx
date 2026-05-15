import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutTemplate } from '@/types/workout';

export function TemplateSelector({
  templates,
  onUseTemplate,
}: {
  templates: WorkoutTemplate[];
  onUseTemplate: (template: WorkoutTemplate) => void;
}) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return ['#10b981', '#059669'];
      case 'intermediate': return ['#f59e0b', '#d97706'];
      case 'advanced': return ['#ef4444', '#dc2626'];
      default: return ['#64748b', '#475569'];
    }
  };

  const getIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'happy-outline';
      case 'intermediate': return 'fitness-outline';
      case 'advanced': return 'flash-outline';
      default: return 'barbell-outline';
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Popular Templates</Text>
      <Text style={styles.sectionSubtitle}>Choose a template to get started quickly</Text>
      
      {templates.map((template) => {
        const colors = getDifficultyColor(template.difficulty);
        const icon = getIcon(template.difficulty);
        
        return (
          <Pressable
            key={template.id}
            onPress={() => onUseTemplate(template)}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}>
            <LinearGradient
              colors={colors}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            
            <View style={styles.cardContent}>
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name={icon} size={24} color="#ffffff" />
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {template.difficulty}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.title}>{template.name}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {template.description}
              </Text>
              
              <View style={styles.footer}>
                <View style={styles.metaItem}>
                  <Ionicons name="repeat-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.metaText}>
                    {template.exercises.length} exercises
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.metaText}>
                    {template.estimatedDurationMinutes} min
                  </Text>
                </View>
              </View>
              
              <View style={styles.useButton}>
                <Text style={styles.useButtonText}>Use Template</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748b',
    marginBottom: 8,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContent: {
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  description: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '400',
  },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    borderRadius: 14,
  },
  useButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});