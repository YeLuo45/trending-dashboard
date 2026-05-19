import { useState, useEffect } from 'react';
import type { TrackedTopic, TrendingProject } from '../types';
import {
  getTrackedTopics,
  addTrackedTopic,
  removeTrackedTopic,
  isTopicTracked,
} from '../utils/reports';
import { getTopTags } from '../utils/recommendations';

interface TopicTrackingPanelProps {
  allProjects: TrendingProject[];
  onClose: () => void;
  onShowRecommendations: () => void;
}

export function TopicTrackingPanel({ allProjects, onClose, onShowRecommendations }: TopicTrackingPanelProps) {
  return <TopicTrackingPanelInner allProjects={allProjects} onClose={onClose} onShowRecommendations={onShowRecommendations} />;
}

function TopicTrackingPanelInner({ allProjects, onClose, onShowRecommendations }: TopicTrackingPanelProps) {
  const [trackedTopics, setTrackedTopics] = useState<TrackedTopic[]>([]);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    setTrackedTopics(getTrackedTopics());
    setSuggestedTags(getTopTags(allProjects, 25));
  }, [allProjects]);

  const handleAddTopic = (name: string) => {
    if (!name.trim()) return;
    const topic = addTrackedTopic(name.trim());
    if (topic) setTrackedTopics(getTrackedTopics());
    setNewTopicInput('');
  };

  const handleRemoveTopic = (id: string) => {
    removeTrackedTopic(id);
    setTrackedTopics(getTrackedTopics());
  };

  // Count projects matching each tracked topic
  const topicProjectCounts = new Map<string, number>();
  for (const topic of trackedTopics) {
    let count = 0;
    for (const project of allProjects) {
      if (project.keywords.some(kw => kw.toLowerCase() === topic.id)) {
        count++;
      }
    }
    topicProjectCounts.set(topic.id, count);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-github-card border border-github-border rounded-lg w-[650px] max-w-[90vw] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-github-border">
          <h2 className="text-xl font-semibold text-github-text flex items-center gap-2">
            🏷 话题追踪 ({trackedTopics.length}/20)
          </h2>
          <button
            onClick={onClose}
            className="text-github-muted hover:text-github-text text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Add Topic Input */}
        <div className="p-4 border-b border-github-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTopicInput}
              onChange={e => setNewTopicInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddTopic(newTopicInput);
              }}
              placeholder="输入话题名称，按回车添加..."
              className="flex-1 px-3 py-2 bg-github-dark border border-github-border rounded text-github-text text-sm placeholder-github-muted focus:outline-none focus:border-github-purple"
            />
            <button
              onClick={() => handleAddTopic(newTopicInput)}
              disabled={!newTopicInput.trim()}
              className="px-4 py-2 bg-github-purple text-white rounded hover:bg-github-purple/80 disabled:opacity-50 transition-colors text-sm"
            >
              添加
            </button>
          </div>
        </div>

        {/* Tracked Topics */}
        <div className="flex-1 overflow-auto p-4">
          {trackedTopics.length === 0 ? (
            <div className="text-center py-8 text-github-muted">
              <div className="text-4xl mb-3">🏷</div>
              <p>暂无追踪的话题</p>
              <p className="text-xs mt-1">从推荐标签中添加或手动输入</p>
            </div>
          ) : (
            <div className="mb-4">
              <h3 className="text-github-muted text-xs mb-2 uppercase tracking-wider">已追踪话题</h3>
              <div className="flex flex-wrap gap-2">
                {trackedTopics.map(topic => {
                  const count = topicProjectCounts.get(topic.id) || 0;
                  return (
                    <div
                      key={topic.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-github-purple/20 text-github-purple group"
                    >
                      <span className="text-sm font-medium">{topic.name}</span>
                      <span className="text-xs opacity-60">({count})</span>
                      <button
                        onClick={() => handleRemoveTopic(topic.id)}
                        className="ml-1 opacity-0 group-hover:opacity-100 text-github-muted hover:text-red-400 transition-opacity text-sm leading-none"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggested Tags */}
          <div>
            <h3 className="text-github-muted text-xs mb-2 uppercase tracking-wider">推荐标签</h3>
            <div className="flex flex-wrap gap-2">
              {suggestedTags
                .filter(tag => !isTopicTracked(tag.tag.toLowerCase()))
                .slice(0, 30)
                .map(tag => (
                  <button
                    key={tag.tag}
                    onClick={() => {
                      addTrackedTopic(tag.tag);
                      setTrackedTopics(getTrackedTopics());
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-github-dark text-github-muted hover:text-github-purple hover:bg-github-purple/10 transition-colors text-xs"
                  >
                    <span>{tag.tag}</span>
                    <span className="opacity-50">({tag.count})</span>
                    <span className="text-github-purple opacity-0 group-hover:opacity-100">+</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-github-border flex justify-between">
          <button
            onClick={onShowRecommendations}
            className="text-sm text-github-purple hover:underline"
          >
            🎯 查看智能推荐
          </button>
          <p className="text-github-muted text-xs">
            追踪话题帮助我们为你生成更精准的推荐
          </p>
        </div>
      </div>
    </div>
  );
}

export default TopicTrackingPanel;

// Inline TopicTags bar - shown below search bar when topics are tracked
interface TopicTagsBarProps {
  allProjects: TrendingProject[];
  onClearTopic: (id: string) => void;
}

export function TopicTagsBar({ allProjects, onClearTopic }: TopicTagsBarProps) {
  const [trackedTopics, setTrackedTopics] = useState<TrackedTopic[]>([]);

  useEffect(() => {
    setTrackedTopics(getTrackedTopics());
  }, []);

  if (trackedTopics.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2 items-center">
      <span className="text-github-muted text-xs">追踪:</span>
      {trackedTopics.map(topic => {
        const count = allProjects.filter(p =>
          p.keywords.some(kw => kw.toLowerCase() === topic.id)
        ).length;
        return (
          <div
            key={topic.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-github-purple/20 text-github-purple text-xs"
          >
            <span>{topic.name}</span>
            <span className="opacity-60">({count})</span>
            <button
              onClick={() => {
                removeTrackedTopic(topic.id);
                setTrackedTopics(getTrackedTopics());
                onClearTopic(topic.id);
              }}
              className="hover:text-red-400 leading-none"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}