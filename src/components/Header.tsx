import { useState, useEffect } from 'react';
import type { GhUser } from '../types';
import { getGhToken, fetchGhUser } from '../utils/github';
import { Settings } from './Settings';

interface HeaderProps {
  lastUpdated: string;
  ghUser: GhUser | null;
  onGhUserChange: (user: GhUser | null) => void;
}

export function Header({ lastUpdated, ghUser, onGhUserChange }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const token = getGhToken();
    if (token && !ghUser) {
      fetchGhUser(token).then(user => {
        if (user) onGhUserChange(user);
      });
    }
  }, []);

  return (
    <>
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-github-text mb-2">
              GitHub Trending
            </h1>
            <p className="text-github-muted text-sm">
              热点项目分析报告
            </p>
          </div>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <div className="text-right">
                <p className="text-github-muted text-xs">最后更新</p>
                <p className="text-github-purple text-sm font-medium">{lastUpdated}</p>
              </div>
            )}

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-2 bg-github-card border border-github-border rounded hover:border-github-purple/50 transition-colors"
            >
              <span>⚙️</span>
              {ghUser ? (
                <img src={ghUser.avatar_url} alt={ghUser.login} className="w-5 h-5 rounded-full" />
              ) : (
                <span className="text-github-muted text-xs">未登录</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} onUserChange={onGhUserChange} />
      )}
    </>
  );
}
