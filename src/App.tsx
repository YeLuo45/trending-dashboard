import { useState, useEffect } from 'react';
import { Header, TabButton, ProjectList } from './components';
import { loadTrendingFromFiles, loadSampleData } from './utils/loadData';
import type { TrendingData } from './types';
import type { GhUser } from './types';
import { getGhToken, forkRepo, parseRepoInfo } from './utils/github';

function App() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ghUser, setGhUser] = useState<GhUser | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [batchForking, setBatchForking] = useState(false);
  const [batchResults, setBatchResults] = useState<{ name: string; success: boolean; url?: string; error?: string }[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const trendingData = await loadTrendingFromFiles();
        setData(trendingData);
      } catch (error) {
        console.error('Failed to load data:', error);
        setData(loadSampleData());
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleToggleSelect = (name: string) => {
    setSelectedProjects(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!data) return;
    const projects = activeTab === 'weekly' ? data.weekly : data.monthly;
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map(p => p.name)));
    }
  };

  const handleBatchFork = async () => {
    const token = getGhToken();
    if (!token) {
      setBatchResults([{ name: 'all', success: false, error: '请先在设置中配置 GitHub Token' }]);
      return;
    }
    if (selectedProjects.size === 0) return;

    const projects = activeTab === 'weekly' ? data!.weekly : data!.monthly;
    const selected = projects.filter(p => selectedProjects.has(p.name));

    setBatchForking(true);
    setBatchResults([]);

    const results: typeof batchResults = [];
    for (const project of selected) {
      const info = parseRepoInfo(project.link);
      if (!info) {
        results.push({ name: project.name, success: false, error: '无法解析仓库信息' });
        continue;
      }
      const result = await forkRepo(info.owner, info.repo, token);
      results.push({ name: project.name, ...result });
      if (result.success && result.url) {
        window.open(result.url, '_blank');
      }
      await new Promise(r => setTimeout(r, 500));
    }

    setBatchForking(false);
    setBatchResults(results);
    setSelectedProjects(new Set());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-github-dark">
        <div className="text-github-purple text-lg">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-github-dark">
        <div className="text-github-muted">暂无数据</div>
      </div>
    );
  }

  const projects = activeTab === 'weekly' ? data.weekly : data.monthly;

  return (
    <div className="min-h-screen bg-github-dark">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Header lastUpdated={data.lastUpdated} ghUser={ghUser} onGhUserChange={setGhUser} />

        {/* Tabs */}
        <div className="flex border-b border-github-border mb-4">
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
        </div>

        {/* Batch Fork Bar */}
        <div className="mb-6 p-4 bg-github-card border border-github-border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-github-purple hover:underline"
              >
                {selectedProjects.size === projects.length ? '取消全选' : '全选'}
              </button>
              <span className="text-github-muted text-sm">
                已选择 <span className="text-github-purple font-medium">{selectedProjects.size}</span> 个项目
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchFork}
                disabled={selectedProjects.size === 0 || batchForking}
                className="px-4 py-2 text-sm rounded bg-github-purple text-white hover:bg-github-purple/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {batchForking ? '批量 Forking...' : `⎈ 批量 Fork (${selectedProjects.size})`}
              </button>
            </div>
          </div>

          {/* Batch Results */}
          {batchResults.length > 0 && (
            <div className="mt-3 pt-3 border-t border-github-border">
              <div className="flex flex-wrap gap-2">
                {batchResults.map((r, i) => (
                  <span key={i} className={`text-xs px-2 py-1 rounded ${
                    r.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {r.name.split('/')[1] || r.name}: {r.success ? '✓' : '✗'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <ProjectList
          projects={projects}
          type={activeTab}
          selectedProjects={selectedProjects}
          onToggleSelect={handleToggleSelect}
        />
      </div>
    </div>
  );
}

export default App;
