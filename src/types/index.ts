export interface TrendingProject {
  rank: number;
  name: string;
  link: string;
  description: string;
  keywords: string[];
  totalStars: string;
  growth: string;
  growthValue: number;
}

export interface TrendingData {
  weekly: TrendingProject[];
  monthly: TrendingProject[];
  lastUpdated: string;
}
