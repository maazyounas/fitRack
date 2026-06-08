/**
 * ScanScreen — Premium AI body scan screen.
 * Supports live camera capture via expo-camera and gallery uploads.
 * Passes image to existing runBodyAnalysis() service.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { CameraOverlay, type GuidanceMessage } from '@/components/CameraOverlay';
import { runBodyAnalysis } from '@/services/ai/bodyAnalysis';
import { saveBodyAnalysis } from '@/services/api/bodyAnalysisApi';
import { useAuthStore } from '@/store/authStore';
import type { AnalysisImage } from '@/types/bodyAnalysis';

const GUIDANCE_MESSAGES: GuidanceMessage[] = [
  { text: 'Center your body in the frame', severity: 'ok', icon: 'body-outline' },
  { text: 'Step back 2–3 meters', severity: 'warn', icon: 'arrow-back-outline' },
  { text: 'Improve lighting', severity: 'warn', icon: 'sunny-outline' },
  { text: 'Keep full body visible', severity: 'error', icon: 'alert-circle-outline' },
  { text: 'Hold still', severity: 'ok', icon: 'hand-right-outline' },
];

const SCAN_TIPS = [
  'Stand in front of a plain background with good lighting.',
  'Keep your full body visible from head to feet.',
  'Hold still for a second before tapping Analyze.',
];

export default function ScanScreen() {
  const router = useRouter();
  const { imageConsent, loadImageConsent, tokens, isHydrated } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [preview, setPreview] = useState<AnalysisImage | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [guidanceIdx, setGuidanceIdx] = useState(0);
  const analysisErrorMessage = 'We could not analyze this image. Please try a clearer full-body photo.';

  const cameraRef = useRef<CameraView>(null);

  // Animated fab scale
  const fabScale = useSharedValue(1);

  useEffect(() => {
    if (isHydrated && tokens) {
      void loadImageConsent().catch((error) => {
        console.warn('[ScanScreen] Skipping consent load:', error);
      });
    }

    // Rotate guidance messages every 3s
    const interval = setInterval(() => {
      setGuidanceIdx((i: number) => (i + 1) % GUIDANCE_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isHydrated, loadImageConsent, tokens]);

  // ── Camera capture ──────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current) return;

    fabScale.value = withSpring(0.88, { damping: 8 }, () => {
      fabScale.value = withSpring(1);
    });

    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo) {
        setPreview({ uri: photo.uri, width: photo.width, height: photo.height });
      }
    } catch {
      Alert.alert('Capture failed', 'Please try again.');
    } finally {
      setScanning(false);
    }
  };

  // ── Gallery pick ────────────────────────────────────────────────────────────
  const handleGalleryPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setPreview({ uri: asset.uri, width: asset.width ?? 0, height: asset.height ?? 0 });
    }
  };

  // ── Run analysis ────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!preview) return;
    setIsAnalyzing(true);
    try {
      const result = await runBodyAnalysis({
        mode: 'body',
        image: preview,
        consentToStore: imageConsent?.storageAllowed ?? false,
      });

      // Automatically sync to backend if storage is allowed
      if (result.storageAllowed) {
        try {
          await saveBodyAnalysis(result);
        } catch (saveErr) {
          console.warn('Analysis saved locally but backend sync failed:', saveErr);
        }
      }

      // Navigate to analysis result screen, passing result as JSON param
      router.push({
        pathname: '/(modals)/analysis-result' as any,
        params: { resultJson: JSON.stringify(result) },
      });
    } catch (err) {
      console.warn('[ScanScreen] Analysis failed:', err);
      Alert.alert('Analysis failed', analysisErrorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // DEV helper: trigger analysis with a non-human repo asset to validate no-body fallback
  const testNonHuman = async () => {
    setPreview({ uri: '/assets/images/icon.png', width: 400, height: 400 });
    // small delay to ensure preview state is applied before analysis
    await new Promise((r) => setTimeout(r, 200));
    await handleAnalyze();
  };

  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  const guidance = GUIDANCE_MESSAGES[guidanceIdx];

  const showTips = () => {
    Alert.alert('Body Scan Tips', SCAN_TIPS.join('\n\n'));
  };

  // ── Camera permission ───────────────────────────────────────────────────────
  if (!permission) {
    return <View style={styles.safe} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>AI Body Scan</Text>
        <View style={styles.modeBadge}>
          <Text style={styles.modeBadgeText}>Body only</Text>
        </View>
      </View>

      {/* ── Camera / Preview ────────────────────────────────────────────────── */}
      <View style={styles.cameraWrap}>
        {preview ? (
          // Preview selected image
          <Image source={{ uri: preview.uri }} style={styles.previewImage} resizeMode="cover" />
        ) : permission.granted ? (
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        ) : (
          <View style={styles.noPermission}>
            <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.noPermText}>Camera access needed</Text>
            <Pressable onPress={requestPermission} style={styles.permBtn}>
              <Text style={styles.permBtnText}>Allow Camera</Text>
            </Pressable>
          </View>
        )}

        {!preview && (
          <View style={styles.flowCard}>
            <View style={styles.flowHeader}>
              <Ionicons name="body-outline" size={16} color="#0f766e" />
              <Text style={styles.flowTitle}>Body scan flow</Text>
            </View>
            <Text style={styles.flowText}>
              Capture a clear full-body photo, then analyze it to get body type, posture, and workout guidance.
            </Text>
          </View>
        )}

        {/* Overlay only in camera mode (no preview) */}
        {!preview && permission.granted && (
          <CameraOverlay guidance={guidance} scanning={scanning} />
        )}

        {/* Dark gradient top fade */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.topFade}
          pointerEvents="none"
        />
        {/* Dark gradient bottom fade */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      </View>

      {/* ── Bottom Controls ──────────────────────────────────────────────────── */}
      <View style={styles.controls}>
        {__DEV__ && (
          <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
            <Pressable onPress={testNonHuman} style={{ backgroundColor: '#fff', padding: 10, borderRadius: 8, alignItems: 'center' }}>
              <Text style={{ color: '#0d9488', fontWeight: '700' }}>Dev: Test Non-Human</Text>
            </Pressable>
          </View>
        )}
        {preview ? (
          // Preview mode: Retake or Analyze
          <View style={styles.previewControls}>
            <Pressable style={styles.retakeBtn} onPress={() => { setPreview(null); }}>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text style={styles.retakeBtnText}>Retake</Text>
            </Pressable>

            <Pressable
              style={[styles.analyzeBtn, isAnalyzing && { opacity: 0.6 }]}
              onPress={handleAnalyze}
              disabled={isAnalyzing}
            >
              <LinearGradient colors={['#0d9488', '#0f766e']} style={styles.analyzeBtnGradient}>
                {isAnalyzing ? (
                  <Text style={styles.analyzeBtnText}>Analyzing…</Text>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={styles.analyzeBtnText}>Analyze</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          // Camera mode: capture + gallery
          <View style={styles.cameraControls}>
            {/* Gallery */}
            <Pressable onPress={handleGalleryPick} style={styles.sideBtn}>
              <Ionicons name="images-outline" size={26} color="#fff" />
              <Text style={styles.sideBtnLabel}>Gallery</Text>
            </Pressable>

            {/* Capture FAB */}
            <Animated.View style={fabStyle}>
              <Pressable onPress={permission.granted ? handleCapture : requestPermission} style={styles.fab}>
                <View style={styles.fabInner} />
              </Pressable>
            </Animated.View>

            {/* Flip (placeholder) */}
            <Pressable onPress={showTips} style={styles.sideBtn}>
              <Ionicons name="information-circle-outline" size={26} color="#fff" />
              <Text style={styles.sideBtnLabel}>Tips</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  modeToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 3, gap: 3 },
  modePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 17 },
  modePillActive: { backgroundColor: '#0d9488' },
  modePillText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  modePillTextActive: { color: '#fff' },
  cameraWrap: { flex: 1, position: 'relative', overflow: 'hidden' },
  camera: { flex: 1 },
  previewImage: { flex: 1, width: '100%' },
  noPermission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#0a0f1e' },
  noPermText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
  permBtn: { backgroundColor: '#0d9488', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  permBtnText: { color: '#fff', fontWeight: '700' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 80 },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  controls: { paddingBottom: 36, paddingTop: 20, paddingHorizontal: 24, backgroundColor: '#000' },
  cameraControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flowCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  flowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  flowTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
  flowText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 18 },
  sideBtn: { alignItems: 'center', gap: 4, width: 64 },
  sideBtnLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  fab: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  fabInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  previewControls: { flexDirection: 'row', gap: 12 },
  retakeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  retakeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  analyzeBtn: { flex: 1.6, borderRadius: 16, overflow: 'hidden' },
  analyzeBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  analyzeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
