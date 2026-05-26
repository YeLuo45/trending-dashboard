import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryProvider, useMemoryContext } from '../MemoryContext';
import type { ReactNode } from 'react';

// Test component that uses the context
function TestConsumer() {
  const memory = useMemoryContext();
  return (
    <div>
      <button onClick={() => memory.setMetaRule('language', 'TypeScript')}>
        Set Language
      </button>
      <span data-testid="rules-count">{memory.getMetaRules().length}</span>
    </div>
  );
}

describe('MemoryContext', () => {
  describe('MemoryProvider', () => {
    it('should render children', () => {
      render(
        <MemoryProvider>
          <div>Test Child</div>
        </MemoryProvider>
      );
      expect(screen.getByText('Test Child')).toBeTruthy();
    });

    it('should provide memory context to children', () => {
      render(
        <MemoryProvider>
          <TestConsumer />
        </MemoryProvider>
      );
      expect(screen.getByTestId('rules-count').textContent).toBe('0');
    });

    it('should allow setting meta rules through context', () => {
      render(
        <MemoryProvider>
          <TestConsumer />
        </MemoryProvider>
      );

      act(() => {
        screen.getByText('Set Language').click();
      });
      expect(screen.getByTestId('rules-count').textContent).toBe('1');
    });
  });

  describe('useMemoryContext', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useMemoryContext must be used within MemoryProvider');

      consoleSpy.mockRestore();
    });
  });
});