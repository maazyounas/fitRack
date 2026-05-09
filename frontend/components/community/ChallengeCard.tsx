import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityChallenge } from '@/types/community';
import { useCommunityStore } from '@/store/communityStore';
import { LinearGradient } from 'expo-linear-gradient';

export function ChallengeCard({ challenge }: { challenge: CommunityChallenge }) {
  const { joinChallenge } = useCommunityStore();

  const isExpired = new Date(challenge.endDate) < new Date();

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={challenge.joined ? ['#0f766e', '#134e4a'] : ['#1e293b', '#0f172a']} 
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="trophy" size={24} color={challenge.joined ? '#5eead4' : '#fbbf24'} />
          </View>
          <View style={styles.titleBox}>
            <Text style={styles.title}>{challenge.title}</Text>
            <Text style={styles.meta}>{challenge.participantCount} participants</Text>
          </View>
        </View>

        <Text style={styles.description}>{challenge.description}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Target</Text>
            <Text style={styles.statValue}>{challenge.metricLabel}</Text>
          </View>
          {challenge.joined && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>My Progress</Text>
              <Text style={styles.statValue}>{challenge.myScore} {challenge.unitLabel}</Text>
            </View>
          )}
        </View>

        {!challenge.joined && !isExpired && (
          <Pressable style={styles.joinButton} onPress={() => joinChallenge(challenge.id)}>
            <Text style={styles.joinButtonText}>Join Challenge</Text>
          </Pressable>
        )}

        {challenge.joined && (
          <View style={styles.joinedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#5eead4" />
            <Text style={styles.joinedText}>You're In!</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBox: {
    marginLeft: 14,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  meta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 20,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  joinButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  joinedText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5eead4',
  },
});
