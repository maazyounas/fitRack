import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, TextInput, ActivityIndicator, RefreshControl, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommunityStore } from '@/store/communityStore';
import { PostCard } from '@/components/community/PostCard';
import { ChallengeCard } from '@/components/community/ChallengeCard';
import { CreatePostModal } from '@/components/community/CreatePostModal';
import { CommunityMember } from '@/types/community';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function CommunityScreen() {
  const { dashboard, isLoading, initialize, searchUsers, toggleFollow } = useCommunityStore();
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges'>('feed');
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CommunityMember[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    void initialize();
  }, [initialize]);

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
            searchResults.map(user => (
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
                  onPress={() => toggleFollow(user.id)}
                >
                  <Text style={[styles.followButtonText, user.isFollowing && styles.followingButtonText]}>
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
              </Pressable>
            ))
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
      </View>

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
                  style={styles.suggestionFollow}
                  onPress={() => toggleFollow(user.id)}
                >
                  <Text style={styles.suggestionFollowText}>Follow</Text>
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
      <FlatList
        data={(activeTab === 'feed' ? dashboard?.posts : dashboard?.challenges) as any[]}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          activeTab === 'feed' 
            ? <PostCard post={item as any} /> 
            : <ChallengeCard challenge={item as any} />
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
                  : "No active challenges right now. Check back soon!"}
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
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  searchBio: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  followingButton: {
    backgroundColor: '#f1f5f9',
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  followingButtonText: {
    color: '#64748b',
  },
  noResults: {
    textAlign: 'center',
    padding: 16,
    color: '#64748b',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 24,
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  activeTabText: {
    color: '#0f172a',
  },
  suggestionsSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  suggestionsList: {
    gap: 12,
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    width: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestionAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 10,
  },
  suggestionFollow: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  suggestionFollowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f766e',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
