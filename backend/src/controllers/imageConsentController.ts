import { Request, Response } from 'express';
import { ImageConsentModel } from '../models/ImageConsent';

type AuthedRequest = Request & { userId?: string };

async function getOrCreateConsent(userId: string) {
  let consent = await ImageConsentModel.findOne({ ownerId: userId });
  if (!consent) {
    consent = await ImageConsentModel.create({ ownerId: userId });
  }
  return consent;
}

function serializeConsent(consent: any) {
  return {
    consentGiven: consent.consentGiven,
    usageExplanationAccepted: consent.usageExplanationAccepted,
    processingMode: consent.processingMode,
    storageAllowed: consent.storageAllowed,
    consentedAt: consent.consentedAt,
    revokedAt: consent.revokedAt,
    storedImages: (consent.storedImages ?? []).map((image: any) => ({
      id: image.id,
      label: image.label,
      sourceFeature: image.sourceFeature,
      createdAt: image.createdAt,
    })),
  };
}

export async function getImageConsent(req: AuthedRequest, res: Response) {
  const consent = await getOrCreateConsent(req.userId as string);
  res.json({ consent: serializeConsent(consent) });
}

export async function updateImageConsent(req: AuthedRequest, res: Response) {
  const consent = await getOrCreateConsent(req.userId as string);
  const payload = req.body as {
    consentGiven?: boolean;
    usageExplanationAccepted?: boolean;
    processingMode?: 'local' | 'cloud';
    storageAllowed?: boolean;
  };

  if (payload.usageExplanationAccepted !== undefined) {
    consent.usageExplanationAccepted = payload.usageExplanationAccepted;
  }

  if (payload.processingMode !== undefined) {
    consent.processingMode = payload.processingMode;
  }

  if (payload.storageAllowed !== undefined) {
    consent.storageAllowed = payload.storageAllowed;
  }

  if (payload.consentGiven !== undefined) {
    consent.consentGiven = payload.consentGiven;
    if (payload.consentGiven) {
      consent.consentedAt = new Date();
      consent.revokedAt = undefined;
    } else {
      consent.revokedAt = new Date();
      consent.storageAllowed = false;
      consent.set('storedImages', []);
    }
  }

  if (!consent.storageAllowed) {
    consent.set('storedImages', []);
  }

  await consent.save();
  res.json({ message: 'Image consent updated.', consent: serializeConsent(consent) });
}

export async function revokeImageConsent(req: AuthedRequest, res: Response) {
  const consent = await getOrCreateConsent(req.userId as string);
  consent.consentGiven = false;
  consent.storageAllowed = false;
  consent.processingMode = 'local';
  consent.revokedAt = new Date();
  consent.set('storedImages', []);

  await consent.save();
  res.json({
    message: 'Image consent withdrawn and stored image records deleted.',
    consent: serializeConsent(consent),
  });
}

export async function deleteStoredImages(req: AuthedRequest, res: Response) {
  const consent = await getOrCreateConsent(req.userId as string);
  consent.set('storedImages', []);
  consent.storageAllowed = false;
  await consent.save();

  res.json({
    message: 'Stored image records deleted immediately.',
    consent: serializeConsent(consent),
  });
}
