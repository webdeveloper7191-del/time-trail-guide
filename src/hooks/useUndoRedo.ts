import { useState, useCallback, useRef } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UndoRedoReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T), actionName?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastAction: string | null;
  reset: (initialState: T) => void;
}

export function useUndoRedo<T>(initialState: T, maxHistory: number = 50): UndoRedoReturn<T> {
  const [history, setHistory] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });
  
  const lastActionRef = useRef<string | null>(null);

  const setState = useCallback((newState: T | ((prev: T) => T), actionName?: string) => {
    setHistory(prev => {
      const resolvedState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prev.present)
        : newState;
      
      // Don't add to history if state is the same
      if (JSON.stringify(resolvedState) === JSON.stringify(prev.present)) {
        return prev;
      }
      
      lastActionRef.current = actionName || null;
      
      // Limit history size
      const newPast = [...prev.past, prev.present].slice(-maxHistory);
      
      return {
        past: newPast,
        present: resolvedState,
        future: [], // Clear future on new action
      };
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      
      lastActionRef.current = 'Undo';
      
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      
      lastActionRef.current = 'Redo';
      
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((initialState: T) => {
    setHistory({
      past: [],
      present: initialState,
      future: [],
    });
    lastActionRef.current = null;
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    lastAction: lastActionRef.current,
    reset,
  };
}
