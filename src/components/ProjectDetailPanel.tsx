import { useState, useEffect } from 'react';
import type { TrendingProject } from '../types';
import { getGhToken, fetchReadme, fetchRepoStats } from '../utils/github';

interface ProjectDetailPanelProps {
  project: TrendingProject;
  onClose: () => void;
}

export function ProjectDetailPanel({ project, onClose }: ProjectDetailPanelProps) {
  const [readme, setReadme] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [stats, setStats] = useState<{ stars: number; forks: number } | null>(null);
  const repoInfo = project.link.replace('https://github.com/', '').split('/');
  const owner = repoInfo[0];
  const repo = repoInfo[1];

  useEffect(() => {
    const token = getGhToken();
    setReadmeLoading(true);
    fetchReadme(owner, repo, token || undefined).then(content => {
      setReadme(content);
      setReadmeLoading(false);
    });
    fetchRepoStats(owner, repo, token || undefined).then(s => s && setStats(s));
  }, [project.name]);

  const chartHeight = 80;
  const chartWidth = 280;
  const history = project.starsHistory || [];
  const maxVal = Math.max(...history, 1);
  const minVal = Math.min(...history, 0);
  const range = maxVal - minVal || 1;

  const points = history.map((val, i) => {
    const x = (i / (history.length - 1 || 1)) * chartWidth;
    const y = chartHeight - ((val - minVal) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const polyline = history.length > 0
    ? `<polyline points="${points}" fill="none" stroke="#a371f7" stroke-width="2" stroke-linejoin="round"/>`
    : '';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-github-card border border-github-border rounded-lg w-[700px] max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-github-border">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-github-purple hover:underline truncate"
            >
              {project.name}
            </a>
            {project.risingPrediction && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gradient-to-r from-orange-500 to-red-500 text-white shrink-0">
                🚀 Rising
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-github-muted hover:text-github-text text-2xl leading-none shrink-0"
          >
            ×
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 px-4 py-3 bg-github-dark/50 border-b border-github-border text-sm">
          <div className="flex items-center gap-1">
            <span className="text-github-orange">★</span>
            <span className="text-github-text font-medium">{(stats?.stars ?? parseInt(project.totalStars.replace(/,/g, ''))).toLocaleString()}</span>
            <span className="text-github-muted ml-1">总星</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-github-blue">⑂</span>
            <span className="text-github-text font-medium">{(stats?.forks ?? parseInt(project.forks?.replace(/,/g, '') || '0')).toLocaleString()}</span>
            <span className="text-github-muted ml-1">Fork</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-github-green">⬆</span>
            <span className="text-github-green font-medium">+{parseInt(project.growth.replace(/,/g, '')).toLocaleString()}</span>
            <span className="text-github-muted ml-1">增长</span>
          </div>
          {project.activity !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-github-purple">●</span>
              <span className="text-github-text font-medium">{project.activity}</span>
              <span className="text-github-muted ml-1">活跃度</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="px-4 py-3 border-b border-github-border">
          <p className="text-github-muted text-sm">{project.description}</p>
        </div>

        {/* Stars History Chart */}
        {history.length > 0 && (
          <div className="px-4 py-3 border-b border-github-border">
            <h4 className="text-github-muted text-xs mb-2">星数历史 (最近{history.length}天)</h4>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-20">
              {polyline}
              {history.map((val, i) => {
                const x = (i / (history.length - 1 || 1)) * chartWidth;
                const y = chartHeight - ((val - minVal) / range) * chartHeight;
                return <circle key={i} cx={x} cy={y} r="2" fill="#a371f7"/>;
              })}
            </svg>
          </div>
        )}

        {/* README Preview */}
        <div className="flex-1 overflow-auto p-4">
          <h4 className="text-github-muted text-xs mb-2">README 预览</h4>
          {readmeLoading ? (
            <div className="text-github-muted text-sm">加载中...</div>
          ) : readme ? (
            <div
              className="text-github-text text-sm prose prose-sm prose-invert max-w-none prose-headings:text-github-purple prose-code:text-github-purple prose-a:text-github-purple"
              dangerouslySetInnerHTML={{ __html: readme }}
            />
          ) : (
            <div className="text-github-muted text-sm">暂无 README 内容</div>
          )}
        </div>
      </div>
    </div>
  );
}