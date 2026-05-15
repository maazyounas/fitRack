import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressAchievement } from '@/types/progress';

export function MilestoneBadge({ achievement, locked = false }: { achievement: ProgressAchievement; locked?: boolean }) {
  const isBronze = achievement.key.includes('bronze');
  const isSilver = achievement.key.includes('silver');
  const isGold = achievement.key.includes('gold') || achievement.key.includes('titan');
  
  const getGradientColors = () => {
    if (locked) return ['#475569', '#1e293b'];
    if (isGold) return ['#fbbf24', '#d97706'];
    if (isSilver) return ['#cbd5e1', '#78716c'];
    if (isBronze) return ['#d97706', '#92400e'];
    return ['#06b6d4', '#0891b2'];
  };

  const getIcon = () => {
    if (locked) return 'lock-closed';
    if (isGold) return 'trophy';
    if (isSilver) return 'medal';
    if (isBronze) return 'ribbon';
    return 'star';
  };

  const getIconColor = () => {
    if (locked) return '#94a3b8';
    if (isGold) return '#fef3c7';
    if (isSilver) return '#f8fafc';
    if (isBronze) return '#fed7aa';
    return '#cffafe';
  };

  const getRankBadge = () => {
    if (locked) return null;
    if (isGold) return { text: 'Gold', color: '#fbbf24' };
    if (isSilver) return { text: 'Silver', color: '#94a3b8' };
    if (isBronze) return { text: 'Bronze', color: '#d97706' };
    return { text: 'Achievement', color: '#06b6d4' };
  };

  const rankBadge = getRankBadge();
  const gradientColors = getGradientColors();

  return (
    <LinearGradient colors={gradientColors} style={[styles.badge, locked && styles.locked]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.iconContainer}>
        <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']} style={styles.iconGradient}>
          <Ionicons name={getIcon()} size={28} color={getIconColor()} />
        </LinearGradient>
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, locked && styles.lockedText]}>{achievement.title}</Text>
          {!locked && rankBadge && (
            <View style={[styles.rankBadge, { backgroundColor: `${rankBadge.color}20` }]}>
              <Text style={[styles.rankText, { color: rankBadge.color }]}>{rankBadge.text}</Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.description, locked && styles.lockedText]}>
          {locked ? achievement.description : 'Keep crushing your goals!'}
        </Text>
        
        {!locked && (
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={10} color="rgba(255,255,255,0.7)" />
            <Text style={styles.date}>
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </Text>
          </View>
        )}
        
        {locked && (
          <View style={styles.rewardHint}>
            <Ionicons name="gift-outline" size={10} color="rgba(255,255,255,0.5)" />
            <Text style={styles.rewardText}>Keep going to unlock this milestone</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    marginBottom: 12,
    marginHorizontal: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  locked: {
    opacity: 0.85,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  description: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    marginBottom: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '400',
  },
  lockedText: {
    color: '#cbd5e1',
  },
  rewardHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rewardText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '400',
  },
});