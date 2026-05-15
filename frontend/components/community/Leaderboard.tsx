import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type LeaderboardEntry = {
  rank: number;
  user: { id: string; name: string; avatarUrl?: string };
  score: number;
};

type LeaderboardProps = {
  entries: LeaderboardEntry[];
};

export function Leaderboard({ entries }: LeaderboardProps) {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return ['#fbbf24', '#f59e0b'];
      case 2: return ['#cbd5e1', '#94a3b8'];
      case 3: return ['#fdba74', '#f97316'];
      default: return ['#f1f5f9', '#e2e8f0'];
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return 'medal';
      case 2: return 'medal';
      case 3: return 'medal';
      default: return null;
    }
  };

  if (!entries.length) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.emptyContent}>
          <Ionicons name="bar-chart-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No rankings yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to join and claim the top spot!</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map((entry) => {
        const rankColors = getRankColor(entry.rank);
        const isTop3 = entry.rank <= 3;
        
        return (
          <View key={entry.user.id} style={styles.row}>
            {/* Rank */}
            <LinearGradient 
              colors={rankColors as [string, string, ...string[]]} 
              style={[styles.rankBadge, isTop3 && styles.rankBadgeTop]}
            >
              {isTop3 ? (
                <Ionicons name={getRankIcon(entry.rank) as any} size={16} color="#ffffff" />
              ) : (
                <Text style={styles.rankNumber}>{entry.rank}</Text>
              )}
            </LinearGradient>

            {/* Avatar */}
            <Image 
              source={{ uri: entry.user.avatarUrl || 'https://via.placeholder.com/40' }} 
              style={styles.avatar} 
            />

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{entry.user.name}</Text>
              <View style={styles.scoreBadge}>
                <Ionicons name="flash" size={12} color="#0d9488" />
                <Text style={styles.score}>{entry.score} pts</Text>
              </View>
            </View>

            {/* Trophy for #1 */}
            {entry.rank === 1 && (
              <View style={styles.trophyIcon}>
                <Ionicons name="trophy" size={20} color="#fbbf24" />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankBadgeTop: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  score: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0d9488',
  },
  trophyIcon: {
    marginLeft: 8,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94a3b8',
    textAlign: 'center',
  },
});