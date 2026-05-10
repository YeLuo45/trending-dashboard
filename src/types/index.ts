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
  lastUpdated: string;
}

export interface GhUser {
  login: string;
  avatar_url: string;
  name: string;
}
