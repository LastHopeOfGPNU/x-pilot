// Unified type definitions
export interface Author {
  name: string;
  handle: string;
  avatar: string;
  verified?: boolean;
}

export interface Stats {
  comments: number;
  retweets: number;
  likes: number;
  views: number;
  bookmarks: number;
}

export interface Metadata {
  category?: string;
  priority?: 'High' | 'Medium' | 'Low';
  deadline?: string;
  assignee?: string;
  status?: string;
}

// Account post interface
export interface AccountPost {
  id: number;
  content: string;
  time: string;
  stats: Stats;
}

// Account analytics interface
export interface AccountAnalytics {
  influence: number;
  engagement: number;
  reach: string;
  avgLikes: string;
  topCategories: string[];
  audienceAge: string;
  audienceGender: string;
}

// Inspiration account interface
export interface InspirationAccount {
  id: number;
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  followers: number;
  likes: number;
  isTargeted: boolean;
  starred?: boolean;
  verified?: boolean;
}

export interface Card {
  id: string;
  type?: 'post' | 'tweet' | 'strategy' | 'action' | 'inspiration' | 'account';
  title?: string;
  content: string;
  author?: string;
  handle?: string;
  avatar?: string;
  time: string;
  likes?: number;
  retweets?: number;
  replies?: number;
  views?: number;
  stats?: Stats;
  metadata?: Metadata;
  inspirationAccount?: InspirationAccount;
  suggestedReply?: string;
  replyActions?: {
    reject: boolean;
    postReply: boolean;
  };
  tweetId?: string;
  username?: string;
}

// Post interface for PostThreadQueue
export interface Post {
  id: string;
  type: 'post' | 'thread';
  content: string;
  createdTime: string;
  scheduledTime?: string;
  status: 'draft' | 'scheduled' | 'published';
  platform: 'twitter';
  threadCount?: number;
  aiGenerated: boolean;
  tags: string[];
  stats?: {
    comments: number;
    retweets: number;
    likes: number;
    views: number;
  };
}

export type CardType = Card['type'];
export type Priority = Metadata['priority'];

// Re-export AI Assistant types
export * from './aiAssistant';