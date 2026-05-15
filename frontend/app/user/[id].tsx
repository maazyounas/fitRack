import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Image, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCommunityStore } from '@/store/communityStore';
import { CommunityMember, CommunityPost } from '@/types/community';
import { PostCard } from '@/components/community/PostCard';

// Stat Card Component
function StatCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={20} color="#0d9488" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPublicProfile, toggleFollow } = useCommunityStore();
  const [profile, setProfile] = useState<CommunityMember | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const router = useRouter();

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPublicProfile(id);
      setProfile(data.profile);
      setPosts(data.posts);
      setIsFollowing(data.profile.isFollowing);
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setIsLoading(false);
    }
  }, [id, getPublicProfile]);

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id, loadProfile]);

  const handleFollow = async () => {
    if (profile) {
      const newFollowing = !isFollowing;
      setIsFollowing(newFollowing);
      setProfile({
        ...profile,
        followerCount: newFollowing ? profile.followerCount + 1 : profile.followerCount - 1
      });
      await toggleFollow(profile.id);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d9488" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Ionicons name="person-outline" size={64} color="#cbd5e1" />
          <Text style={styles.errorTitle}>User not found</Text>
          <Text style={styles.errorSubtitle}>The profile you&apos;re looking for doesn&apos;t exist</Text>
          <Pressable onPress={() => router.back()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Cover Image with Gradient */}
      <LinearGradient 
        colors={['#0a0f1e', '#0f1c2a', '#1e293b']} 
        style={styles.cover}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </Pressable>
      </LinearGradient>
      
      {/* Profile Info Section */}
      <View style={styles.profileInfo}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: profile.profilePictureUrl || 'https://via.placeholder.com/150' }} 
            style={styles.avatar} 
          />
          <View style={styles.avatarBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#0d9488" />
          </View>
        </View>
        
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.username}>@{profile.name.toLowerCase().replace(/\s/g, '')}</Text>
        
        {profile.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatCard icon="people-outline" value={profile.followerCount} label="Followers" />
          <StatCard icon="person-add-outline" value={profile.followingCount} label="Following" />
          <StatCard icon="document-text-outline" value={posts.length} label="Posts" />
        </View>

        {/* Follow Button */}
        <Pressable 
          style={[styles.followButton, isFollowing && styles.followingButton]} 
          onPress={handleFollow}
        >
          <Ionicons 
            name={isFollowing ? 'checkmark-outline' : 'person-add-outline'} 
            size={18} 
            color={isFollowing ? '#0d9488' : '#ffffff'} 
          />
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </View>

      {/* Posts Section Header */}
      <View style={styles.postsHeader}>
        <Ionicons name="grid-outline" size={18} color="#0d9488" />
        <Text style={styles.postsTitle}>Posts</Text>
        <View style={styles.postsCount}>
          <Text style={styles.postsCountText}>{posts.length}</Text>
        </View>
      </View>
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
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.emptyContent}>
              <Ionicons name="images-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                {profile.name} hasn&apos;t shared any posts yet
              </Text>
            </LinearGradient>
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
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '400',
    color: '#64748b',
  },
  
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorContent: {
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Header
  header: {
    marginBottom: 8,
  },
  cover: {
    height: 140,
    width: '100%',
    justifyContent: 'flex-start',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Profile Info
  profileInfo: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#ffffff',
    backgroundColor: '#f1f5f9',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  username: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748b',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    fontWeight: '400',
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748b',
    textTransform: 'lowercase',
  },
  
  // Follow Button
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d9488',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  followingButton: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#0d9488',
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  followingButtonText: {
    color: '#0d9488',
  },
  
  // Posts Section
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  postsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  postsCount: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  postsCountText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  
  // List Content
  listContent: {
    paddingBottom: 40,
  },
  
  // Empty State
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 48,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94a3b8',
    textAlign: 'center',
  },
});