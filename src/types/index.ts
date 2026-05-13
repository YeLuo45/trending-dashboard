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
}

export interface TrendingData {
  weekly: TrendingProject[];
  monthly: TrendingProject[];
  daily?: TrendingProject[];
  lastUpdated: string;
  stars_history?: Record<string, Record<string, number>>;
  forks_history?: Record<string, Record<string, number>>;
}

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
