import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressAchievement } from '@/types/progress';

export function MilestoneBadge({ achievement, locked = false }: { achievement: ProgressAchievement; locked?: boolean }) {
  const isBronze = achievement.key.includes('bronze');
  const isSilver = achievement.key.includes('silver');
  const isGold = achievement.key.includes('gold') || achievement.key.includes('titan');
  
  const colors = isGold 
    ? (locked ? ['#475569', '#1e293b'] : ['#fbbf24', '#b45309'])
    : isSilver
    ? (locked ? ['#475569', '#1e293b'] : ['#94a3b8', '#475569'])
    : isBronze
    ? (locked ? ['#475569', '#1e293b'] : ['#d97706', '#92400e'])
    : (locked ? ['#475569', '#1e293b'] : ['#06b6d4', '#0891b2']);

  return (
    <LinearGradient colors={colors as any} style={[styles.badge, locked && styles.locked]}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={locked ? 'lock-closed' : 'trophy'} 
          size={24} 
          color={locked ? '#94a3b8' : 'white'} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, locked && styles.lockedText]}>{achievement.title}</Text>
        {!locked && <Text style={styles.date}>{new Date(achievement.unlockedAt).toLocaleDateString()}</Text>}
        {locked && <Text style={styles.description}>{achievement.description}</Text>}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  locked: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  description: { color: '#cbd5e1', fontSize: 12, lineHeight: 16 },
  lockedText: { color: '#94a3b8' },
  date: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700' },
});
