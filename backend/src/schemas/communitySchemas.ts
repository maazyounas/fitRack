import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(500, 'Post must be 500 characters or fewer'),
  imageUrl: z.string().url().optional().nullable(),
  challengeId: z.string().length(24, 'Invalid challenge ID').optional().nullable(),
});

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment is required').max(280, 'Comment must be 280 characters or fewer'),
});

export const challengeProgressSchema = z.object({
  scoreDelta: z.number().int().min(1).max(1000).default(1),
});
