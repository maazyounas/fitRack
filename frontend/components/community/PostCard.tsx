import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CommunityPost } from '@/types/community';

type PostCardProps = {
  post: CommunityPost;
  commentDraft: string;
  onCommentDraftChange: (value: string) => void;
  onToggleLike: (postId: string) => void | Promise<void>;
  onSubmitComment: (postId: string) => void | Promise<void>;
};

function formatTime(dateString: string) {
  const deltaMs = Date.now() - new Date(dateString).getTime();
  const deltaMinutes = Math.max(1, Math.floor(deltaMs / 60000));

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
}

export function PostCard({
  post,
  commentDraft,
  onCommentDraftChange,
  onToggleLike,
  onSubmitComment,
}: PostCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.author.name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.authorBlock}>
          <Text style={styles.authorName}>{post.author.name}</Text>
          <Text style={styles.timestamp}>{formatTime(post.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.content}>{post.content}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onToggleLike(post.id)}>
          <Ionicons
            color={post.likedByMe ? '#dc2626' : '#0f766e'}
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={18}
          />
          <Text style={styles.actionLabel}>{post.likeCount} likes</Text>
        </TouchableOpacity>

        <View style={styles.actionButton}>
          <Ionicons color="#475569" name="chatbubble-outline" size={18} />
          <Text style={styles.actionLabel}>{post.commentCount} comments</Text>
        </View>
      </View>

      <View style={styles.commentComposer}>
        <TextInput
          onChangeText={onCommentDraftChange}
          placeholder="Write a supportive comment"
          placeholderTextColor="#94a3b8"
          style={styles.commentInput}
          value={commentDraft}
        />
        <TouchableOpacity style={styles.commentButton} onPress={() => onSubmitComment(post.id)}>
          <Text style={styles.commentButtonLabel}>Send</Text>
        </TouchableOpacity>
      </View>

      {post.comments.length ? (
        <View style={styles.commentsList}>
          {post.comments.slice(-3).map((comment) => (
            <View key={comment.id} style={styles.commentRow}>
              <Text style={styles.commentAuthor}>{comment.author.name}</Text>
              <Text style={styles.commentText}>{comment.content}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4e8',
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    marginRight: 12,
    width: 42,
  },
  avatarText: {
    color: '#115e59',
    fontSize: 18,
    fontWeight: '800',
  },
  authorBlock: {
    flex: 1,
  },
  authorName: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  timestamp: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    color: '#0f172a',
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  commentComposer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  commentInput: {
    backgroundColor: '#f8fafc',
    borderColor: '#dbe4e8',
    borderRadius: 16,
    borderWidth: 1,
    color: '#0f172a',
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  commentButton: {
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  commentButtonLabel: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  commentsList: {
    gap: 8,
  },
  commentRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentAuthor: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  commentText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
});
