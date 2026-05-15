import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommunityChallenge } from '@/types/community';
import { useCommunityStore } from '@/store/communityStore';

export function ChallengeCard({ challenge }: { challenge: CommunityChallenge }) {
  const { joinChallenge } = useCommunityStore();
  const isExpired = new Date(challenge.endDate) < new Date();
  const progress = challenge.joined && challenge.targetValue 
    ? (challenge.myScore / challenge.targetValue) * 100 
    : 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={challenge.joined ? ['#0d9488', '#0f766e'] : ['#1e293b', '#0f172a']} 
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="trophy" size={22} color={challenge.joined ? '#ffffff' : '#fbbf24'} />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{challenge.title}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.6)" />
              <Text style={styles.meta}>{challenge.participantCount} participants</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>{challenge.description}</Text>

        {/* Dates */}
        <View style={styles.dateRow}>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.6)" />
            <Text style={styles.dateText}>
              {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
            </Text>
          </View>
          {isExpired && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredText}>Ended</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Target</Text>
            <Text style={styles.statValue}>
              {challenge.targetValue} {challenge.unitLabel}
            </Text>
          </View>
          {challenge.joined && (
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Your progress</Text>
              <Text style={styles.statValue}>
                {challenge.myScore} {challenge.unitLabel}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        {challenge.joined && !isExpired && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}% complete</Text>
          </View>
        )}

        {/* Action Button */}
        {!challenge.joined && !isExpired && (
          <Pressable style={styles.joinButton} onPress={() => joinChallenge(challenge.id)}>
            <Text style={styles.joinButtonText}>Join Challenge</Text>
            <Ionicons name="arrow-forward" size={16} color="#0f172a" />
          </Pressable>
        )}

        {challenge.joined && !isExpired && (
          <View style={styles.joinedContainer}>
            <Ionicons name="checkmark-circle" size={18} color="#5eead4" />
            <Text style={styles.joinedText}>You&apos;re participating</Text>
          </View>
        )}

        {isExpired && challenge.joined && (
          <View style={styles.completedContainer}>
            <Ionicons name="flag" size={16} color="#94a3b8" />
            <Text style={styles.completedText}>Challenge completed</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    marginBottom: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
  },
  expiredBadge: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#f87171',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5eead4',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  joinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: 'rgba(94,234,212,0.15)',
    borderRadius: 12,
    marginTop: 4,
  },
  joinedText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5eead4',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    marginTop: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94a3b8',
  },
});