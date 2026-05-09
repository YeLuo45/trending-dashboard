interface TabButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

export function TabButton({ active, label, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
        active
          ? 'border-github-purple text-github-purple'
          : 'border-transparent text-github-muted hover:text-github-text'
      }`}
    >
      {label}
    </button>
  );
}
