import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, FlatList, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCommunityStore } from '@/store/communityStore';
import { CommunityMember, CommunityPost } from '@/types/community';
import { PostCard } from '@/components/community/PostCard';
import { LinearGradient } from 'expo-linear-gradient';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPublicProfile, toggleFollow } = useCommunityStore();
  const [profile, setProfile] = useState<CommunityMember | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getPublicProfile(id);
      setProfile(data.profile);
      setPosts(data.posts);
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (profile) {
      setProfile({
        ...profile,
        isFollowing: !profile.isFollowing,
        followerCount: profile.isFollowing ? profile.followerCount - 1 : profile.followerCount + 1
      });
      await toggleFollow(profile.id);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.cover} />
      
      <View style={styles.profileInfo}>
        <Image source={{ uri: profile.profilePictureUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
        
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.bio}>{profile.bio || 'FITRACK Member'}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        <Pressable 
          style={[styles.mainFollowButton, profile.isFollowing && styles.mainFollowingButton]} 
          onPress={handleFollow}
        >
          <Ionicons 
            name={profile.isFollowing ? 'checkmark' : 'person-add'} 
            size={18} 
            color={profile.isFollowing ? '#64748b' : '#fff'} 
          />
          <Text style={[styles.mainFollowText, profile.isFollowing && styles.mainFollowingText]}>
            {profile.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Activity Feed</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet from this member.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  header: {
    marginBottom: 24,
  },
  cover: {
    height: 120,
    width: '100%',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#f8fafc',
    backgroundColor: '#f1f5f9',
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 12,
  },
  bio: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#f1f5f9',
  },
  mainFollowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
    gap: 10,
  },
  mainFollowingButton: {
    backgroundColor: '#e2e8f0',
  },
  mainFollowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  mainFollowingText: {
    color: '#64748b',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 32,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
});
