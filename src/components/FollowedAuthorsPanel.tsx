import { useState, useEffect } from 'react';
import type { FollowedAuthor } from '../types';
import { getFollowedAuthors, unfollowAuthor } from '../utils/social';

interface FollowedAuthorsPanelProps {
  onClose: () => void;
  newProjectsMap?: Map<string, { name: string; link: string }[]>;
}

export function FollowedAuthorsPanel({ onClose, newProjectsMap }: FollowedAuthorsPanelProps) {
  const [authors, setAuthors] = useState<FollowedAuthor[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setAuthors(getFollowedAuthors());
  }, []);

  const handleUnfollow = (username: string) => {
    unfollowAuthor(username);
    setAuthors(getFollowedAuthors());
    setConfirmDelete(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-github-card border border-github-border rounded-lg w-[500px] max-w-[90vw] max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-github-border">
          <h2 className="text-xl font-semibold text-github-text flex items-center gap-2">
            👁 我的关注 ({authors.length}/20)
          </h2>
          <button 
            onClick={onClose}
            className="text-github-muted hover:text-github-text text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto p-4">
          {authors.length === 0 ? (
            <div className="text-center py-12 text-github-muted">
              暂无关注的作者
            </div>
          ) : (
            <div className="space-y-3">
              {authors.map(author => {
                const hasNewProjects = newProjectsMap?.has(author.username.toLowerCase());
                const newProjects = newProjectsMap?.get(author.username.toLowerCase()) || [];
                
                return (
                  <div 
                    key={author.username}
                    className="p-3 bg-github-dark rounded hover:bg-github-dark/80 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <a
                          href={`https://github.com/${author.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:underline"
                        >
                          <span className="text-github-text font-medium">
                            @{author.username}
                          </span>
                          {hasNewProjects && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
                              {newProjects.length} 个新项目
                            </span>
                          )}
                        </a>
                      </div>

                      {/* Unfollow Button */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {confirmDelete === author.username ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUnfollow(author.username)}
                              className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            >
                              确认
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs px-2 py-1 rounded bg-github-card text-github-muted hover:text-github-text"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(author.username)}
                            className="text-github-muted hover:text-red-400 text-sm"
                          >
                            取消关注
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-github-muted text-xs mt-1">
                      关注于 {author.followedAt}
                    </p>

                    {/* New Projects Preview */}
                    {hasNewProjects && (
                      <div className="mt-2 space-y-1">
                        {newProjects.slice(0, 3).map((project, i) => (
                          <a
                            key={i}
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-github-purple hover:underline truncate"
                          >
                            {project.name}
                          </a>
                        ))}
                        {newProjects.length > 3 && (
                          <span className="text-xs text-github-muted">
                            还有 {newProjects.length - 3} 个...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 border-t border-github-border text-center">
          <p className="text-github-muted text-xs">
            关注作者后，当他们有新项目上榜时会收到提示
          </p>
        </div>
      </div>
    </div>
  );
}
