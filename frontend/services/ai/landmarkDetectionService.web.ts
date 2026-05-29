/**
 * landmarkDetectionService.web.ts — Web implementation for pose detection.
 * Uses BlazePose via tfjs web backend and avoids all native-only imports.
 */

import * as tf from '@tensorflow/tfjs-core';
import * as poseDetection from '@tensorflow-models/pose-detection';

export type NormalizedLandmark = {
  id: string;
  label: string;
  x: number;
  y: number;
  confidence: number;
};

export type BodyRatios = {
  shoulderToWaist?: number;
  shoulderToHip?: number;
  hipToWaist?: number;
  torsoToLeg?: number;
};

export type PostureData = {
  spineAngleDeg: number;
  shoulderLevelDeg: number;
  hipLevelDeg: number;
  headForwardPosture: boolean;
};

export type LandmarkDetectionResult = {
  landmarks: NormalizedLandmark[];
  ratios: BodyRatios;
  postureData: PostureData;
  confidence: number;
  detectedPoses: number;
};

let detector: poseDetection.PoseDetector | null = null;

const globalTfjsState = globalThis as typeof globalThis & {
  __fitrackTfjsWebInit?: Promise<void>;
};

async function ensureTfjsBackend(): Promise<void> {
  if (!globalTfjsState.__fitrackTfjsWebInit) {
    globalTfjsState.__fitrackTfjsWebInit = (async () => {
      await import('@tensorflow/tfjs-backend-webgl');
      await tf.setBackend('webgl');
      await tf.ready();
    })();
  }

  await globalTfjsState.__fitrackTfjsWebInit;
}

async function getDetector(): Promise<poseDetection.PoseDetector> {
  if (detector) return detector;
  await ensureTfjsBackend();
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.BlazePose,
    { runtime: 'tfjs', enableSmoothing: true, modelType: 'full' } as any
  );
  return detector;
}

function angleBetween(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
}

export async function detectLandmarks(
  imageUri: string,
  imageWidth: number,
  imageHeight: number
): Promise<LandmarkDetectionResult> {
  try {
    const poseDetector = await getDetector();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUri;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image for pose detection.'));
    });

    const poses = await poseDetector.estimatePoses(img as any);

    if (!poses.length) {
      return {
        landmarks: [],
        ratios: {},
        postureData: { spineAngleDeg: 0, shoulderLevelDeg: 0, hipLevelDeg: 0, headForwardPosture: false },
        confidence: 0,
        detectedPoses: 0,
      };
    }

    const pose = poses[0];
    const kps = pose.keypoints;
    const landmarks: NormalizedLandmark[] = kps.map((kp) => ({
      id: kp.name ?? 'unknown',
      label: kp.name ?? 'Unknown',
      x: kp.x / imageWidth,
      y: kp.y / imageHeight,
      confidence: kp.score ?? 0,
    }));

    const kp = (name: string) => kps.find((k) => k.name === name);
    const ratios: BodyRatios = {};

    const ls = kp('left_shoulder');
    const rs = kp('right_shoulder');
    const lh = kp('left_hip');
    const rh = kp('right_hip');

    if (ls && rs) {
      const shoulderW = Math.abs(ls.x - rs.x);
      if (lh && rh) {
        const hipW = Math.abs(lh.x - rh.x);
        if (hipW > 0) {
          ratios.shoulderToHip = shoulderW / hipW;
          const waistEst = hipW * 0.8;
          ratios.shoulderToWaist = waistEst > 0 ? shoulderW / waistEst : undefined;
          ratios.hipToWaist = waistEst > 0 ? hipW / waistEst : undefined;
        }

        const nose = kp('nose');
        const la = kp('left_ankle');
        const ra = kp('right_ankle');
        if (nose && la && ra) {
          const torsoH = Math.abs(((ls.y + rs.y) / 2) - nose.y);
          const legH = Math.abs(((la.y + ra.y) / 2) - ((lh.y + rh.y) / 2));
          if (legH > 0) ratios.torsoToLeg = torsoH / legH;
        }
      }
    }

    const spineAngleDeg = (lh && rh && ls && rs)
      ? Math.abs(angleBetween({ x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 }, { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 }) - 90)
      : 0;
    const shoulderLevelDeg = (ls && rs) ? Math.abs(angleBetween(ls, rs)) : 0;
    const hipLevelDeg = (lh && rh) ? Math.abs(angleBetween(lh, rh)) : 0;
    const nose = kp('nose');
    const headForwardPosture = (nose && ls && rs)
      ? nose.x < Math.min(ls.x, rs.x) * 0.9
      : false;

    const keyScores = [ls, rs, lh, rh].map((k) => k?.score ?? 0);
    const confidence = keyScores.reduce((a, b) => a + b, 0) / keyScores.length;

    return {
      landmarks,
      ratios,
      postureData: { spineAngleDeg, shoulderLevelDeg, hipLevelDeg, headForwardPosture },
      confidence,
      detectedPoses: poses.length,
    };
  } catch (error) {
    console.error('[LandmarkDetection:web] Error:', error);
    return {
      landmarks: [],
      ratios: {},
      postureData: { spineAngleDeg: 0, shoulderLevelDeg: 0, hipLevelDeg: 0, headForwardPosture: false },
      confidence: 0,
      detectedPoses: 0,
    };
  }
}