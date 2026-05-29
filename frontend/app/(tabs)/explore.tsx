import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { fetchCommunityDashboard } from '@/services/api/community';
import { fetchWorkoutTemplates } from '@/services/api/workout';
import { CommunityChallenge, CommunityDashboard, CommunityMember } from '@/types/community';
import { WorkoutTemplate } from '@/types/workout';

// Category Pill Component
function CategoryPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity 
      style={[styles.categoryPill, active && styles.categoryPillActive]} 
      onPress={onPress}
    >
      <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const difficultyGradients: Record<string, readonly [string, string]> = {
  beginner: ['#0f766e', '#14b8a6'],
  intermediate: ['#d97706', '#f59e0b'],
  advanced: ['#7c3aed', '#8b5cf6'],
};

function formatLabel(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function WorkoutCard({ template, onPress }: { template: WorkoutTemplate; onPress: () => void }) {
  const colors = difficultyGradients[template.difficulty] ?? difficultyGradients.beginner;

  return (
    <TouchableOpacity style={styles.workoutCard} onPress={onPress}>
      <LinearGradient colors={colors} style={styles.workoutCardGradient}>
        <View style={styles.workoutBadge}>
          <Text style={styles.workoutBadgeText}>{formatLabel(template.difficulty)}</Text>
        </View>

        <View style={styles.workoutIconWrap}>
          <Ionicons name="barbell-outline" size={24} color="#fff" />
        </View>

        <View>
          <Text style={styles.workoutTitle} numberOfLines={2}>
            {template.name}
          </Text>
          <Text style={styles.workoutDescription} numberOfLines={2}>
            {template.description}
          </Text>
        </View>

        <View style={styles.workoutMetaRow}>
          <View style={styles.workoutMetaPill}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.workoutMetaText}>{template.estimatedDurationMinutes} min</Text>
          </View>
          <View style={styles.workoutMetaPill}>
            <Ionicons name="layers-outline" size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.workoutMetaText}>{template.exercises.length} moves</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function ChallengeCard({ challenge, onPress }: { challenge: CommunityChallenge; onPress: () => void }) {
  const isExpired = new Date(challenge.endDate) < new Date();

  return (
    <TouchableOpacity style={styles.challengeCard} onPress={onPress}>
      <LinearGradient
        colors={challenge.joined ? ['#0f766e', '#14b8a6'] : ['#1e293b', '#0f172a']}
        style={styles.challengeCardGradient}
      >
        <View style={styles.challengeHeader}>
          <View style={styles.challengeIcon}>
            <Ionicons name="trophy-outline" size={22} color={challenge.joined ? '#ffffff' : '#fbbf24'} />
          </View>
          <View style={styles.challengeHeaderContent}>
            <Text style={styles.challengeTitle} numberOfLines={1}>
              {challenge.title}
            </Text>
            <Text style={styles.challengeSubtitle} numberOfLines={2}>
              {challenge.metricLabel} · {challenge.participantCount} participants
            </Text>
          </View>
          <View style={styles.challengeStatus}>
            <Text style={styles.challengeStatusText}>{challenge.joined ? 'Joined' : isExpired ? 'Ended' : 'Live'}</Text>
          </View>
        </View>

        <Text style={styles.challengeDescription} numberOfLines={3}>
          {challenge.description}
        </Text>

        <View style={styles.challengeStatsRow}>
          <View style={styles.challengeStat}>
            <Text style={styles.challengeStatLabel}>Target</Text>
            <Text style={styles.challengeStatValue}>
              {challenge.targetValue} {challenge.unitLabel}
            </Text>
          </View>
          <View style={styles.challengeStat}>
            <Text style={styles.challengeStatLabel}>Your score</Text>
            <Text style={styles.challengeStatValue}>
              {challenge.myScore} {challenge.unitLabel}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function MemberChip({ member, onPress }: { member: CommunityMember; onPress: () => void }) {
  const initials = member.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <TouchableOpacity style={styles.memberChip} onPress={onPress}>
      {member.profilePictureUrl ? (
        <Image source={{ uri: member.profilePictureUrl }} style={styles.memberAvatar} />
      ) : (
        <View style={styles.memberAvatarFallback}>
          <Text style={styles.memberAvatarText}>{initials || 'M'}</Text>
        </View>
      )}
      <Text style={styles.memberName} numberOfLines={1}>
        {member.name}
      </Text>
      <Text style={styles.memberMeta} numberOfLines={1}>
        {member.followerCount} followers
      </Text>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const { user, tokens } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [dashboard, setDashboard] = useState<CommunityDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExploreData = async (showLoading = true) => {
    const accessToken = tokens?.accessToken;
    if (!accessToken) {
      setTemplates([]);
      setDashboard(null);
      setError('Sign in to load live explore content.');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const [workoutResponse, communityResponse] = await Promise.all([
        fetchWorkoutTemplates(accessToken),
        fetchCommunityDashboard(accessToken),
      ]);

      setTemplates(workoutResponse.templates);
      setDashboard(communityResponse);
    } catch (fetchError) {
      setTemplates([]);
      setDashboard(null);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load explore content.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadExploreData(true);
    // Token changes should reload the screen data.
  }, [tokens?.accessToken]);

  const categories = ['all', ...Array.from(new Set(templates.map((template) => template.difficulty)))];
  const filteredTemplates = selectedCategory === 'all' ? templates : templates.filter((template) => template.difficulty === selectedCategory);
  const activeChallenges = dashboard?.challenges ?? [];
  const suggestions = dashboard?.suggestions ?? [];
  const displayName = user?.profile?.name?.split(' ')[0] ?? 'there';
  const heroSummary = templates.length
    ? `${templates.length} workout templates, ${activeChallenges.length} weekly challenges, and ${suggestions.length} suggested members are synced from the backend.`
    : 'Connect your account to load live workout, challenge, and community data.';

  const onRefresh = () => {
    void loadExploreData(false);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#0f766e" />}
    >
      {/* Hero Section */}
      <LinearGradient colors={['#0a0f1e', '#0f1c2a']} style={styles.heroSection}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Discover what is live</Text>
          <Text style={styles.heroTitleAccent}>Hi, {displayName}</Text>
          <Text style={styles.heroSubtitle}>
            {heroSummary}
          </Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{templates.length}</Text>
            <Text style={styles.statLabel}>Templates</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeChallenges.length}</Text>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dashboard?.me.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </LinearGradient>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={18} color="#b91c1c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/workouts' as any)}>
            <LinearGradient colors={['#0d9488', '#14b8a6']} style={styles.quickActionIcon}>
              <Ionicons name="barbell-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Start Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/nutrition' as any)}>
            <LinearGradient colors={['#f59e0b', '#fbbf24']} style={styles.quickActionIcon}>
              <Ionicons name="restaurant-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Log Meal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/community' as any)}>
            <LinearGradient colors={['#8b5cf6', '#a78bfa']} style={styles.quickActionIcon}>
              <Ionicons name="trophy-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Challenges</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/progress' as any)}>
            <LinearGradient colors={['#ef4444', '#f87171']} style={styles.quickActionIcon}>
              <Ionicons name="stats-chart-outline" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.quickActionLabel}>Progress</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Workouts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Workouts</Text>
          <TouchableOpacity onPress={() => router.push('/workouts' as any)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color="#0f766e" />
            <Text style={styles.loadingText}>Loading live workout templates...</Text>
          </View>
        ) : filteredTemplates.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutsScroll}>
            {filteredTemplates.map((template) => (
              <WorkoutCard key={template.id} template={template} onPress={() => router.push('/workouts' as any)} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={28} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No workout templates found.</Text>
            <Text style={styles.emptyText}>Seed the backend or create a workout plan to populate this section.</Text>
          </View>
        )}
      </View>

      {/* Popular Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((category) => (
            <CategoryPill
              key={category}
              label={formatLabel(category)}
              active={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Community Highlights */}
      <View style={[styles.section, styles.lastSection]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community Highlights</Text>
          <TouchableOpacity onPress={() => router.push('/community' as any)}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {activeChallenges.length ? (
          activeChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} onPress={() => router.push('/community' as any)} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={28} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No active challenges right now.</Text>
            <Text style={styles.emptyText}>The backend will surface weekly challenges here as soon as they exist.</Text>
          </View>
        )}

        {suggestions.length ? (
          <View style={styles.sectionSpacing}>
            <Text style={styles.sectionTitle}>Suggested Members</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
              {suggestions.map((member) => (
                <MemberChip key={member.id} member={member} onPress={() => router.push(`/user/${member.id}` as any)} />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Hero Section
  heroSection: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroTitleAccent: {
    fontSize: 36,
    fontWeight: '600',
    color: '#0d9488',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18,
  },
  
  // Section
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionSpacing: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0d9488',
  },
  
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },

  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#475569',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748b',
    textAlign: 'center',
  },
  
  // Feature Card
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748b',
    lineHeight: 18,
  },
  
  // Workout Card
  workoutsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  workoutCard: {
    width: 210,
    marginRight: 14,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  workoutCardGradient: {
    minHeight: 200,
    padding: 16,
    justifyContent: 'space-between',
  },
  workoutBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  workoutBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  workoutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  workoutDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.84)',
  },
  workoutMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  workoutMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  workoutMetaText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#ffffff',
  },
  
  // Categories
  categoriesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryPillActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },

  challengeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
  },
  challengeCardGradient: {
    padding: 18,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  challengeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeHeaderContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  challengeTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  challengeSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 17,
  },
  challengeStatus: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  challengeStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  challengeDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 19,
    marginBottom: 14,
  },
  challengeStatsRow: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  challengeStat: {
    flex: 1,
  },
  challengeStatLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.52)',
    marginBottom: 4,
  },
  challengeStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },

  suggestionsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  memberChip: {
    width: 120,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 10,
    backgroundColor: '#e2e8f0',
  },
  memberAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 10,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  memberMeta: {
    marginTop: 4,
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  
  // Community Card
  communityCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  communityContent: {
    padding: 24,
    alignItems: 'center',
  },
  communityTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
  },
  communityText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  joinButton: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});