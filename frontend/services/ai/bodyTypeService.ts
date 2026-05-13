/**
 * bodyTypeService.ts — Clean classification layer.
 * Extracts body type from pose landmarks, wrist measurements, and BMI.
 */

import type { BodyType } from '@/types/bodyAnalysis';

export type BodyMetrics = {
  bmi?: number;
  shoulderToWaistRatio?: number;
  frameSize?: 'small' | 'medium' | 'large';
};

export type BodyTypeResult = {
  bodyType: BodyType;
  confidence: number;
  insights: string[];
  bodyMetrics: BodyMetrics;
};

type ClassifyInput = {
  heightCm?: number;
  weightKg?: number;
  wristCm?: number;
  shoulderWidthPx?: number;
  waistWidthPx?: number;
  hipWidthPx?: number;
};

/**
 * Classify body type using available measurements.
 * Priority: wrist measurement → pose landmark ratios → BMI fallback.
 */
export function classifyBodyType(input: ClassifyInput): BodyTypeResult {
  const metrics: BodyMetrics = {};

  // ── BMI ────────────────────────────────────────────────────────────────────
  if (input.heightCm && input.weightKg) {
    metrics.bmi = input.weightKg / Math.pow(input.heightCm / 100, 2);
  }

  // ── Frame size from wrist circumference ────────────────────────────────────
  if (input.wristCm) {
    if (input.wristCm < 15.9) metrics.frameSize = 'small';
    else if (input.wristCm > 18.0) metrics.frameSize = 'large';
    else metrics.frameSize = 'medium';
  }

  // ── Shoulder-to-waist ratio from landmarks ─────────────────────────────────
  if (input.shoulderWidthPx && input.waistWidthPx && input.waistWidthPx > 0) {
    metrics.shoulderToWaistRatio = input.shoulderWidthPx / input.waistWidthPx;
  }

  // ── Classification logic ───────────────────────────────────────────────────

  // 1. Wrist-based (highest priority when available)
  if (input.wristCm) {
    if (input.wristCm < 16.5) {
      return {
        bodyType: 'ectomorph',
        confidence: 0.86,
        insights: [
          'Small frame indicates naturally lean bone structure.',
          'Higher metabolism makes calorie surplus critical for muscle growth.',
          'Focus on compound lifts with progressive overload.',
        ],
        bodyMetrics: metrics,
      };
    }
    if (input.wristCm > 18.5) {
      return {
        bodyType: 'endomorph',
        confidence: 0.83,
        insights: [
          'Larger frame with higher tendency to store energy as fat.',
          'HIIT and metabolic conditioning will accelerate fat loss.',
          'Carbohydrate timing is crucial around workouts.',
        ],
        bodyMetrics: metrics,
      };
    }
    return {
      bodyType: 'mesomorph',
      confidence: 0.88,
      insights: [
        'Medium frame with balanced muscle-to-fat composition.',
        'Responds well to a wide variety of training styles.',
        'Can alternate between strength and hypertrophy phases effectively.',
      ],
      bodyMetrics: metrics,
    };
  }

  // 2. Shoulder-to-waist ratio
  if (metrics.shoulderToWaistRatio) {
    const ratio = metrics.shoulderToWaistRatio;
    if (ratio > 1.45) {
      return {
        bodyType: 'mesomorph',
        confidence: 0.79,
        insights: [
          'Strong V-taper indicates athletic mesomorph build.',
          'Well-suited for strength and aesthetic training combined.',
          'Maintain shoulder-to-waist ratio with structured programming.',
        ],
        bodyMetrics: metrics,
      };
    }
    if (ratio < 1.15) {
      return {
        bodyType: 'endomorph',
        confidence: 0.74,
        insights: [
          'Wider waist relative to shoulders is a common endomorph marker.',
          'Prioritize fat loss phase before muscle-building.',
          'Dietary discipline is more impactful than training volume.',
        ],
        bodyMetrics: metrics,
      };
    }
  }

  // 3. BMI fallback
  if (metrics.bmi !== undefined) {
    if (metrics.bmi < 19.5) {
      return {
        bodyType: 'ectomorph',
        confidence: 0.65,
        insights: [
          'Low BMI suggests lean ectomorph tendency.',
          'Caloric surplus of 300-500 kcal/day will support muscle gains.',
          'Reduce excessive cardio to preserve energy for growth.',
        ],
        bodyMetrics: metrics,
      };
    }
    if (metrics.bmi > 27) {
      return {
        bodyType: 'endomorph',
        confidence: 0.68,
        insights: [
          'Higher BMI consistent with endomorph body composition.',
          'Structured deficit dieting with high protein will drive transformation.',
          'Resistance training preserves muscle during fat loss.',
        ],
        bodyMetrics: metrics,
      };
    }
  }

  // 4. Default
  return {
    bodyType: 'mesomorph',
    confidence: 0.6,
    insights: [
      'Balanced proportions suggest mesomorph tendencies.',
      'Versatile responder to both strength and endurance training.',
      'Consistent progressive overload will yield steady improvements.',
    ],
    bodyMetrics: metrics,
  };
}
