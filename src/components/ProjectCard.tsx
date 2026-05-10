import { useState } from 'react';
import type { TrendingProject } from '../types';
import { getGhToken, forkRepo, parseRepoInfo } from '../utils/github';

interface ProjectCardProps {
  project: TrendingProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [forking, setForking] = useState(false);
  const [forkResult, setForkResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);
  const token = getGhToken();

  const handleFork = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      setForkResult({ success: false, error: '请先在设置中配置 GitHub Token' });
      return;
    }

    const repoInfo = parseRepoInfo(project.link);
    if (!repoInfo) {
      setForkResult({ success: false, error: '无法解析仓库信息' });
      return;
    }

    setForking(true);
    setForkResult(null);

    const result = await forkRepo(repoInfo.owner, repoInfo.repo, token);
    setForking(false);
    setForkResult(result);

    if (result.success && result.url) {
      window.open(result.url, '_blank');
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-500';
  };

  return (
    <div className="bg-github-card border border-github-border rounded-lg p-4 hover:border-github-purple/50 transition-all duration-200 hover:shadow-lg hover:shadow-github-purple/10">
      <div className="flex items-start gap-4">
        {/* Rank */}
        <div className={`text-2xl font-bold min-w-[2rem] ${getRankColor(project.rank)}`}>
          {project.rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Project Name */}
          <h3 className="text-lg font-semibold text-github-purple mb-1 truncate">
            {project.name}
          </h3>

          {/* Description */}
          <p className="text-github-muted text-sm mb-3 line-clamp-2">
            {project.description}
          </p>

          {/* Keywords */}
          <div className="flex flex-wrap gap-2 mb-3">
            {project.keywords.map((keyword, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs rounded-full bg-github-purple/20 text-github-purple"
              >
                {keyword}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-github-orange">★</span>
              <span className="text-github-muted">{parseInt(project.totalStars).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-github-green">⬆</span>
              <span className="text-github-green font-medium">+{parseInt(project.growth).toLocaleString()}</span>
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
