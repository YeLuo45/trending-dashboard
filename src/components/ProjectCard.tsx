import { useState, useEffect } from 'react';
import type { TrendingProject } from '../types';
import { getGhToken, forkRepo, parseRepoInfo, fetchRepoStats } from '../utils/github';
import { addFavorite, removeFavorite, isFavorited, followAuthor, unfollowAuthor, isFollowing } from '../utils/social';
import { RisingBadge } from './RisingBadge';

interface ProjectCardProps {
  project: TrendingProject;
  selected: boolean;
  onSelect: (name: string) => void;
  onFavoritesChange?: () => void;
  onShowComments?: (projectName: string) => void;
  /** Keyword to highlight in name, description, and tags */
  highlightKeyword?: string;
}

/** Highlight occurrences of `keyword` in `text` with a yellow background mark */
function HighlightedText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim()) return <>{text}</>;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-500/20 text-yellow-300 rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function ProjectCard({ project, selected, onSelect, onFavoritesChange, onShowComments, highlightKeyword }: ProjectCardProps) {
  const [forking, setForking] = useState(false);
  const [forkResult, setForkResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);
  const [repoStats, setRepoStats] = useState<{ stars: number; forks: number } | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [following, setFollowing] = useState(false);
  const token = getGhToken();

  const repoInfo = parseRepoInfo(project.link);
  const owner = repoInfo?.owner || project.name.split('/')[0];
  const repo = repoInfo?.repo || project.name.split('/')[1];
  const language = project.keywords?.[0] || 'Unknown';

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
    return 'text-zinc-500';
  };

  // Use real stats if available, otherwise fall back to cached data
  const displayStars = repoStats?.stars ?? parseInt(project.totalStars.replace(/,/g, ''));
  const displayForks = repoStats?.forks ?? parseInt(project.forks?.replace(/,/g, '') || '0');

  return (
    <div 
      className={`relative glass-panel rounded-2xl p-5 transition-all duration-200 active:scale-[0.985] ${
        selected 
          ? 'border-github-purple/60 ring-1 ring-github-purple/30 bg-github-purple/5' 
          : 'hover:border-github-purple/40 hover:shadow-[0_0_24px_rgba(99,102,241,0.06)]'
      }`}
    >
      {/* Favorite Button - Top Right - 更柔和优雅的设计 */}
      <button
        onClick={handleToggleFavorite}
        className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-github-dark/50 border border-github-border/40 text-lg transition-colors cursor-pointer ${
          favorited ? 'text-yellow-400 bg-yellow-500/5' : 'text-github-muted hover:text-yellow-400'
        }`}
        title={favorited ? '取消收藏' : '收藏'}
        style={{ minWidth: '32px', minHeight: '32px' }}
      >
        {favorited ? '★' : '☆'}
      </button>

      <div className="flex items-start gap-4">
        {/* Selection Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(project.name)}
          className="mt-1.5 w-4 h-4 rounded-md border-github-border text-github-purple focus:ring-github-purple focus:ring-offset-github-dark cursor-pointer"
        />

        {/* Rank - monospace tabular digital precision */}
        <div className={`text-2xl font-bold font-mono-tabular min-w-[2.25rem] text-right ${getRankColor(project.rank)}`}>
          {project.rank.toString().padStart(2, '0')}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Project Name + Owner - clickable link */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:underline"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-github-text tracking-tight truncate">
                <HighlightedText text={repo} keyword={highlightKeyword || ''} />
              </h3>
              <RisingBadge project={project} />
              <span className="text-github-muted/60 text-sm">/</span>
              <span className="text-github-muted/80 text-sm font-medium">{owner}</span>
            </a>
            
            {/* Language Badge */}
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs rounded-full bg-github-dark border border-github-border/30">
              <span className={`w-2 h-2 rounded-full ${langColor}`}></span>
              <span className="text-github-muted font-medium">{language}</span>
            </span>
            
            {/* Follow Author Button */}
            <button
              onClick={handleToggleFollow}
              className={`flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-md transition-colors cursor-pointer ${
                following 
                  ? 'bg-github-purple/15 text-github-purple border border-github-purple/20' 
                  : 'bg-github-dark text-github-muted border border-github-border/50 hover:text-github-purple hover:border-github-purple/30'
              }`}
              title={following ? '取消关注' : '关注作者'}
              style={{ minHeight: '24px' }}
            >
              {following ? '✓ 已关注' : '👁 关注'}
            </button>
          </div>

          {/* Description */}
          <p className="text-github-muted text-[13.5px] leading-relaxed mb-4 max-w-[65ch] line-clamp-2">
            <HighlightedText text={project.description} keyword={highlightKeyword || ''} />
          </p>

          {/* Tags / Keywords */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.keywords.map((kw, i) => (
              <span
                key={i}
                className={`px-2.5 py-0.5 text-xs rounded-md font-medium ${
                  highlightKeyword && kw.toLowerCase().includes(highlightKeyword.toLowerCase())
                    ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30'
                    : 'bg-github-dark text-github-muted border border-github-border/30'
                }`}
              >
                <HighlightedText text={kw} keyword={highlightKeyword || ''} />
              </span>
            ))}
          </div>

          {/* Stats - font-mono tabular with nice padding */}
          <div className="flex flex-wrap items-center gap-4 text-sm pt-2 border-t border-github-border/20">
            <div className="flex items-center gap-1">
              <span className="text-github-orange text-base">★</span>
              <span className="text-github-text font-mono-tabular">{displayStars.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-github-blue text-base">⑂</span>
              <span className="text-github-text font-mono-tabular">{displayForks.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-github-green text-base">▲</span>
              <span className="text-github-green font-mono-tabular font-semibold">+{parseInt(project.growth.replace(/,/g, '')).toLocaleString()}</span>
            </div>

            {/* Fork Button */}
            <div className="ml-auto flex items-center gap-2">
              {onShowComments && (
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    onShowComments(project.name);
                  }}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-github-dark border border-github-border/60 text-github-muted hover:text-github-purple hover:border-github-purple/30 transition-colors cursor-pointer"
                  style={{ minHeight: '28px' }}
                >
                  💬 评论
                </button>
              )}
              <button
                onClick={handleFork}
                disabled={forking}
                className="px-3 py-1 text-xs font-semibold rounded-md bg-github-purple/10 border border-github-purple/30 text-github-purple hover:bg-github-purple/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                style={{ minHeight: '28px' }}
              >
                {forking ? 'Forking...' : '⎈ Fork'}
              </button>
            </div>
          </div>

          {/* Fork Result Message */}
          {forkResult && (
            <div className={`mt-3 text-xs font-medium ${forkResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {forkResult.success
                ? `✓ Fork 成功！`
                : `❌ ${forkResult.error}`}
              {forkResult.success && forkResult.url && (
                <a href={forkResult.url} target="_blank" rel="noopener noreferrer" className="ml-2 underline hover:text-github-purple">
                  打开 GitHub 仓库
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
