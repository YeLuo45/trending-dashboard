import type { TrendingProject } from '../types';

interface RisingBadgeProps {
  project: TrendingProject;
}

export function RisingBadge({ project }: RisingBadgeProps) {
  if (!project.risingPrediction) return null;

  return (
    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-gradient-to-r from-orange-500 to-red-500 text-white">
      🚀 Rising
    </span>
  );
}