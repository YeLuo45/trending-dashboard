import { createContext, useContext, type ReactNode } from 'react';
import { useMemory } from './useMemory';
import type { AIMemory } from './types';

const MemoryContext = createContext<AIMemory | null>(null);

export function MemoryProvider({ children }: { children: ReactNode }) {
  const memory = useMemory();
  return (
    <MemoryContext.Provider value={memory}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemoryContext(): AIMemory {
  const ctx = useContext(MemoryContext);
  if (!ctx) {
    throw new Error('useMemoryContext must be used within MemoryProvider');
  }
  return ctx;
}