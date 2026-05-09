import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { UserModel } from '../models/User';
import { SocialProfileModel } from '../models/SocialProfile';
import { SocialPostModel } from '../models/SocialPost';
import { WeeklyChallengeModel } from '../models/WeeklyChallenge';
import { HttpError } from '../utils/http';
import { cleanText } from '../utils/moderation';

type AuthedRequest = Request & { userId?: string };

function toObjectId(id: string) {
  return new Types.ObjectId(id);
}

function startOfCurrentWeek() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const result = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  result.setUTCDate(result.getUTCDate() + diff);
  return result;
}

async function ensureWeeklyChallenges() {
  const weekStart = startOfCurrentWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  const existing = await WeeklyChallengeModel.find({ startDate: weekStart });
  if (existing.length) {
    return existing;
  }

  return WeeklyChallengeModel.insertMany([
    {
      title: 'Workout Streak Sprint',
      description: 'Stack points by checking in after each workout session this week.',
      metricLabel: 'workout points',
      unitLabel: 'pts',
      startDate: weekStart,
      endDate: weekEnd,
      participants: [],
    },
    {
      title: 'Hydration Hustle',
      description: 'Celebrate consistency by logging healthy habits and daily wins.',
      metricLabel: 'habit points',
      unitLabel: 'pts',
      startDate: weekStart,
      endDate: weekEnd,
      participants: [],
    },
  ]);
}

async function getOrCreateSocialProfile(userId: string) {
  let profile = await SocialProfileModel.findOne({ ownerId: userId });
  if (!profile) {
    profile = await SocialProfileModel.create({ ownerId: userId });
  }
  return profile;
}

function dedupeIds(ids: Array<string | Types.ObjectId>) {
  return [...new Set(ids.map((id) => String(id)))];
}

async function loadUsersMap(ids: Array<string | Types.ObjectId>) {
  const uniqueIds = dedupeIds(ids);
  if (!uniqueIds.length) {
    return new Map<string, any>();
  }

  const users = await UserModel.find({ _id: { $in: uniqueIds } });
  return new Map(users.map((user) => [String(user.id), user]));
}

async function loadSocialProfilesMap(ownerIds: Array<string | Types.ObjectId>) {
  const uniqueIds = dedupeIds(ownerIds);
  if (!uniqueIds.length) {
    return new Map<string, any>();
  }

  const profiles = await SocialProfileModel.find({ ownerId: { $in: uniqueIds } });
  return new Map(profiles.map((profile) => [String(profile.ownerId), profile]));
}

function serializeMember(user: any, socialProfile: any, currentUserId: string) {
  return {
    id: String(user.id),
    name: user.profile?.name ?? 'FITRACK Member',
    profilePictureUrl: user.profile?.profilePictureUrl ?? '',
    bio: socialProfile?.bio ?? '',
    followerCount: socialProfile?.followerIds?.length ?? 0,
    followingCount: socialProfile?.followingIds?.length ?? 0,
    isFollowing: (socialProfile?.followerIds ?? []).some((id: Types.ObjectId) => String(id) === currentUserId),
  };
}

function serializeComment(comment: any, usersMap: Map<string, any>) {
  const author = usersMap.get(String(comment.authorId));

  return {
    id: String(comment.id),
    content: comment.content,
    createdAt: comment.createdAt,
    author: {
      id: String(comment.authorId),
      name: author?.profile?.name ?? 'Member',
      profilePictureUrl: author?.profile?.profilePictureUrl ?? '',
    },
  };
}

function serializePost(post: any, currentUserId: string, usersMap: Map<string, any>) {
  const author = usersMap.get(String(post.authorId));

  return {
    id: String(post.id),
    content: post.content,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    challengeId: post.challengeId ? String(post.challengeId) : null,
    author: {
      id: String(post.authorId),
      name: author?.profile?.name ?? 'Member',
      profilePictureUrl: author?.profile?.profilePictureUrl ?? '',
    },
    likeCount: post.likeUserIds.length,
    commentCount: post.comments.length,
    likedByMe: post.likeUserIds.some((id: Types.ObjectId) => String(id) === currentUserId),
    imageUrl: post.imageUrl ?? null,
    isReported: post.isReported ?? false,
    reportCount: post.reportCount ?? 0,
    comments: post.comments
      .slice()
      .sort((left: any, right: any) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
      .map((comment: any) => serializeComment(comment, usersMap)),
  };
}

function serializeChallenge(challenge: any, currentUserId: string, usersMap: Map<string, any>) {
  const leaderboard = [...(challenge.participants ?? [])]
    .sort((left: any, right: any) => right.score - left.score || left.joinedAt.getTime() - right.joinedAt.getTime())
    .slice(0, 10)
    .map((participant: any, index: number) => {
      const user = usersMap.get(String(participant.userId));
      return {
        rank: index + 1,
        score: participant.score,
        user: {
          id: String(participant.userId),
          name: user?.profile?.name ?? 'Member',
          profilePictureUrl: user?.profile?.profilePictureUrl ?? '',
        },
      };
    });

  const myEntry = (challenge.participants ?? []).find(
    (participant: any) => String(participant.userId) === currentUserId
  );

  return {
    id: String(challenge.id),
    title: challenge.title,
    description: challenge.description,
    metricLabel: challenge.metricLabel,
    unitLabel: challenge.unitLabel,
    startDate: challenge.startDate,
    endDate: challenge.endDate,
    joined: Boolean(myEntry),
    myScore: myEntry?.score ?? 0,
    participantCount: challenge.participants.length,
    leaderboard,
  };
}

async function buildCommunityDashboard(currentUserId: string, search = '') {
  const socialProfile = await getOrCreateSocialProfile(currentUserId);
  const challenges = await ensureWeeklyChallenges();
  const followingIds = socialProfile.followingIds.map((id: Types.ObjectId) => String(id));
  const feedAuthorIds = [currentUserId, ...followingIds];

  let posts = await SocialPostModel.find({ authorId: { $in: feedAuthorIds.map(toObjectId) } })
    .sort({ createdAt: -1 })
    .limit(20);

  if (!posts.length) {
    posts = await SocialPostModel.find().sort({ createdAt: -1 }).limit(20);
  }

  const matchedUsers = search.trim()
    ? await UserModel.find({
        _id: { $ne: currentUserId },
        'profile.name': { $regex: search.trim(), $options: 'i' },
      })
        .sort({ 'profile.name': 1 })
        .limit(8)
    : await UserModel.find({ _id: { $nin: [currentUserId, ...followingIds] } })
        .sort({ createdAt: -1 })
        .limit(6);

  const challengeParticipantIds = challenges.flatMap((challenge) =>
    (challenge.participants ?? []).map((participant: any) => String(participant.userId))
  );

  const postUserIds = posts.flatMap((post) => [
    String(post.authorId),
    ...post.comments.map((comment: any) => String(comment.authorId)),
  ]);

  const usersMap = await loadUsersMap([
    currentUserId,
    ...followingIds,
    ...matchedUsers.map((user) => user.id),
    ...challengeParticipantIds,
    ...postUserIds,
  ]);
  const socialProfilesMap = await loadSocialProfilesMap([currentUserId, ...matchedUsers.map((user) => user.id)]);

  const suggestions = matchedUsers.map((user) =>
    serializeMember(user, socialProfilesMap.get(String(user.id)), currentUserId)
  );

  return {
    me: serializeMember(
      usersMap.get(currentUserId),
      socialProfilesMap.get(currentUserId) ?? socialProfile,
      currentUserId
    ),
    suggestions,
    posts: posts.map((post) => serializePost(post, currentUserId, usersMap)),
    challenges: challenges.map((challenge) => serializeChallenge(challenge, currentUserId, usersMap)),
  };
}

export async function getCommunityDashboard(req: AuthedRequest, res: Response) {
  const search = typeof req.query.search === 'string' ? req.query.search : '';
  const dashboard = await buildCommunityDashboard(req.userId as string, search);
  res.json(dashboard);
}

export async function toggleFollowUser(req: AuthedRequest, res: Response) {
  const currentUserId = req.userId as string;
  const targetUserId = String(req.params.userId);

  if (!Types.ObjectId.isValid(targetUserId)) {
    throw new HttpError(400, 'Invalid member id.');
  }
  if (targetUserId === currentUserId) {
    throw new HttpError(400, 'You cannot follow yourself.');
  }

  const targetUser = await UserModel.findById(targetUserId);
  if (!targetUser) {
    throw new HttpError(404, 'Member not found.');
  }

  const [socialProfile, targetProfile] = await Promise.all([
    getOrCreateSocialProfile(currentUserId),
    getOrCreateSocialProfile(targetUserId),
  ]);

  const alreadyFollowing = socialProfile.followingIds.some((id: Types.ObjectId) => String(id) === targetUserId);

  if (alreadyFollowing) {
    socialProfile.followingIds = socialProfile.followingIds.filter(
      (id: Types.ObjectId) => String(id) !== targetUserId
    ) as any;
    targetProfile.followerIds = targetProfile.followerIds.filter(
      (id: Types.ObjectId) => String(id) !== currentUserId
    ) as any;
  } else {
    socialProfile.followingIds.push(toObjectId(targetUserId));
    targetProfile.followerIds.push(toObjectId(currentUserId));
  }

  await Promise.all([socialProfile.save(), targetProfile.save()]);
  const dashboard = await buildCommunityDashboard(currentUserId);
  res.json({
    message: alreadyFollowing ? 'Member unfollowed.' : 'Member followed.',
    following: !alreadyFollowing,
    dashboard,
  });
}

export async function createPost(req: AuthedRequest, res: Response) {
  const content = String(req.body.content ?? '').trim();
  const challengeId = req.body.challengeId ? String(req.body.challengeId) : null;

  if (!content) {
    throw new HttpError(400, 'Post content is required.');
  }
  if (content.length > 500) {
    throw new HttpError(400, 'Post content must be 500 characters or fewer.');
  }

  if (challengeId) {
    const challenge = await WeeklyChallengeModel.findById(challengeId);
    if (!challenge) {
      throw new HttpError(404, 'Challenge not found.');
    }
  }

  const post = await SocialPostModel.create({
    authorId: req.userId,
    content: cleanText(content),
    challengeId,
    imageUrl: req.body.imageUrl || null,
  });

  const usersMap = await loadUsersMap([req.userId as string]);
  res.status(201).json({ post: serializePost(post, req.userId as string, usersMap) });
}

export async function togglePostLike(req: AuthedRequest, res: Response) {
  const post = await SocialPostModel.findById(req.params.postId);
  if (!post) {
    throw new HttpError(404, 'Post not found.');
  }

  const currentUserId = req.userId as string;
  const alreadyLiked = post.likeUserIds.some((id: Types.ObjectId) => String(id) === currentUserId);

  if (alreadyLiked) {
    post.likeUserIds = post.likeUserIds.filter((id: Types.ObjectId) => String(id) !== currentUserId) as any;
  } else {
    post.likeUserIds.push(toObjectId(currentUserId));
  }

  await post.save();
  const usersMap = await loadUsersMap([
    String(post.authorId),
    ...post.comments.map((comment: any) => String(comment.authorId)),
    currentUserId,
  ]);

  res.json({
    message: alreadyLiked ? 'Post unliked.' : 'Post liked.',
    post: serializePost(post, currentUserId, usersMap),
  });
}

export async function addPostComment(req: AuthedRequest, res: Response) {
  const post = await SocialPostModel.findById(req.params.postId);
  if (!post) {
    throw new HttpError(404, 'Post not found.');
  }

  const content = String(req.body.content ?? '').trim();
  if (!content) {
    throw new HttpError(400, 'Comment content is required.');
  }
  if (content.length > 280) {
    throw new HttpError(400, 'Comment content must be 280 characters or fewer.');
  }

  post.comments.push({
    authorId: req.userId,
    content: cleanText(content),
    createdAt: new Date(),
  } as any);

  await post.save();
  const currentUserId = req.userId as string;
  const usersMap = await loadUsersMap([
    String(post.authorId),
    ...post.comments.map((comment: any) => String(comment.authorId)),
    currentUserId,
  ]);

  res.status(201).json({
    message: 'Comment added.',
    post: serializePost(post, currentUserId, usersMap),
  });
}

export async function joinChallenge(req: AuthedRequest, res: Response) {
  const challenge = await WeeklyChallengeModel.findById(req.params.challengeId);
  if (!challenge) {
    throw new HttpError(404, 'Challenge not found.');
  }

  const currentUserId = req.userId as string;
  const existing = challenge.participants.find((participant: any) => String(participant.userId) === currentUserId);
  if (!existing) {
    challenge.participants.push({
      userId: toObjectId(currentUserId),
      score: 0,
      joinedAt: new Date(),
      updatedAt: new Date(),
    } as any);
    await challenge.save();
  }

  const usersMap = await loadUsersMap(challenge.participants.map((participant: any) => String(participant.userId)));
  res.json({
    message: existing ? 'Already joined this challenge.' : 'Challenge joined.',
    challenge: serializeChallenge(challenge, currentUserId, usersMap),
  });
}

export async function addChallengeProgress(req: AuthedRequest, res: Response) {
  const challenge = await WeeklyChallengeModel.findById(req.params.challengeId);
  if (!challenge) {
    throw new HttpError(404, 'Challenge not found.');
  }

  const delta = Math.max(1, Number(req.body.scoreDelta ?? 1));
  const currentUserId = req.userId as string;
  let participant = challenge.participants.find((item: any) => String(item.userId) === currentUserId);

  if (!participant) {
    challenge.participants.push({
      userId: toObjectId(currentUserId),
      score: delta,
      joinedAt: new Date(),
      updatedAt: new Date(),
    } as any);
  } else {
    participant.score += delta;
    participant.updatedAt = new Date();
  }

  await challenge.save();
  participant = challenge.participants.find((item: any) => String(item.userId) === currentUserId);

  const usersMap = await loadUsersMap(challenge.participants.map((item: any) => String(item.userId)));
  res.json({
    message: 'Challenge progress updated.',
    challenge: serializeChallenge(challenge, currentUserId, usersMap),
    myScore: participant?.score ?? delta,
  });
}

export async function reportPost(req: AuthedRequest, res: Response) {
  const post = await SocialPostModel.findById(req.params.postId);
  if (!post) {
    throw new HttpError(404, 'Post not found.');
  }

  post.reportCount = (post.reportCount ?? 0) + 1;
  if (post.reportCount >= 3) {
    post.isReported = true;
  }

  await post.save();
  res.json({ message: 'Post reported. Thank you for helping keep the community safe.' });
}

export async function deletePost(req: AuthedRequest, res: Response) {
  const post = await SocialPostModel.findById(req.params.postId);
  if (!post) {
    throw new HttpError(404, 'Post not found.');
  }

  const user = await UserModel.findById(req.userId);
  const isOwner = String(post.authorId) === req.userId;
  const isAdmin = user?.isAdmin === true;

  if (!isOwner && !isAdmin) {
    throw new HttpError(403, 'You do not have permission to delete this post.');
  }

  await post.deleteOne();
  res.json({ message: 'Post deleted successfully.' });
}

export async function getPublicProfile(req: AuthedRequest, res: Response) {
  const targetUserId = req.params.userId as string;
  const targetUser = await UserModel.findById(targetUserId);
  if (!targetUser) {
    throw new HttpError(404, 'Member not found.');
  }

  const socialProfile = await getOrCreateSocialProfile(targetUserId);
  const posts = await SocialPostModel.find({ authorId: targetUserId, isReported: false })
    .sort({ createdAt: -1 })
    .limit(30);

  const currentUserId = req.userId as string;
  const usersMap = await loadUsersMap([targetUserId, currentUserId]);

  res.json({
    profile: serializeMember(targetUser, socialProfile, currentUserId),
    posts: posts.map((post) => serializePost(post, currentUserId, usersMap)),
  });
}

export async function searchUsers(req: AuthedRequest, res: Response) {
  const query = String(req.query.q ?? '').trim();
  if (!query) {
    return res.json({ users: [] });
  }

  const users = await UserModel.find({
    'profile.name': { $regex: query, $options: 'i' },
  })
    .limit(20)
    .sort({ 'profile.name': 1 });

  const socialProfilesMap = await loadSocialProfilesMap(users.map((u) => u.id));
  const currentUserId = req.userId as string;

  res.json({
    users: users.map((user) => serializeMember(user, socialProfilesMap.get(String(user.id)), currentUserId)),
  });
}

export async function getLeaderboard(req: AuthedRequest, res: Response) {
  const challenge = await WeeklyChallengeModel.findById(req.params.challengeId);
  if (!challenge) {
    throw new HttpError(404, 'Challenge not found.');
  }

  const userIds = challenge.participants.map((p: any) => String(p.userId));
  const usersMap = await loadUsersMap(userIds);
  const currentUserId = req.userId as string;

  res.json({
    challenge: serializeChallenge(challenge, currentUserId, usersMap),
  });
}
