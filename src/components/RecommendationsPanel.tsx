import { useState, useEffect } from 'react';
import type { Recommendation, TrendingProject } from '../types';
import { getRecommendations } from '../utils/recommendations';
import { addFavorite, isFavorited } from '../utils/social';

interface RecommendationsPanelProps {
  allProjects: TrendingProject[];
  onClose: () => void;
}

const REASON_ICONS: Record<Recommendation['reason'], string> = {
  favorite_match: '⭐',
  author_match: '👁',
  topic_match: '🏷',
  trend_match: '📈',
};

export function RecommendationsPanel({ allProjects, onClose }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [favorited, setFavorited] = useState<Set<string>>(new Set());

  useEffect(() => {
    const recs = getRecommendations(allProjects, 12);
    setRecommendations(recs);
    const favSet = new Set<string>();
    recs.forEach(r => {
      if (isFavorited(r.project.name)) favSet.add(r.project.name);
    });
    setFavorited(favSet);
  }, [allProjects]);

  const handleAddFavorite = (rec: Recommendation) => {
    const result = addFavorite({
      name: rec.project.name,
      link: rec.project.link,
      description: rec.project.description,
    });
    if (result) {
      setFavorited(prev => new Set([...prev, rec.project.name]));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-github-card border border-github-border rounded-lg w-[700px] max-w-[90vw] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-github-border">
          <h2 className="text-xl font-semibold text-github-text flex items-center gap-2">
            🎯 智能推荐 ({recommendations.length})
          </h2>
          <button
            onClick={onClose}
            className="text-github-muted hover:text-github-text text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="px-4 py-2 border-b border-github-border bg-github-dark/50">
          <p className="text-github-muted text-xs">
            基于你的收藏偏好和关注作者生成 · 推荐分数越高越符合你的兴趣
          </p>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {recommendations.length === 0 ? (
            <div className="text-center py-12 text-github-muted">
              <div className="text-4xl mb-3">🔍</div>
              <p>暂无推荐</p>
              <p className="text-xs mt-1">收藏一些项目后会获得更精准的推荐</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map(rec => (
                <div
                  key={rec.project.name}
                  className="p-3 bg-github-dark rounded hover:bg-github-dark/80 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center min-w-[40px]">
                      <span className={`text-lg font-bold ${
                        rec.score >= 70 ? 'text-green-400' :
                        rec.score >= 40 ? 'text-yellow-400' : 'text-github-muted'
                      }`}>
                        {rec.score}
                      </span>
                      <span className="text-xs text-github-muted">分</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={rec.project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-github-purple font-medium hover:underline truncate"
                        >
                          {rec.project.name}
                        </a>

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                          rec.reason === 'author_match' ? 'bg-blue-500/20 text-blue-400' :
                          rec.reason === 'favorite_match' ? 'bg-purple-500/20 text-purple-400' :
                          rec.reason === 'topic_match' ? 'bg-green-500/20 text-green-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {REASON_ICONS[rec.reason]} {rec.reasonLabel}
                        </span>

                        {rec.project.risingPrediction && (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                            🔥 国星预测
                          </span>
                        )}
                      </div>

                      <p className="text-github-muted text-sm mt-1 line-clamp-2">
                        {rec.project.description}
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-github-muted text-xs">
                          ⬆ {rec.project.growth}
                        </span>
                        <span className="text-github-muted text-xs">
                          ⭐ {rec.project.totalStars}
                        </span>
                        {rec.project.keywords.slice(0, 3).map(kw => (
                          <span
                            key={kw}
                            className="px-1.5 py-0.5 rounded text-xs bg-github-card text-github-muted"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {!favorited.has(rec.project.name) ? (
                      <button
                        onClick={() => handleAddFavorite(rec)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 text-xs rounded bg-github-purple/20 text-github-purple hover:bg-github-purple/30"
                      >
                        ⭐ 收藏
                      </button>
                    ) : (
                      <span className="opacity-0 group-hover:opacity-100 text-xs text-github-muted">已收藏</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}