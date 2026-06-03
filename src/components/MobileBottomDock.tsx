import { useEffect, useRef, type ReactNode } from 'react';

// Common Half-Screen Bottom Sheet Component for Mobile
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 md:hidden animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 max-h-[80vh] border-t border-github-border/30 rounded-t-2xl overflow-y-auto no-scrollbar animate-slide-up flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ 
          background: 'rgba(9, 9, 11, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        {/* Handle line */}
        <div className="sticky top-0 bg-transparent py-3 flex flex-col items-center border-b border-github-border/20">
          <div className="w-12 h-1 bg-github-muted/30 rounded-full mb-1" />
          <div className="w-full px-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-github-text">{title}</h3>
            <button
              onClick={onClose}
              className="text-github-muted hover:text-github-text text-xl p-1 cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>
        <div className="p-4 pb-12 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// Mobile Floating Bottom Dock (常驻悬浮底座)
interface DockItem {
  icon: string;
  label: string;
  badge?: number;
  onClick: () => void;
  active?: boolean;
}

interface MobileBottomDockProps {
  items: DockItem[];
}

export function MobileBottomDock({ items }: MobileBottomDockProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden flex justify-center no-print">
      <div 
        className="flex items-center justify-around w-full max-w-md px-2 py-1.5 rounded-full border border-white/5 shadow-2xl"
        style={{
          background: 'rgba(18, 18, 22, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)'
        }}
      >
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-all cursor-pointer active:scale-90"
            style={{ minHeight: '44px', minWidth: '54px' }}
          >
            <span className={`text-xl transition-transform ${item.active ? 'scale-110 text-github-purple' : 'text-github-muted'}`}>
              {item.icon}
            </span>
            <span className={`text-[9px] font-bold mt-0.5 transition-colors ${item.active ? 'text-github-purple' : 'text-github-muted'}`}>
              {item.label}
            </span>
            
            {/* Unread badge */}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute top-0 right-2 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold rounded-full bg-github-purple text-white shadow-md">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
