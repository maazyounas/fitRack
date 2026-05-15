import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, Pressable, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useCommunityStore } from '@/store/communityStore';

export function CreatePostModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const { createPost } = useCommunityStore();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photos to share images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Cannot post', 'Please enter some text for your post.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost(content, image || undefined);
      setContent('');
      setImage(null);
      onClose();
    } catch {
      Alert.alert('Post failed', 'Unable to share your post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (content.trim() || image) {
      Alert.alert('Discard post?', 'Your draft will be lost if you close.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onClose },
      ]);
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Share update</Text>
            <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          {/* Input */}
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor="#94a3b8"
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={500}
            autoFocus
          />

          {/* Image Preview */}
          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <Pressable style={styles.removeImage} onPress={() => setImage(null)}>
                <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)']} style={styles.removeImageBg}>
                  <Ionicons name="close" size={18} color="#ffffff" />
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={22} color="#0d9488" />
              <Text style={styles.actionText}>Add photo</Text>
            </Pressable>
            
            <View style={styles.rightActions}>
              <Text style={styles.counter}>{content.length}/500</Text>
            </View>
          </View>

          {/* Submit Button */}
          <Pressable 
            style={[styles.submitButton, (!content.trim() || isSubmitting) && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Post to community</Text>
                <Ionicons name="send-outline" size={18} color="#ffffff" />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  input: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1e293b',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    lineHeight: 20,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  removeImageBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0d9488',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counter: {
    fontSize: 12,
    fontWeight: '400',
    color: '#94a3b8',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0d9488',
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});