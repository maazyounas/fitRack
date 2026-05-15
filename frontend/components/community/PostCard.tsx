import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommunityPost } from '@/types/community';
import { useCommunityStore } from '@/store/communityStore';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';

export function PostCard({ post }: { post: CommunityPost }) {
  const { toggleLike, reportPost, deletePost } = useCommunityStore();
  const currentUser = useAuthStore((state) => state.user);
  const [isLiked, setIsLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showOptions, setShowOptions] = useState(false);

  const isOwner = currentUser?.id === post.author.id;
  const isAdmin = (currentUser as any)?.role === 'admin';

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    toggleLike(post.id);
  };

  const handleReport = () => {
    Alert.alert(
      'Report post',
      'This post will be reviewed by our moderation team.',
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
      'Delete post',
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
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={{ uri: post.author.profilePictureUrl || 'https://via.placeholder.com/150' }} 
          style={styles.avatar} 
        />
        <View style={styles.headerContent}>
          <Text style={styles.name}>{post.author.name}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={10} color="#94a3b8" />
            <Text style={styles.time}>{formatDistanceToNow(new Date(post.createdAt))} ago</Text>
          </View>
        </View>
        
        {/* Options Menu */}
        <Pressable onPress={() => setShowOptions(!showOptions)} style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#94a3b8" />
        </Pressable>
      </View>

      {/* Options Dropdown */}
      {showOptions && (
        <View style={styles.optionsMenu}>
          {(isOwner || isAdmin) ? (
            <Pressable onPress={handleDelete} style={styles.optionItem}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={[styles.optionText, { color: '#ef4444' }]}>Delete post</Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleReport} style={styles.optionItem}>
              <Ionicons name="flag-outline" size={18} color="#64748b" />
              <Text style={styles.optionText}>Report post</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Image */}
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
      )}

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Pressable style={styles.actionButton} onPress={handleLike}>
          <Ionicons 
            name={isLiked ? 'heart' : 'heart-outline'} 
            size={20} 
            color={isLiked ? '#ef4444' : '#64748b'} 
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>{likeCount}</Text>
        </Pressable>

        <Pressable style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={18} color="#64748b" />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </Pressable>

        <View style={styles.flex} />

        {/* Challenge Badge */}
        {post.challengeId && (
          <View style={styles.challengeBadge}>
            <LinearGradient colors={['#f0fdfa', '#ccfbf1']} style={styles.challengeBadgeInner}>
              <Ionicons name="trophy" size={12} color="#0d9488" />
              <Text style={styles.challengeText}>Challenge</Text>
            </LinearGradient>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94a3b8',
  },
  menuButton: {
    padding: 4,
  },
  optionsMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  content: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#334155',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    gap: 6,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  likedText: {
    color: '#ef4444',
  },
  flex: {
    flex: 1,
  },
  challengeBadge: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  challengeBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  challengeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0d9488',
  },
});