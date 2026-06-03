interface TabButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

export function TabButton({ active, label, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
        active
          ? 'bg-github-purple/10 text-github-purple border border-github-purple/20'
          : 'border border-transparent text-github-muted hover:text-github-text hover:bg-github-card/40'
      }`}
      style={{ minHeight: '38px' }}
    >
      {label}
    </button>
  );
}
