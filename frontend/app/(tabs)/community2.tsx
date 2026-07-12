import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, TextInput, ActivityIndicator, RefreshControl, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommunityStore } from '@/store/communityStore';
import { PostCard } from '@/components/community/PostCard';
import { ChallengeCard } from '@/components/community/ChallengeCard';
import { FriendChallengeCard } from '@/components/community/FriendChallengeCard';
import { CreatePostModal } from '@/components/community/CreatePostModal';
import { CommunityMember } from '@/types/community';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/common/AppHeader';
import { useAuthStore } from '@/store/authStore';

export default function CommunityScreen() {
  const { dashboard, isLoading, initialize, searchUsers, toggleFollow } = useCommunityStore();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'friends'>('feed');
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CommunityMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const bootedRef = React.useRef(false);

  useEffect(() => {
    if (!isHydrated || !user || bootedRef.current) {
      return;
    }

    bootedRef.current = true;
    void initialize();
  }, [initialize, isHydrated, user]);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length > 2) {
      setIsSearching(true);
      const results = await searchUsers(text);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const onRefresh = React.useCallback(() => {
    void initialize();
  }, [initialize]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for friends..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#94a3b8"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </Pressable>
        )}
      </View>

      {searchQuery.length > 2 && (
        <View style={styles.searchResults}>
          {isSearching ? (
            <ActivityIndicator color="#0f766e" style={{ marginVertical: 10 }} />
          ) : (
            <>
              {searchResults.map(user => (
                <Pressable 
                  key={user.id} 
                  style={styles.searchResultItem}
                  onPress={() => router.push(`/user/${user.id}` as any)}
                >
                  <Image source={{ uri: user.profilePictureUrl || 'https://via.placeholder.com/150' }} style={styles.searchAvatar} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.searchName}>{user.name}</Text>
                    <Text style={styles.searchBio} numberOfLines={1}>{user.bio || 'FITRACK member'}</Text>
                  </View>
                  <Pressable 
                    style={[styles.followButton, user.isFollowing && styles.followingButton]}
                    onPress={async () => {
                      const following = await toggleFollow(user.id);
                      if (following !== null) {
                        setSearchResults((prev) => prev.map((u) => (u.id === user.id ? { ...u, isFollowing: following } : u)));
                      }
                    }}
                  >
                    <Text style={[styles.followButtonText, user.isFollowing && styles.followingButtonText]}>
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                </Pressable>
              ))}
            </>
          )}
          {searchResults.length === 0 && !isSearching && (
            <Text style={styles.noResults}>No users found.</Text>
          )}
        </View>
      )}

      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>Social Feed</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'challenges' && styles.activeTab]}
          onPress={() => setActiveTab('challenges')}
        >
          <Text style={[styles.tabText, activeTab === 'challenges' && styles.activeTabText]}>Challenges</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>Friend Duels</Text>
        </Pressable>
      </View>

      {activeTab === 'feed' && (
        <Pressable style={styles.createPostButton} onPress={() => setIsPostModalVisible(true)}>
          <LinearGradient colors={['#0f766e', '#14b8a6']} style={styles.createPostGradient}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.createPostText}>Create Post</Text>
          </LinearGradient>
        </Pressable>
      )}

      {activeTab === 'feed' && dashboard?.suggestions && dashboard.suggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionTitle}>Friend Suggestions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsList}>
            {dashboard.suggestions.map(user => (
              <Pressable 
                key={user.id} 
                style={styles.suggestionCard}
                onPress={() => router.push(`/user/${user.id}` as any)}
              >
                <Image source={{ uri: user.profilePictureUrl || 'https://via.placeholder.com/150' }} style={styles.suggestionAvatar} />
                <Text style={styles.suggestionName} numberOfLines={1}>{user.name}</Text>
                <Pressable 
                    style={[styles.suggestionFollow, user.isFollowing && styles.suggestionFollowing]}
                    onPress={async () => {
                      await toggleFollow(user.id);
                      // dashboard in store is updated; UI will re-render from store
                    }}
                  >
                  <Text style={[styles.suggestionFollowText, user.isFollowing && styles.suggestionFollowingText]}>{user.isFollowing ? 'Following' : 'Follow'}</Text>
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Community" />
      <FlatList
        data={
          (activeTab === 'feed'
            ? dashboard?.posts
            : activeTab === 'challenges'
              ? dashboard?.challenges
              : dashboard?.friendChallenges) as any[]
        }
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          activeTab === 'feed' 
            ? <PostCard post={item as any} /> 
            : activeTab === 'challenges'
              ? <ChallengeCard challenge={item as any} />
              : <FriendChallengeCard challenge={item as any} />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#e2e8f0" />
              <Text style={styles.emptyText}>
                {activeTab === 'feed' 
                  ? "No posts yet. Follow people or share your first update!"
                  : activeTab === 'challenges'
                    ? "No active challenges right now. Check back soon!"
                    : "No friend duels yet. Join a weekly challenge with a friend to start competing!"}
              </Text>
            </View>
          ) : null
        }
      />

      <Pressable style={styles.fab} onPress={() => setIsPostModalVisible(true)}>
        <LinearGradient colors={['#0f766e', '#14b8a6']} style={styles.fabGradient}>
          <Ionicons name="add" size={30} color="#fff" />
        </LinearGradient>
      </Pressable>

      <CreatePostModal visible={isPostModalVisible} onClose={() => setIsPostModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 120,
  },

  // ───────────────── Header ─────────────────
  header: {
    marginBottom: 18,
  },

  // ───────────────── Search ─────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#ffffff',

    borderRadius: 18,

    paddingHorizontal: 16,
    height: 54,

    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',

    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },

  searchIcon: {
    marginRight: 10,
  },

  searchInput: {
    flex: 1,

    fontSize: 14,
    fontWeight: '500',

    color: '#0f172a',
  },

  // ───────────────── Search Results ─────────────────
  searchResults: {
    marginTop: 10,

    backgroundColor: '#ffffff',

    borderRadius: 20,

    paddingVertical: 6,

    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,

    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.7)',

    overflow: 'hidden',
  },

  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 14,
    paddingVertical: 12,

    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },

  searchAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },

  searchName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },

  searchBio: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },

  followButton: {
    backgroundColor: '#0f766e',

    paddingHorizontal: 14,
    paddingVertical: 8,

    borderRadius: 12,
  },

  followingButton: {
    backgroundColor: '#eef2f7',
  },

  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },

  followingButtonText: {
    color: '#64748b',
  },

  noResults: {
    textAlign: 'center',
    paddingVertical: 20,

    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },

  // ───────────────── Tabs ─────────────────
  tabContainer: {
    flexDirection: 'row',

    marginTop: 22,

    backgroundColor: '#e2e8f0',

    borderRadius: 18,

    padding: 5,
  },

  tab: {
    flex: 1,

    paddingVertical: 12,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,
  },

  activeTab: {
    backgroundColor: '#ffffff',

    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },

  createPostButton: {
    marginTop: 16,
    marginBottom: 6,
  },

  createPostGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
  },

  createPostText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },

  activeTabText: {
    color: '#0f172a',
    fontWeight: '700',
  },

  // ───────────────── Suggestions ─────────────────
  suggestionsSection: {
    marginTop: 24,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
    letterSpacing: 0.2,
  },

  suggestionsList: {
    paddingRight: 6,
  },

  suggestionCard: {
    width: 132,

    backgroundColor: '#ffffff',

    borderRadius: 24,

    paddingVertical: 18,
    paddingHorizontal: 14,

    alignItems: 'center',

    marginRight: 14,

    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.7)',

    shadowColor: '#0f172a',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  suggestionAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,

    marginBottom: 12,
  },

  suggestionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',

    textAlign: 'center',

    marginBottom: 12,
  },

  suggestionFollow: {
    backgroundColor: '#f0fdfa',

    paddingVertical: 8,
    borderRadius: 12,

    width: '100%',
    alignItems: 'center',
  },

  suggestionFollowing: {
    backgroundColor: '#0f766e',
  },

  suggestionFollowText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f766e',
  },

  suggestionFollowingText: {
    color: '#ffffff',
  },

  // ───────────────── Empty State ─────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 110,

    paddingHorizontal: 40,
  },

  emptyText: {
    marginTop: 18,

    textAlign: 'center',

    color: '#94a3b8',

    fontSize: 14,
    fontWeight: '500',

    lineHeight: 22,
  },

  // ───────────────── Floating Action Button ─────────────────
  fab: {
    position: 'absolute',

    bottom: 26,
    right: 22,

    width: 62,
    height: 62,

    borderRadius: 31,

    shadowColor: '#0f766e',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },

  fabGradient: {
    flex: 1,

    borderRadius: 31,

    justifyContent: 'center',
    alignItems: 'center',
  },
});
