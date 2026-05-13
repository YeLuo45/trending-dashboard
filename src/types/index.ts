export interface TrendingProject {
  rank: number;
  name: string;
  link: string;
  description: string;
  keywords: string[];
  totalStars: string;
  growth: string;
  growthValue: number;
  forks?: string;
  forksValue?: number;
  activity?: number;
  starsHistory?: number[];
  risingPrediction?: boolean;
}

export interface TrendingData {
  weekly: TrendingProject[];
  monthly: TrendingProject[];
  daily?: TrendingProject[];
  lastUpdated: string;
  stars_history?: Record<string, Record<string, number>>;
  forks_history?: Record<string, Record<string, number>>;
}

export type SortKey = 'rank' | 'growth' | 'forks' | 'activity' | 'stars';
export type SortDirection = 'asc' | 'desc';

export interface GhUser {
  login: string;
  avatar_url: string;
  name: string;
}

// Social Features Types
export interface FavoriteItem {
  name: string;          // "owner/repo"
  link: string;          // GitHub URL
  description: string;   // 翻译后描述
  starredAt: string;    // 收藏时间
  category?: string;     // 分类标签（可选：学习/工作/调研）
}

export interface SharedList {
  id: string;            // 6位哈希 ID
  projects: FavoriteItem[];
  createdAt: string;
  title?: string;        // 可选分享标题
}

export interface FollowedAuthor {
  username: string;
  followedAt: string;
}

// ============ Topic Tracking ============
export interface TrackedTopic {
  id: string;              // lowercase tag name
  name: string;            // display name (original case)
  addedAt: string;
  color?: string;          // optional custom color
}

// ============ Smart Recommendations ===========
export interface Recommendation {
  project: TrendingProject;
  reason: 'favorite_match' | 'author_match' | 'topic_match' | 'trend_match';
  reasonLabel: string;    // e.g. "匹配你的收藏偏好: AI/机器学习"
  score: number;          // 0-100, higher = more relevant
}

// ============ Reports ===========
export interface Report {
  id: string;
  type: 'daily' | 'weekly';
  title: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  summary: string;         // brief summary text
  topProjects: TrendingProject[];
  newInTrend: TrendingProject[];
  risingProjects: TrendingProject[];
  topicSummaries: { topic: string; count: number }[];
}

// ============ User Preferences ===========
export interface UserPreferences {
  trackedTopics: TrackedTopic[];
  reportHistory: Report[];
  lastReportGenerated?: string;
  recommendationsLastUpdated?: string;
}
