import { useState, useEffect, useRef } from 'react';
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
  onShowExport,
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [followedCount, setFollowedCount] = useState(0);
  const [newProjectsCount, setNewProjectsCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Click outside to close dropdown
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMenuDropdown(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  return (
    <>
      <header className="mb-8 border-b border-github-border/10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-github-text tracking-tight mb-1">
              GitHub Trending
            </h1>
            <p className="text-github-muted text-xs md:text-sm font-medium">
              极客深度科技风向标报告
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Last updated - desktop only */}
            {lastUpdated && (
              <div className="text-right hide-mobile">
                <p className="text-github-muted text-[9px] uppercase tracking-wider font-bold">最后更新</p>
                <p className="text-github-purple text-xs font-mono font-extrabold">{lastUpdated}</p>
              </div>
            )}

            {/* Quick toggles - desktop only */}
            <div className="hide-mobile flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>

            {/* Aggregated Geek Kit Dropdown Menu - Desktop only */}
            <div className="relative hide-mobile" ref={dropdownRef}>
              <button
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                className={`flex items-center gap-1.5 px-3 py-2 bg-github-card border rounded-lg transition-colors cursor-pointer ${
                  showMenuDropdown 
                    ? 'border-github-purple text-github-purple' 
                    : 'border-github-border hover:border-github-purple/50'
                }`}
                style={{ minHeight: '38px' }}
              >
                <span>🛠️</span>
                <span className="text-github-text text-xs font-semibold">分析套件</span>
                {newProjectsCount + unreadNotifications > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                )}
                <span className="text-[10px] opacity-60">▼</span>
              </button>

              {showMenuDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-white/5 z-50 p-2 shadow-2xl animate-fade-in"
                  style={{
                    background: 'rgba(18, 18, 22, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <p className="text-[9px] text-github-muted font-bold uppercase tracking-wider px-3 py-1.5 border-b border-github-border/20 mb-1">功能聚合</p>
                  
                  {onShowFavorites && (
                    <button
                      onClick={() => { onShowFavorites(); setShowMenuDropdown(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-github-text hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span>⭐</span>
                      <span className="flex-1">收藏夹</span>
                      {favoritesCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-github-purple/20 text-github-purple text-[10px] font-bold">{favoritesCount}</span>}
                    </button>
                  )}

                  {onShowFollowedAuthors && (
                    <button
                      onClick={() => { onShowFollowedAuthors(); setShowMenuDropdown(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-github-text hover:bg-white/5 transition-colors cursor-pointer relative"
                    >
                      <span>👁</span>
                      <span className="flex-1">关注作者</span>
                      {followedCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-github-purple/20 text-github-purple text-[10px] font-bold">{followedCount}</span>}
                      {newProjectsCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                    </button>
                  )}

                  {onShowHistory && (
                    <button
                      onClick={() => { onShowHistory(); setShowMenuDropdown(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-github-text hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span>📋</span>
                      <span className="flex-1">Fork 历史</span>
                      {forkHistoryCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-github-purple/20 text-github-purple text-[10px] font-bold">{forkHistoryCount}</span>}
                    </button>
                  )}

                  {onShowTopicTracking && (
                    <button
                      onClick={() => { onShowTopicTracking(); setShowMenuDropdown(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-github-text hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span>🏷</span>
                      <span className="flex-1">话题追踪</span>
                    </button>
                  )}

                  {onShowReports && (
                    <button
                      onClick={() => { onShowReports(); setShowMenuDropdown(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-github-text hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span>📊</span>
                      <span className="flex-1">报告中心</span>
                    </button>
                  )}

                  {onShowRecommendations && (
                    <button
                      onClick={() => { onShowRecommendations(); setShowMenuDropdown(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-github-text hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span>🎯</span>
                      <span className="flex-1">智能推荐</span>
                    </button>
                  )}

                  {onShowNotificationCenter && (
                    <button
                      onClick={() => { onShowNotificationCenter(); setShowMenuDropdown(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs text-github-text hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span>🔔</span>
                      <span className="flex-1">通知中心</span>
                      {unreadNotifications > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">{unreadNotifications}</span>}
                    </button>
                  )}

                  {onShowExport && (
                    <button
                      onClick={() => { onShowExport(); setShowMenuDropdown(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 border-t border-github-border/20 mt-1.5 rounded-lg text-left text-xs text-github-text hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span>📥</span>
                      <span className="flex-1">导出数据</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Global Settings / Profile Avatar */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-2 bg-github-card border border-github-border rounded-lg hover:border-github-purple/50 transition-colors cursor-pointer"
              style={{ minHeight: '38px' }}
            >
              <span>⚙️</span>
              {ghUser ? (
                <img src={ghUser.avatar_url} alt={ghUser.login} className="w-5 h-5 rounded-full" />
              ) : (
                <span className="text-github-muted text-xs hide-mobile font-semibold">未连接</span>
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
