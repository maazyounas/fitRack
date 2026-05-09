import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommunityPost } from '@/types/community';
import { useCommunityStore } from '@/store/communityStore';
import { useAuthStore } from '@/store/authStore';
// @ts-ignore
import { formatDistanceToNow } from 'date-fns';

export function PostCard({ post }: { post: CommunityPost }) {
  const { toggleLike, reportPost, deletePost } = useCommunityStore();
  const currentUser = useAuthStore((state) => state.user);
  const [isLiked, setIsLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const isOwner = currentUser?.id === post.author.id;
  const isAdmin = (currentUser as any)?.role === 'admin';

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    toggleLike(post.id);
  };

  const handleReport = () => {
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post for inappropriate content?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: () => reportPost(post.id)
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deletePost(post.id)
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: post.author.profilePictureUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{post.author.name}</Text>
          <Text style={styles.time}>{formatDistanceToNow(new Date(post.createdAt))} ago</Text>
        </View>
        {(isOwner || isAdmin) ? (
          <Pressable onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </Pressable>
        ) : (
          <Pressable onPress={handleReport}>
            <Ionicons name="alert-circle-outline" size={20} color="#94a3b8" />
          </Pressable>
        )}
      </View>

      <Text style={styles.content}>{post.content}</Text>

      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
      )}

      <View style={styles.footer}>
        <Pressable style={styles.action} onPress={handleLike}>
          <Ionicons 
            name={isLiked ? 'heart' : 'heart-outline'} 
            size={22} 
            color={isLiked ? '#ef4444' : '#64748b'} 
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>{likeCount}</Text>
        </Pressable>

        <Pressable style={styles.action}>
          <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        {post.challengeId && (
          <View style={styles.challengeBadge}>
            <Ionicons name="trophy" size={14} color="#0f766e" />
            <Text style={styles.challengeText}>Challenge Post</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  time: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  likedText: {
    color: '#ef4444',
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  challengeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
  },
});
