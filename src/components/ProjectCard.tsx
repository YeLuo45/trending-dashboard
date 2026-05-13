import { useState, useEffect } from 'react';
import type { TrendingProject } from '../types';
import { getGhToken, forkRepo, parseRepoInfo, fetchRepoStats } from '../utils/github';
import { addFavorite, removeFavorite, isFavorited, followAuthor, unfollowAuthor, isFollowing } from '../utils/social';

interface ProjectCardProps {
  project: TrendingProject;
  selected: boolean;
  onSelect: (name: string) => void;
  onFavoritesChange?: () => void;
}

export function ProjectCard({ project, selected, onSelect, onFavoritesChange }: ProjectCardProps) {
  const [forking, setForking] = useState(false);
  const [forkResult, setForkResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);
  const [repoStats, setRepoStats] = useState<{ stars: number; forks: number } | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [following, setFollowing] = useState(false);
  const token = getGhToken();

  const repoInfo = parseRepoInfo(project.link);
  const owner = repoInfo?.owner || project.name.split('/')[0];
  const repo = repoInfo?.repo || project.name.split('/')[1];
  const language = project.keywords[0] || 'Unknown';

  // Initialize social states
  useEffect(() => {
    setFavorited(isFavorited(project.name));
    setFollowing(isFollowing(owner));
  }, [project.name, owner]);

  // Fetch real repo stats
  useEffect(() => {
    if (repoInfo) {
      fetchRepoStats(repoInfo.owner, repoInfo.repo, token || undefined).then(stats => {
        if (stats) setRepoStats(stats);
      });
    }
  }, [project.name]);

  const languageColors: Record<string, string> = {
    Python: 'bg-yellow-400',
    TypeScript: 'bg-blue-400',
    JavaScript: 'bg-yellow-300',
    Go: 'bg-cyan-400',
    Rust: 'bg-orange-500',
    Java: 'bg-red-500',
    'Jupyter Notebook': 'bg-orange-400',
    Swift: 'bg-orange-300',
    Kotlin: 'bg-purple-500',
    Dart: 'bg-blue-300',
    Ruby: 'bg-red-400',
    PHP: 'bg-purple-400',
    'C++': 'bg-pink-400',
    C: 'bg-gray-400',
    Shell: 'bg-green-500',
  };
  const langColor = languageColors[language] || 'bg-gray-400';

  const handleFork = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      setForkResult({ success: false, error: '请先在设置中配置 GitHub Token' });
      return;
    }

    const info = parseRepoInfo(project.link);
    if (!info) {
      setForkResult({ success: false, error: '无法解析仓库信息' });
      return;
    }

    setForking(true);
    setForkResult(null);

    const result = await forkRepo(info.owner, info.repo, token);
    setForking(false);
    setForkResult(result);

    if (result.success && result.url) {
      window.open(result.url, '_blank');
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (favorited) {
      removeFavorite(project.name);
      setFavorited(false);
    } else {
      const success = addFavorite({
        name: project.name,
        link: project.link,
        description: project.description,
      });
      if (success) {
        setFavorited(true);
      } else {
        alert('收藏数量已达上限（500条）');
      }
    }
    onFavoritesChange?.();
  };

  const handleToggleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (following) {
      unfollowAuthor(owner);
      setFollowing(false);
    } else {
      const success = followAuthor(owner);
      if (success) {
        setFollowing(true);
      } else {
        alert('关注数量已达上限（20个）');
      }
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-500';
  };

  // Use real stats if available, otherwise fall back to cached data
  const displayStars = repoStats?.stars ?? parseInt(project.totalStars.replace(/,/g, ''));
  const displayForks = repoStats?.forks ?? parseInt(project.forks?.replace(/,/g, '') || '0');

  return (
    <div className={`relative bg-github-card border rounded-lg p-4 transition-all duration-200 hover:shadow-lg hover:shadow-github-purple/10 ${selected ? 'border-github-purple border-2' : 'border-github-border hover:border-github-purple/50'}`}>
      {/* Favorite Button - Top Right */}
      <button
        onClick={handleToggleFavorite}
        className={`absolute top-3 right-3 text-xl transition-colors ${
          favorited ? 'text-yellow-400' : 'text-github-muted hover:text-yellow-400'
        }`}
        title={favorited ? '取消收藏' : '收藏'}
      >
        {favorited ? '★' : '☆'}
      </button>

      <div className="flex items-start gap-4">
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(project.name)}
          className="mt-1 w-4 h-4 rounded border-github-border text-github-purple focus:ring-github-purple cursor-pointer"
        />

        {/* Rank */}
        <div className={`text-2xl font-bold min-w-[2rem] ${getRankColor(project.rank)}`}>
          {project.rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Project Name + Owner - clickable link */}
          <div className="flex items-center gap-2 mb-1">
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:underline"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-github-purple truncate">
                {repo}
              </h3>
              <span className="text-github-muted text-sm">/</span>
              <span className="text-github-muted text-sm">{owner}</span>
            </a>
            {/* Language Badge */}
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-github-dark">
              <span className={`w-2 h-2 rounded-full ${langColor}`}></span>
              <span className="text-github-muted">{language}</span>
            </span>
            {/* Follow Author Button */}
            <button
              onClick={handleToggleFollow}
              className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors ${
                following 
                  ? 'bg-github-purple/20 text-github-purple' 
                  : 'bg-github-dark text-github-muted hover:text-github-purple'
              }`}
              title={following ? '取消关注' : '关注作者'}
            >
              {following ? '✓' : '👁'} {following ? '已关注' : '关注'}
            </button>
          </div>

          {/* Description */}
          <p className="text-github-muted text-sm mb-3 line-clamp-2">
            {project.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-github-orange">★</span>
              <span className="text-github-muted">{displayStars.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-github-blue">⑂</span>
              <span className="text-github-muted">{displayForks.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-github-green">⬆</span>
              <span className="text-github-green font-medium">+{parseInt(project.growth.replace(/,/g, '')).toLocaleString()}</span>
            </div>

            {/* Fork Button */}
            <div className="ml-auto">
              <button
                onClick={handleFork}
                disabled={forking}
                className="px-3 py-1 text-xs rounded bg-github-purple/20 text-github-purple hover:bg-github-purple/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {forking ? 'Forking...' : '⎈ Fork'}
              </button>
            </div>
          </div>

          {/* Fork Result Message */}
          {forkResult && (
            <div className={`mt-2 text-xs ${forkResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {forkResult.success
                ? `Fork 成功！`
                : `❌ ${forkResult.error}`}
              {forkResult.success && forkResult.url && (
                <a href={forkResult.url} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                  打开仓库
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
