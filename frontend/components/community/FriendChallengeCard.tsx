import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommunityFriendChallenge } from '@/types/community';
import { useCommunityStore } from '@/store/communityStore';

export function FriendChallengeCard({ challenge }: { challenge: CommunityFriendChallenge }) {
  const { logChallengeProgress } = useCommunityStore();
  const [isLogging, setIsLogging] = useState(false);
  const [progressInput, setProgressInput] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  const isExpired = new Date(challenge.endDate) < new Date();
  const myProgress = challenge.targetValue 
    ? (challenge.myScore / challenge.targetValue) * 100 
    : 0;
  const friendProgress = challenge.targetValue 
    ? (challenge.friendScore / challenge.targetValue) * 100 
    : 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isWinning = challenge.myScore > challenge.friendScore;

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={isWinning ? ['#7c3aed', '#6d28d9'] : ['#1e40af', '#1e3a8a']} 
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {challenge.friendImage ? (
              <Image source={{ uri: challenge.friendImage }} style={styles.friendAvatar} />
            ) : (
              <Ionicons name="flame" size={22} color={isWinning ? '#fbbf24' : '#60a5fa'} />
            )}
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{challenge.challengeTitle}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={12} color="rgba(255,255,255,0.6)" />
              <Text style={styles.meta}>vs {challenge.friendName}</Text>
            </View>
          </View>
        </View>

        {/* Challenge Description */}
        <Text style={styles.description}>
          Race to {challenge.targetValue} {challenge.unitLabel}!
        </Text>

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
              <Text style={styles.expiredText}>Finished</Text>
            </View>
          )}
        </View>

        {/* Comparison Stats */}
        <View style={styles.comparisonContainer}>
          <View style={styles.playerStat}>
            <Text style={styles.playerLabel}>You</Text>
            <Text style={styles.playerScore}>{challenge.myScore}</Text>
            <View style={styles.miniProgressBar}>
              <View style={[styles.miniProgressFill, { width: `${Math.min(myProgress, 100)}%`, backgroundColor: '#60a5fa' }]} />
            </View>
          </View>
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>
          <View style={styles.playerStat}>
            <Text style={styles.playerLabel}>{challenge.friendName}</Text>
            <Text style={styles.playerScore}>{challenge.friendScore}</Text>
            <View style={styles.miniProgressBar}>
              <View style={[styles.miniProgressFill, { width: `${Math.min(friendProgress, 100)}%`, backgroundColor: '#fca5a5' }]} />
            </View>
          </View>
        </View>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          {isWinning && !isExpired && (
            <View style={styles.winningBadge}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={styles.winningText}>You are winning!</Text>
            </View>
          )}
          {isExpired && (
            <View style={styles.finishedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#86efac" />
              <Text style={styles.finishedText}>Challenge ended</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {!isExpired && (
          <View style={styles.actionsContainer}>
            {!isLogging ? (
              <View style={styles.logButtonsRow}>
                <Pressable 
                  style={[styles.logButton, styles.quickButton]} 
                  onPress={async () => {
                    setIsSaving(true);
                    await logChallengeProgress(challenge.challengeId, 1);
                    setIsSaving(false);
                  }}
                  disabled={isSaving}
                >
                  <Ionicons name="add" size={14} color="#ffffff" />
                  <Text style={styles.logButtonText}>+1</Text>
                </Pressable>
                <Pressable 
                  style={[styles.logButton, styles.customButton]} 
                  onPress={() => setIsLogging(true)}
                >
                  <Text style={styles.logButtonText}>Log Score</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={progressInput}
                  onChangeText={setProgressInput}
                  placeholder="Amount"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
                <Pressable
                  style={styles.saveButton}
                  onPress={async () => {
                    const delta = parseInt(progressInput, 10);
                    if (isNaN(delta) || delta <= 0) return;
                    setIsSaving(true);
                    await logChallengeProgress(challenge.challengeId, delta);
                    setIsSaving(false);
                    setIsLogging(false);
                    setProgressInput('1');
                  }}
                  disabled={isSaving}
                >
                  <Text style={styles.saveButtonText}>{isSaving ? '...' : 'Add'}</Text>
                </Pressable>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsLogging(false);
                    setProgressInput('1');
                  }}
                >
                  <Ionicons name="close" size={16} color="#ffffff" />
                </Pressable>
              </View>
            )}
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
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  friendAvatar: {
    width: '100%',
    height: '100%',
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
    marginBottom: 12,
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
    backgroundColor: 'rgba(100,116,139,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#cbd5e1',
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
  },
  playerStat: {
    flex: 1,
  },
  playerLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  playerScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  miniProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  vsContainer: {
    paddingHorizontal: 8,
  },
  vsText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 12,
  },
  winningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  winningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24',
  },
  finishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(134,239,172,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  finishedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#86efac',
  },
  actionsContainer: {
    marginTop: 8,
  },
  logButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    justifyContent: 'center',
  },
  quickButton: {
    backgroundColor: '#ffffff',
    flex: 0.3,
  },
  customButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    flex: 0.7,
  },
  logButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    height: 36,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
