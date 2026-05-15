import { useState, useEffect } from 'react';
import type { GhUser } from '../types';
import { getGhToken, fetchGhUser } from '../utils/github';
import { Settings } from './Settings';
import { getFavorites, getFollowedAuthors, getNewProjectsFromFollowedAuthors, getUnreadNotificationCount } from '../utils/social';
import type { TrendingProject } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';

interface HeaderProps {
  lastUpdated: string;
  ghUser: GhUser | null;
  onGhUserChange: (user: GhUser | null) => void;
  forkHistoryCount?: number;
  onForkHistorySync?: (records: import('../utils/github').ForkHistoryRecord[]) => void;
  onShowHistory?: () => void;
  projects?: TrendingProject[];
  onShowFavorites?: () => void;
  onShowFollowedAuthors?: () => void;
  onShowRecommendations?: () => void;
  onShowTopicTracking?: () => void;
  onShowReports?: () => void;
  onShowNotificationCenter?: () => void;
  onShowMobileNav?: () => void;
  onShowExport?: () => void;
}

export function Header({
  lastUpdated, ghUser, onGhUserChange,
  forkHistoryCount = 0, onForkHistorySync,
  onShowHistory,
  projects = [],
  onShowFavorites, onShowFollowedAuthors,
  onShowRecommendations, onShowTopicTracking, onShowReports,
  onShowNotificationCenter,
  onShowMobileNav, onShowExport,
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [followedCount, setFollowedCount] = useState(0);
  const [newProjectsCount, setNewProjectsCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const token = getGhToken();
    if (token && !ghUser) {
      fetchGhUser(token).then(user => {
        if (user) onGhUserChange(user);
      });
    }
  }, []);

  // Update social counts
  useEffect(() => {
    const favs = getFavorites();
    setFavoritesCount(favs.length);

    const followed = getFollowedAuthors();
    setFollowedCount(followed.length);

    // Check for new projects from followed authors
    if (projects.length > 0) {
      const newProjects = getNewProjectsFromFollowedAuthors(projects);
      const totalNew = newProjects.reduce((sum, a) => sum + a.projects.length, 0);
      setNewProjectsCount(totalNew);
    }

    // Check unread notifications
    setUnreadNotifications(getUnreadNotificationCount());
  }, [projects]);

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

          <div className="flex items-center gap-2">
            {/* Mobile menu button - only shows on mobile */}
            <button
              onClick={onShowMobileNav}
              className="show-mobile-only flex items-center gap-2 px-3 py-2 bg-github-card border border-github-border rounded hover:border-github-purple/50 transition-colors"
            >
              <span>☰</span>
              <span className="text-github-muted text-xs">菜单</span>
            </button>

            {/* Theme & Language toggles - hide on mobile */}
            <div className="hide-mobile flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>

            {lastUpdated && (
              <div className="text-right hide-mobile">
                <p className="text-github-muted text-xs">最后更新</p>
                <p className="text-github-purple text-sm font-medium">{lastUpdated}</p>
              </div>
            )}

            {/* Export button - hide on mobile */}
            {onShowExport && (
              <button
                onClick={onShowExport}
                className="hide-mobile flex items-center gap-2 px-3 py-2 bg-github-card border border-github-border rounded hover:border-github-purple/50 transition-colors"
              >
                <span>📥</span>
                <span className="text-github-muted text-xs">导出</span>
              </button>
            )}

            {/* Favorites Button - hide on mobile */}
            {onShowFavorites && (
              <button
                onClick={onShowFavorites}
                className="hide-mobile flex items-center gap-2 px-3 py-2 bg-github-card border border-github-border rounded hover:border-github-purple/50 transition-colors"
              >
                <span>⭐</span>
                <span className="text-github-muted text-xs">收藏</span>
                {favoritesCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-github-purple text-white">
                    {favoritesCount}
                  </span>
                )}
              </button>
            )}

            {/* Followed Authors Button - hide on mobile */}
            {onShowFollowedAuthors && (
              <button
                onClick={onShowFollowedAuthors}
                className="hide-mobile flex items-center gap-2 px-3 py-2 bg-github-card border border-github-border rounded hover:border-github-purple/50 transition-colors relative"
              >
                <span>👁</span>
                <span className="text-github-muted text-xs">关注</span>
                {followedCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-github-purple text-white">
                    {followedCount}
                  </span>
                )}
                {/* Notification dot for new projects */}
                {newProjectsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs rounded-full bg-red-500 text-white">
                    {newProjectsCount > 9 ? '9+' : newProjectsCount}
                  </span>
                )}
              </button>
            )}

            {/* Fork History Button - hide on mobile */}
            {onShowHistory && (
              <button
                onClick={onShowHistory}
                className="hide-mobile flex items-center gap-2 px-3 py-2 bg-github-card border border-github-border rounded hover:border-github-purple/50 transition-colors"
              >
                <span>📋</span>
                <span className="text-github-muted text-xs">历史</span>
                {forkHistoryCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-github-purple text-white">
                    {forkHistoryCount}
                  </span>
                )}
              </button>
            )}

            {/* Topic Tracking Button - hide on mobile */}
            {onShowTopicTracking && (
              <button
                onClick={onShowTopicTracking}
                className="hide-mobile flex items-center gap-2 px-3 py-2 bg-github-card border border-github-border rounded hover:border-github-purple/50 transition-colors"
              >
                <span>🏷</span>
                <span className="text-github-muted text-xs">话题</span>
              </button>
            )}

            {/* Reports Button - hide on mobile */}
            {onShowReports && (
              <button
                onClick={onShowReports}
                className="hide-mobile flex items-center gap-2 px-3 py-2 bg-github-card border border-github-border rounded hover:border-github-purple/50 transition-colors"
              >
                <span>📊</span>
                <span className="text-github-muted text-xs">报告</span>
              </button>
            )}

            {/* Recommendations Button - hide on mobile */}
            {onShowRecommendations && (
              <button
                onClick={onShowRecommendations}
                className="hide-mobile flex items-center gap-2 px-3 py-2 bg-github-card border border-github-border rounded hover:border-github-purple/50 transition-colors"
              >
                <span>🎯</span>
                <span className="text-github-muted text-xs">推荐</span>
              </button>
            )}

            {/* Notification Center Button - hide on mobile */}
            {onShowNotificationCenter && (
              <button
                onClick={onShowNotificationCenter}
                className="hide-mobile flex items-center gap-2 px-3 py-2 bg-github-card border border-github-border rounded hover:border-github-purple/50 transition-colors relative"
              >
                <span>🔔</span>
                <span className="text-github-muted text-xs">通知</span>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs rounded-full bg-red-500 text-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
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
        <Settings
          onClose={() => setShowSettings(false)}
          onUserChange={onGhUserChange}
          forkHistoryCount={forkHistoryCount}
          onForkHistorySync={onForkHistorySync}
        />
      )}
    </>
  );
}
