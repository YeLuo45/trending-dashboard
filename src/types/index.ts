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
