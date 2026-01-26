import { useState, useCallback, useEffect } from 'react';

interface UseFormBuilderUndoRedoOptions<T> {
  maxHistory?: number;
}

interface UseFormBuilderUndoRedoReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  currentIndex: number;
}

export function useFormBuilderUndoRedo<T>(
  initialState: T,
  options: UseFormBuilderUndoRedoOptions<T> = {}
): UseFormBuilderUndoRedoReturn<T> {
  const { maxHistory = 50 } = options;
  
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex] ?? initialState;

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory(prev => {
      const current = prev[currentIndex];
      const nextState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(current)
        : newState;

      // Don't add to history if state hasn't changed
      if (JSON.stringify(current) === JSON.stringify(nextState)) {
        return prev;
      }

      // Remove any future states if we're in the middle of history
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push(nextState);

      // Trim history if it exceeds max
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }

      return newHistory;
    });

    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, maxHistory - 1);
      return newIndex;
    });
  }, [currentIndex, maxHistory]);

  const undo = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setCurrentIndex(prev => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          // Ctrl+Shift+Z = Redo
          e.preventDefault();
          if (canRedo) redo();
        } else {
          // Ctrl+Z = Undo
          e.preventDefault();
          if (canUndo) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        // Ctrl+Y = Redo (Windows style)
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.length,
    currentIndex,
  };
}
