import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutTemplate } from '@/types/workout';

export function TemplateSelector({
  templates,
  onUseTemplate,
  compact = false,
}: {
  templates: WorkoutTemplate[];
  onUseTemplate: (template: WorkoutTemplate) => void;
  compact?: boolean;
}) {
  const { width } = useWindowDimensions();
  const isCompact = compact || width < 380;

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
    <View style={[styles.wrapper, isCompact ? styles.wrapperCompact : null]}>
      <Text style={[styles.sectionTitle, isCompact ? styles.sectionTitleCompact : null]}>
        Popular Templates
      </Text>
      <Text style={[styles.sectionSubtitle, isCompact ? styles.sectionSubtitleCompact : null]}>
        Choose a template to get started quickly
      </Text>
      
      {templates.map((template) => {
        const colors = getDifficultyColor(template.difficulty);
        const icon = getIcon(template.difficulty);
        
        return (
          <Pressable
            key={template.id}
            onPress={() => onUseTemplate(template)}
              style={({ pressed }) => [styles.card, isCompact ? styles.cardCompact : null, pressed && styles.cardPressed]}>
            <LinearGradient
              colors={colors}
              style={styles.cardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            
              <View style={[styles.cardContent, isCompact ? styles.cardContentCompact : null]}>
              <View style={styles.header}>
                <View style={[styles.iconContainer, isCompact ? styles.iconContainerCompact : null]}>
                  <Ionicons name={icon} size={isCompact ? 22 : 24} color="#ffffff" />
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {template.difficulty}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.title, isCompact ? styles.titleCompact : null]}>{template.name}</Text>
              <Text style={[styles.description, isCompact ? styles.descriptionCompact : null]} numberOfLines={3}>
                {template.description}
              </Text>
              
              <View style={[styles.footer, isCompact ? styles.footerCompact : null]}>
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
              
              <View style={[styles.useButton, isCompact ? styles.useButtonCompact : null]}>
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
  wrapperCompact: {
    paddingHorizontal: 0,
    paddingVertical: 4,
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
  sectionTitleCompact: {
    fontSize: 17,
  },
  sectionSubtitleCompact: {
    lineHeight: 19,
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
  cardCompact: {
    borderRadius: 18,
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
  cardContentCompact: {
    padding: 16,
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
  iconContainerCompact: {
    width: 44,
    height: 44,
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
  titleCompact: {
    fontSize: 17,
  },
  description: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 14,
  },
  descriptionCompact: {
    lineHeight: 17,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 14,
  },
  footerCompact: {
    gap: 10,
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
  useButtonCompact: {
    paddingVertical: 9,
  },
  useButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});