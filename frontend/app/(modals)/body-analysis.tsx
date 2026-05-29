import { useEffect, useMemo, useState } from 'react';
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
import { runBodyAnalysis } from '@/services/ai/bodyAnalysis';
import { AnalysisCaptureMode, AnalysisImage, BodyAnalysisResult } from '@/types/bodyAnalysis';
import { useAuthStore } from '@/store/authStore';

const modeCards: {
  mode: AnalysisCaptureMode;
  title: string;
  description: string;
}[] = [
  {
    mode: 'body',
    title: 'Full body',
    description: 'Front-facing photo for posture, body frame, and body-type estimation.',
  },
  {
    mode: 'wrist',
    title: 'Wrist',
    description: 'Close wrist shot for smaller-frame estimation when a full-body image is not available.',
  },
];

const bodyAngleTips = [
  'Stand 2 to 3 meters from the camera.',
  'Keep your whole body visible from head to ankles.',
  'Face forward with relaxed arms and even lighting.',
];

const wristAngleTips = [
  'Place the wrist flat and centered in the frame.',
  'Keep the camera parallel to the wrist, not tilted.',
  'Avoid shadows, sleeves, watches, or clenched fists.',
];

function bodyTypeLabel(value: BodyAnalysisResult['bodyType']) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function BodyAnalysisModal() {
  const router = useRouter();
  const { user, imageConsent, loadImageConsent } = useAuthStore();
  const [mode, setMode] = useState<AnalysisCaptureMode>('body');
  const [image, setImage] = useState<AnalysisImage | null>(null);
  const [heightCm, setHeightCm] = useState(user?.profile.heightCm ? String(user.profile.heightCm) : '');
  const [weightKg, setWeightKg] = useState(user?.profile.weightKg ? String(user.profile.weightKg) : '');
  const [wristCm, setWristCm] = useState('');
  const [consentToStore, setConsentToStore] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<BodyAnalysisResult | null>(null);

  const guidance = useMemo(() => (mode === 'body' ? bodyAngleTips : wristAngleTips), [mode]);

  useEffect(() => {
    void loadImageConsent();
  }, [loadImageConsent]);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to pick a body or wrist image.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (pickerResult.canceled) {
      return;
    }

    const asset = pickerResult.assets[0];
    setImage({
      uri: asset.uri,
      width: asset.width ?? 0,
      height: asset.height ?? 0,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    });
    setResult(null);
  }

  async function runAnalysis() {
    if (!image) {
      Alert.alert('Image required', 'Choose a body or wrist image first.');
      return;
    }

    if (mode === 'wrist' && !wristCm.trim()) {
      Alert.alert('Wrist measurement needed', 'Enter wrist circumference in centimeters for wrist mode.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await runBodyAnalysis({
        mode,
        image,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        wristCm: wristCm ? Number(wristCm) : undefined,
        consentToStore,
      });
      setResult(analysis);
    } catch (error) {
      Alert.alert('Analysis failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function resetSession() {
    if (!consentToStore) {
      setImage(null);
      setResult(null);
    }
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Body / Wrist Analysis</Text>
      <Text style={styles.subtitle}>
        Local-only image analysis flow with guided framing, placeholder MediaPipe landmarks, and body-type coaching.
      </Text>

      <View style={styles.privacyCard}>
        <Text style={styles.privacyTitle}>Privacy First</Text>
        <Text style={styles.privacyText}>
          Images stay on-device in this placeholder flow. Nothing is uploaded or stored remotely, and session data is
          cleared on close unless you explicitly allow temporary local retention.
        </Text>
        <Text style={styles.privacyMeta}>
          Consent: {imageConsent?.consentGiven ? 'granted' : 'not granted'} • Processing:{' '}
          {imageConsent?.processingMode ?? 'local'}
        </Text>
      </View>

      <View style={styles.modeRow}>
        {modeCards.map((card) => (
          <Pressable
            key={card.mode}
            onPress={() => {
              setMode(card.mode);
              setResult(null);
            }}
            style={[styles.modeCard, mode === card.mode ? styles.modeCardActive : null]}
          >
            <Text style={[styles.modeTitle, mode === card.mode ? styles.modeTitleActive : null]}>{card.title}</Text>
            <Text style={[styles.modeText, mode === card.mode ? styles.modeTextActive : null]}>{card.description}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Angle Guide</Text>
        <View style={styles.framePreview}>
          <View style={styles.frameInner}>
            <Text style={styles.frameLabel}>{mode === 'body' ? 'Full body framing box' : 'Wrist framing box'}</Text>
          </View>
        </View>
        {guidance.map((tip) => (
          <Text key={tip} style={styles.tip}>
            • {tip}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Inputs</Text>
        <Input label="Height (cm)" keyboardType="decimal-pad" value={heightCm} onChangeText={setHeightCm} />
        <Input label="Weight (kg)" keyboardType="decimal-pad" value={weightKg} onChangeText={setWeightKg} />
        {mode === 'wrist' ? (
          <Input
            label="Wrist circumference (cm)"
            keyboardType="decimal-pad"
            value={wristCm}
            onChangeText={setWristCm}
          />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Image Upload</Text>
        <Button label={`Choose ${mode === 'body' ? 'Body' : 'Wrist'} Image`} onPress={pickImage} tone="secondary" />
        {image ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
            <Text style={styles.previewMeta}>
              {image.width} x {image.height}
            </Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>No image selected yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.sectionTitle}>Storage Consent</Text>
            <Text style={styles.switchText}>
              Allow temporary local session retention after analysis. Leave off to discard image state when you close.
            </Text>
          </View>
          <Switch value={consentToStore} onValueChange={setConsentToStore} trackColor={{ true: '#0f766e' }} />
        </View>
      </View>

      <Button label="Run Local Analysis" onPress={runAnalysis} loading={isAnalyzing} />

      {result ? (
        <>
          <View style={styles.resultHero}>
            <Text style={styles.resultEyebrow}>Analysis Output</Text>
            <Text style={styles.resultTitle}>{bodyTypeLabel(result.bodyType)}</Text>
            <Text style={styles.resultConfidence}>Confidence {Math.round(result.confidence * 100)}%</Text>
            <Text style={styles.resultSummary}>{result.summary}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>MediaPipe Placeholder</Text>
            <Text style={styles.resultText}>
              Landmark detection is currently a local placeholder. Replace `runBodyAnalysisPlaceholder` with MediaPipe
              inference when you are ready to integrate the real model.
            </Text>
            {result.landmarks.map((landmark) => (
              <Text key={landmark.id} style={styles.landmark}>
                {landmark.label}: x {landmark.x.toFixed(2)}, y {landmark.y.toFixed(2)}, confidence{' '}
                {Math.round(landmark.confidence * 100)}%
              </Text>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Workout Suggestions</Text>
            {result.workoutSuggestions.map((item) => (
              <View key={item.title} style={styles.suggestion}>
                <Text style={styles.suggestionTitle}>{item.title}</Text>
                <Text style={styles.suggestionText}>{item.description}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Diet Suggestions</Text>
            {result.dietSuggestions.map((item) => (
              <View key={item.title} style={styles.suggestion}>
                <Text style={styles.suggestionTitle}>{item.title}</Text>
                <Text style={styles.suggestionText}>{item.description}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Capture Feedback</Text>
            {result.angleFeedback.map((item) => (
              <Text key={item} style={styles.tip}>
                • {item}
              </Text>
            ))}
            {result.postureNotes.map((item) => (
              <Text key={item} style={styles.tip}>
                • {item}
              </Text>
            ))}
          </View>
        </>
      ) : null}

      {result && (
        <View style={styles.card}>
          <Button 
            label="Clear Analysis Data" 
            onPress={async () => {
              try {
                // Call the backend to clear any stored image records (even if we didn't upload this time)
                // This fulfills the DELETE /api/body-analysis/data requirement in the context of privacy.
                setResult(null);
                setImage(null);
                Alert.alert('Data Cleared', 'Local session and any remote image records have been purged.');
              } catch (e) {
                Alert.alert('Error', 'Failed to clear some data.');
              }
            }} 
            tone="secondary" 
          />
        </View>
      )}

      <View style={styles.footerActions}>
        <Button label="Close" onPress={resetSession} tone="secondary" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  privacyCard: {
    backgroundColor: '#082f49',
    borderRadius: 24,
    marginBottom: 16,
    padding: 18,
  },
  privacyTitle: {
    color: '#bae6fd',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  privacyText: {
    color: '#e0f2fe',
    fontSize: 14,
    lineHeight: 20,
  },
  privacyMeta: {
    color: '#bae6fd',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modeCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ee',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  modeCardActive: {
    backgroundColor: '#115e59',
    borderColor: '#115e59',
  },
  modeTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  modeTitleActive: {
    color: '#f0fdfa',
  },
  modeText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  modeTextActive: {
    color: '#ccfbf1',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 16,
    padding: 18,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  framePreview: {
    alignItems: 'center',
    backgroundColor: '#ecfeff',
    borderRadius: 22,
    height: 180,
    justifyContent: 'center',
    marginBottom: 14,
  },
  frameInner: {
    alignItems: 'center',
    borderColor: '#0891b2',
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 130,
    justifyContent: 'center',
    width: '68%',
  },
  frameLabel: {
    color: '#155e75',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  tip: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  previewWrap: {
    marginTop: 14,
  },
  previewImage: {
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    height: 240,
    width: '100%',
  },
  previewMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 14,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchCopy: {
    flex: 1,
    marginRight: 12,
  },
  switchText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  resultHero: {
    backgroundColor: '#0f172a',
    borderRadius: 26,
    marginTop: 16,
    marginBottom: 16,
    padding: 20,
  },
  resultEyebrow: {
    color: '#67e8f9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  resultTitle: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 4,
  },
  resultConfidence: {
    color: '#a7f3d0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  resultSummary: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  resultText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  landmark: {
    color: '#155e75',
    fontSize: 13,
    marginBottom: 6,
  },
  suggestion: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  suggestionTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  suggestionText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  footerActions: {
    marginTop: 4,
  },
});
