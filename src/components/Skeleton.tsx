export function ProjectCardSkeleton() {
  return (
    <div className="bg-github-card border border-github-border rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded bg-github-dark/60 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-github-dark/60 rounded w-48 mb-2" />
            <div className="h-3 bg-github-dark/60 rounded w-32" />
          </div>
        </div>
        <div className="flex gap-2 ml-4 flex-shrink-0">
          <div className="h-6 bg-github-dark/60 rounded w-16" />
          <div className="h-6 bg-github-dark/60 rounded w-16" />
        </div>
      </div>
      <div className="h-3 bg-github-dark/60 rounded w-full mb-2" />
      <div className="h-3 bg-github-dark/60 rounded w-3/4 mb-4" />
      <div className="flex gap-2">
        <div className="h-5 bg-github-dark/60 rounded w-12" />
        <div className="h-5 bg-github-dark/60 rounded w-16" />
        <div className="h-5 bg-github-dark/60 rounded w-14" />
      </div>
    </div>
  );
}

export function ProjectListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }, (_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FullPageSkeleton() {
  return (
    <div className="min-h-screen bg-github-dark">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-github-dark/60" />
            <div>
              <div className="h-5 bg-github-dark/60 rounded w-40 mb-1" />
              <div className="h-3 bg-github-dark/60 rounded w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-github-dark/60 rounded w-20" />
            <div className="h-8 bg-github-dark/60 rounded w-20" />
            <div className="h-8 bg-github-dark/60 rounded w-20" />
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-4 mb-6">
          <div className="h-8 bg-github-dark/60 rounded w-24" />
          <div className="h-8 bg-github-dark/60 rounded w-24" />
          <div className="h-8 bg-github-dark/60 rounded w-24" />
        </div>

        {/* Filter bar skeleton */}
        <div className="flex gap-3 mb-6">
          <div className="h-8 bg-github-dark/60 rounded w-32" />
          <div className="h-8 bg-github-dark/60 rounded w-24" />
          <div className="h-8 bg-github-dark/60 rounded w-28" />
        </div>

        {/* Project list skeleton */}
        <div className="grid gap-4">
          {Array.from({ length: 5 }, (_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
