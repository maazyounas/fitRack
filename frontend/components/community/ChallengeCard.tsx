import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WeeklyChallenge } from '@/types/community';

type ChallengeCardProps = {
  challenge: WeeklyChallenge;
  onJoin: (challengeId: string) => void | Promise<void>;
  onLogProgress: (challengeId: string) => void | Promise<void>;
};

function formatRange(startDate: string, endDate: string) {
  return `${new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${new Date(endDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;
}

export function ChallengeCard({ challenge, onJoin, onLogProgress }: ChallengeCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{challenge.title}</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{challenge.myScore} pts</Text>
        </View>
      </View>

      <Text style={styles.description}>{challenge.description}</Text>
      <Text style={styles.meta}>
        {challenge.participantCount} participants | {formatRange(challenge.startDate, challenge.endDate)}
      </Text>
      <Text style={styles.metric}>Metric: {challenge.metricLabel}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => onJoin(challenge.id)}>
          <Text style={styles.secondaryLabel}>{challenge.joined ? 'Joined' : 'Join challenge'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={() => onLogProgress(challenge.id)}>
          <Text style={styles.primaryLabel}>+1 progress</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    gap: 10,
    marginRight: 14,
    padding: 18,
    width: 290,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#f8fafc',
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    marginRight: 10,
  },
  scoreBadge: {
    backgroundColor: '#14b8a6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scoreText: {
    color: '#042f2e',
    fontSize: 12,
    fontWeight: '800',
  },
  description: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  metric: {
    color: '#5eead4',
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  secondaryLabel: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 14,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  primaryLabel: {
    color: '#042f2e',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
});
