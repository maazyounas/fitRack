import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChallengeCard } from '@/components/community/ChallengeCard';
import { Leaderboard } from '@/components/community/Leaderboard';
import { PostCard } from '@/components/community/PostCard';
import {
  addCommunityPostComment,
  addWeeklyChallengeProgress,
  createCommunityPost,
  fetchCommunityDashboard,
  joinWeeklyChallenge,
  toggleCommunityPostLike,
  toggleFollow,
} from '@/services/api/community';
import { useAuthStore } from '@/store/authStore';
import { CommunityDashboard, CommunityPost, WeeklyChallenge } from '@/types/community';

function replacePost(posts: CommunityPost[], nextPost: CommunityPost) {
  return posts.map((post) => (post.id === nextPost.id ? nextPost : post));
}

function replaceChallenge(challenges: WeeklyChallenge[], nextChallenge: WeeklyChallenge) {
  return challenges.map((challenge) => (challenge.id === nextChallenge.id ? nextChallenge : challenge));
}

export default function CommunityScreen() {
  const tokens = useAuthStore((state) => state.tokens);
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState<CommunityDashboard | null>(null);
  const [postDraft, setPostDraft] = useState('');
  const [search, setSearch] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  async function loadCommunity(nextSearch = search, spinner = true) {
    if (!tokens?.accessToken) {
      return;
    }

    if (spinner) {
      setLoading(true);
    }

    try {
      const response = await fetchCommunityDashboard(tokens.accessToken, nextSearch);
      setDashboard(response);
    } catch (error) {
      Alert.alert('Community unavailable', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCommunity('', true);
  }, [tokens?.accessToken]);

  async function handleCreatePost() {
    if (!tokens?.accessToken) {
      return;
    }

    const content = postDraft.trim();
    if (!content) {
      Alert.alert('Write something first', 'Your post needs a short update before publishing.');
      return;
    }

    setSubmittingPost(true);
    try {
      const response = await createCommunityPost(tokens.accessToken, { content });
      setDashboard((current) =>
        current
          ? {
              ...current,
              posts: [response.post, ...current.posts],
            }
          : current
      );
      setPostDraft('');
    } catch (error) {
      Alert.alert('Could not post update', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSubmittingPost(false);
    }
  }

  async function handleFollow(userId: string) {
    if (!tokens?.accessToken) {
      return;
    }

    try {
      const response = await toggleFollow(tokens.accessToken, userId);
      setDashboard(response.dashboard);
    } catch (error) {
      Alert.alert('Could not update follow status', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  async function handleToggleLike(postId: string) {
    if (!tokens?.accessToken) {
      return;
    }

    try {
      const response = await toggleCommunityPostLike(tokens.accessToken, postId);
      setDashboard((current) =>
        current
          ? {
              ...current,
              posts: replacePost(current.posts, response.post),
            }
          : current
      );
    } catch (error) {
      Alert.alert('Could not update like', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  async function handleAddComment(postId: string) {
    if (!tokens?.accessToken) {
      return;
    }

    const content = commentDrafts[postId]?.trim();
    if (!content) {
      return;
    }

    try {
      const response = await addCommunityPostComment(tokens.accessToken, postId, content);
      setDashboard((current) =>
        current
          ? {
              ...current,
              posts: replacePost(current.posts, response.post),
            }
          : current
      );
      setCommentDrafts((current) => ({ ...current, [postId]: '' }));
    } catch (error) {
      Alert.alert('Could not add comment', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  async function handleJoinChallenge(challengeId: string) {
    if (!tokens?.accessToken) {
      return;
    }

    try {
      const response = await joinWeeklyChallenge(tokens.accessToken, challengeId);
      setDashboard((current) =>
        current
          ? {
              ...current,
              challenges: replaceChallenge(current.challenges, response.challenge),
            }
          : current
      );
    } catch (error) {
      Alert.alert('Could not join challenge', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  async function handleAddChallengeProgress(challengeId: string) {
    if (!tokens?.accessToken) {
      return;
    }

    try {
      const response = await addWeeklyChallengeProgress(tokens.accessToken, challengeId, 1);
      setDashboard((current) =>
        current
          ? {
              ...current,
              challenges: replaceChallenge(current.challenges, response.challenge),
            }
          : current
      );
    } catch (error) {
      Alert.alert('Could not log challenge progress', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  if (loading && !dashboard) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color="#0f766e" size="large" />
        <Text style={styles.loadingText}>Loading your community feed...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          onRefresh={() => {
            setRefreshing(true);
            void loadCommunity(search, false);
          }}
          refreshing={refreshing}
          tintColor="#0f766e"
        />
      }
      style={styles.screen}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Community hub</Text>
        <Text style={styles.title}>Train with friends, celebrate wins, and climb the weekly board.</Text>
        <Text style={styles.subtitle}>
          {dashboard?.me.followerCount ?? 0} followers | {dashboard?.me.followingCount ?? 0} following
        </Text>
      </View>

      <View style={styles.composer}>
        <Text style={styles.sectionTitle}>Share an update</Text>
        <TextInput
          multiline
          onChangeText={setPostDraft}
          placeholder={`What did you crush today, ${user?.profile.name ?? 'athlete'}?`}
          placeholderTextColor="#94a3b8"
          style={styles.postInput}
          textAlignVertical="top"
          value={postDraft}
        />
        <TouchableOpacity disabled={submittingPost} onPress={handleCreatePost} style={styles.publishButton}>
          <Text style={styles.publishLabel}>{submittingPost ? 'Posting...' : 'Post update'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, styles.sectionTitleNoMargin]}>Find friends</Text>
          <Ionicons color="#0f766e" name="people" size={18} />
        </View>
        <TextInput
          onChangeText={(value: string) => {
            setSearch(value);
            void loadCommunity(value, false);
          }}
          placeholder="Search members by name"
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          value={search}
        />
        <View style={styles.memberGrid}>
          {(dashboard?.suggestions ?? []).map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>{member.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.memberContent}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text numberOfLines={2} style={styles.memberBio}>
                  {member.bio || 'Ready to share workouts, meals, and momentum.'}
                </Text>
                <Text style={styles.memberMeta}>{member.followerCount} followers</Text>
              </View>
              <TouchableOpacity onPress={() => handleFollow(member.id)} style={styles.followButton}>
                <Text style={styles.followLabel}>{member.isFollowing ? 'Following' : 'Follow'}</Text>
              </TouchableOpacity>
            </View>
          ))}
          {!dashboard?.suggestions.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No members matched that search.</Text>
              <Text style={styles.emptyCopy}>Try a different name or pull to refresh for more suggestions.</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly challenges</Text>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
          {(dashboard?.challenges ?? []).map((challenge) => (
            <ChallengeCard
              challenge={challenge}
              key={challenge.id}
              onJoin={handleJoinChallenge}
              onLogProgress={handleAddChallengeProgress}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        <Leaderboard entries={dashboard?.challenges[0]?.leaderboard ?? []} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feed</Text>
        <View style={styles.feed}>
          {(dashboard?.posts ?? []).map((post) => (
            <PostCard
              commentDraft={commentDrafts[post.id] ?? ''}
              key={post.id}
              onCommentDraftChange={(value: string) =>
                setCommentDrafts((current) => ({
                  ...current,
                  [post.id]: value,
                }))
              }
              onSubmitComment={handleAddComment}
              onToggleLike={handleToggleLike}
              post={post}
            />
          ))}
          {!dashboard?.posts.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Your feed is ready for its first post.</Text>
              <Text style={styles.emptyCopy}>Follow a few friends or share today&apos;s workout to get things moving.</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#eef6f5',
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingState: {
    alignItems: 'center',
    backgroundColor: '#eef6f5',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#475569',
    fontSize: 14,
    marginTop: 12,
  },
  hero: {
    backgroundColor: '#0f766e',
    borderRadius: 28,
    marginBottom: 16,
    padding: 22,
  },
  eyebrow: {
    color: '#99f6e4',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    color: '#ccfbf1',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  composer: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4e8',
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    padding: 18,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionTitleNoMargin: {
    marginBottom: 0,
  },
  postInput: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4e8',
    borderRadius: 18,
    borderWidth: 1,
    color: '#0f172a',
    minHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  publishButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#0f766e',
    borderRadius: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  publishLabel: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4e8',
    borderRadius: 18,
    borderWidth: 1,
    color: '#0f172a',
    marginBottom: 12,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  memberGrid: {
    gap: 12,
  },
  memberCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dbe4e8',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  memberAvatar: {
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderRadius: 999,
    height: 46,
    justifyContent: 'center',
    marginRight: 12,
    width: 46,
  },
  memberAvatarText: {
    color: '#115e59',
    fontSize: 18,
    fontWeight: '800',
  },
  memberContent: {
    flex: 1,
  },
  memberName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  memberBio: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  memberMeta: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  followButton: {
    backgroundColor: '#ccfbf1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  followLabel: {
    color: '#115e59',
    fontSize: 13,
    fontWeight: '800',
  },
  feed: {
    gap: 14,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4e8',
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCopy: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
});
