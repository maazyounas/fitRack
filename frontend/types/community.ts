export type CommunityMember = {
  id: string;
  name: string;
  profilePictureUrl?: string;
  bio?: string;
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
    profilePictureUrl?: string;
  };
};

export type CommunityPost = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  challengeId?: string | null;
  author: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  comments: CommunityComment[];
};

export type LeaderboardEntry = {
  rank: number;
  score: number;
  user: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };
};

export type WeeklyChallenge = {
  id: string;
  title: string;
  description: string;
  metricLabel: string;
  unitLabel: string;
  startDate: string;
  endDate: string;
  joined: boolean;
  myScore: number;
  participantCount: number;
  leaderboard: LeaderboardEntry[];
};

export type CommunityDashboard = {
  me: CommunityMember;
  suggestions: CommunityMember[];
  posts: CommunityPost[];
  challenges: WeeklyChallenge[];
};
