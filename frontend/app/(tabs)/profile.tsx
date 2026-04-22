import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { validateNumberRange, validateRequired } from '@/utils/validators';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, isLoading, logout, touchActivity } = useAuthStore();
  const [name, setName] = useState(user?.profile.name ?? '');
  const [age, setAge] = useState(user?.profile.age ? String(user.profile.age) : '');
  const [heightCm, setHeightCm] = useState(user?.profile.heightCm ? String(user.profile.heightCm) : '');
  const [weightKg, setWeightKg] = useState(user?.profile.weightKg ? String(user.profile.weightKg) : '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profile.profilePictureUrl ?? '');

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfilePictureUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const issues = [
      validateRequired(name, 'Name'),
      validateNumberRange(age, 'Age', 1, 120),
      validateNumberRange(heightCm, 'Height', 50, 300),
      validateNumberRange(weightKg, 'Weight', 20, 500),
    ].filter(Boolean);

    if (issues.length) {
      Alert.alert('Check your profile', issues.join('\n'));
      return;
    }

    try {
      touchActivity();
      await updateProfile({
        name: name.trim(),
        age: age ? Number(age) : undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        profilePictureUrl,
      });
      Alert.alert('Profile updated', 'Your personal information and calories are up to date.');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Pressable onPress={handlePickImage}>
          {profilePictureUrl ? (
            <Image source={{ uri: profilePictureUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{(name || 'F').charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </Pressable>
        <Text style={styles.name}>{user?.profile.name ?? 'FITRACK Member'}</Text>
        <Text style={styles.meta}>{user?.email || user?.phone || 'No contact saved yet'}</Text>
        <Text style={styles.calories}>
          Daily calories: {user?.profile.dailyCalories ? `${user.profile.dailyCalories} kcal` : 'Add height, weight, and age'}
        </Text>
      </View>

      <View style={styles.card}>
        <Input label="Full name" onChangeText={setName} value={name} />
        <Input keyboardType="number-pad" label="Age" onChangeText={setAge} value={age} />
        <Input keyboardType="decimal-pad" label="Height (cm)" onChangeText={setHeightCm} value={heightCm} />
        <Input keyboardType="decimal-pad" label="Weight (kg)" onChangeText={setWeightKg} value={weightKg} />
        <Button label="Save Profile" loading={isLoading} onPress={handleSave} />
      </View>

      <View style={styles.actions}>
        <Button label="Open Settings" onPress={() => router.push('/settings' as never)} tone="secondary" />
        <Button
          label="Log Out"
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
          tone="danger"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ecfeff',
    flexGrow: 1,
    padding: 20,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 28,
    marginBottom: 20,
    padding: 24,
  },
  avatar: {
    borderRadius: 50,
    height: 100,
    marginBottom: 14,
    width: 100,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#ccfbf1',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#115e59',
    fontSize: 34,
    fontWeight: '800',
  },
  name: {
    color: '#f0fdfa',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  meta: {
    color: '#ccfbf1',
    fontSize: 15,
    marginBottom: 10,
  },
  calories: {
    color: '#f0fdfa',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
});
