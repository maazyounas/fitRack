import { StyleSheet, Text, View } from 'react-native';
import { ProgressAchievement } from '@/types/progress';

export function MilestoneBadge({ achievement }: { achievement: ProgressAchievement }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.title}>{achievement.title}</Text>
      <Text style={styles.description}>{achievement.description}</Text>
      <Text style={styles.date}>{new Date(achievement.unlockedAt).toLocaleDateString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    marginBottom: 12,
    padding: 16,
  },
  title: { color: '#f8fafc', fontSize: 15, fontWeight: '800', marginBottom: 4 },
  description: { color: '#cbd5e1', fontSize: 13, lineHeight: 18 },
  date: { color: '#67e8f9', fontSize: 11, fontWeight: '700', marginTop: 8 },
});
