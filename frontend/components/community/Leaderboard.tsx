import { StyleSheet, Text, View } from 'react-native';
import { LeaderboardEntry } from '@/types/community';

type LeaderboardProps = {
  entries: LeaderboardEntry[];
};

export function Leaderboard({ entries }: LeaderboardProps) {
  if (!entries.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Leaderboard warming up</Text>
        <Text style={styles.emptyCopy}>Join the challenge to claim the first spot.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {entries.map((entry) => (
        <View key={entry.user.id} style={styles.row}>
          <View style={styles.rankPill}>
            <Text style={styles.rankText}>#{entry.rank}</Text>
          </View>
          <View style={styles.userBlock}>
            <Text style={styles.userName}>{entry.user.name}</Text>
            <Text style={styles.metaText}>{entry.score} pts</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dbe4e8',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rankPill: {
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    marginRight: 12,
    width: 38,
  },
  rankText: {
    color: '#115e59',
    fontSize: 13,
    fontWeight: '800',
  },
  userBlock: {
    flex: 1,
  },
  userName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  metaText: {
    color: '#475569',
    fontSize: 13,
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4e8',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCopy: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
});
