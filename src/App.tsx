import { useState, useEffect } from 'react';
import { Header, TabButton, ProjectList } from './components';
import { loadTrendingFromFiles, loadSampleData } from './utils/loadData';
import type { TrendingData } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-github-dark">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Header lastUpdated={data.lastUpdated} />
        
        {/* Tabs */}
        <div className="flex border-b border-github-border mb-8">
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
        
        {/* Content */}
        <ProjectList
          projects={activeTab === 'weekly' ? data.weekly : data.monthly}
          type={activeTab}
        />
      </div>
    </div>
  );
}

export default App;
