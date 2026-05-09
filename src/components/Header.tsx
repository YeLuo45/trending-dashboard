interface HeaderProps {
  lastUpdated: string;
}

export function Header({ lastUpdated }: HeaderProps) {
  return (
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
        {lastUpdated && (
          <div className="text-right">
            <p className="text-github-muted text-xs">最后更新</p>
            <p className="text-github-purple text-sm font-medium">{lastUpdated}</p>
          </div>
        )}
      </div>
    </header>
  );
}
