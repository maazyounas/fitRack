import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ExerciseModel } from '../models/Exercise';
import { SessionModel } from '../models/Session';
import { SocialPostModel } from '../models/SocialPost';
import { UserModel } from '../models/User';
import { WeeklyChallengeModel } from '../models/WeeklyChallenge';
import { NotificationTokenModel } from '../models/NotificationToken';
import { getApiErrors, getRequestLogs } from '../services/adminTelemetry';
import { sendPushNotification, broadcastNotification } from '../services/notificationService';
import { decryptValue } from '../utils/crypto';
import { HttpError } from '../utils/http';
import { WorkoutPlanModel } from '../models/WorkoutPlan';

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
    retention: {
      newLast7Days: await UserModel.countDocuments({ createdAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      activeLast7Days: await UserModel.countDocuments({ lastLoginAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    },
    popularExercises: await WorkoutPlanModel.aggregate([
      { $unwind: '$days' },
      { $unwind: '$days.exercises' },
      { $group: { _id: '$days.exercises.exerciseId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'exercises', localField: '_id', foreignField: '_id', as: 'exercise' } },
      { $unwind: '$exercise' },
      { $project: { name: '$exercise.name', count: 1 } }
    ]),
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

export async function getUsers(req: AuthedRequest, res: Response) {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(10, Number(req.query.limit ?? 20)));
  const search = String(req.query.search ?? '').trim();

  const query: any = {};
  if (search) {
    query.$or = [
      { 'profile.name': { $regex: search, $options: 'i' } },
      { emailHash: { $exists: true } }, // Searching by hash isn't helpful here, but we can search by name
    ];
  }

  const [users, total] = await Promise.all([
    UserModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    UserModel.countDocuments(query),
  ]);

  res.json({
    users: users.map(serializeAdminUser),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function createExercise(req: AuthedRequest, res: Response) {
  const exercise = await ExerciseModel.create(req.body);
  res.status(201).json({ exercise: serializeAdminExercise(exercise) });
}

export async function updateExercise(req: AuthedRequest, res: Response) {
  const exercise = await ExerciseModel.findByIdAndUpdate(req.params.exerciseId, req.body, { new: true });
  if (!exercise) throw new HttpError(404, 'Exercise not found.');
  res.json({ exercise: serializeAdminExercise(exercise) });
}

export async function deleteExercise(req: AuthedRequest, res: Response) {
  const exercise = await ExerciseModel.findByIdAndDelete(req.params.exerciseId);
  if (!exercise) throw new HttpError(404, 'Exercise not found.');
  res.json({ message: 'Exercise deleted.' });
}

export async function sendManualNotification(req: AuthedRequest, res: Response) {
  const { title, body, userIds } = req.body;
  if (!title || !body) throw new HttpError(400, 'Title and body are required.');

  if (userIds && userIds.length) {
    await sendPushNotification(userIds, title, body);
  } else {
    await broadcastNotification(title, body);
  }

  res.json({ message: 'Notification sent.' });
}

export async function toggleUserStatus(req: AuthedRequest, res: Response) {
  const user = await UserModel.findById(req.params.userId);
  if (!user) throw new HttpError(404, 'User not found.');
  if (user.isAdmin && req.userId !== String(user._id)) throw new HttpError(403, 'Cannot toggle status of other admins.');

  if (user.deactivatedAt) {
    user.deactivatedAt = undefined;
  } else {
    user.deactivatedAt = new Date();
    await SessionModel.updateMany({ userId: user._id }, { $set: { revokedAt: new Date() } });
  }

  await user.save();
  res.json({ user: serializeAdminUser(user) });
}
