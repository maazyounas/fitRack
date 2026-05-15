export type CommunityMember = {
  id: string;
  name: string;
  profilePictureUrl: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
};

export type CommunityComment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profilePictureUrl: string;
  };
};

export type CommunityPost = {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    profilePictureUrl: string;
  };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  comments: CommunityComment[];
  challengeId?: string;
  isReported: boolean;
  reportCount: number;
};

export type ChallengeLeaderboardEntry = {
  rank: number;
  score: number;
  user: {
    id: string;
    name: string;
    profilePictureUrl: string;
  };
};

export type CommunityChallenge = {
  id: string;
  title: string;
  description: string;
  metricLabel: string;
  unitLabel: string;
  targetValue: number;
  startDate: string;
  endDate: string;
  joined: boolean;
  myScore: number;
  participantCount: number;
  leaderboard: ChallengeLeaderboardEntry[];
};

export type CommunityDashboard = {
  me: CommunityMember;
  suggestions: CommunityMember[];
  posts: CommunityPost[];
  challenges: CommunityChallenge[];
};
