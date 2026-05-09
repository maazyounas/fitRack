import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCommunityStore } from '@/store/communityStore';
import { Button } from '../ui/Button';

export function CreatePostModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const { createPost } = useCommunityStore();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
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
      Alert.alert('Error', 'Please enter some text for your post.');
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, we would upload the image to S3/Cloudinary first
      // and then send the URL to the backend. 
      // For now, we pass the local URI (placeholder logic)
      await createPost(content, image || undefined);
      setContent('');
      setImage(null);
      onClose();
    } catch (error) {
      Alert.alert('Post Failed', 'Unable to share your post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Update</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            placeholder="What's on your mind? (Bad words will be filtered)"
            placeholderTextColor="#94a3b8"
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={500}
          />

          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <Pressable style={styles.removeImage} onPress={() => setImage(null)}>
                <Ionicons name="close-circle" size={24} color="#fff" />
              </Pressable>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#0f766e" />
              <Text style={styles.actionText}>Photo</Text>
            </Pressable>
            
            <View style={{ flex: 1 }} />
            
            <Text style={styles.counter}>{content.length}/500</Text>
          </View>

          <Button 
            label="Post to Community" 
            onPress={handleSubmit} 
            loading={isSubmitting}
            disabled={!content.trim()}
          />
        </View>
      </View>
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    fontSize: 16,
    color: '#334155',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f766e',
  },
  counter: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
