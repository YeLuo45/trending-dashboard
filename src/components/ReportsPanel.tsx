import { useState, useEffect } from 'react';
import type { Report, TrendingProject } from '../types';
import {
  getReports,
  deleteReport,
  generateDailyReport,
  generateWeeklyReport,
  shouldGenerateReport,
} from '../utils/reports';

interface ReportsPanelProps {
  weeklyProjects: TrendingProject[];
  dailyProjects: TrendingProject[];
  onClose: () => void;
}

export function ReportsPanel({ weeklyProjects, dailyProjects, onClose }: ReportsPanelProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [generating, setGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState<Report | null>(null);

  useEffect(() => {
    setReports(getReports());
  }, []);

  const handleGenerateDaily = () => {
    setGenerating(true);
    const report = generateDailyReport(dailyProjects, weeklyProjects);
    const saved = { ...report, id: `daily_${Date.now()}` };
    // save manually since generateDailyReport already saves
    const existing = getReports();
    if (!existing.some(r => r.type === 'daily' && r.periodStart === saved.periodStart)) {
      existing.unshift(saved);
      localStorage.setItem('trend_reports', JSON.stringify(existing.slice(0, 30)));
    }
    setReports(getReports());
    setGenerating(false);
  };

  const handleGenerateWeekly = () => {
    setGenerating(true);
    const report = generateWeeklyReport(weeklyProjects, dailyProjects);
    const saved = { ...report, id: `weekly_${Date.now()}` };
    const existing = getReports();
    if (!existing.some(r => r.type === 'weekly' && r.periodStart === saved.periodStart)) {
      existing.unshift(saved);
      localStorage.setItem('trend_reports', JSON.stringify(existing.slice(0, 30)));
    }
    setReports(getReports());
    setGenerating(false);
  };

  const handleDelete = (id: string) => {
    deleteReport(id);
    setReports(getReports());
    setActiveReport(null);
  };

  const canGenerateDaily = shouldGenerateReport('daily');
  const canGenerateWeekly = shouldGenerateReport('weekly');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-github-card border border-github-border rounded-lg w-[800px] max-w-[90vw] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-github-border">
          <h2 className="text-xl font-semibold text-github-text flex items-center gap-2">
            📊 趋势报告
          </h2>
          <button
            onClick={onClose}
            className="text-github-muted hover:text-github-text text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Generate Buttons */}
        <div className="flex gap-3 p-4 border-b border-github-border">
          <button
            onClick={handleGenerateDaily}
            disabled={generating || !canGenerateDaily}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-github-dark border border-github-border rounded hover:border-github-purple/50 disabled:opacity-40 transition-colors"
          >
            <span className="text-lg">📅</span>
            <div className="text-left">
              <div className="text-sm text-github-text font-medium">生成日报</div>
              <div className="text-xs text-github-muted">今日趋势汇总</div>
            </div>
            {!canGenerateDaily && (
              <span className="text-xs text-github-muted ml-2">今日已生成</span>
            )}
          </button>

          <button
            onClick={handleGenerateWeekly}
            disabled={generating || !canGenerateWeekly}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-github-dark border border-github-border rounded hover:border-github-purple/50 disabled:opacity-40 transition-colors"
          >
            <span className="text-lg">📆</span>
            <div className="text-left">
              <div className="text-sm text-github-text font-medium">生成周报</div>
              <div className="text-xs text-github-muted">本周趋势汇总</div>
            </div>
            {!canGenerateWeekly && (
              <span className="text-xs text-github-muted ml-2">本周已生成</span>
            )}
          </button>
        </div>

        {/* Reports List + Detail */}
        <div className="flex flex-1 overflow-hidden">
          {/* Report List */}
          <div className="w-1/3 border-r border-github-border overflow-auto">
            {reports.length === 0 ? (
              <div className="p-4 text-center text-github-muted text-sm">
                暂无报告
              </div>
            ) : (
              <div className="divide-y divide-github-border">
                {reports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => setActiveReport(report)}
                    className={`w-full text-left p-3 hover:bg-github-dark/50 transition-colors ${
                      activeReport?.id === report.id ? 'bg-github-dark/70' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{report.type === 'daily' ? '📅' : '📆'}</span>
                      <span className="text-sm text-github-text font-medium truncate">
                        {report.title}
                      </span>
                    </div>
                    <div className="text-xs text-github-muted mt-1">
                      {report.createdAt}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Report Detail */}
          <div className="flex-1 overflow-auto p-4">
            {activeReport ? (
              <ReportDetail report={activeReport} onDelete={handleDelete} />
            ) : (
              <div className="flex items-center justify-center h-full text-github-muted text-sm">
                选择一份报告查看详情
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReportDetailProps {
  report: Report;
  onDelete: (id: string) => void;
}

function ReportDetail({ report, onDelete }: ReportDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-github-text">{report.title}</h3>
          <button
            onClick={() => onDelete(report.id)}
            className="text-github-muted hover:text-red-400 text-sm"
          >
            🗑 删除
          </button>
        </div>
        <p className="text-github-muted text-sm">{report.summary}</p>
        <p className="text-github-muted text-xs mt-1">
          周期: {report.periodStart} ~ {report.periodEnd}
        </p>
      </div>

      {/* Top Projects */}
      <div>
        <h4 className="text-github-text font-medium mb-2 flex items-center gap-2">
          🏆 热门项目 Top {report.topProjects.length}
        </h4>
        <div className="space-y-2">
          {report.topProjects.slice(0, 5).map((project, i) => (
            <a
              key={project.name}
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 bg-github-dark rounded hover:bg-github-dark/80 transition-colors"
            >
              <span className={`w-6 text-center text-sm font-bold ${
                i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-github-muted'
              }`}>
                #{i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-github-purple text-sm font-medium truncate">{project.name}</div>
                <div className="text-github-muted text-xs">⬆ {project.growth} · ⭐ {project.totalStars}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Rising Projects */}
      {report.risingProjects.length > 0 && (
        <div>
          <h4 className="text-github-text font-medium mb-2 flex items-center gap-2">
            🔥 国星预测 ({report.risingProjects.length})
          </h4>
          <div className="space-y-2">
            {report.risingProjects.map(project => (
              <a
                key={project.name}
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 bg-red-500/5 border border-red-500/20 rounded hover:bg-red-500/10 transition-colors"
              >
                <span className="text-red-400">🔥</span>
                <div className="flex-1 min-w-0">
                  <div className="text-github-purple text-sm font-medium truncate">{project.name}</div>
                  <div className="text-github-muted text-xs">⬆ {project.growth} · ⭐ {project.totalStars}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Topic Summary */}
      {report.topicSummaries.length > 0 && (
        <div>
          <h4 className="text-github-text font-medium mb-2">📊 话题分布</h4>
          <div className="flex flex-wrap gap-2">
            {report.topicSummaries.map(ts => (
              <span
                key={ts.topic}
                className="px-2 py-1 rounded text-xs bg-github-dark text-github-muted"
              >
                {ts.topic} ({ts.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}