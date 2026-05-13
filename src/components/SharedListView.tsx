import { useEffect, useState } from 'react';
import type { SharedList } from '../types';
import { getSharedList } from '../utils/social';

interface SharedListViewProps {
  shareId: string;
}

export function SharedListView({ shareId }: SharedListViewProps) {
  const [sharedList, setSharedList] = useState<SharedList | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Listen for storage changes to sync data across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'shared_lists') {
        const list = getSharedList(shareId);
        if (list) {
          setSharedList(list);
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    // Initial load
    const list = getSharedList(shareId);
    if (list) {
      setSharedList(list);
    } else {
      setNotFound(true);
    }
    
    return () => window.removeEventListener('storage', handleStorage);
  }, [shareId]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-github-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-github-text mb-2">分享已过期</h2>
          <p className="text-github-muted">该分享链接不存在或已过期</p>
        </div>
      </div>
    );
  }

  if (!sharedList) {
    return (
      <div className="min-h-screen bg-github-dark flex items-center justify-center">
        <div className="text-github-purple text-lg">加载中...</div>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('链接已复制到剪贴板');
  };

  return (
    <div className="min-h-screen bg-github-dark">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Share Card */}
        <div className="bg-github-card border border-github-border rounded-lg overflow-hidden">
          {/* Card Header */}
          <div className="p-6 border-b border-github-border text-center">
            <h1 className="text-2xl font-bold text-github-text mb-2">
              {sharedList.title || '✨ 精选项目列表'}
            </h1>
            <p className="text-github-muted text-sm">
              来自 Trending Dashboard · {sharedList.createdAt}
            </p>
          </div>

          {/* Project List */}
          <div className="p-6">
            <div className="space-y-4">
              {sharedList.projects.map((project, index) => (
                <a
                  key={index}
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-github-dark rounded hover:bg-github-dark/80 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-github-purple font-medium">
                      {project.name}
                    </span>
                    <span className="text-github-orange text-sm">★</span>
                  </div>
                  <p className="text-github-muted text-sm line-clamp-2">
                    {project.description}
                  </p>
                </a>
              ))}
            </div>
          </div>

          {/* Card Footer */}
          <div className="p-4 border-t border-github-border bg-github-dark/50 text-center">
            <p className="text-github-muted text-xs">
              trending-dashboard · 发现最新 GitHub 趋势项目
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={handleCopyLink}
            className="px-6 py-3 rounded bg-github-purple text-white hover:bg-github-purple/80 transition-colors flex items-center gap-2"
          >
            📋 复制链接
          </button>
          <a
            href="/"
            className="px-6 py-3 rounded bg-github-card border border-github-border text-github-text hover:border-github-purple/50 transition-colors"
          >
            🚀 查看趋势
          </a>
        </div>
      </div>
    </div>
  );
}
