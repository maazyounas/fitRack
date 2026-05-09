import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user?.profile.gender ?? 'male');
  const [heightCm, setHeightCm] = useState(user?.profile.heightCm ? String(user.profile.heightCm) : '');
  const [weightKg, setWeightKg] = useState(user?.profile.weightKg ? String(user.profile.weightKg) : '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profile.profilePictureUrl ?? '');

  const h = Number(heightCm);
  const w = Number(weightKg);
  const bmi = h > 0 && w > 0 ? (w / Math.pow(h / 100, 2)).toFixed(1) : null;

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

    if (!result.canceled && result.assets[0].uri) {
      const uri = result.assets[0].uri;
      setProfilePictureUrl(uri); // Optimistic UI update
      try {
        await useAuthStore.getState().uploadProfilePicture(uri);
      } catch (error) {
        Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not upload picture.');
      }
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
        gender,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
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
        
        <Text style={styles.fieldLabel}>Gender</Text>
        <View style={styles.genderRow}>
          {(['male', 'female', 'other'] as const).map((g) => (
            <Pressable
              key={g}
              onPress={() => setGender(g)}
              style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
            >
              <Text style={[styles.genderTxt, gender === g && styles.genderTxtActive]}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Input keyboardType="decimal-pad" label="Height (cm)" onChangeText={setHeightCm} value={heightCm} />
        <Input keyboardType="decimal-pad" label="Weight (kg)" onChangeText={setWeightKg} value={weightKg} />
        
        {bmi && (
          <View style={styles.bmiBox}>
            <Text style={styles.bmiLabel}>Your BMI</Text>
            <Text style={styles.bmiValue}>{bmi}</Text>
          </View>
        )}

        <View style={styles.aiSettingBox}>
          <View style={styles.aiSettingLeft}>
            <Text style={styles.aiSettingTitle}>Adaptive Difficulty</Text>
            <Text style={styles.aiSettingDesc}>AI automatically adjusts weights based on performance</Text>
          </View>
          <Switch
            value={user?.preferences.adaptiveDifficulty ?? true}
            onValueChange={async (val) => {
              try {
                await useAuthStore.getState().updatePreferences({ adaptiveDifficulty: val });
              } catch (err) {
                Alert.alert('Update failed', 'Could not save AI preference.');
              }
            }}
            trackColor={{ false: '#767577', true: '#0f766e' }}
            thumbColor={user?.preferences.adaptiveDifficulty ? '#ccfbf1' : '#f4f3f4'}
          />
        </View>

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
  fieldLabel: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderBtnActive: {
    borderColor: '#0f766e',
    backgroundColor: '#0f766e',
  },
  genderTxt: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  genderTxtActive: {
    color: '#fff',
  },
  bmiBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bmiLabel: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  bmiValue: {
    color: '#0f766e',
    fontSize: 20,
    fontWeight: '800',
  },
  aiSettingBox: {
    backgroundColor: '#f0fdfa',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  aiSettingLeft: {
    flex: 1,
    marginRight: 12,
  },
  aiSettingTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  aiSettingDesc: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 16,
  },
});
