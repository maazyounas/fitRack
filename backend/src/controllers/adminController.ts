import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ExerciseModel } from '../models/Exercise';
import { SessionModel } from '../models/Session';
import { SocialPostModel } from '../models/SocialPost';
import { UserModel } from '../models/User';
import { WeeklyChallengeModel } from '../models/WeeklyChallenge';
import { getApiErrors, getRequestLogs } from '../services/adminTelemetry';
import { decryptValue } from '../utils/crypto';
import { HttpError } from '../utils/http';

type AuthedRequest = Request & { userId?: string; isAdmin?: boolean };

function serializeAdminUser(user: any) {
  return {
    id: String(user.id),
    isAdmin: Boolean(user.isAdmin),
    email: decryptValue(user.emailEncrypted),
    phone: decryptValue(user.phoneEncrypted),
    profile: user.profile,
    verification: user.verification,
    deactivatedAt: user.deactivatedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function getAverageRating(ratings: Array<{ score: number }>) {
  if (!ratings.length) {
    return 0;
  }

  const total = ratings.reduce((sum, rating) => sum + rating.score, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

function serializeAdminExercise(exercise: any) {
  const ratings = exercise.ratings ?? [];

  return {
    id: String(exercise.id),
    name: exercise.name,
    slug: exercise.slug,
    description: exercise.description,
    muscleGroup: exercise.muscleGroup,
    targetMuscles: exercise.targetMuscles ?? [],
    difficulty: exercise.difficulty,
    equipment: exercise.equipment,
    instructions: exercise.instructions ?? [],
    demoVideos: exercise.demoVideos ?? [],
    ratingAverage: getAverageRating(ratings),
    ratingCount: ratings.length,
    favoriteCount: (exercise.favoriteUserIds ?? []).length,
    commentCount: (exercise.comments ?? []).length,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,
  };
}

async function loadUsersMap(userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (!uniqueIds.length) {
    return new Map<string, any>();
  }

  const users = await UserModel.find({ _id: { $in: uniqueIds } });
  return new Map(users.map((user) => [String(user.id), user]));
}

function serializeCommunityPost(post: any, usersMap: Map<string, any>) {
  const author = usersMap.get(String(post.authorId));

  return {
    id: String(post.id),
    content: post.content,
    challengeId: post.challengeId ? String(post.challengeId) : null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    likeCount: (post.likeUserIds ?? []).length,
    commentCount: (post.comments ?? []).length,
    author: {
      id: String(post.authorId),
      name: author?.profile?.name ?? 'Member',
      email: decryptValue(author?.emailEncrypted) ?? '',
    },
    comments: (post.comments ?? []).map((comment: any) => {
      const commentAuthor = usersMap.get(String(comment.authorId));
      return {
        id: String(comment.id),
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          id: String(comment.authorId),
          name: commentAuthor?.profile?.name ?? 'Member',
          email: decryptValue(commentAuthor?.emailEncrypted) ?? '',
        },
      };
    }),
  };
}

async function buildAnalytics() {
  const now = new Date();
  const [totalUsers, disabledUsers, adminUsers, activeSessions, exerciseCount, postCount, challenges] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ deactivatedAt: { $exists: true, $ne: null } }),
    UserModel.countDocuments({ isAdmin: true }),
    SessionModel.countDocuments({ revokedAt: null, expiresAt: { $gt: now } }),
    ExerciseModel.countDocuments(),
    SocialPostModel.countDocuments(),
    WeeklyChallengeModel.find().sort({ startDate: -1 }).limit(5),
  ]);

  const posts = await SocialPostModel.find({}, { comments: 1, likeUserIds: 1 }).sort({ createdAt: -1 }).limit(200);
  const commentCount = posts.reduce((sum, post: any) => sum + (post.comments?.length ?? 0), 0);
  const likeCount = posts.reduce((sum, post: any) => sum + (post.likeUserIds?.length ?? 0), 0);

  return {
    users: {
      total: totalUsers,
      active: totalUsers - disabledUsers,
      disabled: disabledUsers,
      admins: adminUsers,
    },
    content: {
      exercises: exerciseCount,
      communityPosts: postCount,
      communityComments: commentCount,
      communityLikes: likeCount,
      activeSessions,
      challenges: challenges.length,
    },
    challengeSnapshots: challenges.map((challenge) => ({
      id: String(challenge.id),
      title: challenge.title,
      participantCount: (challenge.participants ?? []).length,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
    })),
  };
}

export async function getAdminDashboard(_req: AuthedRequest, res: Response) {
  const [analytics, users, exercises, posts] = await Promise.all([
    buildAnalytics(),
    UserModel.find().sort({ createdAt: -1 }),
    ExerciseModel.find().sort({ updatedAt: -1, name: 1 }),
    SocialPostModel.find().sort({ updatedAt: -1 }).limit(50),
  ]);

  const usersMap = await loadUsersMap(
    posts.flatMap((post: any) => [
      String(post.authorId),
      ...(post.comments ?? []).map((comment: any) => String(comment.authorId)),
    ])
  );

  res.json({
    analytics,
    users: users.map(serializeAdminUser),
    exercises: exercises.map(serializeAdminExercise),
    communityPosts: posts.map((post) => serializeCommunityPost(post, usersMap)),
    system: {
      requestLogs: getRequestLogs(),
      apiErrors: getApiErrors(),
    },
  });
}

export async function disableUserAccount(req: AuthedRequest, res: Response) {
  const targetUserId = String(req.params.userId);

  if (!Types.ObjectId.isValid(targetUserId)) {
    throw new HttpError(400, 'Invalid user id.');
  }

  if (targetUserId === req.userId) {
    throw new HttpError(400, 'You cannot disable your own account.');
  }

  const user = await UserModel.findById(targetUserId);
  if (!user) {
    throw new HttpError(404, 'User not found.');
  }

  if (user.isAdmin) {
    throw new HttpError(400, 'Admin accounts cannot be disabled from the hub.');
  }

  user.deactivatedAt = new Date();
  await user.save();
  await SessionModel.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date(), lastActivityAt: new Date() } }
  );

  res.json({
    message: 'Account disabled.',
    user: serializeAdminUser(user),
  });
}

export async function deleteCommunityPost(req: AuthedRequest, res: Response) {
  const postId = String(req.params.postId);

  if (!Types.ObjectId.isValid(postId)) {
    throw new HttpError(400, 'Invalid post id.');
  }

  const post = await SocialPostModel.findById(postId);
  if (!post) {
    throw new HttpError(404, 'Post not found.');
  }

  await SocialPostModel.deleteOne({ _id: post._id });
  res.json({ message: 'Community post deleted.' });
}

export async function deleteCommunityComment(req: AuthedRequest, res: Response) {
  const postId = String(req.params.postId);
  const commentId = String(req.params.commentId);

  if (!Types.ObjectId.isValid(postId) || !Types.ObjectId.isValid(commentId)) {
    throw new HttpError(400, 'Invalid moderation target.');
  }

  const post = await SocialPostModel.findById(postId);
  if (!post) {
    throw new HttpError(404, 'Post not found.');
  }

  const existingComment = post.comments.id(commentId);
  if (!existingComment) {
    throw new HttpError(404, 'Comment not found.');
  }

  post.comments = post.comments.filter((comment: any) => String(comment.id) !== commentId) as any;
  await post.save();

  res.json({ message: 'Comment deleted.' });
}
