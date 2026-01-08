import { useState, useCallback, useRef, useEffect } from 'react';

export interface HistoryEntry<T> {
  id: string;
  timestamp: Date;
  actionType: 'add' | 'delete' | 'update' | 'move' | 'resize' | 'bulk' | 'copy' | 'undo' | 'redo' | 'initial';
  description: string;
  snapshot: T;
}

interface UndoRedoState<T> {
  entries: HistoryEntry<T>[];
  currentIndex: number;
}

interface UndoRedoReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T), actionName?: string, actionType?: HistoryEntry<T>['actionType']) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastAction: string | null;
  reset: (initialState: T) => void;
  historyEntries: HistoryEntry<T>[];
  currentHistoryIndex: number;
  revertToHistoryIndex: (index: number) => void;
  lastSaveTime: Date | null;
}

const AUTO_SAVE_KEY = 'roster_autosave';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export function useUndoRedo<T>(initialState: T, maxHistory: number = 50): UndoRedoReturn<T> {
  const [history, setHistory] = useState<UndoRedoState<T>>(() => {
    const initialEntry: HistoryEntry<T> = {
      id: `history-${Date.now()}`,
      timestamp: new Date(),
      actionType: 'initial',
      description: 'Initial state',
      snapshot: initialState,
    };
    return {
      entries: [initialEntry],
      currentIndex: 0,
    };
  });
  
  const lastActionRef = useRef<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  // Auto-save to localStorage
  useEffect(() => {
    const saveToStorage = () => {
      try {
        const currentState = history.entries[history.currentIndex]?.snapshot;
        if (currentState) {
          localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({
            data: currentState,
            timestamp: new Date().toISOString(),
          }));
          setLastSaveTime(new Date());
        }
      } catch (e) {
        console.warn('Auto-save failed:', e);
      }
    };

    // Save immediately on first render
    saveToStorage();

    // Set up interval for periodic saves
    const interval = setInterval(saveToStorage, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [history.entries, history.currentIndex]);

  const currentState = history.entries[history.currentIndex]?.snapshot ?? initialState;

  const setState = useCallback((
    newState: T | ((prev: T) => T), 
    actionName?: string, 
    actionType: HistoryEntry<T>['actionType'] = 'update'
  ) => {
    setHistory(prev => {
      const currentSnapshot = prev.entries[prev.currentIndex]?.snapshot;
      const resolvedState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(currentSnapshot)
        : newState;
      
      // Don't add to history if state is the same
      if (JSON.stringify(resolvedState) === JSON.stringify(currentSnapshot)) {
        return prev;
      }
      
      lastActionRef.current = actionName || null;
      
      // Create new history entry
      const newEntry: HistoryEntry<T> = {
        id: `history-${Date.now()}`,
        timestamp: new Date(),
        actionType,
        description: actionName || 'Changed',
        snapshot: resolvedState,
      };
      
      // Remove any future entries (redo stack)
      const newEntries = [
        ...prev.entries.slice(0, prev.currentIndex + 1),
        newEntry,
      ].slice(-maxHistory); // Limit history size
      
      return {
        entries: newEntries,
        currentIndex: newEntries.length - 1,
      };
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.currentIndex <= 0) return prev;
      
      lastActionRef.current = 'Undo';
      
      return {
        ...prev,
        currentIndex: prev.currentIndex - 1,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.currentIndex >= prev.entries.length - 1) return prev;
      
      lastActionRef.current = 'Redo';
      
      return {
        ...prev,
        currentIndex: prev.currentIndex + 1,
      };
    });
  }, []);

  const reset = useCallback((initialState: T) => {
    const initialEntry: HistoryEntry<T> = {
      id: `history-${Date.now()}`,
      timestamp: new Date(),
      actionType: 'initial',
      description: 'Reset',
      snapshot: initialState,
    };
    setHistory({
      entries: [initialEntry],
      currentIndex: 0,
    });
    lastActionRef.current = null;
  }, []);

  const revertToHistoryIndex = useCallback((index: number) => {
    setHistory(prev => {
      if (index < 0 || index >= prev.entries.length) return prev;
      
      lastActionRef.current = `Reverted to "${prev.entries[index].description}"`;
      
      return {
        ...prev,
        currentIndex: index,
      };
    });
  }, []);

  return {
    state: currentState,
    setState,
    undo,
    redo,
    canUndo: history.currentIndex > 0,
    canRedo: history.currentIndex < history.entries.length - 1,
    lastAction: lastActionRef.current,
    reset,
    historyEntries: history.entries,
    currentHistoryIndex: history.currentIndex,
    revertToHistoryIndex,
    lastSaveTime,
  };
}
