# GitHub Trending UI Redesign & Mobile Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 彻底重构 GitHub Trending 趋势看板的 UI 视觉品味（采用高阶靛蓝 + 深暗锌灰微透毛玻璃 + Monospace精密等宽指标），并全新适配一套触控极佳、单手可驭的移动端悬浮底座 (Mobile Bottom Dock) 与半屏弹性抽屉 (Bottom Sheets)。

**Architecture:** 
- **基础主题层 (Theme & Tailwind)**：升级 `src/index.css`，采用深邃真暗背景 (`#09090b`) 并使用微高光边缘毛玻璃材质。
- **精密组件层 (Components Polish)**：ProjectCard、Header 与 Tab 彻底重构：卡片转为无框悬浮态，数值对齐为等宽字体，悬浮/按压绑定物理弹簧曲线。
- **移动端多维底座 (Mobile Floating Bottom Dock & Drawer)**：彻底用常驻的 Floating Bottom Bar 与优雅划出的 Bottom Sheet 弹性半屏抽屉，代替粗暴的 ☰ 菜单和大量的桌面按钮隐藏。

**Tech Stack:** React 19, Vite 8, Tailwind CSS v4, HTML5 Semantic Elements.

---

### Task 1: Theme and Style Core Setup (主题与全局样式升级)

**Files:**
- Modify: `projects/trending-dashboard/src/index.css`
- Verify: 执行编译与热更新审查。

- [ ] **Step 1: 升级 `@theme` 变量与全局背景，声明高阶极简色彩方案**

在 `src/index.css` 中重定义系统主题色。将 `github-dark`、`github-card`、`github-border` 和 `github-purple` 彻底重标定为高品质暗色和靛蓝色系统。代码实现：

```css
@import "tailwindcss";

@theme {
  /* Dark theme (default) - 标定为极致深邃的 Zinc-950 系统 */
  --color-github-dark: #09090b;
  --color-github-card: rgba(18, 18, 22, 0.45);
  --color-github-border: rgba(255, 255, 255, 0.05);
  --color-github-text: #f4f4f5;
  --color-github-muted: #a1a1aa;
  --color-github-green: #10b981;
  --color-github-purple: #6366f1; /* Digital Indigo 点缀 */
  --color-github-orange: #f59e0b;
  --color-github-blue: #3b82f6;

  /* 极致高光微透材质 */
  --backdrop-blur-glass: blur(16px);
}

/* Light theme overrides - 标定为温暖纸张灰系统 */
.light {
  --color-github-dark: #f9f9fb;
  --color-github-card: rgba(255, 255, 255, 0.8);
  --color-github-border: rgba(9, 9, 11, 0.06);
  --color-github-text: #18181b;
  --color-github-muted: #71717a;
  --color-github-green: #059669;
  --color-github-purple: #4f46e5;
  --color-github-orange: #d97706;
  --color-github-blue: #2563eb;
}

.light body {
  background-color: #f9f9fb;
  color: #18181b;
}

.dark body {
  background-color: #09090b;
  color: #f4f4f5;
}
```

- [ ] **Step 2: 注入高阶透光卡片与微高光边缘 CSS 样式**

在 `src/index.css` 尾部，追加现代微弱高光边框和毛玻璃卡片样式，并完善自定义等宽数字字距规范。追加代码：

```css
/* Premium Glassmorphism Panel Edge Approximation */
.glass-panel {
  background: var(--color-github-card);
  backdrop-filter: var(--backdrop-blur-glass);
  -webkit-backdrop-filter: var(--backdrop-blur-glass);
  border: 1px solid var(--color-github-border);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 8px 32px rgba(0, 0, 0, 0.24);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.light .glass-panel {
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 8px 32px rgba(9, 9, 11, 0.04);
}

/* Tabular Mono numbers for metrics alignment */
.font-mono-tabular {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* Hide scrollbar but keep functional for mobile sheet */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

- [ ] **Step 3: 运行 `npm run build` 确保无 PostCSS 或 CSS 语法错误**

执行构建命令，验证 CSS 文件编译通过：
`npm run build`
Expected: Compile PASS.

---

### Task 2: Polish TabButton with Sleek Slider Indicator (微小标签及状态过度升级)

**Files:**
- Modify: `projects/trending-dashboard/src/components/TabButton.tsx`

- [ ] **Step 1: 升级 TabButton 的字体和指示条过渡，确保完全无 AI Lila 紫色**

重构 `TabButton.tsx` 的选中状态和样式，将其改为精致的无框毛玻璃内缩风格。代码实现：

```tsx
interface TabButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

export function TabButton({ active, label, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
        active
          ? 'bg-github-purple/10 text-github-purple border border-github-purple/20'
          : 'border border-transparent text-github-muted hover:text-github-text hover:bg-github-card/40'
      }`}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: 页面效果审查**
检查控制台，保证热更新无任何类型错误。

---

### Task 3: Polish ProjectCard with Precision Monospace Metrics (精密项目卡片升级)

**Files:**
- Modify: `projects/trending-dashboard/src/components/ProjectCard.tsx`

- [ ] **Step 1: 升级 ProjectCard 的容器、物理按压动效、等宽数字指标**

彻底重构卡片布局：
1. 采用 `.glass-panel` 代替老式的卡片外框样式。
2. 将 Rank 排名、Stars、Forks 以及 Growth 改用等宽数字字体 `.font-mono-tabular`。
3. 对卡片绑定点击按压的回弹效果。
4. 全站禁用 Em-dash 字符。

代码实现（完整替换 `ProjectCard` 组件返回值）：

```tsx
// ... 前期 imports 与 State 初始化保持原样 ...

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

          {/* Description - max length check */}
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
```

- [ ] **Step 2: 实机数据样式测试**
刷新页面，审查所有项目卡片圆角是 `rounded-2xl`，数字指标（例如 3,850 等）已切换至等宽排版。

---

### Task 4: Create Mobile-First Bottom Floating Dock & Half-Screen Bottom Sheets (移动端多维悬浮底栏与半屏抽屉)

**Files:**
- Create: `projects/trending-dashboard/src/components/MobileBottomDock.tsx`
- Modify: `projects/trending-dashboard/src/components/index.ts` (导出此新组件)

- [ ] **Step 1: 新建并编写 `MobileBottomDock.tsx` 代码**

设计极富质感、带有安全区高度保障的悬浮 Dock 以及底部半屏弹性 Sheet 逻辑：

```tsx
import { useEffect, useRef, type ReactNode } from 'react';

// Common Half-Screen Bottom Sheet Component for Mobile
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 md:hidden animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-github-dark/95 border-t border-github-border rounded-t-2xl overflow-y-auto no-scrollbar animate-slide-up flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ 
          background: 'rgba(9, 9, 11, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        {/* Handle line */}
        <div className="sticky top-0 bg-transparent py-3 flex flex-col items-center border-b border-github-border/30">
          <div className="w-12 h-1 bg-github-muted/30 rounded-full mb-1" />
          <div className="w-full px-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-github-text">{title}</h3>
            <button
              onClick={onClose}
              className="text-github-muted hover:text-github-text text-xl p-1"
            >
              &times;
            </button>
          </div>
        </div>
        <div className="p-4 pb-12 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// Mobile Floating Bottom Dock (常驻悬浮底座)
interface DockItem {
  icon: string;
  label: string;
  badge?: number;
  onClick: () => void;
  active?: boolean;
}

interface MobileBottomDockProps {
  items: DockItem[];
}

export function MobileBottomDock({ items }: MobileBottomDockProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden flex justify-center">
      <div 
        className="flex items-center justify-around w-full max-w-md px-4 py-2 rounded-full border border-white/5 shadow-2xl"
        style={{
          background: 'rgba(18, 18, 22, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)'
        }}
      >
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-full transition-all cursor-pointer active:scale-90"
            style={{ minHeight: '48px', minWidth: '48px' }}
          >
            <span className={`text-xl transition-transform ${item.active ? 'scale-110 text-github-purple' : 'text-github-muted'}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-medium transition-colors ${item.active ? 'text-github-purple' : 'text-github-muted'}`}>
              {item.label}
            </span>
            
            {/* Unread badge */}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute top-0 right-2 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold rounded-full bg-github-purple text-white shadow-md">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 在 `src/components/index.ts` 中导出新创建的 MobileBottomDock 与 BottomSheet**

添加导出至 `src/components/index.ts`。

---

### Task 5: Streamline and Refactor Header Component (头部的极简聚合)

**Files:**
- Modify: `projects/trending-dashboard/src/components/Header.tsx`

- [ ] **Step 1: 桌面端深度精简，将 6 个图标按钮聚合到“AI 分析套件”下拉中**

重构 `Header.tsx` 逻辑：
1. 桌面端去除堆叠的 6 个单列按钮，改用一个优雅、轻盈的 **智能极客套件 (Intellect Kit)** 下拉浮窗菜单。
2. 清理移动端的旧元素。
3. 对齐 Sentence-case、紧收字间距（`tracking-tight`）。

代码实现：

```tsx
import { useState, useEffect, useRef } from 'react';
import type { GhUser } from '../types';
import { getGhToken, fetchGhUser } from '../utils/github';
import { Settings } from './Settings';
import { getFavorites, getFollowedAuthors, getNewProjectsFromFollowedAuthors, getUnreadNotificationCount } from '../utils/social';
import type { TrendingProject } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';

// ... HeaderProps 接口维持不变 ...

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

  useEffect(() => {
    setFavoritesCount(getFavorites().length);
    setFollowedCount(getFollowedAuthors().length);

    if (projects.length > 0) {
      const newProjects = getNewProjectsFromFollowedAuthors(projects);
      const totalNew = newProjects.reduce((sum, a) => sum + a.projects.length, 0);
      setNewProjectsCount(totalNew);
    }

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
                <p className="text-github-muted text-[10px] uppercase tracking-wider">最后更新</p>
                <p className="text-github-purple text-xs font-mono font-bold">{lastUpdated}</p>
              </div>
            )}

            {/* Quick toggles */}
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
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
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
                  <p className="text-[10px] text-github-muted font-bold uppercase tracking-wider px-3 py-1.5 border-b border-github-border/20 mb-1">功能聚合</p>
                  
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
                      {newProjectsCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
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
```

---

### Task 6: Connect App.tsx with Unified Mobile Dock and Bottom Sheet (骨架与底座整合)

**Files:**
- Modify: `projects/trending-dashboard/src/App.tsx`

- [ ] **Step 1: 在 `App.tsx` 中集成 MobileBottomDock 与自适应 Bottom Sheet，移除冗余的 MobileNavDrawer**

1. 引入新组件 `MobileBottomDock` 与 `BottomSheet`。
2. 设计移动端专用的筛选 Bottom Sheet。
3. 整合底部 Dock items：
   - Feed (每周最热，控制 TabButton)
   - Filter (弹出筛选 Bottom Sheet)
   - Favorites (直接滑入 Favorites)
   - More (打开更多选项：历史、话题、报告、推荐等)
4. 将原本的 Favorites 抽屉、设置、历史记录在移动端转化为通过 `BottomSheet` 组件呈装。

代码实现（精简和升级核心返回骨架）：

```tsx
// ... imports ...
import { Header, TabButton, ProjectList, AdvancedFilterBar, applyFilters, TopicTrendingView, ExportPanel, ErrorBoundary, FullPageSkeleton, SharePoster, NotificationCenter, MobileBottomDock, BottomSheet } from './components';

// ... App() 初始化及 State 保持不变 ...

  // 移动端专用 Tab 控制 Bottom Sheet 与 Bottom Dock items 组装
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);

  const mobileDockItems = [
    {
      icon: '📊',
      label: '每周趋势',
      active: activeTab === 'weekly' && viewMode === 'list',
      onClick: () => { setActiveTab('weekly'); setViewMode('list'); }
    },
    {
      icon: '⚡',
      label: '今日增长',
      active: activeTab === 'daily' && viewMode === 'list',
      onClick: () => { setActiveTab('daily'); setViewMode('list'); }
    },
    {
      icon: '🔍',
      label: '筛选',
      active: showMobileFilter,
      onClick: () => setShowMobileFilter(true)
    },
    {
      icon: '⭐',
      label: '我的收藏',
      badge: favoritesCount,
      onClick: () => setShowFavorites(true)
    },
    {
      icon: '🪄',
      label: '更多分析',
      onClick: () => setShowMobileMore(true)
    }
  ];

  // ... 渲染核心骨架 ...
  return (
    <>
      {loading ? (
        <FullPageSkeleton />
      ) : (
        <ErrorBoundary>
          <div className="min-h-screen bg-github-dark pb-24 md:pb-8"> {/* 底部预留 24 像素保证 Floating Dock 呼吸 */}
            <div className="max-w-4xl mx-auto px-4 py-8">
              <Header
                lastUpdated={safeData.lastUpdated}
                ghUser={ghUser}
                onGhUserChange={setGhUser}
                forkHistoryCount={forkHistory.length}
                onForkHistorySync={setForkHistory}
                onShowHistory={() => setShowHistory(true)}
                projects={[...safeData.weekly, ...safeData.monthly, ...(safeData.daily || [])]}
                onShowFavorites={() => setShowFavorites(true)}
                onShowFollowedAuthors={() => setShowFollowedAuthors(true)}
                onShowRecommendations={() => setShowRecommendations(true)}
                onShowTopicTracking={() => setShowTopicTracking(true)}
                onShowReports={() => setShowReports(true)}
                onShowNotificationCenter={() => setShowNotificationCenter(true)}
                onShowExport={() => setShowExport(true)}
              />

              {/* Tabs Section - Desktop and Table View */}
              <div className="flex items-center justify-between border-b border-github-border/10 mb-6 pb-2 hide-mobile">
                <div className="flex gap-2">
                  <TabButton
                    active={activeTab === 'weekly'}
                    label="📈 本周增长"
                    onClick={() => setActiveTab('weekly')}
                  />
                  <TabButton
                    active={activeTab === 'monthly'}
                    label="🔥 本月最热"
                    onClick={() => setActiveTab('monthly')}
                  />
                  <TabButton
                    active={activeTab === 'daily'}
                    label="⚡ 今日趋势"
                    onClick={() => setActiveTab('daily')}
                  />
                  <TabButton
                    active={activeTab === 'forked'}
                    label="📦 Repositories"
                    onClick={() => setActiveTab('forked')}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-github-purple/15 text-github-purple border border-github-purple/30'
                        : 'text-github-muted hover:text-github-text'
                    }`}
                  >
                    📋 列表
                  </button>
                  <button
                    onClick={() => setViewMode('topic')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'topic'
                        ? 'bg-github-purple/15 text-github-purple border border-github-purple/30'
                        : 'text-github-muted hover:text-github-text'
                    }`}
                  >
                    🏷 话题趋势
                  </button>
                </div>
              </div>

              {/* Advanced Filter Bar - Desktop Only */}
              <div className="hide-mobile">
                <AdvancedFilterBar
                  projects={allProjects}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>

              {/* Batch Fork Bar - Sleek minimal styling */}
              <div className="mb-6 p-4 glass-panel rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm font-semibold text-github-purple hover:underline"
                    >
                      {selectedProjects.size === filteredProjects.length ? '取消全选' : '全选'}
                    </button>
                    <span className="text-github-muted text-sm font-mono-tabular">
                      已选择 <span className="text-github-purple font-bold">{selectedProjects.size}</span> 个项目
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleShareSelected}
                      disabled={selectedProjects.size === 0}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-github-dark border border-github-border/60 text-github-text hover:border-github-purple/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      🔗 分享列表
                    </button>
                    {selectedProjects.size > 0 && (
                      <button
                        onClick={() => {
                          const allProjects = [
                            ...(data?.weekly || []),
                            ...(data?.monthly || []),
                            ...(data?.daily || []),
                          ];
                          const selected = allProjects.filter(p => selectedProjects.has(p.name));
                          const favorites = getFavorites();
                          const posterProjects = selected.map(p => {
                            const existing = favorites.find(f => f.name === p.name);
                            return {
                              name: p.name,
                              link: p.link,
                              description: p.description,
                              starredAt: existing?.starredAt || new Date().toLocaleString(),
                            };
                          });
                          setSharePosterProjects(posterProjects);
                        }}
                        className="px-4 py-2 text-xs font-bold rounded-lg bg-github-dark border border-github-border/60 text-github-text hover:border-github-purple/50 transition-all cursor-pointer"
                      >
                        🖼️ 生成海报
                      </button>
                    )}
                    <button
                      onClick={handleBatchFork}
                      disabled={selectedProjects.size === 0 || batchForking}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-github-purple text-white hover:bg-github-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {batchForking ? '批量 Forking...' : `⎈ 批量 Fork (${selectedProjects.size})`}
                    </button>
                  </div>
                </div>

                {/* Batch Results */}
                {batchResults.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-github-border/10">
                    <div className="flex flex-wrap gap-2">
                      {batchResults.map((r, i) => (
                        <span key={i} className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                          r.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {r.name.split('/')[1] || r.name}: {r.success ? '✓' : '✗'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Core Content Feed */}
              {activeTab === 'forked' ? (
                <Suspense fallback={<div className="text-github-text text-center py-12">加载中...</div>}>
                  <ForkedProjectsPanel ghUser={ghUser} initialUsername={forkedUsername} />
                </Suspense>
              ) : viewMode === 'list' ? (
                <ProjectList
                  projects={filteredProjects}
                  type={activeTab}
                  selectedProjects={selectedProjects}
                  onToggleSelect={handleToggleSelect}
                  onFavoritesChange={handleFavoritesChange}
                  onShowComments={(projectName) => setCommentsProject(projectName)}
                  highlightKeyword={filters.keyword}
                />
              ) : (
                <TopicTrendingView
                  projects={filteredProjects}
                  selectedProjects={selectedProjects}
                  onToggleSelect={handleToggleSelect}
                  onFavoritesChange={handleFavoritesChange}
                  onShowComments={(projectName) => setCommentsProject(projectName)}
                />
              )}
            </div>

            {/* Mobile Bottom Navigation Dock */}
            <MobileBottomDock items={mobileDockItems} />

            {/* Mobile Bottom Sheets (筛选/功能汇总) */}
            <BottomSheet
              isOpen={showMobileFilter}
              onClose={() => setShowMobileFilter(false)}
              title="高级筛选过滤器"
            >
              <AdvancedFilterBar
                projects={allProjects}
                filters={filters}
                onFiltersChange={setFilters}
              />
            </BottomSheet>

            <BottomSheet
              isOpen={showMobileMore}
              onClose={() => setShowMobileMore(false)}
              title="极客智能分析套件"
            >
              <div className="grid grid-cols-2 gap-3 pb-8">
                <button
                  onClick={() => { setShowMobileMore(false); setShowHistory(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800"
                >
                  <span className="text-2xl mb-1">📋</span>
                  <span className="text-xs font-semibold text-github-text">Fork 历史</span>
                  <span className="text-[10px] text-github-muted mt-1">{forkHistory.length} 项记录</span>
                </button>
                <button
                  onClick={() => { setShowMobileMore(false); setShowTopicTracking(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800"
                >
                  <span className="text-2xl mb-1">🏷</span>
                  <span className="text-xs font-semibold text-github-text">话题追踪</span>
                </button>
                <button
                  onClick={() => { setShowMobileMore(false); setShowReports(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800"
                >
                  <span className="text-2xl mb-1">📊</span>
                  <span className="text-xs font-semibold text-github-text">报告中心</span>
                </button>
                <button
                  onClick={() => { setShowMobileMore(false); setShowRecommendations(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800"
                >
                  <span className="text-2xl mb-1">🎯</span>
                  <span className="text-xs font-semibold text-github-text">智能推荐</span>
                </button>
                <button
                  onClick={() => { setShowMobileMore(false); setShowNotificationCenter(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800"
                >
                  <span className="text-2xl mb-1">🔔</span>
                  <span className="text-xs font-semibold text-github-text">通知中心</span>
                  {unreadNotifications > 0 && <span className="text-[9px] bg-red-500 text-white px-1.5 rounded-full mt-1">{unreadNotifications} 未读</span>}
                </button>
                <button
                  onClick={() => { setShowMobileMore(false); setShowExport(true); }}
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 animate-pulse"
                >
                  <span className="text-2xl mb-1">📥</span>
                  <span className="text-xs font-semibold text-github-text">导出数据</span>
                </button>
              </div>
            </BottomSheet>

            {/* Desktop Full-Screen Modals & Popups remain unchanged (Favorites, Reports, Comments, etc.) ... */}
```

---

### Task 7: Run Final Verification and Lint Check (最终检验与样式校验)

**Files:**
- Verify: 全站测试。

- [ ] **Step 1: 检查全站编译，排除任何 TypeScript/Eslint 冲突与死循环错误**

运行：
`npm run build`
Expected: Compile PASS.

- [ ] **Step 2: 自我审计 Em-dash 及 LILA 紫色遗留物**

在 `projects/trending-dashboard` 项目中全局进行正则检索，排除任何可见 `—` 元素和 `bg-github-purple` 之外的野杂渐变色。

---
