import type { TrendingProject, Recommendation } from '../types';
import { getFavorites, getFollowedAuthors } from './social';

const TOPIC_COLORS = [
  'bg-blue-500/20 text-blue-400',
  'bg-green-500/20 text-green-400',
  'bg-yellow-500/20 text-yellow-400',
  'bg-pink-500/20 text-pink-400',
  'bg-purple-500/20 text-purple-400',
  'bg-orange-500/20 text-orange-400',
  'bg-cyan-500/20 text-cyan-400',
  'bg-red-500/20 text-red-400',
];

// Topic color index derived from topic string hash
function getTopicColor(topic: string): string {
  let hash = 0;
  for (let i = 0; i < topic.length; i++) {
    hash = (hash * 31 + topic.charCodeAt(i)) % TOPIC_COLORS.length;
  }
  return TOPIC_COLORS[Math.abs(hash) % TOPIC_COLORS.length];
}

function getFollowedSet(): Set<string> {
  return new Set(getFollowedAuthors().map(a => a.username.toLowerCase()));
}

// Get a reason label for a recommendation
function getReasonLabel(
  reason: Recommendation['reason'],
  topic?: string
): string {
  switch (reason) {
    case 'favorite_match':
      return topic ? `收藏偏好: ${topic}` : '收藏匹配';
    case 'author_match':
      return '关注作者新项目';
    case 'topic_match':
      return topic ? `话题追踪: ${topic}` : '话题匹配';
    case 'trend_match':
      return '热门趋势';
  }
}

// Score a project based on topic overlap with favorites
function scoreByFavoriteTopics(
  project: TrendingProject,
  topicScores: Map<string, number>
): { score: number; matchedTopic: string } {
  let bestScore = 0;
  let bestTopic = '';
  for (const kw of project.keywords) {
    const key = kw.toLowerCase().trim();
    if (topicScores.has(key)) {
      const s = topicScores.get(key)!;
      if (s > bestScore) {
        bestScore = s;
        bestTopic = kw;
      }
    }
  }
  return { score: bestScore, matchedTopic: bestTopic };
}

/**
 * Generate smart recommendations for projects based on user's favorites and followed authors.
 * Returns up to maxResults recommendations sorted by score descending.
 */
export function getRecommendations(
  allProjects: TrendingProject[],
  maxResults: number = 10
): Recommendation[] {
  const favorites = getFavorites();
  const followedSet = getFollowedSet();

  // Build topic frequency map from trending projects that match favorited repos
  // (for each favorited repo, we look at keywords of same-name project in allProjects)
  const favoriteNames = new Set(favorites.map(f => f.name));
  const topicScores = new Map<string, number>();
  for (const project of allProjects) {
    if (favoriteNames.has(project.name)) {
      for (const kw of project.keywords) {
        const key = kw.toLowerCase().trim();
        if (key) topicScores.set(key, (topicScores.get(key) || 0) + 1);
      }
    }
  }

  const recommendations: Recommendation[] = [];

  for (const project of allProjects) {
    // Skip if already in favorites
    if (favorites.some(f => f.name === project.name)) continue;

    // Check author match (followed author)
    const parts = project.name.split('/');
    const author = parts.length >= 2 ? parts[0].toLowerCase() : '';
    const isFollowed = followedSet.has(author);

    // Score by topic match with favorites
    const { score: topicScore, matchedTopic } = scoreByFavoriteTopics(project, topicScores);

    // Base score from topic match
    let finalScore = topicScore;
    let reason: Recommendation['reason'] = 'trend_match';
    let reasonLabel = getReasonLabel('trend_match');

    if (isFollowed && topicScore > 0) {
      // Both author and topic match - highest priority
      finalScore = topicScore + 60;
      reason = 'author_match';
      reasonLabel = getReasonLabel('author_match');
    } else if (isFollowed) {
      // Author match only
      finalScore = 50;
      reason = 'author_match';
      reasonLabel = getReasonLabel('author_match');
    } else if (topicScore > 0) {
      // Topic match with favorites
      finalScore = topicScore + 20;
      reason = 'favorite_match';
      reasonLabel = getReasonLabel('favorite_match', matchedTopic);
    }

    // Boost score for rising prediction projects
    if (project.risingPrediction) {
      finalScore += 15;
    }

    // Boost for strong growth
    if (project.growthValue > 500) {
      finalScore += 10;
    }

    // Only recommend if score is meaningful
    if (finalScore > 5) {
      recommendations.push({
        project,
        reason,
        reasonLabel,
        score: Math.min(100, finalScore),
      });
    }
  }

  // Sort by score descending, deduplicate by project name
  const seen = new Set<string>();
  const sorted = recommendations
    .sort((a, b) => b.score - a.score)
    .filter(r => {
      if (seen.has(r.project.name)) return false;
      seen.add(r.project.name);
      return true;
    });

  return sorted.slice(0, maxResults);
}

/**
 * Get color class for a topic tag
 */
export function getTopicColorClass(topic: string): string {
  return getTopicColor(topic);
}

/**
 * Aggregate all unique keywords/tags from a project list.
 * Returns them sorted by frequency.
 */
export function getTopTags(projects: TrendingProject[], limit: number = 30): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of projects) {
    for (const kw of p.keywords) {
      const key = kw.toLowerCase().trim();
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}